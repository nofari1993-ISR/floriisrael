import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Trash2, Edit2, Package, Flower2, Check, X, Sparkles, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useInventory, type Flower } from "@/hooks/useInventory";

interface InventoryTabProps {
  shopId: string;
}

const InventoryTab = ({ shopId }: InventoryTabProps) => {
  const navigate = useNavigate();
  const { flowers, loading, addFlower, updateFlower, removeFlower } = useInventory(shopId);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ name: "", color: "", price: "", quantity: "" });
  const [editData, setEditData] = useState({ name: "", color: "", price: "", quantity: "" });

  const handleAdd = async () => {
    if (!formData.name || !formData.price) return;
    const success = await addFlower({
      name: formData.name,
      color: formData.color || undefined,
      price: Number(formData.price),
      quantity: Number(formData.quantity) || 0,
    });
    if (success) {
      setFormData({ name: "", color: "", price: "", quantity: "" });
      setShowAddForm(false);
    }
  };

  const startEdit = (flower: Flower) => {
    setEditingId(flower.id);
    setEditData({
      name: flower.name,
      color: flower.color || "",
      price: String(flower.price),
      quantity: String(flower.quantity),
    });
  };

  const handleEdit = async () => {
    if (!editingId || !editData.name || !editData.price) return;
    const success = await updateFlower(editingId, {
      name: editData.name,
      color: editData.color || null,
      price: Number(editData.price),
      quantity: Number(editData.quantity) || 0,
    });
    if (success) setEditingId(null);
  };

  const LOW_STOCK_THRESHOLD = 15;
  const lowStockFlowers = flowers.filter((f) => f.quantity > 0 && f.quantity <= LOW_STOCK_THRESHOLD);
  const outOfStockFlowers = flowers.filter((f) => f.quantity === 0 || !f.in_stock);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-display font-bold text-foreground">מלאי פרחים</h2>
          <p className="text-sm text-muted-foreground font-body mt-1">
            {flowers.length} פרחים במלאי
          </p>
        </div>
        <Button
          variant="hero"
          size="default"
          className="rounded-xl gap-2"
          onClick={() => setShowAddForm(!showAddForm)}
        >
          <Plus className="w-4 h-4" />
          {showAddForm ? "ביטול" : "הוסף פרח"}
        </Button>
      </div>

      {/* Low Stock Warning Banner */}
      {(lowStockFlowers.length > 0 || outOfStockFlowers.length > 0) && (
        <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 rounded-2xl p-4 space-y-2">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0" />
            <h3 className="font-display font-semibold text-amber-800 dark:text-amber-300">
              התראת מלאי
            </h3>
          </div>
          <div className="text-sm font-body text-amber-700 dark:text-amber-400 space-y-1">
            {lowStockFlowers.length > 0 && (
              <p>
                ⚠️ <strong>{lowStockFlowers.length} פרחים</strong> עם מלאי נמוך (פחות מ-{LOW_STOCK_THRESHOLD} יחידות) — 
                יש לבדוק האם הוזמנו זרים חדשים ולעדכן כמויות.
              </p>
            )}
            {outOfStockFlowers.length > 0 && (
              <p>
                🚫 <strong>{outOfStockFlowers.length} פרחים</strong> אזלו מהמלאי — 
                עדכנו את הכמות אם התקבלה אספקה חדשה.
              </p>
            )}
          </div>
        </div>
      )}

      {/* Add Form */}
      <AnimatePresence>
        {showAddForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-card rounded-2xl p-6 border border-border/50 shadow-card space-y-4">
              <h3 className="font-display text-lg font-semibold text-foreground text-right">פרח חדש</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="font-body">שם הפרח *</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))}
                    placeholder="ורד אדום"
                    className="rounded-xl"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="font-body">צבע</Label>
                  <Input
                    value={formData.color}
                    onChange={(e) => setFormData((p) => ({ ...p, color: e.target.value }))}
                    placeholder="אדום"
                    className="rounded-xl"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="font-body">מחיר (₪) *</Label>
                  <Input
                    type="number"
                    value={formData.price}
                    onChange={(e) => setFormData((p) => ({ ...p, price: e.target.value }))}
                    placeholder="15"
                    className="rounded-xl"
                    min="0"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="font-body">כמות</Label>
                  <Input
                    type="number"
                    value={formData.quantity}
                    onChange={(e) => setFormData((p) => ({ ...p, quantity: e.target.value }))}
                    placeholder="50"
                    className="rounded-xl"
                    min="0"
                  />
                </div>
              </div>
              <div className="flex justify-end">
                <Button variant="hero" className="rounded-xl gap-2" onClick={handleAdd}>
                  <Flower2 className="w-4 h-4" />
                  הוסף פרח
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Flowers Table */}
      {loading ? (
        <div className="text-center py-16 text-muted-foreground font-body">טוען מלאי...</div>
      ) : flowers.length === 0 ? (
        <div className="text-center py-16">
          <Package className="w-16 h-16 mx-auto mb-4 text-muted-foreground/20" />
          <p className="font-display text-xl font-semibold text-muted-foreground">המלאי ריק</p>
          <p className="text-sm mt-2 text-muted-foreground font-body">הוסיפי פרחים כדי להתחיל</p>
        </div>
      ) : (
        <div className="bg-card rounded-2xl border border-border/50 shadow-card overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50 hover:bg-muted/50">
                <TableHead className="text-right font-display font-semibold">שם</TableHead>
                <TableHead className="text-right font-display font-semibold">צבע</TableHead>
                <TableHead className="text-right font-display font-semibold">מחיר</TableHead>
                <TableHead className="text-right font-display font-semibold">כמות</TableHead>
                <TableHead className="text-right font-display font-semibold">סטטוס</TableHead>
                <TableHead className="text-right font-display font-semibold w-[140px]">פעולות</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {flowers.map((flower) => {
                const isLowStock = flower.quantity > 0 && flower.quantity <= LOW_STOCK_THRESHOLD;
                const isOutOfStock = flower.quantity === 0 || !flower.in_stock;

                return (
                  <TableRow
                    key={flower.id}
                    className={`group ${isLowStock ? "bg-amber-50/50 dark:bg-amber-950/20" : ""} ${isOutOfStock ? "bg-destructive/5" : ""}`}
                  >
                    {editingId === flower.id ? (
                      <>
                        <TableCell>
                          <Input
                            value={editData.name}
                            onChange={(e) => setEditData((p) => ({ ...p, name: e.target.value }))}
                            className="rounded-lg h-8"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            value={editData.color}
                            onChange={(e) => setEditData((p) => ({ ...p, color: e.target.value }))}
                            className="rounded-lg h-8"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            value={editData.price}
                            onChange={(e) => setEditData((p) => ({ ...p, price: e.target.value }))}
                            className="rounded-lg h-8"
                            min="0"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            value={editData.quantity}
                            onChange={(e) => setEditData((p) => ({ ...p, quantity: e.target.value }))}
                            className="rounded-lg h-8"
                            min="0"
                          />
                        </TableCell>
                        <TableCell />
                        <TableCell>
                          <div className="flex gap-1">
                            <Button size="icon" variant="ghost" onClick={handleEdit} className="h-7 w-7 text-primary hover:text-primary">
                              <Check className="w-4 h-4" />
                            </Button>
                            <Button size="icon" variant="ghost" onClick={() => setEditingId(null)} className="h-7 w-7 text-muted-foreground">
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </>
                    ) : (
                      <>
                        <TableCell className="font-display font-semibold text-foreground">
                          <div className="flex items-center gap-2">
                            <Flower2 className="w-4 h-4 text-primary/60 shrink-0" />
                            {flower.name}
                          </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground font-body">{flower.color || "—"}</TableCell>
                        <TableCell className="font-semibold text-foreground">₪{flower.price}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1.5">
                            {isLowStock && (
                              <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                            )}
                            <span className={`font-body ${isLowStock ? "text-amber-600 dark:text-amber-400 font-semibold" : "text-muted-foreground"}`}>
                              {flower.quantity}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {isOutOfStock ? (
                            <span className="text-xs px-3 py-1 rounded-full font-medium bg-destructive/10 text-destructive">
                              אזל
                            </span>
                          ) : isLowStock ? (
                            <span className="text-xs px-3 py-1 rounded-full font-medium bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300">
                              מלאי נמוך
                            </span>
                          ) : (
                            <span className="text-xs px-3 py-1 rounded-full font-medium bg-sage-light text-sage">
                              במלאי
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => navigate(`/ai-chat?shopId=${shopId}&mode=promote-flower&flowerName=${encodeURIComponent(flower.name)}${flower.color ? `&flowerColor=${encodeURIComponent(flower.color)}` : ""}`)}
                              className="h-7 w-7 text-primary/60 hover:text-primary"
                              title={`צור זר עם ${flower.name}`}
                            >
                              <Sparkles className="w-4 h-4" />
                            </Button>
                            <Button size="icon" variant="ghost" onClick={() => startEdit(flower)} className="h-7 w-7 text-muted-foreground hover:text-primary">
                              <Edit2 className="w-4 h-4" />
                            </Button>
                            <Button size="icon" variant="ghost" onClick={() => removeFlower(flower.id)} className="h-7 w-7 text-muted-foreground hover:text-destructive">
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </>
                    )}
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
};

export default InventoryTab;

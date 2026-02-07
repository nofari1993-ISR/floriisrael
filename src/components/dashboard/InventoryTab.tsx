import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Trash2, Edit2, Package, Flower2, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useInventory, type Flower } from "@/hooks/useInventory";

interface InventoryTabProps {
  shopId: string;
}

const InventoryTab = ({ shopId }: InventoryTabProps) => {
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

      {/* Flowers List */}
      {loading ? (
        <div className="text-center py-16 text-muted-foreground font-body">טוען מלאי...</div>
      ) : flowers.length === 0 ? (
        <div className="text-center py-16">
          <Package className="w-16 h-16 mx-auto mb-4 text-muted-foreground/20" />
          <p className="font-display text-xl font-semibold text-muted-foreground">המלאי ריק</p>
          <p className="text-sm mt-2 text-muted-foreground font-body">הוסיפי פרחים כדי להתחיל</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {/* Table Header */}
          <div className="hidden md:grid grid-cols-[2fr_1fr_1fr_1fr_1fr_auto] gap-4 px-5 py-3 bg-muted/50 rounded-xl text-sm font-semibold text-muted-foreground font-body">
            <span>שם</span>
            <span>צבע</span>
            <span>מחיר</span>
            <span>כמות</span>
            <span>סטטוס</span>
            <span>פעולות</span>
          </div>

          {flowers.map((flower) => (
            <motion.div
              key={flower.id}
              layout
              className="bg-card rounded-xl border border-border/50 p-4 md:p-5 hover:shadow-soft transition-shadow"
            >
              {editingId === flower.id ? (
                /* Edit Mode */
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-[2fr_1fr_1fr_1fr_1fr_auto] gap-3 items-center">
                  <Input value={editData.name} onChange={(e) => setEditData((p) => ({ ...p, name: e.target.value }))} className="rounded-lg" />
                  <Input value={editData.color} onChange={(e) => setEditData((p) => ({ ...p, color: e.target.value }))} className="rounded-lg" />
                  <Input type="number" value={editData.price} onChange={(e) => setEditData((p) => ({ ...p, price: e.target.value }))} className="rounded-lg" min="0" />
                  <Input type="number" value={editData.quantity} onChange={(e) => setEditData((p) => ({ ...p, quantity: e.target.value }))} className="rounded-lg" min="0" />
                  <div />
                  <div className="flex gap-1">
                    <Button size="icon" variant="ghost" onClick={handleEdit} className="text-primary hover:text-primary">
                      <Check className="w-4 h-4" />
                    </Button>
                    <Button size="icon" variant="ghost" onClick={() => setEditingId(null)} className="text-muted-foreground">
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ) : (
                /* View Mode */
                <div className="grid grid-cols-2 md:grid-cols-[2fr_1fr_1fr_1fr_1fr_auto] gap-3 items-center">
                  <div className="font-display font-semibold text-foreground flex items-center gap-2">
                    <Flower2 className="w-4 h-4 text-primary/60 shrink-0" />
                    {flower.name}
                  </div>
                  <span className="text-sm text-muted-foreground font-body">{flower.color || "—"}</span>
                  <span className="font-semibold text-foreground">₪{flower.price}</span>
                  <span className="text-sm text-muted-foreground font-body">{flower.quantity}</span>
                  <span className={`text-xs px-3 py-1 rounded-full font-medium w-fit ${flower.in_stock ? "bg-sage-light text-sage" : "bg-destructive/10 text-destructive"}`}>
                    {flower.in_stock ? "במלאי" : "אזל"}
                  </span>
                  <div className="flex gap-1 justify-end col-span-2 md:col-span-1">
                    <Button size="icon" variant="ghost" onClick={() => startEdit(flower)} className="text-muted-foreground hover:text-primary">
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button size="icon" variant="ghost" onClick={() => removeFlower(flower.id)} className="text-muted-foreground hover:text-destructive">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default InventoryTab;

import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Trash2, Edit2, Package, Flower2, Check, X, Sparkles, AlertTriangle, Search, ChevronDown, ChevronUp } from "lucide-react";
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
import { useToast } from "@/hooks/use-toast";

interface InventoryTabProps {
  shopId: string;
}

const InventoryTab = ({ shopId }: InventoryTabProps) => {
  const { flowers, loading, addFlower, updateFlower, removeFlower } = useInventory(shopId);
  const { toast } = useToast();
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [formData, setFormData] = useState({ name: "", color: "", price: "", quantity: "", shelf_life_days: "7" });
  const [editData, setEditData] = useState({ name: "", color: "", price: "", quantity: "", shelf_life_days: "7" });
  const [togglingBoostIds, setTogglingBoostIds] = useState<Set<string>>(new Set());
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  const filteredFlowers = useMemo(() => {
    if (!searchQuery.trim()) return flowers;
    const q = searchQuery.trim().toLowerCase();
    return flowers.filter((f) => f.name.includes(q) || (f.color && f.color.includes(q)));
  }, [flowers, searchQuery]);

  // Group flowers by name
  const groupedFlowers = useMemo(() => {
    const groups: Record<string, Flower[]> = {};
    for (const f of filteredFlowers) {
      if (!groups[f.name]) groups[f.name] = [];
      groups[f.name].push(f);
    }
    return Object.entries(groups).sort(([a], [b]) => a.localeCompare(b, "he"));
  }, [filteredFlowers]);

  const toggleGroup = (name: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  };

  const handleToggleBoost = async (flower: Flower) => {
    setTogglingBoostIds((prev) => new Set(prev).add(flower.id));
    const newBoosted = !flower.boosted;
    const updateData: any = { boosted: newBoosted };
    if (newBoosted) {
      updateData.boosted_at = new Date().toISOString();
    } else {
      updateData.boosted_at = null;
    }
    const success = await updateFlower(flower.id, updateData);
    setTogglingBoostIds((prev) => {
      const next = new Set(prev);
      next.delete(flower.id);
      return next;
    });
    if (success) {
      toast({
        title: newBoosted
          ? `✨ ${flower.name} מקודם ל-5 ימים! ה-AI יתעדף אותו בזרים`
          : `${flower.name} הוסר מקידום`,
      });
    }
  };

  const handleAdd = async () => {
    if (!formData.name || !formData.price) return;
    const success = await addFlower({
      name: formData.name,
      color: formData.color || undefined,
      price: Number(formData.price),
      quantity: Number(formData.quantity) || 0,
      shelf_life_days: Number(formData.shelf_life_days) || 7,
    });
    if (success) {
      setFormData({ name: "", color: "", price: "", quantity: "", shelf_life_days: "7" });
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
      shelf_life_days: String(flower.shelf_life_days ?? 7),
    });
  };

  const handleEdit = async () => {
    if (!editingId || !editData.name || !editData.price) return;
    const success = await updateFlower(editingId, {
      name: editData.name,
      color: editData.color || null,
      price: Number(editData.price),
      quantity: Number(editData.quantity) || 0,
      shelf_life_days: Number(editData.shelf_life_days) || 7,
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

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
        <Input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="חיפוש לפי שם או צבע..."
          className="rounded-xl pr-9"
        />
      </div>
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
                <div className="space-y-2">
                  <Label className="font-body">ימי מדף</Label>
                  <Input
                    type="number"
                    value={formData.shelf_life_days}
                    onChange={(e) => setFormData((p) => ({ ...p, shelf_life_days: e.target.value }))}
                    placeholder="7"
                    className="rounded-xl"
                    min="1"
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
                <TableHead className="text-right font-display font-semibold w-[40px]"></TableHead>
                <TableHead className="text-right font-display font-semibold">שם</TableHead>
                <TableHead className="text-right font-display font-semibold">צבעים</TableHead>
                <TableHead className="text-right font-display font-semibold">סה״כ כמות</TableHead>
                <TableHead className="text-right font-display font-semibold">סטטוס</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {groupedFlowers.map(([name, group]) => {
                const totalQuantity = group.reduce((sum, f) => sum + f.quantity, 0);
                const isExpanded = expandedGroups.has(name);
                const hasLowStock = group.some((f) => f.quantity > 0 && f.quantity <= LOW_STOCK_THRESHOLD);
                const hasOutOfStock = group.some((f) => f.quantity === 0 || !f.in_stock);

                return (
                  <React.Fragment key={name}>
                    {/* Group header row */}
                    <TableRow
                      className={`cursor-pointer hover:bg-muted/30 ${hasLowStock ? "bg-amber-50/30 dark:bg-amber-950/10" : ""} ${hasOutOfStock ? "bg-destructive/5" : ""}`}
                      onClick={() => toggleGroup(name)}
                    >
                      <TableCell className="w-[40px]">
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4 text-muted-foreground" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-muted-foreground" />
                        )}
                      </TableCell>
                      <TableCell className="font-display font-semibold text-foreground">
                        <div className="flex items-center gap-2">
                          <Flower2 className="w-4 h-4 text-primary/60 shrink-0" />
                          {name}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {group.map((f) => (
                            <span key={f.id} className="text-xs px-2 py-0.5 rounded-lg bg-muted text-muted-foreground font-body">
                              {f.color || "—"}
                            </span>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell className="font-semibold text-foreground font-body">{totalQuantity}</TableCell>
                      <TableCell>
                        {hasOutOfStock ? (
                          <span className="text-xs px-3 py-1 rounded-full font-medium bg-destructive/10 text-destructive">יש אזל</span>
                        ) : hasLowStock ? (
                          <span className="text-xs px-3 py-1 rounded-full font-medium bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300">מלאי נמוך</span>
                        ) : (
                          <span className="text-xs px-3 py-1 rounded-full font-medium bg-sage-light text-sage">במלאי</span>
                        )}
                      </TableCell>
                    </TableRow>

                    {/* Expanded color rows */}
                    {isExpanded && group.map((flower) => {
                      const isLowStock = flower.quantity > 0 && flower.quantity <= LOW_STOCK_THRESHOLD;
                      const isOutOfStock = flower.quantity === 0 || !flower.in_stock;

                      return (
                        <TableRow
                          key={flower.id}
                          className={`group border-r-4 border-r-primary/20 ${isLowStock ? "bg-amber-50/50 dark:bg-amber-950/20" : ""} ${isOutOfStock ? "bg-destructive/5" : "bg-muted/10"}`}
                        >
                          {editingId === flower.id ? (
                            <>
                              <TableCell />
                              <TableCell colSpan={2}>
                                <div className="flex gap-2">
                                  <Input value={editData.color} onChange={(e) => setEditData((p) => ({ ...p, color: e.target.value }))} className="rounded-lg h-8" placeholder="צבע" />
                                  <Input type="number" value={editData.price} onChange={(e) => setEditData((p) => ({ ...p, price: e.target.value }))} className="rounded-lg h-8 w-20" placeholder="מחיר" min="0" />
                                  <Input type="number" value={editData.quantity} onChange={(e) => setEditData((p) => ({ ...p, quantity: e.target.value }))} className="rounded-lg h-8 w-20" placeholder="כמות" min="0" />
                                  <Input type="number" value={editData.shelf_life_days} onChange={(e) => setEditData((p) => ({ ...p, shelf_life_days: e.target.value }))} className="rounded-lg h-8 w-20" placeholder="מדף" min="1" />
                                </div>
                              </TableCell>
                              <TableCell colSpan={2}>
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
                              <TableCell />
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-body font-medium text-foreground/80">{flower.color || "—"}</span>
                                  {flower.boosted && <Sparkles className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />}
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-3 text-sm font-body">
                                  <span className="text-muted-foreground">₪{flower.price}</span>
                                  <span className="text-muted-foreground">•</span>
                                  <div className="flex items-center gap-1">
                                    {isLowStock && <AlertTriangle className="w-3 h-3 text-amber-500 shrink-0" />}
                                    <span className={isLowStock ? "text-amber-600 dark:text-amber-400 font-semibold" : isOutOfStock ? "text-destructive font-semibold" : "text-muted-foreground"}>
                                      {flower.quantity} יח׳
                                    </span>
                                  </div>
                                  <span className="text-muted-foreground">•</span>
                                  {(() => {
                                    if (isOutOfStock) return <span className="text-xs text-muted-foreground">—</span>;
                                    const restocked = flower.last_restocked_at ? new Date(flower.last_restocked_at) : null;
                                    if (!restocked) return <span className="text-xs text-muted-foreground">—</span>;
                                    const expiryDate = new Date(restocked.getTime() + (flower.shelf_life_days || 7) * 24 * 60 * 60 * 1000);
                                    const daysLeft = Math.ceil((expiryDate.getTime() - Date.now()) / (24 * 60 * 60 * 1000));
                                    if (daysLeft <= 0) return <span className="text-xs px-2 py-0.5 rounded-full bg-destructive/10 text-destructive font-medium">פג תוקף</span>;
                                    if (daysLeft <= 2) return <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 font-medium">{daysLeft} ימים</span>;
                                    return <span className="text-xs text-muted-foreground">{daysLeft} ימים</span>;
                                  })()}
                                </div>
                              </TableCell>
                              <TableCell>
                                {isOutOfStock ? (
                                  <span className="text-xs px-3 py-1 rounded-full font-medium bg-destructive/10 text-destructive">אזל</span>
                                ) : isLowStock ? (
                                  <span className="text-xs px-3 py-1 rounded-full font-medium bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300">נמוך</span>
                                ) : (
                                  <span className="text-xs px-3 py-1 rounded-full font-medium bg-sage-light text-sage">במלאי</span>
                                )}
                              </TableCell>
                              <TableCell>
                                <div className="flex gap-1">
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    onClick={(e) => { e.stopPropagation(); handleToggleBoost(flower); }}
                                    disabled={togglingBoostIds.has(flower.id)}
                                    className={`h-7 w-7 ${flower.boosted ? "text-amber-500 hover:text-amber-600" : "text-primary/60 hover:text-primary"}`}
                                    title={flower.boosted ? `הסר קידום` : `קדם בזרים`}
                                  >
                                    <Sparkles className={`w-4 h-4 ${flower.boosted ? "fill-amber-500" : ""}`} />
                                  </Button>
                                  <Button size="icon" variant="ghost" onClick={(e) => { e.stopPropagation(); startEdit(flower); }} className="h-7 w-7 text-muted-foreground hover:text-primary">
                                    <Edit2 className="w-4 h-4" />
                                  </Button>
                                  <Button size="icon" variant="ghost" onClick={(e) => { e.stopPropagation(); removeFlower(flower.id); }} className="h-7 w-7 text-muted-foreground hover:text-destructive">
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </div>
                              </TableCell>
                            </>
                          )}
                        </TableRow>
                      );
                    })}
                  </React.Fragment>
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

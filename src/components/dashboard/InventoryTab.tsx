import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Trash2, Edit2, Package, Flower2, Check, X, Sparkles, Search, ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useInventory, type Flower } from "@/hooks/useInventory";
import { useToast } from "@/hooks/use-toast";

interface InventoryTabProps {
  shopId: string;
}

const InventoryTab = ({ shopId }: InventoryTabProps) => {
  const { flowers, loading, addFlower, updateFlower, toggleAvailability, toggleBoost, removeFlower } = useInventory(shopId);
  const { toast } = useToast();
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [togglingIds, setTogglingIds] = useState<Set<string>>(new Set());
  const [formData, setFormData] = useState({ name: "", color: "", price: "", quantity: "", shelf_life_days: "7" });
  const [editData, setEditData] = useState({ name: "", color: "", price: "", quantity: "", shelf_life_days: "7" });

  const filteredFlowers = useMemo(() => {
    if (!searchQuery.trim()) return flowers;
    const q = searchQuery.trim().toLowerCase();
    return flowers.filter((f) => f.name.includes(q) || (f.color && f.color.includes(q)));
  }, [flowers, searchQuery]);

  const availableCount = flowers.filter((f) => f.is_available).length;
  const unavailableCount = flowers.length - availableCount;

  const handleToggleAvailability = async (flower: Flower) => {
    setTogglingIds((prev) => new Set(prev).add(flower.id));
    await toggleAvailability(flower);
    setTogglingIds((prev) => { const n = new Set(prev); n.delete(flower.id); return n; });
  };

  const handleToggleBoost = async (flower: Flower) => {
    if (!flower.is_available) return;
    setTogglingIds((prev) => new Set(prev).add(flower.id + "_boost"));
    await toggleBoost(flower);
    setTogglingIds((prev) => { const n = new Set(prev); n.delete(flower.id + "_boost"); return n; });
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

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-display font-bold text-foreground">מלאי פרחים</h2>
          <p className="text-xs text-muted-foreground font-body mt-0.5">
            {availableCount} זמינים · {unavailableCount} לא זמינים
          </p>
        </div>
        <Button
          variant="hero"
          size="sm"
          className="rounded-xl gap-1.5"
          onClick={() => setShowAddForm(!showAddForm)}
        >
          <Plus className="w-4 h-4" />
          {showAddForm ? "ביטול" : "הוסף"}
        </Button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
        <Input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="חיפוש לפי שם או צבע..."
          className="rounded-xl pr-9"
        />
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
            <div className="bg-card rounded-2xl p-4 border border-border/50 shadow-card space-y-3">
              <h3 className="font-display text-base font-semibold text-foreground">פרח חדש</h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1 col-span-2">
                  <Label className="text-xs font-body">שם הפרח *</Label>
                  <Input value={formData.name} onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))} placeholder="ורד" className="rounded-xl h-9" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-body">צבע</Label>
                  <Input value={formData.color} onChange={(e) => setFormData((p) => ({ ...p, color: e.target.value }))} placeholder="אדום" className="rounded-xl h-9" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-body">מחיר ₪ *</Label>
                  <Input type="number" value={formData.price} onChange={(e) => setFormData((p) => ({ ...p, price: e.target.value }))} placeholder="15" className="rounded-xl h-9" min="0" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-body">כמות</Label>
                  <Input type="number" value={formData.quantity} onChange={(e) => setFormData((p) => ({ ...p, quantity: e.target.value }))} placeholder="50" className="rounded-xl h-9" min="0" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-body">ימי מדף</Label>
                  <Input type="number" value={formData.shelf_life_days} onChange={(e) => setFormData((p) => ({ ...p, shelf_life_days: e.target.value }))} placeholder="7" className="rounded-xl h-9" min="1" />
                </div>
              </div>
              <Button variant="hero" className="w-full rounded-xl gap-2" onClick={handleAdd}>
                <Flower2 className="w-4 h-4" />
                הוסף פרח
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Flower Cards */}
      {loading ? (
        <div className="text-center py-16 text-muted-foreground font-body">טוען מלאי...</div>
      ) : flowers.length === 0 ? (
        <div className="text-center py-16">
          <Package className="w-16 h-16 mx-auto mb-4 text-muted-foreground/20" />
          <p className="font-display text-lg font-semibold text-muted-foreground">המלאי ריק</p>
          <p className="text-sm mt-2 text-muted-foreground font-body">הוסיפי פרחים כדי להתחיל</p>
        </div>
      ) : (
        <div className="space-y-2">
          <AnimatePresence>
            {filteredFlowers.map((flower) => (
              <motion.div
                key={flower.id}
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, height: 0 }}
                className={`bg-card rounded-2xl border p-4 shadow-sm transition-colors ${
                  flower.is_available ? "border-border/50" : "border-border/20 opacity-60"
                }`}
              >
                {editingId === flower.id ? (
                  /* ── Edit Mode ── */
                  <div className="space-y-3">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground font-body w-16 shrink-0 text-right">שם:</span>
                        <Input value={editData.name} onChange={(e) => setEditData((p) => ({ ...p, name: e.target.value }))} className="rounded-lg h-8 text-sm flex-1" placeholder="שם" />
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground font-body w-16 shrink-0 text-right">צבע:</span>
                        <Input value={editData.color} onChange={(e) => setEditData((p) => ({ ...p, color: e.target.value }))} className="rounded-lg h-8 text-sm flex-1" placeholder="צבע" />
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground font-body w-16 shrink-0 text-right">מחיר ₪:</span>
                        <Input type="number" value={editData.price} onChange={(e) => setEditData((p) => ({ ...p, price: e.target.value }))} className="rounded-lg h-8 text-sm flex-1" placeholder="מחיר" min="0" />
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground font-body w-16 shrink-0 text-right">כמות:</span>
                        <Input type="number" value={editData.quantity} onChange={(e) => setEditData((p) => ({ ...p, quantity: e.target.value }))} className="rounded-lg h-8 text-sm flex-1" placeholder="כמות" min="0" />
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground font-body w-16 shrink-0 text-right">ימי מדף:</span>
                        <Input type="number" value={editData.shelf_life_days} onChange={(e) => setEditData((p) => ({ ...p, shelf_life_days: e.target.value }))} className="rounded-lg h-8 text-sm flex-1" placeholder="ימי מדף" min="1" />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="hero" onClick={handleEdit} className="flex-1 h-8 rounded-lg gap-1">
                        <Check className="w-3.5 h-3.5" /> שמור
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => setEditingId(null)} className="h-8 rounded-lg">
                        <X className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                ) : (
                  /* ── View Mode ── */
                  <div className="flex items-center gap-3">
                    {/* Availability Toggle */}
                    <Switch
                      checked={flower.is_available}
                      onCheckedChange={() => handleToggleAvailability(flower)}
                      disabled={togglingIds.has(flower.id)}
                      className="shrink-0"
                    />

                    {/* Flower Image */}
                    <div className="w-12 h-12 rounded-xl overflow-hidden shrink-0 bg-muted border border-border/30">
                      {flower.image ? (
                        <img
                          src={flower.image}
                          alt={flower.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center animate-pulse">
                          <ImageIcon className="w-5 h-5 text-muted-foreground/30" />
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-display font-semibold text-sm text-foreground truncate">
                          {flower.name}
                        </span>
                        {flower.color && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground font-body">
                            {flower.color}
                          </span>
                        )}
                        {flower.is_boosted && (
                          <Sparkles className="w-3.5 h-3.5 text-amber-500 fill-amber-500 shrink-0" />
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-muted-foreground font-body">₪{flower.price}</span>
                        <span className="text-xs text-muted-foreground">·</span>
                        <span className="text-xs text-muted-foreground font-body">{flower.quantity} יח׳</span>
                        <span className="text-xs text-muted-foreground">·</span>
                        <span className={`text-xs font-medium font-body ${flower.is_available ? "text-green-600 dark:text-green-400" : "text-muted-foreground"}`}>
                          {flower.is_available ? "זמין" : "לא זמין"}
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1 shrink-0">
                      {/* Boost - only when available */}
                      <button
                        onClick={() => handleToggleBoost(flower)}
                        disabled={!flower.is_available || togglingIds.has(flower.id + "_boost")}
                        title={!flower.is_available ? "הפרח לא זמין" : flower.is_boosted ? "הסר קידום" : "קדם בצ'אט"}
                        className={`p-1.5 rounded-lg transition-colors ${
                          !flower.is_available
                            ? "opacity-30 cursor-not-allowed"
                            : flower.is_boosted
                            ? "text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-950/30"
                            : "text-muted-foreground hover:text-primary hover:bg-muted"
                        }`}
                      >
                        <Sparkles className={`w-4 h-4 ${flower.is_boosted ? "fill-amber-500" : ""}`} />
                      </button>
                      <button
                        onClick={() => startEdit(flower)}
                        className="p-1.5 rounded-lg text-muted-foreground hover:text-primary hover:bg-muted transition-colors"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => removeFlower(flower.id)}
                        className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
};

export default InventoryTab;

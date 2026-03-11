import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Trash2, Edit2, Package, Flower2, Check, X, Sparkles, Search, ImageIcon, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useInventory, type Flower } from "@/hooks/useInventory";

interface InventoryTabProps {
  shopId: string;
}

const InventoryTab = ({ shopId }: InventoryTabProps) => {
  const { flowers, loading, addFlower, updateFlower, toggleAvailability, toggleBoost, removeFlower, generateFlowerImage } = useInventory(shopId);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [generatingImageIds, setGeneratingImageIds] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");
  const [togglingIds, setTogglingIds] = useState<Set<string>>(new Set());
  const [colorInput, setColorInput] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    colors: [] as string[],
    price: "",
    quantity: "",
    shelf_life_days: "7",
  });
  const [editData, setEditData] = useState({
    name: "",
    color: "",
    price: "",
    quantity: "",
    shelf_life_days: "7",
  });

  // ── Filter ──
  const filteredFlowers = useMemo(() => {
    if (!searchQuery.trim()) return flowers;
    const q = searchQuery.trim().toLowerCase();
    return flowers.filter(
      (f) => f.name.toLowerCase().includes(q) || (f.color && f.color.toLowerCase().includes(q))
    );
  }, [flowers, searchQuery]);

  // ── Group by flower name ──
  const groupedFlowers = useMemo(() => {
    const groups: Record<string, Flower[]> = {};
    for (const f of filteredFlowers) {
      if (!groups[f.name]) groups[f.name] = [];
      groups[f.name].push(f);
    }
    return Object.entries(groups).sort(([a], [b]) => a.localeCompare(b));
  }, [filteredFlowers]);

  const availableCount = flowers.filter((f) => f.is_available).length;
  const unavailableCount = flowers.length - availableCount;

  // ── Color tag helpers ──
  const addColorTag = () => {
    const trimmed = colorInput.trim();
    if (trimmed && !formData.colors.includes(trimmed)) {
      setFormData((p) => ({ ...p, colors: [...p.colors, trimmed] }));
    }
    setColorInput("");
  };

  const removeColorTag = (color: string) => {
    setFormData((p) => ({ ...p, colors: p.colors.filter((c) => c !== color) }));
  };

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

  const handleGenerateImage = async (flower: Flower) => {
    setGeneratingImageIds((prev) => new Set(prev).add(flower.id));
    await generateFlowerImage(flower.id, flower.name, flower.color ?? undefined);
    setGeneratingImageIds((prev) => { const n = new Set(prev); n.delete(flower.id); return n; });
  };

  const handleAdd = async () => {
    if (!formData.name || !formData.price) return;
    const colorsToAdd = formData.colors.length > 0 ? formData.colors : [undefined as string | undefined];
    for (const color of colorsToAdd) {
      await addFlower({
        name: formData.name,
        color: color || undefined,
        price: Number(formData.price),
        quantity: Number(formData.quantity) || 0,
        shelf_life_days: Number(formData.shelf_life_days) || 7,
      });
    }
    setFormData({ name: "", colors: [], price: "", quantity: "", shelf_life_days: "7" });
    setColorInput("");
    setShowAddForm(false);
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

              {/* Name */}
              <div className="space-y-1">
                <Label className="text-xs font-body">שם הפרח *</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))}
                  placeholder="ורד"
                  className="rounded-xl h-9"
                />
              </div>

              {/* Colors multi-tag */}
              <div className="space-y-1">
                <Label className="text-xs font-body">צבעים</Label>
                {formData.colors.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-2">
                    {formData.colors.map((c) => (
                      <span
                        key={c}
                        className="flex items-center gap-1 text-xs bg-primary/10 text-primary px-2.5 py-1 rounded-full font-body"
                      >
                        {c}
                        <button
                          onClick={() => removeColorTag(c)}
                          className="hover:text-destructive transition-colors"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
                <div className="flex gap-2">
                  <Input
                    value={colorInput}
                    onChange={(e) => setColorInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === ",") {
                        e.preventDefault();
                        addColorTag();
                      }
                    }}
                    placeholder="אדום, לבן... (Enter להוספה)"
                    className="rounded-xl h-9 flex-1"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addColorTag}
                    className="rounded-xl h-9 px-3 shrink-0"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>

              {/* Price / Quantity / Shelf life */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs font-body">מחיר ₪ *</Label>
                  <Input
                    type="number"
                    value={formData.price}
                    onChange={(e) => setFormData((p) => ({ ...p, price: e.target.value }))}
                    placeholder="15"
                    className="rounded-xl h-9"
                    min="0"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-body">כמות</Label>
                  <Input
                    type="number"
                    value={formData.quantity}
                    onChange={(e) => setFormData((p) => ({ ...p, quantity: e.target.value }))}
                    placeholder="50"
                    className="rounded-xl h-9"
                    min="0"
                  />
                </div>
                <div className="space-y-1 col-span-2">
                  <Label className="text-xs font-body">ימי מדף</Label>
                  <Input
                    type="number"
                    value={formData.shelf_life_days}
                    onChange={(e) => setFormData((p) => ({ ...p, shelf_life_days: e.target.value }))}
                    placeholder="7"
                    className="rounded-xl h-9"
                    min="1"
                  />
                </div>
              </div>

              <Button variant="hero" className="w-full rounded-xl gap-2" onClick={handleAdd}>
                <Flower2 className="w-4 h-4" />
                {formData.colors.length > 1 ? `הוסף ${formData.colors.length} גוונים` : "הוסף פרח"}
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Flower Groups */}
      {loading ? (
        <div className="text-center py-16 text-muted-foreground font-body">טוען מלאי...</div>
      ) : flowers.length === 0 ? (
        <div className="text-center py-16">
          <Package className="w-16 h-16 mx-auto mb-4 text-muted-foreground/20" />
          <p className="font-display text-lg font-semibold text-muted-foreground">המלאי ריק</p>
          <p className="text-sm mt-2 text-muted-foreground font-body">הוסיפי פרחים כדי להתחיל</p>
        </div>
      ) : (
        <div className="space-y-3">
          <AnimatePresence>
            {groupedFlowers.map(([groupName, variants]) => {
              const allUnavailable = variants.every((f) => !f.is_available);
              return (
                <motion.div
                  key={groupName}
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, height: 0 }}
                  className={`bg-card rounded-2xl border border-border/50 shadow-sm overflow-hidden transition-opacity ${
                    allUnavailable ? "opacity-50" : ""
                  }`}
                >
                  {/* ── Group header ── */}
                  <div className="px-4 pt-3 pb-2 border-b border-border/30 flex items-center justify-between">
                    <span className="font-display font-bold text-sm text-foreground">{groupName}</span>
                    <span className="text-xs text-muted-foreground font-body">
                      {variants.length > 1 ? `${variants.length} צבעים` : (variants[0].color || "")}
                    </span>
                  </div>

                  {/* ── Color variants ── */}
                  <div className="divide-y divide-border/20">
                    {variants.map((flower) => (
                      <div
                        key={flower.id}
                        className={`px-4 py-2.5 transition-colors ${!flower.is_available ? "opacity-50" : ""}`}
                      >
                        {editingId === flower.id ? (
                          /* ── Edit Mode ── */
                          <div className="space-y-2 py-1">
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
                          <div className="flex items-center gap-2">
                            {/* Availability toggle */}
                            <Switch
                              checked={flower.is_available}
                              onCheckedChange={() => handleToggleAvailability(flower)}
                              disabled={togglingIds.has(flower.id)}
                              className="shrink-0"
                            />

                            {/* Image thumbnail */}
                            <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0 bg-muted border border-border/30 relative group/img">
                              {flower.image ? (
                                <img
                                  src={flower.image}
                                  alt={`${flower.name} ${flower.color ?? ""}`}
                                  className="w-full h-full object-cover"
                                />
                              ) : generatingImageIds.has(flower.id) ? (
                                <div className="w-full h-full flex items-center justify-center bg-primary/5">
                                  <Loader2 className="w-4 h-4 text-primary animate-spin" />
                                </div>
                              ) : (
                                <button
                                  onClick={() => handleGenerateImage(flower)}
                                  title="ייצר תמונה"
                                  className="w-full h-full flex flex-col items-center justify-center gap-0.5 hover:bg-primary/10 transition-colors"
                                >
                                  <Sparkles className="w-3.5 h-3.5 text-primary/60" />
                                  <span className="text-[8px] text-primary/60 font-body leading-none">ייצר</span>
                                </button>
                              )}
                            </div>

                            {/* Color name + price */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1.5">
                                <span className="text-sm font-body text-foreground truncate">
                                  {flower.color ?? (
                                    <span className="text-muted-foreground italic text-xs">ללא צבע</span>
                                  )}
                                </span>
                                {flower.is_boosted && (
                                  <Sparkles className="w-3 h-3 text-amber-500 fill-amber-500 shrink-0" />
                                )}
                              </div>
                              <span className="text-xs text-muted-foreground font-body">₪{flower.price}</span>
                            </div>

                            {/* Actions */}
                            <div className="flex items-center gap-0.5 shrink-0">
                              <button
                                onClick={() => handleToggleBoost(flower)}
                                disabled={!flower.is_available || togglingIds.has(flower.id + "_boost")}
                                title={
                                  !flower.is_available ? "הפרח לא זמין" :
                                  flower.is_boosted ? "הסר קידום" : "קדם בצ'אט"
                                }
                                className={`p-1.5 rounded-lg transition-colors ${
                                  !flower.is_available
                                    ? "opacity-30 cursor-not-allowed"
                                    : flower.is_boosted
                                    ? "text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-950/30"
                                    : "text-muted-foreground hover:text-primary hover:bg-muted"
                                }`}
                              >
                                <Sparkles className={`w-3.5 h-3.5 ${flower.is_boosted ? "fill-amber-500" : ""}`} />
                              </button>
                              <button
                                onClick={() => startEdit(flower)}
                                className="p-1.5 rounded-lg text-muted-foreground hover:text-primary hover:bg-muted transition-colors"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => removeFlower(flower.id)}
                                className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
};

export default InventoryTab;

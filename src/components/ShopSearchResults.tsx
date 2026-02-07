import { motion, AnimatePresence } from "framer-motion";
import { Star, MapPin, Clock, Plus, X, Store, Palette, ArrowRight, Loader2 } from "lucide-react";
import Logo from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import ShopDIYBuilder from "@/components/ShopDIYBuilder";
import { useShops, type Shop } from "@/hooks/useShops";
import { useAuth } from "@/hooks/useAuth";

interface AddShopFormData {
  name: string;
  location: string;
  speciality: string;
  hours: string;
  tags: string;
}

interface ShopSearchResultsProps {
  open: boolean;
  onClose: () => void;
  searchQuery: string;
}

const ShopSearchResults = ({ open, onClose, searchQuery }: ShopSearchResultsProps) => {
  const { shops, loading, addShop, removeShop } = useShops(searchQuery);
  const { isAdmin } = useAuth();
  const navigate = useNavigate();
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedShop, setSelectedShop] = useState<Shop | null>(null);
  const [formData, setFormData] = useState<AddShopFormData>({
    name: "",
    location: "",
    speciality: "",
    hours: "",
    tags: "",
  });

  const handleAddShop = async () => {
    if (!formData.name || !formData.location) return;

    const success = await addShop({
      name: formData.name,
      location: formData.location,
      speciality: formData.speciality || undefined,
      hours: formData.hours || undefined,
      tags: formData.tags ? formData.tags.split(",").map((t) => t.trim()) : undefined,
    });

    if (success) {
      setFormData({ name: "", location: "", speciality: "", hours: "", tags: "" });
      setShowAddForm(false);
    }
  };

  const handleRemoveShop = async (id: string) => {
    await removeShop(id);
  };

  return (
    <>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-50 bg-background overflow-y-auto"
          >
            {/* Top Bar */}
            <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-xl border-b border-border/50">
              <div className="container mx-auto px-4 py-4 flex items-center justify-between">
                <button
                  onClick={onClose}
                  className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors font-body"
                >
                  <ArrowRight className="w-5 h-5" />
                  חזרה לדף הראשי
                </button>
                <Logo size="sm" />
              </div>
            </div>

            {/* Page Content */}
            <div className="container mx-auto px-4 py-10">
              {/* Header */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="text-center mb-12"
              >
                <h1 className="text-4xl md:text-5xl font-display font-bold text-foreground mb-3">
                  {searchQuery ? `חנויות באזור "${searchQuery}"` : "חנויות פרחים"}
                </h1>
                <p className="text-lg text-muted-foreground font-body">
                  {loading ? "טוען חנויות..." : `${shops.length} חנויות נמצאו`}
                </p>
              </motion.div>

              {/* Admin Add Button */}
              {isAdmin && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="flex justify-center mb-8"
                >
                  <Button
                    variant="hero-outline"
                    size="default"
                    className="rounded-xl gap-2"
                    onClick={() => setShowAddForm(!showAddForm)}
                  >
                    <Plus className="w-4 h-4" />
                    {showAddForm ? "ביטול" : "הוסף חנות"}
                  </Button>
                </motion.div>
              )}

              {/* Add Shop Form */}
              <AnimatePresence>
                {showAddForm && isAdmin && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden mb-10 max-w-2xl mx-auto"
                  >
                    <div className="bg-card rounded-2xl p-6 space-y-4 border border-border/50 shadow-card">
                      <h3 className="font-display text-lg font-semibold text-foreground text-right">חנות חדשה</h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <input
                          type="text"
                          placeholder="שם החנות *"
                          value={formData.name}
                          onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                          className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm font-body text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-ring"
                        />
                        <input
                          type="text"
                          placeholder="כתובת *"
                          value={formData.location}
                          onChange={(e) => setFormData((prev) => ({ ...prev, location: e.target.value }))}
                          className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm font-body text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-ring"
                        />
                        <input
                          type="text"
                          placeholder="התמחות"
                          value={formData.speciality}
                          onChange={(e) => setFormData((prev) => ({ ...prev, speciality: e.target.value }))}
                          className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm font-body text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-ring"
                        />
                        <input
                          type="text"
                          placeholder="שעות פעילות"
                          value={formData.hours}
                          onChange={(e) => setFormData((prev) => ({ ...prev, hours: e.target.value }))}
                          className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm font-body text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-ring"
                        />
                      </div>
                      <input
                        type="text"
                        placeholder="תגיות (מופרדות בפסיק)"
                        value={formData.tags}
                        onChange={(e) => setFormData((prev) => ({ ...prev, tags: e.target.value }))}
                        className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm font-body text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-ring"
                      />
                      <div className="flex justify-end">
                        <Button variant="hero" size="default" className="rounded-xl gap-2" onClick={handleAddShop}>
                          <Store className="w-4 h-4" />
                          הוסף חנות
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Shop Grid */}
              {loading ? (
                <div className="text-center py-20">
                  <Loader2 className="w-10 h-10 mx-auto mb-4 animate-spin text-primary" />
                  <p className="text-muted-foreground font-body">טוען חנויות...</p>
                </div>
              ) : shops.length === 0 ? (
                <div className="text-center py-20 text-muted-foreground">
                  <Store className="w-16 h-16 mx-auto mb-4 opacity-20" />
                  <p className="font-display text-xl font-semibold">לא נמצאו חנויות</p>
                  <p className="text-sm mt-2 font-body">נסו לחפש כתובת אחרת</p>
                </div>
              ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
                  {shops.map((shop, index) => (
                    <motion.div
                      key={shop.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 + index * 0.06 }}
                      className="group relative bg-card rounded-2xl overflow-hidden border border-border/50 hover:border-primary/30 shadow-soft hover:shadow-elevated transition-all duration-300"
                    >
                      {/* Remove Button - Admin only */}
                      {isAdmin && (
                        <button
                          onClick={() => handleRemoveShop(shop.id)}
                          className="absolute top-3 left-3 z-10 opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-full bg-background/80 hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
                          title="הסר חנות"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}

                      {/* Shop Header - gradient bar instead of emoji */}
                      <div className="h-2 bg-gradient-sage" />

                      <div className="p-6 space-y-4">
                        {/* Name & Speciality */}
                        <div className="text-right">
                          <h3 className="font-display text-xl font-bold text-foreground">{shop.name}</h3>
                          <p className="text-sm text-primary font-medium mt-0.5">{shop.speciality}</p>
                        </div>

                        {/* Details */}
                        <div className="space-y-2.5">
                          <div className="flex items-center gap-2.5 text-sm text-muted-foreground">
                            <MapPin className="w-4 h-4 shrink-0 text-primary/60" />
                            <span>{shop.location}</span>
                          </div>
                          <div className="flex items-center gap-2.5 text-sm text-muted-foreground">
                            <Clock className="w-4 h-4 shrink-0 text-primary/60" />
                            <span>{shop.hours}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Star className="w-4 h-4 fill-gold text-gold" />
                            <span className="font-semibold text-foreground">{shop.rating}</span>
                            <span className="text-muted-foreground text-sm">({shop.reviews} ביקורות)</span>
                          </div>
                        </div>

                        {/* Tags */}
                        <div className="flex flex-wrap gap-1.5">
                          {shop.tags.map((tag) => (
                            <span
                              key={tag}
                              className="text-xs px-3 py-1 rounded-full bg-muted text-muted-foreground font-medium"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>

                        {/* Separator */}
                        <div className="border-t border-border/50" />

                        {/* Action Buttons */}
                        <div className="flex gap-2 justify-center">
                          <Button
                            variant="hero"
                            size="sm"
                            className="flex-1 rounded-xl gap-2"
                            onClick={() => setSelectedShop(shop)}
                          >
                            <Palette className="w-4 h-4" />
                            עיצוב זר עצמאי
                          </Button>
                          <Button
                            variant="hero-outline"
                            size="sm"
                            className="rounded-xl gap-1"
                            onClick={() => navigate("/ai-chat")}
                          >
                            <Palette className="w-3.5 h-3.5" />
                            בניית זר עם AI
                          </Button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* DIY Builder Dialog */}
      <ShopDIYBuilder
        open={!!selectedShop}
        onOpenChange={(val) => { if (!val) setSelectedShop(null); }}
        shopName={selectedShop?.name || ""}
        shopImage={selectedShop?.image || ""}
        onBack={() => setSelectedShop(null)}
      />
    </>
  );
};

export default ShopSearchResults;

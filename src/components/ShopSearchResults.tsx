import { motion, AnimatePresence } from "framer-motion";
import { Plus, Store, ArrowRight, Loader2, Navigation, AlertCircle, Trash2 } from "lucide-react";
import Logo from "@/components/Logo";
import ShopCard from "@/components/ShopCard";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

import { useShops } from "@/hooks/useShops";
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
  const {
    shops,
    loading,
    addShop,
    removeShop,
    userLocation,
    locationLoading,
    locationError,
    requestLocation,
  } = useShops(searchQuery);
  const { isAdmin, user } = useAuth();
  const navigate = useNavigate();
  const [showAddForm, setShowAddForm] = useState(false);
  const [shopToDelete, setShopToDelete] = useState<{ id: string; name: string } | null>(null);
  
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
      owner_id: user?.id,
    });

    if (success) {
      setFormData({ name: "", location: "", speciality: "", hours: "", tags: "" });
      setShowAddForm(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (shopToDelete) {
      await removeShop(shopToDelete.id);
      setShopToDelete(null);
    }
  };

  const handleRemoveShop = (id: string, name: string) => {
    setShopToDelete({ id, name });
  };

  const formatDistance = (distance?: number) => {
    if (distance === undefined) return null;
    if (distance < 1) return `${Math.round(distance * 1000)} מ'`;
    return `${distance} ק"מ`;
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
                className="text-center mb-8"
              >
                <h1 className="text-4xl md:text-5xl font-display font-bold text-foreground mb-3">
                  {searchQuery ? `חנויות באזור "${searchQuery}"` : "חנויות פרחים"}
                </h1>
                <p className="text-lg text-muted-foreground font-body">
                  {loading ? "טוען חנויות..." : `${shops.length} חנויות נמצאו`}
                </p>
              </motion.div>

              {/* Location Button */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="flex flex-col items-center gap-2 mb-8"
              >
                {!userLocation && (
                  <Button
                    variant="hero-outline"
                    className="rounded-xl gap-2"
                    onClick={requestLocation}
                    disabled={locationLoading}
                  >
                    {locationLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        מאתר מיקום...
                      </>
                    ) : (
                      <>
                        <Navigation className="w-4 h-4" />
                        מצא חנויות קרובות אליי
                      </>
                    )}
                  </Button>
                )}
                {userLocation && (
                  <p className="text-sm text-primary font-body flex items-center gap-1.5">
                    <Navigation className="w-3.5 h-3.5" />
                    החנויות ממוינות לפי מרחק ממיקומך
                  </p>
                )}
                {locationError && (
                  <p className="text-sm text-destructive font-body flex items-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5" />
                    {locationError}
                  </p>
                )}
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
                          placeholder="כתובת (עיר, רחוב) *"
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
                    <ShopCard
                      key={shop.id}
                      shop={shop}
                      index={index}
                      isAdmin={isAdmin}
                      onRemove={handleRemoveShop}
                      formatDistance={formatDistance}
                    />
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!shopToDelete} onOpenChange={(open) => !open && setShopToDelete(null)}>
        <AlertDialogContent className="rounded-2xl" dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-display text-right">
              מחיקת חנות "{shopToDelete?.name}"
            </AlertDialogTitle>
            <AlertDialogDescription className="text-right font-body">
              פעולה זו תמחק את החנות, כל המלאי, וכל ההזמנות שלה לצמיתות. לא ניתן לבטל פעולה זו.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex gap-2 sm:flex-row-reverse">
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-xl"
            >
              מחק לצמיתות
            </AlertDialogAction>
            <AlertDialogCancel className="rounded-xl">ביטול</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default ShopSearchResults;

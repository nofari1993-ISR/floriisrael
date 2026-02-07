import { motion, AnimatePresence } from "framer-motion";
import { Star, MapPin, Clock, Plus, X, Store } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useState } from "react";

interface Shop {
  id: number;
  name: string;
  location: string;
  rating: number;
  reviews: number;
  speciality: string;
  image: string;
  hours: string;
  tags: string[];
}

const initialShops: Shop[] = [
  {
    id: 1,
    name: "פרחי הגן",
    location: "תל אביב, רוטשילד 42",
    rating: 4.9,
    reviews: 234,
    speciality: "זרים רומנטיים",
    image: "🌹",
    hours: "08:00 - 20:00",
    tags: ["משלוח מהיר", "DIY"],
  },
  {
    id: 2,
    name: "בלום בוטיק",
    location: "ירושלים, אמילי זולא 15",
    rating: 4.8,
    reviews: 189,
    speciality: "עיצוב מודרני",
    image: "🌸",
    hours: "09:00 - 21:00",
    tags: ["פרימיום", "אירועים"],
  },
  {
    id: 3,
    name: "הפרח הירוק",
    location: "חיפה, הנביאים 8",
    rating: 4.7,
    reviews: 156,
    speciality: "פרחי שדה",
    image: "🌿",
    hours: "07:30 - 19:00",
    tags: ["אורגני", "מקומי"],
  },
  {
    id: 4,
    name: "סחלב פרחים",
    location: "הרצליה, סוקולוב 22",
    rating: 4.9,
    reviews: 312,
    speciality: "סידורי יוקרה",
    image: "🌺",
    hours: "08:00 - 22:00",
    tags: ["יוקרה", "24/7 משלוח"],
  },
];

interface AddShopFormData {
  name: string;
  location: string;
  speciality: string;
  hours: string;
  tags: string;
}

interface ShopSearchResultsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  searchQuery: string;
}

const ShopSearchResults = ({ open, onOpenChange, searchQuery }: ShopSearchResultsProps) => {
  const [shops, setShops] = useState<Shop[]>(initialShops);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState<AddShopFormData>({
    name: "",
    location: "",
    speciality: "",
    hours: "",
    tags: "",
  });

  const handleAddShop = () => {
    if (!formData.name || !formData.location) return;

    const newShop: Shop = {
      id: Date.now(),
      name: formData.name,
      location: formData.location,
      rating: 5.0,
      reviews: 0,
      speciality: formData.speciality || "כללי",
      image: "🌼",
      hours: formData.hours || "09:00 - 18:00",
      tags: formData.tags ? formData.tags.split(",").map((t) => t.trim()) : [],
    };

    setShops((prev) => [...prev, newShop]);
    setFormData({ name: "", location: "", speciality: "", hours: "", tags: "" });
    setShowAddForm(false);
  };

  const handleRemoveShop = (id: number) => {
    setShops((prev) => prev.filter((shop) => shop.id !== id));
  };

  const filteredShops = searchQuery
    ? shops.filter(
        (shop) =>
          shop.name.includes(searchQuery) ||
          shop.location.includes(searchQuery) ||
          shop.speciality.includes(searchQuery)
      )
    : shops;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto p-0 rounded-2xl border-border/50">
        <DialogHeader className="p-6 pb-2">
          <DialogTitle className="font-display text-2xl text-foreground text-right">
            {searchQuery ? `תוצאות חיפוש: "${searchQuery}"` : "חנויות פרחים"}
          </DialogTitle>
          <DialogDescription className="text-right text-muted-foreground">
            {filteredShops.length} חנויות נמצאו
          </DialogDescription>
        </DialogHeader>

        <div className="px-6 pb-4">
          {/* Add Shop Button */}
          <Button
            variant="hero-outline"
            size="sm"
            className="rounded-xl gap-2 mb-4"
            onClick={() => setShowAddForm(!showAddForm)}
          >
            <Plus className="w-4 h-4" />
            {showAddForm ? "ביטול" : "הוסף חנות"}
          </Button>

          {/* Add Shop Form */}
          <AnimatePresence>
            {showAddForm && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden mb-6"
              >
                <div className="glass-card rounded-2xl p-5 space-y-3 border border-border/50">
                  <h3 className="font-display font-semibold text-foreground text-right">חנות חדשה</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <input
                      type="text"
                      placeholder="שם החנות *"
                      value={formData.name}
                      onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                      className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm font-body text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-ring"
                    />
                    <input
                      type="text"
                      placeholder="כתובת *"
                      value={formData.location}
                      onChange={(e) => setFormData((prev) => ({ ...prev, location: e.target.value }))}
                      className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm font-body text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-ring"
                    />
                    <input
                      type="text"
                      placeholder="התמחות"
                      value={formData.speciality}
                      onChange={(e) => setFormData((prev) => ({ ...prev, speciality: e.target.value }))}
                      className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm font-body text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-ring"
                    />
                    <input
                      type="text"
                      placeholder="שעות פעילות"
                      value={formData.hours}
                      onChange={(e) => setFormData((prev) => ({ ...prev, hours: e.target.value }))}
                      className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm font-body text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>
                  <input
                    type="text"
                    placeholder="תגיות (מופרדות בפסיק)"
                    value={formData.tags}
                    onChange={(e) => setFormData((prev) => ({ ...prev, tags: e.target.value }))}
                    className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm font-body text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-ring"
                  />
                  <div className="flex justify-end">
                    <Button variant="hero" size="sm" className="rounded-xl gap-2" onClick={handleAddShop}>
                      <Store className="w-4 h-4" />
                      הוסף חנות
                    </Button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Shop List */}
          <div className="space-y-3">
            {filteredShops.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Store className="w-12 h-12 mx-auto mb-3 opacity-40" />
                <p className="font-body">לא נמצאו חנויות</p>
                <p className="text-sm mt-1">נסו לחפש כתובת אחרת או הוסיפו חנות חדשה</p>
              </div>
            ) : (
              filteredShops.map((shop, index) => (
                <motion.div
                  key={shop.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="group relative flex items-center gap-4 p-4 rounded-2xl border border-border/50 bg-card hover:border-primary/20 hover:shadow-soft transition-all duration-300"
                >
                  {/* Remove Button */}
                  <button
                    onClick={() => handleRemoveShop(shop.id)}
                    className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-full hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
                    title="הסר חנות"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>

                  {/* Shop Icon */}
                  <div className="w-14 h-14 rounded-xl bg-gradient-card flex items-center justify-center text-3xl shrink-0">
                    {shop.image}
                  </div>

                  {/* Shop Info */}
                  <div className="flex-1 min-w-0 text-right">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1">
                        <Star className="w-3.5 h-3.5 fill-gold text-gold" />
                        <span className="text-sm font-semibold text-foreground">{shop.rating}</span>
                        <span className="text-xs text-muted-foreground">({shop.reviews})</span>
                      </div>
                      <h3 className="font-display font-bold text-foreground truncate">{shop.name}</h3>
                    </div>
                    <div className="flex items-center justify-end gap-1.5 mt-1 text-sm text-muted-foreground">
                      <span>{shop.location}</span>
                      <MapPin className="w-3.5 h-3.5 shrink-0" />
                    </div>
                    <div className="flex items-center justify-end gap-1.5 mt-0.5 text-xs text-muted-foreground">
                      <span>{shop.hours}</span>
                      <Clock className="w-3 h-3 shrink-0" />
                    </div>
                    <div className="flex flex-wrap justify-end gap-1.5 mt-2">
                      {shop.tags.map((tag) => (
                        <span
                          key={tag}
                          className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground font-medium"
                        >
                          {tag}
                        </span>
                      ))}
                      <span className="text-xs px-2 py-0.5 rounded-full bg-accent/30 text-accent-foreground font-medium">
                        {shop.speciality}
                      </span>
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ShopSearchResults;

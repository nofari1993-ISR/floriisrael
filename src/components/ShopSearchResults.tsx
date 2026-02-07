import { motion, AnimatePresence } from "framer-motion";
import { Star, MapPin, Clock, Plus, X, Store, Palette, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import ShopDIYBuilder from "@/components/ShopDIYBuilder";

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
  onClose: () => void;
  searchQuery: string;
}

const ShopSearchResults = ({ open, onClose, searchQuery }: ShopSearchResultsProps) => {
  const [shops, setShops] = useState<Shop[]>(initialShops);
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedShop, setSelectedShop] = useState<Shop | null>(null);
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
                <div className="flex items-center gap-2">
                  <span className="text-2xl">🌸</span>
                  <span className="font-display text-xl font-bold text-foreground">Nuphar Flowers AI</span>
                </div>
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
                <span className="inline-block px-4 py-1.5 rounded-full bg-accent/30 text-accent-foreground text-sm font-medium mb-4">
                  🏪 תוצאות חיפוש
                </span>
                <h1 className="text-4xl md:text-5xl font-display font-bold text-foreground mb-3">
                  {searchQuery ? `חנויות באזור "${searchQuery}"` : "חנויות פרחים"}
                </h1>
                <p className="text-lg text-muted-foreground font-body">
                  {filteredShops.length} חנויות נמצאו — בחרו חנות ובנו את הזר שלכם
                </p>
              </motion.div>

              {/* Add Shop Button */}
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

              {/* Add Shop Form */}
              <AnimatePresence>
                {showAddForm && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden mb-10 max-w-2xl mx-auto"
                  >
                    <div className="glass-card rounded-2xl p-6 space-y-4 border border-border/50">
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
              {filteredShops.length === 0 ? (
                <div className="text-center py-20 text-muted-foreground">
                  <Store className="w-16 h-16 mx-auto mb-4 opacity-30" />
                  <p className="font-display text-xl font-semibold">לא נמצאו חנויות</p>
                  <p className="text-sm mt-2 font-body">נסו לחפש כתובת אחרת או הוסיפו חנות חדשה</p>
                </div>
              ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
                  {filteredShops.map((shop, index) => (
                    <motion.div
                      key={shop.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.15 + index * 0.07 }}
                      className="group relative bg-card rounded-2xl overflow-hidden border border-border/50 hover:border-primary/20 shadow-soft hover:shadow-card transition-all duration-300"
                    >
                      {/* Remove Button */}
                      <button
                        onClick={() => handleRemoveShop(shop.id)}
                        className="absolute top-3 left-3 z-10 opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-full bg-background/80 hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
                        title="הסר חנות"
                      >
                        <X className="w-4 h-4" />
                      </button>

                      {/* Shop Header */}
                      <div className="bg-gradient-card p-6 text-center">
                        <span className="text-5xl block mb-3">{shop.image}</span>
                        <h3 className="font-display text-xl font-bold text-foreground">{shop.name}</h3>
                        <p className="text-sm text-muted-foreground mt-1">{shop.speciality}</p>
                      </div>

                      {/* Shop Details */}
                      <div className="p-5 space-y-3">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <MapPin className="w-4 h-4 shrink-0" />
                          <span>{shop.location}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Clock className="w-4 h-4 shrink-0" />
                          <span>{shop.hours}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Star className="w-4 h-4 fill-gold text-gold" />
                          <span className="font-semibold text-foreground">{shop.rating}</span>
                          <span className="text-muted-foreground text-sm">({shop.reviews})</span>
                        </div>

                        {/* Tags */}
                        <div className="flex flex-wrap gap-2 pt-1">
                          {shop.tags.map((tag) => (
                            <span
                              key={tag}
                              className="text-xs px-2.5 py-1 rounded-full bg-muted text-muted-foreground font-medium"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>

                        {/* DIY Button */}
                        <Button
                          variant="hero"
                          size="sm"
                          className="w-full mt-3 rounded-xl gap-2"
                          onClick={() => setSelectedShop(shop)}
                        >
                          <Palette className="w-4 h-4" />
                          בנה זר DIY
                        </Button>
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

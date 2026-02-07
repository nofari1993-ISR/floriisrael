import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "../utils";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Search, Filter, Palette, Loader2, SlidersHorizontal } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

import FlowerCard from "../components/flowers/FlowerCard";
import BouquetSummary from "../components/bouquet/BouquetSummary";

const SEASONS = ["כל השנה", "אביב", "קיץ", "סתיו", "חורף"];
const CATEGORIES = ["הכל", "עיקרי", "משני", "מילוי", "ירק"];
// צבעים יהיו דינמיים לפי הפרחים הזמינים

export default function BouquetStudio() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSeason, setSelectedSeason] = useState("כל השנה");
  const [selectedCategory, setSelectedCategory] = useState("הכל");
  const [selectedColor, setSelectedColor] = useState("הכל");
  const [selectedFlowers, setSelectedFlowers] = useState([]);
  const [isMobileSummaryOpen, setIsMobileSummaryOpen] = useState(false);
  const [generatedImageUrl, setGeneratedImageUrl] = useState(null);

  const { data: flowers = [], isLoading } = useQuery({
    queryKey: ["flowers"],
    queryFn: () => base44.entities.Flower.list(),
  });

  const { data: colorVariants = [] } = useQuery({
    queryKey: ["colorVariants"],
    queryFn: () => base44.entities.FlowerColorVariant.list(),
  });

  // קבלת רשימת צבעים יחודיים זמינים
  const availableColors = ["הכל", ...new Set(colorVariants.map((cv) => cv.color).filter(Boolean))].sort();

  // טעינת זר שמור אם קיים (למקרה שחזרו מדף התשלום)
  useEffect(() => {
    const savedBouquet = localStorage.getItem("custom_bouquet_state");
    if (savedBouquet) {
      try {
        const parsed = JSON.parse(savedBouquet);
        setSelectedFlowers(parsed.selectedFlowers || []);
        setGeneratedImageUrl(parsed.generatedImageUrl || null);
      } catch (error) {
        console.error("Error loading saved bouquet:", error);
      }
    }
  }, []);

  // Get current season
  const getCurrentSeason = () => {
    const month = new Date().getMonth();
    if (month >= 2 && month <= 4) return "אביב";
    if (month >= 5 && month <= 7) return "קיץ";
    if (month >= 8 && month <= 10) return "סתיו";
    return "חורף";
  };

  const currentSeason = getCurrentSeason();

  // Filter flowers
  const filteredFlowers = flowers.filter((flower) => {
    const matchesSearch =
      flower.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      flower.name_en?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesSeason =
      selectedSeason === "כל השנה" || flower.season?.includes(selectedSeason) || flower.season?.includes("כל השנה");

    const matchesCategory = selectedCategory === "הכל" || flower.category === selectedCategory;

    const matchesColor = selectedColor === "הכל" || flower.colors?.includes(selectedColor);

    return matchesSearch && matchesSeason && matchesCategory && matchesColor;
  });

  // Handle add flower
  const handleAddFlower = (flower, color) => {
    setSelectedFlowers((prev) => {
      const key = color ? `${flower.id}_${color}` : flower.id;
      const existing = prev.find((f) => (f.color ? `${f.flower.id}_${f.color}` : f.flower.id) === key);
      if (existing) {
        return prev.map((f) =>
          (f.color ? `${f.flower.id}_${f.color}` : f.flower.id) === key ? { ...f, quantity: f.quantity + 1 } : f,
        );
      }
      return [...prev, { flower, color, quantity: 1 }];
    });
  };

  // Handle remove flower
  const handleRemoveFlower = (flower, color) => {
    setSelectedFlowers((prev) => {
      const key = color ? `${flower.id}_${color}` : flower.id;
      const existing = prev.find((f) => (f.color ? `${f.flower.id}_${f.color}` : f.flower.id) === key);
      if (existing && existing.quantity > 1) {
        return prev.map((f) =>
          (f.color ? `${f.flower.id}_${f.color}` : f.flower.id) === key ? { ...f, quantity: f.quantity - 1 } : f,
        );
      }
      return prev.filter((f) => (f.color ? `${f.flower.id}_${f.color}` : f.flower.id) !== key);
    });
  };

  // Handle remove from summary
  const handleRemoveFromSummary = (flowerId) => {
    setSelectedFlowers((prev) => prev.filter((f) => f.flower.id !== flowerId));
  };

  // Get quantity for flower
  const getQuantity = (flowerId) => {
    const item = selectedFlowers.find((f) => f.flower.id === flowerId);
    return item?.quantity || 0;
  };

  // Handle checkout
  const handleCheckout = async (generatedImageUrl = null) => {
    const totalPrice = selectedFlowers.reduce((sum, item) => sum + item.flower.price * item.quantity, 0);

    const bouquetData = {
      name: "זר מעוצב אישית",
      flowers: selectedFlowers.map((item) => ({
        flower_id: item.flower.id,
        flower_name: item.flower.name,
        color: item.color || null,
        quantity: item.quantity,
        price_per_unit: item.flower.price,
      })),
      total_price: totalPrice,
      image_url: generatedImageUrl || null,
      created_by_ai: false,
    };

    // שמירת הזר לפני המעבר לתשלום
    const bouquetState = {
      selectedFlowers,
      generatedImageUrl,
      timestamp: new Date().toISOString(),
    };
    localStorage.setItem("custom_bouquet_state", JSON.stringify(bouquetState));

    const bouquet = await base44.entities.Bouquet.create(bouquetData);
    navigate(createPageUrl(`Checkout?bouquet_id=${bouquet.id}`));
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50/50 to-white">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-500 to-teal-600 py-12 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-full px-4 py-2 mb-4">
              <span className="text-emerald-100">🌸</span>
              <span className="text-white text-sm">עכשיו בעונה: {currentSeason}</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">סטודיו לעיצוב זרים</h1>
            <p className="text-emerald-100 text-lg max-w-2xl mx-auto">
              בחרו מהמבחר הרחב שלנו ובנו את הזר המושלם בדיוק לפי הטעם שלכם
            </p>
          </motion.div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Filters */}
        <div className="bg-white rounded-2xl shadow-md p-4 mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                placeholder="חיפוש פרחים..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pr-10 rounded-full"
              />
            </div>

            {/* Season Filter */}
            <Select value={selectedSeason} onValueChange={setSelectedSeason}>
              <SelectTrigger className="w-full md:w-40 rounded-full">
                <SelectValue placeholder="עונה" />
              </SelectTrigger>
              <SelectContent>
                {SEASONS.map((season) => (
                  <SelectItem key={season} value={season}>
                    {season}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Category Filter */}
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-full md:w-40 rounded-full">
                <SelectValue placeholder="קטגוריה" />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Color Filter */}
            <Select value={selectedColor} onValueChange={setSelectedColor}>
              <SelectTrigger className="w-full md:w-40 rounded-full">
                <SelectValue placeholder="צבע" />
              </SelectTrigger>
              <SelectContent>
                {availableColors.map((color) => (
                  <SelectItem key={color} value={color}>
                    {color}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Active Filters */}
          <div className="flex flex-wrap gap-2 mt-4">
            {selectedSeason !== "כל השנה" && (
              <Badge variant="secondary" className="bg-emerald-100 text-emerald-700">
                {selectedSeason}
                <button onClick={() => setSelectedSeason("כל השנה")} className="mr-1 hover:text-emerald-900">
                  ×
                </button>
              </Badge>
            )}
            {selectedCategory !== "הכל" && (
              <Badge variant="secondary" className="bg-purple-100 text-purple-700">
                {selectedCategory}
                <button onClick={() => setSelectedCategory("הכל")} className="mr-1 hover:text-purple-900">
                  ×
                </button>
              </Badge>
            )}
            {selectedColor !== "הכל" && (
              <Badge variant="secondary" className="bg-rose-100 text-rose-700">
                {selectedColor}
                <button onClick={() => setSelectedColor("הכל")} className="mr-1 hover:text-rose-900">
                  ×
                </button>
              </Badge>
            )}
          </div>
        </div>

        <div className="grid lg:grid-cols-4 gap-8">
          {/* Flowers Grid */}
          <div className="lg:col-span-3">
            {isLoading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
              </div>
            ) : filteredFlowers.length === 0 ? (
              <div className="text-center py-20">
                <Palette className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">לא נמצאו פרחים</h3>
                <p className="text-gray-500">נסו לשנות את הסינון</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {filteredFlowers
                  .sort((a, b) => {
                    const priority = ["גרברה", "שושן צחוק", "ורד"];
                    const aIndex = priority.indexOf(a.name);
                    const bIndex = priority.indexOf(b.name);

                    if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex;
                    if (aIndex !== -1) return -1;
                    if (bIndex !== -1) return 1;

                    // רוסקוס, שרך ואקליפטוס למטה
                    if (a.name === "רוסקוס" || a.name === "שרך" || a.name === "אקליפטוס") return 1;
                    if (b.name === "רוסקוס" || b.name === "שרך" || b.name === "אקליפטוס") return -1;

                    return 0;
                  })
                  .map((flower) => (
                    <FlowerCard
                      key={flower.id}
                      flower={flower}
                      quantity={getQuantity(flower.id)}
                      onAdd={handleAddFlower}
                      onRemove={handleRemoveFlower}
                    />
                  ))}
              </div>
            )}
          </div>

          {/* Desktop Summary */}
          <div className="hidden lg:block">
            <div className="sticky top-24">
              <BouquetSummary
                selectedFlowers={selectedFlowers}
                onRemove={handleRemoveFromSummary}
                onClearAll={() => setSelectedFlowers([])}
                onCheckout={() => handleCheckout(generatedImageUrl)}
                onImageGenerated={setGeneratedImageUrl}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Summary Button */}
      {selectedFlowers.length > 0 && (
        <div className="fixed bottom-4 left-4 right-4 lg:hidden z-50">
          <Sheet open={isMobileSummaryOpen} onOpenChange={setIsMobileSummaryOpen}>
            <SheetTrigger asChild>
              <Button className="w-full bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 rounded-full py-6 text-lg shadow-xl">
                <span className="flex items-center gap-2">
                  צפה בזר ({selectedFlowers.reduce((sum, i) => sum + i.quantity, 0)} פרחים)
                  <span className="bg-white/20 px-3 py-1 rounded-full">
                    ₪{selectedFlowers.reduce((sum, i) => sum + i.flower.price * i.quantity, 0)}
                  </span>
                </span>
              </Button>
            </SheetTrigger>
            <SheetContent side="bottom" className="h-[90vh] rounded-t-3xl overflow-y-auto">
              <SheetHeader>
                <SheetTitle>הזר שלכם</SheetTitle>
              </SheetHeader>
              <div className="mt-4">
                <BouquetSummary
                  selectedFlowers={selectedFlowers}
                  onRemove={handleRemoveFromSummary}
                  onClearAll={() => setSelectedFlowers([])}
                  onCheckout={() => {
                    setIsMobileSummaryOpen(false);
                    handleCheckout(generatedImageUrl);
                  }}
                  onImageGenerated={setGeneratedImageUrl}
                />
              </div>
            </SheetContent>
          </Sheet>
        </div>
      )}
    </div>
  );
}

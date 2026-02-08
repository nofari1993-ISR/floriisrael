import { useNavigate, useSearchParams } from "react-router-dom";
import { useState, useMemo, useCallback } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Palette, Search, Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

import Logo from "@/components/Logo";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

import FlowerCard from "@/components/diy-builder/FlowerCard";
import BouquetSummary from "@/components/diy-builder/BouquetSummary";
import ColorSelector from "@/components/diy-builder/ColorSelector";
import { useDIYBuilder } from "@/hooks/useDIYBuilder";

const DIYBuilderPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const shopId = searchParams.get("shopId");

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedColor, setSelectedColor] = useState("הכל");
  const [isMobileSummaryOpen, setIsMobileSummaryOpen] = useState(false);
  const [colorSelectorFlower, setColorSelectorFlower] = useState<string | null>(null);

  const {
    selectedFlowers,
    handleAddFlower,
    handleRemoveFlower,
    handleRemoveFromSummary,
    clearAll,
    getQuantity,
    totalPrice,
    totalItems,
  } = useDIYBuilder();

  // Fetch flowers from database
  const { data: flowers = [], isLoading } = useQuery({
    queryKey: ["diy-flowers", shopId],
    queryFn: async () => {
      let query = supabase
        .from("flowers")
        .select("id, name, color, price, quantity, image, in_stock");

      if (shopId) {
        query = query.eq("shop_id", shopId);
      }

      const { data, error } = await query.order("name");
      if (error) throw error;
      return data || [];
    },
  });

  // Get unique colors for filter
  const availableColors = [
    "הכל",
    ...new Set(flowers.map((f) => f.color).filter(Boolean)),
  ];

  // Group flowers by name to detect color variants
  const flowerColorVariants = useMemo(() => {
    const groups: Record<string, typeof flowers> = {};
    for (const f of flowers) {
      if (!groups[f.name]) groups[f.name] = [];
      groups[f.name].push(f);
    }
    return groups;
  }, [flowers]);

  // Filter flowers
  const filteredFlowers = flowers.filter((flower) => {
    const matchesSearch = flower.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesColor = selectedColor === "הכל" || flower.color === selectedColor;
    return matchesSearch && matchesColor;
  });

  // Handle flower add - check if it has color variants
  const handleFlowerAdd = useCallback(
    (flower: any) => {
      const variants = flowerColorVariants[flower.name];
      if (variants && variants.length > 1) {
        setColorSelectorFlower(flower.name);
      } else {
        handleAddFlower(flower);
      }
    },
    [flowerColorVariants, handleAddFlower]
  );

  // Handle color selector confirm
  const handleColorConfirm = useCallback(
    (selections: { variantId: string; color: string; quantity: number }[]) => {
      for (const sel of selections) {
        const flower = flowers.find((f) => f.id === sel.variantId);
        if (flower) {
          const currentQty = getQuantity(flower.id);
          const toAdd = sel.quantity - currentQty;
          for (let i = 0; i < toAdd; i++) {
            handleAddFlower(flower);
          }
        }
      }
    },
    [flowers, getQuantity, handleAddFlower]
  );

  // Color selector variants for the active flower
  const activeColorVariants = useMemo(() => {
    if (!colorSelectorFlower) return [];
    return (flowerColorVariants[colorSelectorFlower] || []).map((f) => ({
      id: f.id,
      color: f.color || "ללא צבע",
      price: f.price,
      quantity: f.quantity,
    }));
  }, [colorSelectorFlower, flowerColorVariants]);

  // Handle checkout
  const handleCheckout = async () => {
    if (selectedFlowers.length === 0) return;

    try {
      const designFee = Math.round(totalPrice * 0.05);
      const grandTotal = totalPrice + designFee;

      const { data, error } = await supabase.functions.invoke("create-order", {
        body: {
          shop_id: shopId,
          customer_name: "לקוח מהאתר",
          recipient_name: "ייקבע בהמשך",
          delivery_address: "ייקבע בהמשך",
          delivery_date: new Date().toISOString().split("T")[0],
          total_price: grandTotal,
          notes: "זר מעוצב אישית (DIY)",
          items: selectedFlowers.map((item) => ({
            flower_name: item.flower.name,
            flower_id: item.flower.id,
            quantity: item.quantity,
            unit_price: item.flower.price,
          })),
        },
      });

      if (error) throw error;

      toast({
        title: "ההזמנה נשמרה בהצלחה! 🎉",
        description: `מספר הזמנה: ${data.order_id?.slice(0, 8)}`,
      });

      // Navigate to success or home
      navigate("/?shops=open");
    } catch (err: any) {
      console.error("Checkout error:", err);
      toast({
        title: "שגיאה בשמירת ההזמנה",
        description: err.message || "נסו שוב",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-hero">
      {/* Header */}
      <div className="flex-shrink-0 bg-background/80 backdrop-blur-xl border-b border-border/50">
        <div className="container mx-auto px-4 py-2 flex items-center justify-between">
          <button
            onClick={() => navigate("/?shops=open")}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors font-body text-sm"
          >
            <ArrowRight className="w-4 h-4" />
            חזרה לחנויות
          </button>
          <div className="flex items-center gap-2">
            <Palette className="w-4 h-4 text-primary" />
            <Logo size="sm" />
          </div>
        </div>
      </div>

      {/* Hero */}
      <div className="bg-gradient-sage py-8 md:py-12 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="inline-flex items-center gap-2 bg-primary-foreground/20 backdrop-blur-sm rounded-full px-4 py-1.5 mb-3">
              <span>🌸</span>
              <span className="text-primary-foreground text-sm font-body">עיצוב עצמאי</span>
            </div>
            <h1 className="text-2xl md:text-4xl font-display font-bold text-primary-foreground mb-2">
              סטודיו לעיצוב זרים
            </h1>
            <p className="text-primary-foreground/80 font-body max-w-2xl mx-auto">
              בחרו מהמבחר הרחב ובנו את הזר המושלם בדיוק לפי הטעם שלכם
            </p>
          </motion.div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Filters */}
        <div className="bg-card rounded-2xl border border-border/50 shadow-soft p-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="חיפוש פרחים..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pr-10 rounded-xl font-body"
              />
            </div>
          </div>

          {/* Color filter chips */}
          {availableColors.length > 1 && (
            <div className="flex flex-wrap gap-1.5 mt-3">
              {availableColors.map((color) => (
                <button
                  key={color}
                  onClick={() => setSelectedColor(color)}
                  className={`px-3 py-1 rounded-full text-xs font-body font-medium transition-all ${
                    selectedColor === color
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                  }`}
                >
                  {color}
                </button>
              ))}
            </div>
          )}

          {/* Active filters */}
          {selectedColor !== "הכל" && (
            <div className="flex flex-wrap gap-2 mt-3">
              <Badge variant="secondary" className="bg-secondary text-secondary-foreground">
                {selectedColor}
                <button onClick={() => setSelectedColor("הכל")} className="mr-1 hover:opacity-70">
                  ×
                </button>
              </Badge>
            </div>
          )}
        </div>

        {/* Main grid */}
        <div className="grid lg:grid-cols-4 gap-6">
          {/* Flowers grid */}
          <div className="lg:col-span-3">
            {isLoading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : filteredFlowers.length === 0 ? (
              <div className="text-center py-20">
                <Palette className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
                <h3 className="text-lg font-display font-semibold text-foreground mb-1">
                  לא נמצאו פרחים
                </h3>
                <p className="text-sm text-muted-foreground font-body">נסו לשנות את הסינון</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
                {filteredFlowers.map((flower) => {
                  const hasVariants = (flowerColorVariants[flower.name]?.length || 0) > 1;
                  return (
                    <FlowerCard
                      key={flower.id}
                      flower={flower}
                      selectedQuantity={getQuantity(flower.id)}
                      onAdd={handleFlowerAdd}
                      onRemove={handleRemoveFlower}
                      hasColorVariants={hasVariants}
                      onOpenColorSelector={hasVariants ? () => setColorSelectorFlower(flower.name) : undefined}
                    />
                  );
                })}
              </div>
            )}
          </div>

          {/* Desktop summary */}
          <div className="hidden lg:block">
            <div className="sticky top-24">
              <BouquetSummary
                selectedFlowers={selectedFlowers}
                onRemove={handleRemoveFromSummary}
                onClearAll={clearAll}
                onCheckout={handleCheckout}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Mobile summary button */}
      {selectedFlowers.length > 0 && (
        <div className="fixed bottom-4 left-4 right-4 lg:hidden z-50">
          <Sheet open={isMobileSummaryOpen} onOpenChange={setIsMobileSummaryOpen}>
            <SheetTrigger asChild>
              <Button variant="hero" className="w-full rounded-full py-6 text-base shadow-elevated gap-2">
                צפה בזר ({totalItems} פרחים)
                <span className="bg-primary-foreground/20 px-3 py-1 rounded-full text-sm">
                  ₪{totalPrice}
                </span>
              </Button>
            </SheetTrigger>
            <SheetContent side="bottom" className="h-[85vh] rounded-t-3xl overflow-y-auto">
              <SheetHeader>
                <SheetTitle className="font-display">הזר שלכם</SheetTitle>
              </SheetHeader>
              <div className="mt-4">
                <BouquetSummary
                  selectedFlowers={selectedFlowers}
                  onRemove={handleRemoveFromSummary}
                  onClearAll={clearAll}
                  onCheckout={() => {
                    setIsMobileSummaryOpen(false);
                    handleCheckout();
                  }}
                />
              </div>
            </SheetContent>
          </Sheet>
        </div>
      )}

      {/* Color Selector Dialog */}
      <ColorSelector
        flowerName={colorSelectorFlower || ""}
        variants={activeColorVariants}
        isOpen={!!colorSelectorFlower}
        onClose={() => setColorSelectorFlower(null)}
        onConfirm={handleColorConfirm}
      />
    </div>
  );
};

export default DIYBuilderPage;

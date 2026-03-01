import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Trash2, ShoppingBag, X, Sparkles, Loader2, Maximize2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import type { FlowerData } from "./FlowerCard";
import FullscreenImageModal from "./FullscreenImageModal";
import BouquetTips from "./BouquetTips";

export interface SelectedFlower {
  flower: FlowerData;
  quantity: number;
}

interface BouquetSummaryProps {
  selectedFlowers: SelectedFlower[];
  onRemove: (flowerId: string) => void;
  onClearAll: () => void;
  onCheckout: (bouquetImageUrl?: string | null) => void;
  onScrollToCategory?: (category: "filler" | "greenery" | "accessories") => void;
}

const GREENERY_NAMES = new Set(["אקליפטוס", "רוסקוס", "שרך"]);
const FILLER_NAMES = new Set(["גיבסנית", "לבנדר"]);
const ACCESSORY_NAMES = new Set(["אגרטל"]);

const BouquetSummary = ({ selectedFlowers, onRemove, onClearAll, onCheckout, onScrollToCategory }: BouquetSummaryProps) => {
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const totalPrice = selectedFlowers.reduce(
    (sum, item) => sum + item.flower.price * item.quantity,
    0
  );
  const totalItems = selectedFlowers.reduce((sum, item) => sum + item.quantity, 0);
  const grandTotal = totalPrice;

  const handleGenerateImage = async () => {
    setIsGeneratingImage(true);
    try {
      const flowers = selectedFlowers
        .filter((item) => !ACCESSORY_NAMES.has(item.flower.name))
        .map((item) => ({
          name: item.flower.name,
          quantity: item.quantity,
          color: item.flower.color || "",
        }));

      const hasVase = selectedFlowers.some((item) => ACCESSORY_NAMES.has(item.flower.name));
      const vaseItem = hasVase ? selectedFlowers.find((item) => ACCESSORY_NAMES.has(item.flower.name)) : null;
      const vaseSize = vaseItem?.flower.color || "M";
      const vaseSizeLabel = vaseSize === "S" ? "small" : vaseSize === "L" ? "large" : "medium";

      const flowerList = flowers.map((f) => `${f.quantity} ${f.color} ${f.name}`.trim()).join(", ");

      const prompt = hasVase
        ? `Realistic photo of a beautiful flower bouquet in a clear glass ${vaseSizeLabel} vase on white background: ${flowerList}. Professional product photography, soft natural light.`
        : `Realistic top-down photo of a beautiful flower bouquet wrapped in kraft paper on white background: ${flowerList}. Professional flat-lay photography, camera pointing straight down, soft natural light.`;

      const imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=1024&height=1024&model=flux&nologo=true&seed=${Date.now()}`;

      // Pre-load via Image element (no CORS restrictions)
      await new Promise<void>((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve();
        img.onerror = () => reject(new Error("Image failed to load"));
        img.src = imageUrl;
      });

      setGeneratedImageUrl(imageUrl);
      toast({ title: "התמונה נוצרה בהצלחה! 🎨" });
    } catch (err: any) {
      console.error("Image generation error:", err);
      toast({
        title: "שגיאה ביצירת התמונה",
        description: "נסו שוב בעוד כמה שניות",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingImage(false);
    }
  };

  if (selectedFlowers.length === 0) {
    return (
      <div className="bg-card rounded-2xl border border-border/50 p-6 text-center shadow-soft">
        <span className="text-4xl mb-3 block">💐</span>
        <h3 className="font-display font-semibold text-foreground mb-1">הזר שלכם ריק</h3>
        <p className="text-sm text-muted-foreground font-body">
          הוסיפו פרחים מהרשימה כדי ליצור את הזר המושלם
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="bg-card rounded-2xl border border-border/50 shadow-card overflow-hidden flex flex-col max-h-[calc(100vh-2rem)]">
        {/* Header */}
        <div className="bg-gradient-sage p-4 flex items-center justify-between flex-shrink-0">
          <h3 className="font-display font-semibold text-primary-foreground text-sm">
            💐 הזר שלכם ({totalItems} פרחים)
          </h3>
          <button
            onClick={onClearAll}
            className="text-primary-foreground/70 hover:text-primary-foreground text-xs font-body flex items-center gap-1 transition-colors"
          >
            <Trash2 className="w-3 h-3" />
            נקה הכל
          </button>
        </div>

        {/* Scrollable middle section */}
        <div className="flex-1 min-h-0 overflow-y-auto">
          {/* AI Image Section */}
          <div className="p-3 border-b border-border/30">
            {generatedImageUrl ? (
              <div className="space-y-2">
                <div className="relative rounded-xl overflow-hidden">
                  <img
                    src={generatedImageUrl}
                    alt="הזר שלכם"
                    className="w-full h-56 object-contain bg-muted/10"
                  />
                  <div className="absolute bottom-2 right-2 bg-black/60 backdrop-blur-sm text-white text-[10px] px-2 py-0.5 rounded-full flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    נוצר ע״י Flori
                  </div>
                  <button
                    onClick={() => setIsFullscreen(true)}
                    className="absolute top-2 left-2 bg-white/90 backdrop-blur-sm rounded-full p-1.5 hover:bg-white transition-colors"
                    title="הגדל"
                  >
                    <Maximize2 className="w-3.5 h-3.5 text-foreground" />
                  </button>
                </div>

                <p className="text-[10px] text-muted-foreground font-body leading-relaxed">
                  * התמונה נוצרת באמצעות בינה מלאכותית והיא להמחשה בלבד.
                  הזר בפועל יכלול את הפרחים והכמויות המדויקים שמפורטים ברשימה.
                </p>

                <Button
                  variant="outline"
                  size="sm"
                  className="w-full text-xs gap-1.5 rounded-lg"
                  onClick={handleGenerateImage}
                  disabled={isGeneratingImage}
                >
                  {isGeneratingImage ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      מרענן תמונה...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-3.5 h-3.5" />
                      רענן תמונה
                    </>
                  )}
                </Button>
              </div>
            ) : (
              <Button
                variant="hero"
                size="lg"
                className="w-full gap-3 rounded-xl text-base py-6 font-bold shadow-elevated"
                onClick={handleGenerateImage}
                disabled={isGeneratingImage}
              >
                {isGeneratingImage ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    יוצר תמונה...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5" />
                    צור תמונה של הזר ✨
                  </>
                )}
              </Button>
            )}
          </div>

          {/* Smart tips */}
          <BouquetTips
            hasMainFlowers={selectedFlowers.some((f) => !GREENERY_NAMES.has(f.flower.name) && !FILLER_NAMES.has(f.flower.name))}
            hasFillers={selectedFlowers.some((f) => FILLER_NAMES.has(f.flower.name))}
            hasGreenery={selectedFlowers.some((f) => GREENERY_NAMES.has(f.flower.name))}
            onScrollToCategory={onScrollToCategory}
          />

          {/* Flowers list */}
          <div className="p-3 space-y-2">
            <AnimatePresence>
              {selectedFlowers.map((item) => (
                <motion.div
                  key={item.flower.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  className="flex items-center justify-between gap-2 py-2 border-b border-border/30 last:border-0"
                >
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-body text-foreground block truncate">
                      {item.flower.color ? `${item.flower.color} ` : ""}
                      {item.flower.name}
                    </span>
                    <span className="text-xs text-muted-foreground font-body">
                      {item.quantity} × ₪{item.flower.price}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-display font-bold text-foreground">
                      ₪{item.flower.price * item.quantity}
                    </span>
                    <button
                      onClick={() => onRemove(item.flower.id)}
                      className="text-muted-foreground hover:text-destructive transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>

        {/* Totals + Checkout - always pinned at bottom */}
        <div className="flex-shrink-0 border-t border-border/50 bg-card">
          <div className="p-3">
            <div className="flex justify-between text-sm font-display font-bold text-foreground mb-3">
              <span>סה״כ</span>
              <span className="text-primary text-base">₪{grandTotal}</span>
            </div>
            <Button
              variant="hero"
              className="w-full rounded-xl gap-2"
              onClick={() => onCheckout(generatedImageUrl)}
            >
              <ShoppingBag className="w-4 h-4" />
              המשך להזמנה
            </Button>
          </div>
        </div>
      </div>

      {/* Fullscreen modal */}
      <FullscreenImageModal
        imageUrl={generatedImageUrl}
        isOpen={isFullscreen}
        onClose={() => setIsFullscreen(false)}
      />
    </>
  );
};

export default BouquetSummary;

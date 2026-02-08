import { useState } from "react";
import { Plus, Minus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const COLOR_MAP: Record<string, string> = {
  "אדום": "#DC2626",
  "לבן": "#FFFFFF",
  "צהוב": "#FCD34D",
  "ורוד": "#F472B6",
  "אפרסק": "#FDBA74",
  "כחול": "#3B82F6",
  "כתום": "#F97316",
  "סגול": "#A855F7",
  "פוקסיה": "#EC4899",
  "ירוק": "#10B981",
};

interface ColorVariant {
  id: string;
  color: string;
  price: number;
  quantity: number;
}

interface ColorSelectorProps {
  flowerName: string;
  variants: ColorVariant[];
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (selections: { variantId: string; color: string; quantity: number }[]) => void;
}

const ColorSelector = ({ flowerName, variants, isOpen, onClose, onConfirm }: ColorSelectorProps) => {
  const [colorQuantities, setColorQuantities] = useState<Record<string, number>>({});

  const handleQuantityChange = (variantId: string, delta: number) => {
    setColorQuantities((prev) => {
      const current = prev[variantId] || 0;
      const variant = variants.find((v) => v.id === variantId);
      const maxStock = variant?.quantity || 0;
      const newValue = Math.max(0, Math.min(current + delta, maxStock));
      if (newValue === 0) {
        const { [variantId]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [variantId]: newValue };
    });
  };

  const handleConfirm = () => {
    const selections = Object.entries(colorQuantities)
      .filter(([, qty]) => qty > 0)
      .map(([variantId, quantity]) => {
        const variant = variants.find((v) => v.id === variantId);
        return {
          variantId,
          color: variant?.color || "",
          quantity,
        };
      });
    onConfirm(selections);
    setColorQuantities({});
    onClose();
  };

  const handleClose = () => {
    setColorQuantities({});
    onClose();
  };

  const totalQuantity = Object.values(colorQuantities).reduce((sum, qty) => sum + qty, 0);
  const totalCost = Object.entries(colorQuantities).reduce((sum, [variantId, qty]) => {
    const variant = variants.find((v) => v.id === variantId);
    return sum + (variant?.price || 0) * qty;
  }, 0);

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-sm rounded-2xl" dir="rtl">
        <DialogHeader>
          <DialogTitle className="font-display text-center">
            בחרו צבעים וכמויות - {flowerName}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <p className="text-sm text-muted-foreground font-body text-center">
            בחרו את הצבעים והכמות לכל צבע:
          </p>

          <div className="space-y-2">
            {variants.map((variant) => {
              const quantity = colorQuantities[variant.id] || 0;
              const dotColor = COLOR_MAP[variant.color] || "#9CA3AF";
              const isWhite = variant.color === "לבן";

              return (
                <div
                  key={variant.id}
                  className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                    quantity > 0
                      ? "border-primary bg-primary/5"
                      : "border-border/50 bg-card"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <div
                      className="w-5 h-5 rounded-full flex-shrink-0"
                      style={{
                        backgroundColor: dotColor,
                        border: isWhite ? "1.5px solid #D1D5DB" : "none",
                      }}
                    />
                    <div>
                      <span className="text-sm font-body font-medium text-foreground">
                        {variant.color}
                      </span>
                      <span className="text-xs text-muted-foreground font-body block">
                        ₪{variant.price}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-7 w-7 rounded-full"
                      onClick={() => handleQuantityChange(variant.id, -1)}
                      disabled={quantity === 0}
                    >
                      <Minus className="w-3 h-3" />
                    </Button>
                    <span className="w-6 text-center font-display font-bold text-sm text-foreground">
                      {quantity}
                    </span>
                    <Button
                      variant="hero"
                      size="icon"
                      className="h-7 w-7 rounded-full"
                      onClick={() => handleQuantityChange(variant.id, 1)}
                      disabled={quantity >= variant.quantity}
                    >
                      <Plus className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>

          {totalQuantity > 0 && (
            <div className="text-center text-sm font-body text-primary font-medium">
              סה״כ: {totalQuantity} פרחים · ₪{totalCost}
            </div>
          )}

          <div className="flex gap-2">
            <Button variant="outline" className="flex-1 rounded-xl" onClick={handleClose}>
              ביטול
            </Button>
            <Button
              variant="hero"
              className="flex-1 rounded-xl"
              onClick={handleConfirm}
              disabled={totalQuantity === 0}
            >
              הוסף לזר ({totalQuantity})
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ColorSelector;

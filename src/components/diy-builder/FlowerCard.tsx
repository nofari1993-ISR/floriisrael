import { useState } from "react";
import { motion } from "framer-motion";
import { Plus, Minus, Palette } from "lucide-react";
import { Button } from "@/components/ui/button";

import ColorSelector from "./ColorSelector";

interface FlowerData {
  id: string;
  name: string;
  color: string | null;
  price: number;
  quantity: number;
  image: string | null;
  in_stock: boolean;
}

interface ColorVariant {
  id: string;
  color: string;
  price: number;
  quantity: number;
}

interface FlowerCardProps {
  flower: FlowerData;
  selectedQuantity: number;
  onAdd: (flower: FlowerData) => void;
  onRemove: (flower: FlowerData) => void;
  colorVariants?: ColorVariant[];
}

const FlowerCard = ({
  flower,
  selectedQuantity,
  onAdd,
  onRemove,
  colorVariants,
}: FlowerCardProps) => {
  const [isColorSelectorOpen, setIsColorSelectorOpen] = useState(false);

  const isOutOfStock = !flower.in_stock || flower.quantity <= 0;
  const reachedMax = selectedQuantity >= flower.quantity;
  const hasColors = colorVariants && colorVariants.length > 1;

  const handleAdd = () => {
    if (hasColors) {
      setIsColorSelectorOpen(true);
    } else {
      onAdd(flower);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-card rounded-2xl overflow-hidden shadow-soft hover:shadow-card transition-all duration-300 group ${
        isOutOfStock ? "opacity-50" : ""
      }`}
    >
      {/* Image */}
      <div className="relative aspect-square overflow-hidden">
        {flower.image ? (
          <img
            src={flower.image}
            alt={flower.name}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full bg-muted/30 flex items-center justify-center">
            <span className="text-5xl">🌸</span>
          </div>
        )}

        {isOutOfStock && (
          <div className="absolute inset-0 bg-background/60 flex items-center justify-center">
            <span className="text-sm font-body font-medium text-muted-foreground bg-background/80 px-3 py-1 rounded-full">
              אזל מהמלאי
            </span>
          </div>
        )}

        {/* Quantity Badge */}
        {selectedQuantity > 0 && (
          <div className="absolute top-3 left-3 bg-primary text-primary-foreground w-8 h-8 rounded-full flex items-center justify-center font-bold shadow-lg text-sm">
            {selectedQuantity}
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-3 md:p-4">
        <h3 className="text-sm md:text-lg font-display font-semibold text-foreground mb-1">
          {flower.name}
        </h3>

        {/* Color badge */}
        {flower.color && (
          <div className="flex flex-wrap gap-1 mb-2">
            <span className="text-xs text-muted-foreground font-body">{flower.color}</span>
          </div>
        )}

        {/* Stock info */}
        <div className="text-[10px] text-muted-foreground font-body mb-2">
          {flower.quantity} יח׳ במלאי
        </div>

        {/* Price & Actions */}
        <div className="flex items-center justify-between gap-1 min-w-0">
          <span className="text-base md:text-xl font-display font-bold text-primary shrink-0">
            ₪{flower.price}
          </span>

          {!isOutOfStock && (
            <div className="flex items-center gap-0.5 md:gap-1 shrink-0">
              {hasColors && (
                <Button
                  size="icon"
                  variant="outline"
                  className="h-6 w-6 md:h-8 md:w-8 rounded-full shrink-0 border-primary/30 text-primary"
                  onClick={() => setIsColorSelectorOpen(true)}
                  title="בחר צבעים"
                >
                  <Palette className="w-3 h-3 md:w-4 md:h-4" />
                </Button>
              )}

              {selectedQuantity > 0 ? (
                <div className="flex items-center gap-0.5 shrink-0">
                  <Button
                    size="icon"
                    variant="outline"
                    className="h-6 w-6 md:h-8 md:w-8 rounded-full shrink-0"
                    onClick={() => onRemove(flower)}
                  >
                    <Minus className="w-3 h-3 md:w-4 md:h-4" />
                  </Button>
                  <span className="w-4 md:w-6 text-center font-display font-bold text-xs md:text-base text-foreground">
                    {selectedQuantity}
                  </span>
                  <Button
                    size="icon"
                    variant="hero"
                    className="h-6 w-6 md:h-8 md:w-8 rounded-full shrink-0"
                    onClick={() => onAdd(flower)}
                    disabled={reachedMax}
                  >
                    <Plus className="w-3 h-3 md:w-4 md:h-4" />
                  </Button>
                </div>
              ) : (
                <Button
                  size="sm"
                  variant="hero"
                  className="rounded-full shrink-0 text-[10px] md:text-sm h-6 md:h-8 px-2 md:px-3"
                  onClick={handleAdd}
                >
                  <Plus className="w-3 h-3 md:w-4 md:h-4 ml-0.5 md:ml-1" />
                  הוסף
                </Button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Embedded Color Selector */}
      {hasColors && (
        <ColorSelector
          flowerName={flower.name}
          variants={colorVariants}
          isOpen={isColorSelectorOpen}
          onClose={() => setIsColorSelectorOpen(false)}
          onConfirm={(selections) => {
            for (const sel of selections) {
              // This will be handled by the parent
              onAdd({ ...flower, id: sel.variantId } as FlowerData);
            }
            setIsColorSelectorOpen(false);
          }}
        />
      )}
    </motion.div>
  );
};

export default FlowerCard;
export type { FlowerData };

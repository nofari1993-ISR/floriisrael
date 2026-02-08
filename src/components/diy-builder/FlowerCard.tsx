import { useState } from "react";
import { motion } from "framer-motion";
import { Plus, Minus, Palette } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface FlowerData {
  id: string;
  name: string;
  color: string | null;
  price: number;
  quantity: number;
  image: string | null;
  in_stock: boolean;
}

interface FlowerCardProps {
  flower: FlowerData;
  selectedQuantity: number;
  onAdd: (flower: FlowerData) => void;
  onRemove: (flower: FlowerData) => void;
  hasColorVariants?: boolean;
  onOpenColorSelector?: () => void;
}

const FlowerCard = ({
  flower,
  selectedQuantity,
  onAdd,
  onRemove,
  hasColorVariants,
  onOpenColorSelector,
}: FlowerCardProps) => {
  const isOutOfStock = !flower.in_stock || flower.quantity <= 0;
  const reachedMax = selectedQuantity >= flower.quantity;

  const handleAdd = () => {
    if (hasColorVariants && onOpenColorSelector) {
      onOpenColorSelector();
    } else {
      onAdd(flower);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`bg-card rounded-2xl border border-border/50 overflow-hidden shadow-soft hover:shadow-card transition-all ${
        isOutOfStock ? "opacity-50" : ""
      }`}
    >
      {/* Image */}
      <div className="aspect-square bg-muted/30 flex items-center justify-center relative">
        {flower.image ? (
          <img
            src={flower.image}
            alt={flower.name}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <span className="text-5xl">🌸</span>
        )}

        {isOutOfStock && (
          <div className="absolute inset-0 bg-background/60 flex items-center justify-center">
            <span className="text-sm font-body font-medium text-muted-foreground bg-background/80 px-3 py-1 rounded-full">
              אזל מהמלאי
            </span>
          </div>
        )}

        {/* Quantity badge */}
        {selectedQuantity > 0 && (
          <div className="absolute top-2 left-2 w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold shadow-md">
            {selectedQuantity}
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-3 space-y-2">
        <h3 className="font-display font-semibold text-foreground text-sm leading-tight">
          {flower.name}
        </h3>

        {/* Color badge */}
        {flower.color && (
          <div className="flex flex-wrap gap-1">
            <Badge variant="outline" className="text-[10px] px-1.5 py-0 rounded-full border-border/50 text-muted-foreground">
              {flower.color}
            </Badge>
          </div>
        )}

        {/* Stock info */}
        <div className="text-[10px] text-muted-foreground font-body">
          {flower.quantity} יח׳ במלאי
        </div>

        {/* Price & actions */}
        <div className="flex items-center justify-between gap-1">
          <span className="text-sm font-display font-bold text-primary whitespace-nowrap">
            ₪{flower.price}
          </span>

          {!isOutOfStock && (
            <div className="flex items-center gap-1.5">
              {/* Color palette button for multi-color flowers */}
              {hasColorVariants && (
                <Button
                  variant="outline"
                  size="icon"
                  className="h-7 w-7 rounded-full border-primary/30 text-primary"
                  onClick={onOpenColorSelector}
                  title="בחר צבעים"
                >
                  <Palette className="w-3.5 h-3.5" />
                </Button>
              )}

              {selectedQuantity > 0 ? (
                <div className="flex items-center gap-1.5">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-7 w-7 rounded-full border-border"
                    onClick={() => onRemove(flower)}
                  >
                    <Minus className="w-3 h-3" />
                  </Button>
                  <span className="w-5 text-center font-display font-bold text-foreground text-xs">
                    {selectedQuantity}
                  </span>
                  <Button
                    variant="hero"
                    size="icon"
                    className="h-7 w-7 rounded-full"
                    onClick={() => onAdd(flower)}
                    disabled={reachedMax}
                  >
                    <Plus className="w-3 h-3" />
                  </Button>
                </div>
              ) : (
                <Button
                  variant="hero-outline"
                  size="sm"
                  className="rounded-full text-xs gap-1 h-7 px-3"
                  onClick={handleAdd}
                >
                  <Plus className="w-3 h-3" />
                  הוסף
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default FlowerCard;
export type { FlowerData };

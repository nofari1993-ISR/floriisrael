import { motion } from "framer-motion";
import { Plus, Minus } from "lucide-react";
import { Button } from "@/components/ui/button";

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
}

const FlowerCard = ({ flower, selectedQuantity, onAdd, onRemove, hasColorVariants }: FlowerCardProps) => {
  const isOutOfStock = !flower.in_stock || flower.quantity <= 0;
  const reachedMax = selectedQuantity >= flower.quantity;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`bg-card rounded-2xl border border-border/50 overflow-hidden shadow-soft hover:shadow-card transition-all ${
        isOutOfStock ? "opacity-50" : ""
      }`}
    >
      {/* Image / Emoji */}
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
        <div className="flex items-start justify-between gap-1">
          <div>
            <h3 className="font-display font-semibold text-foreground text-sm leading-tight">
              {flower.name}
            </h3>
            {flower.color && (
              <span className="text-xs text-muted-foreground font-body">{flower.color}</span>
            )}
          </div>
          <span className="text-sm font-display font-bold text-primary whitespace-nowrap">
            ₪{flower.price}
          </span>
        </div>

        <div className="text-[10px] text-muted-foreground font-body">
          {flower.quantity} יח׳ במלאי
        </div>

        {/* Add/Remove buttons */}
        {!isOutOfStock && (
          <div className="flex items-center gap-2">
            {selectedQuantity > 0 ? (
              <div className="flex items-center gap-2 w-full">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8 rounded-full border-border"
                  onClick={() => onRemove(flower)}
                >
                  <Minus className="w-3.5 h-3.5" />
                </Button>
                <span className="flex-1 text-center font-display font-bold text-foreground text-sm">
                  {selectedQuantity}
                </span>
                <Button
                  variant="hero"
                  size="icon"
                  className="h-8 w-8 rounded-full"
                  onClick={() => onAdd(flower)}
                  disabled={reachedMax}
                >
                  <Plus className="w-3.5 h-3.5" />
                </Button>
              </div>
            ) : (
              <Button
                variant="hero-outline"
                size="sm"
                className="w-full rounded-full text-xs gap-1"
                onClick={() => onAdd(flower)}
              >
                <Plus className="w-3.5 h-3.5" />
                {hasColorVariants ? "בחר צבעים" : "הוסף לזר"}
              </Button>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default FlowerCard;
export type { FlowerData };

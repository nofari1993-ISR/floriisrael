import { motion, AnimatePresence } from "framer-motion";
import { Trash2, ShoppingBag, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { FlowerData } from "./FlowerCard";

export interface SelectedFlower {
  flower: FlowerData;
  quantity: number;
}

interface BouquetSummaryProps {
  selectedFlowers: SelectedFlower[];
  onRemove: (flowerId: string) => void;
  onClearAll: () => void;
  onCheckout: () => void;
}

const BouquetSummary = ({ selectedFlowers, onRemove, onClearAll, onCheckout }: BouquetSummaryProps) => {
  const totalPrice = selectedFlowers.reduce(
    (sum, item) => sum + item.flower.price * item.quantity,
    0
  );
  const totalItems = selectedFlowers.reduce((sum, item) => sum + item.quantity, 0);
  const designFee = Math.round(totalPrice * 0.05);
  const grandTotal = totalPrice + designFee;

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
    <div className="bg-card rounded-2xl border border-border/50 shadow-card overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-sage p-4 flex items-center justify-between">
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

      {/* Flowers list */}
      <div className="p-3 space-y-2 max-h-[40vh] overflow-y-auto">
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

      {/* Totals */}
      <div className="p-3 border-t border-border/50 space-y-1.5">
        <div className="flex justify-between text-xs font-body text-muted-foreground">
          <span>עלות פרחים</span>
          <span>₪{totalPrice}</span>
        </div>
        <div className="flex justify-between text-xs font-body text-muted-foreground">
          <span>דמי עיצוב (5%)</span>
          <span>₪{designFee}</span>
        </div>
        <div className="flex justify-between text-sm font-display font-bold text-foreground pt-1.5 border-t border-border/30">
          <span>סה״כ</span>
          <span>₪{grandTotal}</span>
        </div>
      </div>

      {/* Checkout */}
      <div className="p-3 pt-0">
        <Button
          variant="hero"
          className="w-full rounded-xl gap-2"
          onClick={onCheckout}
        >
          <ShoppingBag className="w-4 h-4" />
          המשך להזמנה
        </Button>
      </div>
    </div>
  );
};

export default BouquetSummary;

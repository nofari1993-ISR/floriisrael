import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ShoppingBag, Pencil, RotateCcw, Loader2 } from "lucide-react";

export interface BouquetFlower {
  name: string;
  quantity: number;
  unit_price: number;
  color: string;
  line_total: number;
}

export interface BouquetRecommendation {
  flowers: BouquetFlower[];
  total_price: number;
  flowers_cost: number;
  digital_design_fee: number;
  message: string;
  image_url?: string | null;
}

interface BouquetCardProps {
  recommendation: BouquetRecommendation;
  onAccept: () => void;
  onModify: () => void;
  onReset: () => void;
}

const BouquetCard = ({ recommendation, onAccept, onModify, onReset }: BouquetCardProps) => {
  const [imageLoaded, setImageLoaded] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="border border-border rounded-2xl overflow-hidden bg-card shadow-card"
    >
      {/* Bouquet Image */}
      {recommendation.image_url && (
        <div className="relative w-full max-h-48 overflow-hidden bg-muted/30">
          {!imageLoaded && (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="w-5 h-5 text-primary animate-spin" />
            </div>
          )}
          <img
            src={recommendation.image_url}
            alt="הזר שלך"
            className={`w-full object-cover transition-opacity ${imageLoaded ? "opacity-100" : "opacity-0 h-0"}`}
            onLoad={() => setImageLoaded(true)}
          />
        </div>
      )}

      {/* Flowers list */}
      <div className="p-4 space-y-2">
        <h3 className="text-sm font-display font-bold text-foreground mb-3 flex items-center gap-2">
          💐 הזר שלך
        </h3>
        <div className="space-y-1.5">
          {recommendation.flowers.map((flower, i) => (
            <div key={i} className="flex items-center justify-between text-sm font-body">
              <span className="text-foreground">
                {flower.color ? `${flower.color} ` : ""}{flower.name} × {flower.quantity}
              </span>
              <span className="text-muted-foreground">₪{flower.line_total}</span>
            </div>
          ))}
        </div>

        <div className="border-t border-border/50 pt-2 mt-3 space-y-1">
          <div className="flex justify-between text-xs font-body text-muted-foreground">
            <span>עלות פרחים</span>
            <span>₪{recommendation.flowers_cost}</span>
          </div>
          <div className="flex justify-between text-xs font-body text-muted-foreground">
            <span>דמי עיצוב דיגיטלי (5%)</span>
            <span>₪{recommendation.digital_design_fee}</span>
          </div>
          <div className="flex justify-between text-sm font-display font-bold text-foreground pt-1 border-t border-border/30">
            <span>סה״כ</span>
            <span>₪{recommendation.total_price}</span>
          </div>
        </div>
      </div>

      {/* Action buttons */}
      <div className="p-3 bg-muted/30 border-t border-border/50 space-y-2">
        <div className="grid grid-cols-2 gap-2">
          <Button
            variant="hero"
            className="rounded-xl gap-2 text-sm"
            onClick={onAccept}
          >
            <ShoppingBag className="w-4 h-4" />
            שמור וסיים
          </Button>
          <Button
            variant="hero-outline"
            className="rounded-xl gap-2 text-sm"
            onClick={onModify}
          >
            <Pencil className="w-4 h-4" />
            שנה את הזר
          </Button>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="w-full text-xs text-muted-foreground gap-1"
          onClick={onReset}
        >
          <RotateCcw className="w-3 h-3" />
          התחל מחדש
        </Button>
      </div>
    </motion.div>
  );
};

export default BouquetCard;

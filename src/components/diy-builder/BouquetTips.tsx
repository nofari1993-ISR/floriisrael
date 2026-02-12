import { motion, AnimatePresence } from "framer-motion";
import { Lightbulb, Leaf, Flower2 } from "lucide-react";

interface BouquetTipsProps {
  hasMainFlowers: boolean;
  hasFillers: boolean;
  hasGreenery: boolean;
  onScrollToCategory?: (category: "filler" | "greenery" | "accessories") => void;
}

const BouquetTips = ({ hasMainFlowers, hasFillers, hasGreenery, onScrollToCategory }: BouquetTipsProps) => {
  if (!hasMainFlowers || (hasFillers && hasGreenery)) return null;

  const tips: { key: string; icon: React.ReactNode; text: string; action: "filler" | "greenery" }[] = [];

  if (!hasGreenery) {
    tips.push({
      key: "greenery",
      icon: <Leaf className="w-3.5 h-3.5 text-emerald-600 shrink-0" />,
      text: "הוסיפו ירק ועלווה לזר – כמו אקליפטוס או רוסקוס – לנפח ומראה טבעי 🍃",
      action: "greenery",
    });
  }

  if (!hasFillers) {
    tips.push({
      key: "filler",
      icon: <Flower2 className="w-3.5 h-3.5 text-primary shrink-0" />,
      text: "פרחי מילוי כמו גיבסנית או לבנדר ישלימו את הזר בטקסטורה עדינה ✨",
      action: "filler",
    });
  }

  if (tips.length === 0) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        className="p-3 border-b border-border/30"
      >
        <div className="flex items-center gap-1.5 mb-2">
          <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
          <span className="text-xs font-display font-semibold text-foreground">טיפ לזר מושלם</span>
        </div>
        <div className="space-y-2">
          {tips.map((tip) => (
            <button
              key={tip.key}
              onClick={() => onScrollToCategory?.(tip.action)}
              className="w-full flex items-start gap-2 bg-muted/40 hover:bg-muted/70 rounded-xl px-3 py-2.5 text-right transition-colors group"
            >
              {tip.icon}
              <span className="text-xs font-body text-muted-foreground group-hover:text-foreground leading-relaxed transition-colors">
                {tip.text}
              </span>
            </button>
          ))}
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default BouquetTips;

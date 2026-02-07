import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Plus, Minus, ShoppingBag, ArrowRight, Sparkles } from "lucide-react";

const flowers = [
  { id: 1, name: "ורדים", emoji: "🌹", price: 15, color: "bg-secondary" },
  { id: 2, name: "שושנים", emoji: "🌷", price: 12, color: "bg-blush/40" },
  { id: 3, name: "אקליפטוס", emoji: "🌿", price: 8, color: "bg-sage-light" },
  { id: 4, name: "חמניות", emoji: "🌻", price: 10, color: "bg-accent/30" },
  { id: 5, name: "לבנדר", emoji: "💜", price: 9, color: "bg-secondary/60" },
  { id: 6, name: "פאוניה", emoji: "🌸", price: 20, color: "bg-blush/60" },
  { id: 7, name: "דליה", emoji: "🌺", price: 14, color: "bg-accent/40" },
  { id: 8, name: "גיבסנית", emoji: "🤍", price: 6, color: "bg-muted" },
];

interface ShopDIYBuilderProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  shopName: string;
  shopImage: string;
  onBack: () => void;
}

const ShopDIYBuilder = ({ open, onOpenChange, shopName, shopImage, onBack }: ShopDIYBuilderProps) => {
  const [selected, setSelected] = useState<Record<number, number>>({});

  const addFlower = (id: number) => {
    setSelected((prev) => ({ ...prev, [id]: (prev[id] || 0) + 1 }));
  };

  const removeFlower = (id: number) => {
    setSelected((prev) => {
      const next = { ...prev };
      if (next[id] > 1) next[id]--;
      else delete next[id];
      return next;
    });
  };

  const totalItems = Object.values(selected).reduce((a, b) => a + b, 0);
  const totalPrice = Object.entries(selected).reduce((sum, [id, count]) => {
    const flower = flowers.find((f) => f.id === Number(id));
    return sum + (flower?.price || 0) * count;
  }, 0);

  const handleClose = (value: boolean) => {
    if (!value) {
      setSelected({});
    }
    onOpenChange(value);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-0 rounded-2xl border-border/50">
        {/* Header */}
        <DialogHeader className="p-6 pb-3 border-b border-border/30">
          <div className="flex items-center justify-between">
            <button
              onClick={() => {
                setSelected({});
                onBack();
              }}
              className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowRight className="w-4 h-4" />
              חזרה לחנויות
            </button>
            <div className="flex items-center gap-3">
              <DialogTitle className="font-display text-xl text-foreground">
                בנו זר ב{shopName}
              </DialogTitle>
              <span className="text-2xl">{shopImage}</span>
            </div>
          </div>
          <DialogDescription className="text-right text-muted-foreground mt-1">
            בחרו פרחים ובנו את הזר המושלם שלכם
          </DialogDescription>
        </DialogHeader>

        <div className="p-6">
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Flower Grid */}
            <div className="lg:col-span-2">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {flowers.map((flower, index) => (
                  <motion.div
                    key={flower.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.03 }}
                    className={`relative rounded-2xl p-4 ${flower.color} border border-border/30 transition-all duration-300 hover:shadow-card cursor-pointer ${
                      selected[flower.id] ? "ring-2 ring-primary shadow-card" : ""
                    }`}
                    onClick={() => addFlower(flower.id)}
                  >
                    <div className="text-center space-y-1.5">
                      <span className="text-3xl block">{flower.emoji}</span>
                      <h4 className="font-display font-semibold text-foreground text-sm">{flower.name}</h4>
                      <p className="text-xs text-muted-foreground">₪{flower.price}</p>
                    </div>

                    <AnimatePresence>
                      {selected[flower.id] && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          exit={{ scale: 0 }}
                          className="absolute -top-2 -left-2 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold"
                        >
                          {selected[flower.id]}
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {selected[flower.id] && (
                      <div className="absolute bottom-1.5 left-1.5 flex gap-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            removeFlower(flower.id);
                          }}
                          className="w-5 h-5 rounded-full bg-background/80 flex items-center justify-center hover:bg-background transition-colors"
                        >
                          <Minus className="w-3 h-3 text-foreground" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            addFlower(flower.id);
                          }}
                          className="w-5 h-5 rounded-full bg-background/80 flex items-center justify-center hover:bg-background transition-colors"
                        >
                          <Plus className="w-3 h-3 text-foreground" />
                        </button>
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Cart Summary */}
            <div className="bg-card rounded-2xl p-5 shadow-soft border border-border/50 h-fit">
              <h3 className="font-display text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                <ShoppingBag className="w-5 h-5" />
                הזר שלי
              </h3>

              {totalItems === 0 ? (
                <div className="text-center py-8">
                  <Sparkles className="w-8 h-8 mx-auto mb-2 text-muted-foreground/40" />
                  <p className="text-muted-foreground text-sm font-body">
                    לחצו על פרחים כדי להוסיף לזר
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {Object.entries(selected).map(([id, count]) => {
                    const flower = flowers.find((f) => f.id === Number(id));
                    if (!flower) return null;
                    return (
                      <div key={id} className="flex items-center justify-between py-1.5 border-b border-border/30">
                        <div className="flex items-center gap-2">
                          <span className="text-sm">{flower.emoji}</span>
                          <span className="font-body text-sm text-foreground">{flower.name}</span>
                          <span className="text-muted-foreground text-xs">x{count}</span>
                        </div>
                        <span className="font-semibold text-sm text-foreground">₪{flower.price * count}</span>
                      </div>
                    );
                  })}
                  <div className="pt-3 border-t border-border">
                    <div className="flex justify-between items-center mb-3">
                      <span className="font-display font-bold text-foreground">סה״כ</span>
                      <span className="font-display font-bold text-xl text-primary">₪{totalPrice}</span>
                    </div>
                    <Button variant="hero" className="w-full rounded-xl" size="lg">
                      הזמינו עכשיו
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ShopDIYBuilder;

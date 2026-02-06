import { motion } from "framer-motion";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus, Minus, ShoppingBag } from "lucide-react";

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

const BouquetBuilder = () => {
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

  return (
    <section id="bouquet-builder" className="py-24 bg-muted/30">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <span className="inline-block px-4 py-1.5 rounded-full bg-secondary/60 text-secondary-foreground text-sm font-medium mb-4">
            🎨 DIY
          </span>
          <h2 className="text-4xl md:text-5xl font-display font-bold text-foreground mb-4">
            בנו את הזר שלכם
          </h2>
          <p className="text-lg text-muted-foreground font-body max-w-2xl mx-auto">
            בחרו את הפרחים האהובים עליכם, התאימו כמויות ותצרו את הזר המושלם עבורכם
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Flower Selection */}
          <div className="lg:col-span-2">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {flowers.map((flower, index) => (
                <motion.div
                  key={flower.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.05 }}
                  className={`relative rounded-2xl p-5 ${flower.color} border border-border/30 transition-all duration-300 hover:shadow-card cursor-pointer ${
                    selected[flower.id] ? "ring-2 ring-primary shadow-card" : ""
                  }`}
                  onClick={() => addFlower(flower.id)}
                >
                  <div className="text-center space-y-2">
                    <span className="text-4xl block">{flower.emoji}</span>
                    <h4 className="font-display font-semibold text-foreground">{flower.name}</h4>
                    <p className="text-sm text-muted-foreground">₪{flower.price}</p>
                  </div>
                  {selected[flower.id] && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute -top-2 -left-2 w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold"
                    >
                      {selected[flower.id]}
                    </motion.div>
                  )}
                  {selected[flower.id] && (
                    <div className="absolute bottom-2 left-2 flex gap-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          removeFlower(flower.id);
                        }}
                        className="w-6 h-6 rounded-full bg-background/80 flex items-center justify-center hover:bg-background transition-colors"
                      >
                        <Minus className="w-3 h-3 text-foreground" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          addFlower(flower.id);
                        }}
                        className="w-6 h-6 rounded-full bg-background/80 flex items-center justify-center hover:bg-background transition-colors"
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
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="bg-card rounded-2xl p-6 shadow-card border border-border/50 h-fit sticky top-8"
          >
            <h3 className="font-display text-xl font-bold text-foreground mb-6 flex items-center gap-2">
              <ShoppingBag className="w-5 h-5" />
              הזר שלי
            </h3>

            {totalItems === 0 ? (
              <p className="text-muted-foreground text-center py-8 font-body">
                לחצו על פרחים כדי להוסיף לזר 🌿
              </p>
            ) : (
              <div className="space-y-3">
                {Object.entries(selected).map(([id, count]) => {
                  const flower = flowers.find((f) => f.id === Number(id));
                  if (!flower) return null;
                  return (
                    <div key={id} className="flex items-center justify-between py-2 border-b border-border/30">
                      <div className="flex items-center gap-2">
                        <span>{flower.emoji}</span>
                        <span className="font-body text-foreground">{flower.name}</span>
                        <span className="text-muted-foreground text-sm">x{count}</span>
                      </div>
                      <span className="font-semibold text-foreground">₪{flower.price * count}</span>
                    </div>
                  );
                })}
                <div className="pt-4 border-t border-border">
                  <div className="flex justify-between items-center mb-4">
                    <span className="font-display font-bold text-lg text-foreground">סה״כ</span>
                    <span className="font-display font-bold text-2xl text-primary">₪{totalPrice}</span>
                  </div>
                  <Button variant="hero" className="w-full rounded-xl" size="lg">
                    הזמינו עכשיו
                  </Button>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default BouquetBuilder;

import { motion } from "framer-motion";
import { Sparkles, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

import galleryRomantic from "@/assets/gallery-romantic.jpg";
import gallerySunny from "@/assets/gallery-sunny.jpg";
import galleryPastel from "@/assets/gallery-pastel.jpg";
import galleryTropical from "@/assets/gallery-tropical.jpg";

const bouquets = [
  {
    image: galleryRomantic,
    title: "זר רומנטי",
    description: "ורדים אדומים ופיוניות ורודות",
    tag: "הכי פופולרי 🔥",
  },
  {
    image: gallerySunny,
    title: "זר שמש",
    description: "חמניות וגרברות בגווני זהב",
    tag: "שמחה טהורה ☀️",
  },
  {
    image: galleryPastel,
    title: "זר פסטל",
    description: "טוליפים, לבנדר ולילי",
    tag: "עדין ואלגנטי 🌿",
  },
  {
    image: galleryTropical,
    title: "זר טרופי",
    description: "שושנים וציפורנים בצבעים חיים",
    tag: "אנרגיה צבעונית 🌺",
  },
];

const AIBouquetGallery = () => {
  const navigate = useNavigate();

  return (
    <section className="py-16 md:py-24 relative overflow-hidden">
      {/* Vivid background */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-secondary/20 to-background pointer-events-none" />
      <div className="absolute top-10 left-10 w-48 md:w-72 h-48 md:h-72 rounded-full bg-accent/20 blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-56 md:w-80 h-56 md:h-80 rounded-full bg-secondary/30 blur-3xl pointer-events-none" />

      <div className="container mx-auto px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-10 md:mb-16"
        >
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-sage text-primary-foreground text-sm font-medium mb-3 md:mb-4">
            <Sparkles className="w-4 h-4" />
            נוצר על ידי AI
          </span>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-display font-bold text-foreground mb-3 md:mb-4">
            הזרים שה-AI שלנו יצר 💐
          </h2>
          <p className="text-base md:text-lg text-muted-foreground font-body max-w-2xl mx-auto">
            כל זר מעוצב בהתאמה אישית על ידי הבינה המלאכותית שלנו — בחרו סגנון, תקציב ואירוע, וקבלו זר חלומי
          </p>
        </motion.div>

        {/* Gallery Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mb-12">
          {bouquets.map((bouquet, index) => (
            <motion.div
              key={bouquet.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="group cursor-pointer"
              onClick={() => navigate("/ai-chat")}
            >
              <div className="relative rounded-2xl overflow-hidden shadow-card hover:shadow-elevated transition-all duration-500 bg-card border border-border/50 hover:border-primary/30">
                <div className="aspect-square overflow-hidden">
                  <img
                    src={bouquet.image}
                    alt={bouquet.title}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-foreground/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </div>

                {/* Tag */}
                <div className="absolute top-3 right-3">
                  <span className="px-2.5 py-1 rounded-full bg-card/80 backdrop-blur-sm text-xs font-medium text-foreground border border-border/30">
                    {bouquet.tag}
                  </span>
                </div>

                {/* Info overlay */}
                <div className="absolute bottom-0 left-0 right-0 p-4 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                  <h3 className="font-display font-bold text-primary-foreground text-lg">{bouquet.title}</h3>
                  <p className="text-primary-foreground/80 text-sm font-body">{bouquet.description}</p>
                </div>

                {/* Static info for mobile */}
                <div className="p-3 md:hidden">
                  <h3 className="font-display font-bold text-foreground text-sm">{bouquet.title}</h3>
                  <p className="text-muted-foreground text-xs font-body">{bouquet.description}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center"
        >
          <Button
            variant="hero"
            size="lg"
            className="rounded-2xl gap-2 text-base md:text-lg px-8 md:px-10 py-5 md:py-6"
            onClick={() => navigate("/ai-chat")}
          >
            <Sparkles className="w-4 h-4 md:w-5 md:h-5" />
            בנו את הזר שלכם עם AI
            <ArrowLeft className="w-4 h-4 md:w-5 md:h-5" />
          </Button>
        </motion.div>
      </div>
    </section>
  );
};

export default AIBouquetGallery;

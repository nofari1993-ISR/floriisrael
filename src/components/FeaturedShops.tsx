import { motion } from "framer-motion";
import { Star, MapPin, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";

const shops = [
  {
    id: 1,
    name: "פרחי הגן",
    location: "תל אביב, רוטשילד 42",
    rating: 4.9,
    reviews: 234,
    speciality: "זרים רומנטיים",
    image: "🌹",
    hours: "08:00 - 20:00",
    tags: ["משלוח מהיר", "DIY"],
  },
  {
    id: 2,
    name: "בלום בוטיק",
    location: "ירושלים, אמילי זולא 15",
    rating: 4.8,
    reviews: 189,
    speciality: "עיצוב מודרני",
    image: "🌸",
    hours: "09:00 - 21:00",
    tags: ["פרימיום", "אירועים"],
  },
  {
    id: 3,
    name: "הפרח הירוק",
    location: "חיפה, הנביאים 8",
    rating: 4.7,
    reviews: 156,
    speciality: "פרחי שדה",
    image: "🌿",
    hours: "07:30 - 19:00",
    tags: ["אורגני", "מקומי"],
  },
  {
    id: 4,
    name: "סחלב פרחים",
    location: "הרצליה, סוקולוב 22",
    rating: 4.9,
    reviews: 312,
    speciality: "סידורי יוקרה",
    image: "🌺",
    hours: "08:00 - 22:00",
    tags: ["יוקרה", "24/7 משלוח"],
  },
];

const FeaturedShops = () => {
  return (
    <section id="shops" className="py-24 bg-background">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <span className="inline-block px-4 py-1.5 rounded-full bg-accent/30 text-accent-foreground text-sm font-medium mb-4">
            🏪 חנויות מובילות
          </span>
          <h2 className="text-4xl md:text-5xl font-display font-bold text-foreground mb-4">
            חנויות פרחים מומלצות
          </h2>
          <p className="text-lg text-muted-foreground font-body max-w-2xl mx-auto">
            חנויות הפרחים הטובות ביותר, נבחרו בקפידה לפי דירוג לקוחות ואיכות השירות
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {shops.map((shop, index) => (
            <motion.div
              key={shop.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="group bg-card rounded-2xl overflow-hidden border border-border/50 hover:border-primary/20 shadow-soft hover:shadow-card transition-all duration-300"
            >
              {/* Shop Header */}
              <div className="bg-gradient-card p-6 text-center">
                <span className="text-5xl block mb-3">{shop.image}</span>
                <h3 className="font-display text-xl font-bold text-foreground">{shop.name}</h3>
                <p className="text-sm text-muted-foreground mt-1">{shop.speciality}</p>
              </div>

              {/* Shop Details */}
              <div className="p-5 space-y-3">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="w-4 h-4 shrink-0" />
                  <span>{shop.location}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="w-4 h-4 shrink-0" />
                  <span>{shop.hours}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4 fill-gold text-gold" />
                  <span className="font-semibold text-foreground">{shop.rating}</span>
                  <span className="text-muted-foreground text-sm">({shop.reviews})</span>
                </div>

                {/* Tags */}
                <div className="flex flex-wrap gap-2 pt-2">
                  {shop.tags.map((tag) => (
                    <span
                      key={tag}
                      className="text-xs px-2.5 py-1 rounded-full bg-muted text-muted-foreground font-medium"
                    >
                      {tag}
                    </span>
                  ))}
                </div>

                <Button variant="hero-outline" size="sm" className="w-full mt-4 rounded-xl">
                  צפו בחנות
                </Button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturedShops;

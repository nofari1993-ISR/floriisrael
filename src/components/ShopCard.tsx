import { motion } from "framer-motion";
import { Star, MapPin, Clock, Palette, Navigation, Trash2, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Shop } from "@/hooks/useShops";

interface ShopCardProps {
  shop: Shop;
  index: number;
  isAdmin: boolean;
  onRemove: (id: string, name: string) => void;
  formatDistance: (distance?: number) => string | null;
}

const ShopCard = ({ shop, index, isAdmin, onRemove, formatDistance }: ShopCardProps) => {
  const navigate = useNavigate();

  // Generate star icons
  const renderStars = (rating: number) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalf = rating - fullStars >= 0.5;

    for (let i = 0; i < 5; i++) {
      if (i < fullStars) {
        stars.push(
          <Star key={i} className="w-3.5 h-3.5 fill-primary text-primary" />
        );
      } else if (i === fullStars && hasHalf) {
        stars.push(
          <Star key={i} className="w-3.5 h-3.5 fill-primary/50 text-primary" />
        );
      } else {
        stars.push(
          <Star key={i} className="w-3.5 h-3.5 text-border" />
        );
      }
    }
    return stars;
  };

  // Placeholder image when shop has no real image
  const shopImage = shop.image && shop.image !== "🌼"
    ? shop.image
    : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 + index * 0.06 }}
      className="group relative bg-card rounded-2xl overflow-hidden border border-border/50 hover:border-primary/30 shadow-soft hover:shadow-elevated transition-all duration-300"
    >
      {/* Image Section */}
      <div className="relative h-48 overflow-hidden bg-muted">
        {shopImage ? (
          <img
            src={shopImage}
            alt={shop.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full bg-gradient-sage flex items-center justify-center">
            <span className="text-5xl opacity-80">💐</span>
          </div>
        )}

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-foreground/30 via-transparent to-transparent" />

        {/* Distance Badge - overlaid on image */}
        {shop.distance !== undefined && (
          <div className="absolute bottom-3 right-3 z-10 bg-primary text-primary-foreground text-xs font-body font-semibold px-3 py-1.5 rounded-xl shadow-md flex items-center gap-1.5">
            <Navigation className="w-3.5 h-3.5" />
            {formatDistance(shop.distance)}
          </div>
        )}

        {/* Remove Button - Admin only */}
        {isAdmin && (
          <button
            onClick={() => onRemove(shop.id, shop.name)}
            className="absolute top-3 left-3 z-10 opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-full bg-background/80 hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
            title="מחק חנות"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Content */}
      <div className="p-5 space-y-3">
        {/* Name & Rating Row */}
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-display text-lg font-bold text-foreground leading-tight">
            {shop.name}
          </h3>
          <div className="flex flex-col items-end shrink-0">
            <div className="flex items-center gap-0.5">
              {renderStars(shop.rating)}
            </div>
            <span className="text-xs text-muted-foreground mt-0.5">
              {shop.rating} ({shop.reviews})
            </span>
          </div>
        </div>

        {/* Location */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <MapPin className="w-4 h-4 shrink-0 text-primary/60" />
          <span>{shop.location}</span>
        </div>

        {/* Speciality */}
        {shop.speciality && shop.speciality !== "כללי" && (
          <p className="text-sm text-foreground/80 font-body leading-relaxed">
            {shop.speciality}
          </p>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2 pt-1">
          <Button
            variant="hero"
            size="sm"
            className="flex-1 rounded-xl gap-2"
            onClick={() => navigate(`/diy-builder?shopId=${shop.id}`)}
          >
            <Palette className="w-4 h-4" />
            עיצוב זר DIY
          </Button>
          <Button
            variant="hero-outline"
            size="sm"
            className="rounded-xl gap-1.5"
            onClick={() => navigate(`/ai-chat?shopId=${shop.id}`)}
          >
            ✨ זר עם AI
          </Button>
        </div>

        {/* Bottom Info Row */}
        <div className="flex items-center gap-3 pt-1 border-t border-border/40">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Clock className="w-3.5 h-3.5 text-primary/50" />
            <span>{shop.hours}</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-primary font-medium mr-auto">
            <Truck className="w-3.5 h-3.5" />
            <span>משלוח עד הבית</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default ShopCard;

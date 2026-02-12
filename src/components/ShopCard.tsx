import { useState } from "react";
import { motion } from "framer-motion";
import { Star, MapPin, Clock, Palette, Navigation, Trash2, Truck, MessageSquarePlus, Globe, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Shop } from "@/hooks/useShops";
import ReviewModal from "@/components/ReviewModal";

import shopPlaceholder1 from "@/assets/shop-placeholder-1.jpg";
import shopPlaceholder2 from "@/assets/shop-placeholder-2.jpg";
import shopPlaceholder3 from "@/assets/shop-placeholder-3.jpg";

const placeholderImages = [shopPlaceholder1, shopPlaceholder2, shopPlaceholder3];

interface ShopCardProps {
  shop: Shop;
  index: number;
  isAdmin: boolean;
  onRemove: (id: string, name: string) => void;
  formatDistance: (distance?: number) => string | null;
}

const ShopCard = ({ shop, index, isAdmin, onRemove, formatDistance }: ShopCardProps) => {
  const navigate = useNavigate();
  const [reviewOpen, setReviewOpen] = useState(false);

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

  // Use shop image if available, otherwise cycle through placeholders based on index
  const shopImage = shop.image && shop.image !== "🌼"
    ? shop.image
    : placeholderImages[index % placeholderImages.length];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 + index * 0.06 }}
      className="group relative bg-card rounded-2xl overflow-hidden border border-border/50 hover:border-primary/30 shadow-soft hover:shadow-elevated transition-all duration-300"
    >
      {/* Image Section */}
      <div className="relative h-48 overflow-hidden bg-muted cursor-pointer" onClick={() => navigate(`/shop/${shop.id}`)}>
        <img
          src={shopImage}
          alt={shop.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />

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
          <h3
            className="font-display text-lg font-bold text-foreground leading-tight cursor-pointer hover:text-primary transition-colors"
            onClick={() => navigate(`/shop/${shop.id}`)}
          >
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
        <div className="flex flex-col gap-2 pt-1">
          <Button
            variant="hero"
            size="sm"
            className="w-full rounded-xl gap-2 py-3 text-base font-semibold shadow-md"
            onClick={() => navigate(`/ai-chat?shopId=${shop.id}`)}
          >
            ✨ Flori השוזרת
          </Button>
          <Button
            variant="hero-outline"
            size="sm"
            className="w-full rounded-xl gap-2"
            onClick={() => navigate(`/diy-builder?shopId=${shop.id}`)}
          >
            <Palette className="w-4 h-4" />
            לשזור בעצמך
          </Button>
        </div>

        {/* Bottom Info Row */}
        <div className="flex items-center flex-wrap gap-3 pt-1 border-t border-border/40">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Clock className="w-3.5 h-3.5 text-primary/50" />
            <span>{shop.hours}</span>
          </div>
          <button
            onClick={() => setReviewOpen(true)}
            className="flex items-center gap-1 text-xs text-primary font-medium font-body hover:underline transition-colors"
          >
            <MessageSquarePlus className="w-3.5 h-3.5" />
            כתבו ביקורת
          </button>
          {shop.website && (
            <a
              href={shop.website.startsWith("http") ? shop.website : `https://${shop.website}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-xs text-primary font-medium font-body hover:underline transition-colors"
            >
              <Globe className="w-3.5 h-3.5" />
              אתר החנות
            </a>
          )}
          <div className="flex items-center gap-1.5 text-xs text-primary font-medium mr-auto">
            <Truck className="w-3.5 h-3.5" />
            <span>משלוח עד הבית</span>
          </div>
        </div>
      </div>

      <ReviewModal
        open={reviewOpen}
        onClose={() => setReviewOpen(false)}
        shopId={shop.id}
        shopName={shop.name}
      />
    </motion.div>
  );
};

export default ShopCard;

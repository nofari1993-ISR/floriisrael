import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { MapPin, Clock, Star, Sparkles, Palette, Globe, Phone, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import Logo from "@/components/Logo";
import Footer from "@/components/Footer";

import shopPlaceholder1 from "@/assets/shop-placeholder-1.jpg";
import shopPlaceholder2 from "@/assets/shop-placeholder-2.jpg";
import shopPlaceholder3 from "@/assets/shop-placeholder-3.jpg";

const placeholderImages = [shopPlaceholder1, shopPlaceholder2, shopPlaceholder3];

interface ShopData {
  id: string;
  name: string;
  location: string;
  rating: number | null;
  reviews: number | null;
  speciality: string | null;
  image: string | null;
  hours: string | null;
  phone: string | null;
  website: string | null;
}

const ShopLanding = () => {
  const { shopId } = useParams<{ shopId: string }>();
  const navigate = useNavigate();
  const [shop, setShop] = useState<ShopData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!shopId) return;
    const fetchShop = async () => {
      const { data, error } = await supabase
        .from("shops")
        .select("id, name, location, rating, reviews, speciality, image, hours, phone, website")
        .eq("id", shopId)
        .single();
      if (!error && data) setShop(data);
      setLoading(false);
    };
    fetchShop();
  }, [shopId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground font-body">טוען...</div>
      </div>
    );
  }

  if (!shop) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-4">
        <p className="text-lg text-muted-foreground font-body">החנות לא נמצאה</p>
        <Button variant="hero" onClick={() => navigate("/")}>
          <ArrowRight className="w-4 h-4 ml-2" />
          חזרה לדף הבית
        </Button>
      </div>
    );
  }

  const shopImage =
    shop.image && shop.image !== "🌼"
      ? shop.image
      : placeholderImages[0];

  const renderStars = (rating: number) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    for (let i = 0; i < 5; i++) {
      stars.push(
        <Star
          key={i}
          className={`w-5 h-5 ${i < fullStars ? "fill-primary text-primary" : "text-border"}`}
        />
      );
    }
    return stars;
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        {/* Background Image */}
        <div className="absolute inset-0">
          <img
            src={shopImage}
            alt={shop.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-foreground/60 via-foreground/40 to-background" />
        </div>

        <div className="relative z-10 container mx-auto px-4">
          {/* Top nav */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-between py-6"
          >
            <button onClick={() => navigate("/")} className="opacity-80 hover:opacity-100 transition-opacity">
              <Logo size="md" className="[&_img]:brightness-0 [&_img]:invert [&_img]:mix-blend-normal [&_span]:text-white" />
            </button>
            <Button
              variant="ghost"
              size="sm"
              className="text-white/80 hover:text-white hover:bg-white/10 gap-2"
              onClick={() => navigate("/")}
            >
              <ArrowRight className="w-4 h-4" />
              חזרה
            </Button>
          </motion.div>

          {/* Shop Info */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-center py-16 md:py-24 space-y-4"
          >
            <h1 className="text-4xl md:text-6xl font-display font-bold text-white drop-shadow-lg">
              {shop.name}
            </h1>

            {shop.speciality && shop.speciality !== "כללי" && (
              <p className="text-lg md:text-xl text-white/80 font-body">{shop.speciality}</p>
            )}

            <div className="flex items-center justify-center gap-6 text-white/80 flex-wrap">
              <div className="flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                <span className="font-body">{shop.location}</span>
              </div>
              {shop.hours && (
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  <span className="font-body">{shop.hours}</span>
                </div>
              )}
            </div>

            {shop.rating && (
              <div className="flex items-center justify-center gap-2">
                <div className="flex gap-0.5">{renderStars(shop.rating)}</div>
                <span className="text-white font-semibold">{shop.rating}</span>
                {shop.reviews !== null && (
                  <span className="text-white/60 text-sm">({shop.reviews} ביקורות)</span>
                )}
              </div>
            )}

            {/* Contact info */}
            <div className="flex items-center justify-center gap-4 pt-2 flex-wrap">
              {shop.phone && (
                <a
                  href={`tel:${shop.phone}`}
                  className="flex items-center gap-1.5 text-white/70 hover:text-white transition-colors text-sm font-body"
                >
                  <Phone className="w-4 h-4" />
                  {shop.phone}
                </a>
              )}
              {shop.website && (
                <a
                  href={shop.website.startsWith("http") ? shop.website : `https://${shop.website}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-white/70 hover:text-white transition-colors text-sm font-body"
                >
                  <Globe className="w-4 h-4" />
                  אתר החנות
                </a>
              )}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-3">
              איך תרצו להזמין?
            </h2>
            <p className="text-muted-foreground font-body text-lg">
              בחרו את הדרך שמתאימה לכם ליצור את הזר המושלם
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-6 md:gap-8 max-w-4xl mx-auto">
            {/* Flori AI Chat Card */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="group relative bg-card rounded-3xl border border-border/50 hover:border-primary/30 shadow-soft hover:shadow-elevated transition-all duration-300 overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-sage opacity-0 group-hover:opacity-5 transition-opacity duration-300" />
              <div className="relative p-8 md:p-10 space-y-6">
                <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
                  <Sparkles className="w-8 h-8 text-primary" />
                </div>
                <div className="space-y-3">
                  <h3 className="text-2xl font-display font-bold text-foreground">
                    Flori השוזרת ✨
                  </h3>
                  <p className="text-muted-foreground font-body leading-relaxed">
                    ספרו לפלורי למי הזר ומה האירוע, והיא תיצור עבורכם זר מושלם מתוך המלאי של החנות — כולל תמונה מיוחדת!
                  </p>
                </div>
                <ul className="space-y-2 text-sm text-muted-foreground font-body">
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                    המלצה חכמה מבוססת AI
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                    תמונת זר ייחודית שנוצרת בזמן אמת
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                    התאמה אישית לאירוע ולתקציב
                  </li>
                </ul>
                <Button
                  variant="hero"
                  size="lg"
                  className="w-full rounded-2xl gap-2 text-lg py-6"
                  onClick={() => navigate(`/ai-chat?shopId=${shop.id}`)}
                >
                  <Sparkles className="w-5 h-5" />
                  התחילו שיחה עם פלורי
                </Button>
              </div>
            </motion.div>

            {/* DIY Builder Card */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="group relative bg-card rounded-3xl border border-border/50 hover:border-secondary/30 shadow-soft hover:shadow-elevated transition-all duration-300 overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-blush opacity-0 group-hover:opacity-5 transition-opacity duration-300" />
              <div className="relative p-8 md:p-10 space-y-6">
                <div className="w-16 h-16 rounded-2xl bg-secondary/10 flex items-center justify-center">
                  <Palette className="w-8 h-8 text-secondary" />
                </div>
                <div className="space-y-3">
                  <h3 className="text-2xl font-display font-bold text-foreground">
                    שזור בעצמך 🌸
                  </h3>
                  <p className="text-muted-foreground font-body leading-relaxed">
                    בחרו פרחים בעצמכם מתוך המלאי של החנות, בנו את הזר בדיוק כמו שאתם רוצים — פרח אחרי פרח.
                  </p>
                </div>
                <ul className="space-y-2 text-sm text-muted-foreground font-body">
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-secondary" />
                    בחירה חופשית מכל המלאי
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-secondary" />
                    שליטה מלאה בהרכב ובמחיר
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-secondary" />
                    סינון לפי צבע ועונתיות
                  </li>
                </ul>
                <Button
                  variant="blush"
                  size="lg"
                  className="w-full rounded-2xl gap-2 text-lg py-6"
                  onClick={() => navigate(`/diy-builder?shopId=${shop.id}`)}
                >
                  <Palette className="w-5 h-5" />
                  התחילו לשזור
                </Button>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default ShopLanding;

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import logoImage from "@/assets/logo.png";
import { ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import Logo from "@/components/Logo";
import Footer from "@/components/Footer";
import FullscreenImageModal from "@/components/diy-builder/FullscreenImageModal";

interface GalleryBouquet {
  id: string;
  image_url: string;
  flowers: { name: string; quantity: number; color?: string }[];
  total_price: number;
  occasion: string | null;
  style: string | null;
  message: string | null;
  created_at: string;
}

const Gallery = () => {
  const [bouquets, setBouquets] = useState<GalleryBouquet[]>([]);
  const [loading, setLoading] = useState(true);
  const [fullscreenUrl, setFullscreenUrl] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchGallery = async () => {
      const { data, error } = await supabase
        .from("gallery_bouquets")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);

      if (!error && data) {
        setBouquets(data as unknown as GalleryBouquet[]);
      }
      setLoading(false);
    };
    fetchGallery();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-hero">
      <div className="container mx-auto px-4 pt-8 pb-4">
        <motion.nav
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="flex items-center justify-between py-3 px-5 glass-nav rounded-2xl mb-8"
        >
          <Logo size="md" />
          <Button variant="hero-outline" size="sm" className="gap-2" onClick={() => navigate("/")}>
            <ArrowRight className="w-4 h-4" />
            חזרה לדף הבית
          </Button>
        </motion.nav>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="text-center mb-10"
        >
          <h1 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-3 flex items-center justify-center gap-3 flex-wrap">
            גלריית הזרים של
            <span className="inline-flex items-center gap-2">
              <img src={logoImage} alt="Flori" className="w-10 h-10 object-contain mix-blend-multiply inline-block" />
              <span style={{ fontFamily: "'Pacifico', cursive" }}>Flori</span>
            </span>
          </h1>
          <p className="text-muted-foreground font-body text-base md:text-lg max-w-md mx-auto">
            הזרים שנוצרו על ידי הקהילה שלנו
          </p>
        </motion.div>

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
          </div>
        ) : bouquets.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-muted-foreground font-body text-lg">
              עדיין אין זרים בגלריה 🌷 היו הראשונים ליצור!
            </p>
            <Button variant="hero" className="mt-4" onClick={() => navigate("/shops")}>
              צרו את הזר הראשון
            </Button>
          </div>
        ) : (
          <div className="columns-2 md:columns-3 lg:columns-4 gap-4 space-y-4">
            {bouquets.map((bouquet, i) => (
              <motion.div
                key={bouquet.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: i * 0.05 }}
                className="break-inside-avoid glass-card rounded-2xl overflow-hidden shadow-card hover:shadow-elevated transition-shadow cursor-pointer group"
                onClick={() => setFullscreenUrl(bouquet.image_url)}
              >
                <div className="relative overflow-hidden">
                  <img
                    src={bouquet.image_url}
                    alt="זר פרחים"
                    className="w-full object-cover group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-foreground/30 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <div className="p-3 space-y-1.5">
                  <div className="flex flex-wrap gap-1">
                    {bouquet.flowers.map((f, j) => (
                      <span
                        key={j}
                        className="text-[11px] font-body bg-primary/10 text-primary rounded-full px-2 py-0.5"
                      >
                        {f.color ? `${f.color} ` : ""}{f.name}
                      </span>
                    ))}
                  </div>
                  {bouquet.message && (
                    <p className="text-xs font-body text-muted-foreground leading-relaxed line-clamp-3">
                      {bouquet.message}
                    </p>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      <FullscreenImageModal
        imageUrl={fullscreenUrl}
        isOpen={!!fullscreenUrl}
        onClose={() => setFullscreenUrl(null)}
      />

      <Footer />
    </div>
  );
};

export default Gallery;

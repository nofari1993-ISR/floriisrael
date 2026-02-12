import { motion, AnimatePresence } from "framer-motion";
import { Search, MapPin, LogOut, LayoutDashboard, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useEffect, useRef, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import ISRAELI_CITIES from "@/data/israeliCities";
import ShopSearchResults from "@/components/ShopSearchResults";
import { useAuth } from "@/hooks/useAuth";
import { useShopOwner } from "@/hooks/useShopOwner";
import Logo from "@/components/Logo";
import { supabase } from "@/integrations/supabase/client";

import galleryRomantic from "@/assets/gallery-romantic.jpg";
import gallerySunny from "@/assets/gallery-sunny.jpg";
import galleryPastel from "@/assets/gallery-pastel.jpg";
import galleryTropical from "@/assets/gallery-tropical.jpg";

const fallbackImages = [
  { src: galleryRomantic, label: "זר רומנטי" },
  { src: gallerySunny, label: "זר שמש" },
  { src: galleryPastel, label: "זר פסטל" },
  { src: galleryTropical, label: "זר טרופי" },
];

const Hero = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchParams, setSearchParams] = useSearchParams();
  const showResults = searchParams.get("shops") === "open";
  const { user, isAdmin, signOut } = useAuth();
  const { isShopOwner } = useShopOwner();
  const navigate = useNavigate();
  const [currentImage, setCurrentImage] = useState(0);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [bouquetImages, setBouquetImages] = useState(fallbackImages);

  // Fetch gallery images
  useEffect(() => {
    const fetchGallery = async () => {
      const { data } = await supabase
        .from("gallery_bouquets")
        .select("image_url, occasion, style")
        .order("created_at", { ascending: false })
        .limit(8);

      if (data && data.length >= 2) {
        const newImages = (data as { image_url: string; occasion: string | null; style: string | null }[]).map((b) => ({
          src: b.image_url,
          label: b.occasion || b.style || "זר מהקהילה",
        }));
        setBouquetImages(newImages);
        setCurrentImage(0);
      }
    };
    fetchGallery();
  }, []);

  const filteredCities = useMemo(() => {
    if (!searchQuery || searchQuery.length < 1) return [];
    const q = searchQuery.trim();
    return [...new Set(ISRAELI_CITIES.filter((city) => city.includes(q)))].slice(0, 6);
  }, [searchQuery]);

  const selectCity = (city: string) => {
    setSearchQuery(city);
    setShowSuggestions(false);
    inputRef.current?.focus();
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const q = searchParams.get("q");
    if (q) setSearchQuery(q);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImage((prev) => (prev + 1) % bouquetImages.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [bouquetImages.length]);

  const openResults = () => {
    setSearchParams({ shops: "open", q: searchQuery });
  };

  const closeResults = () => {
    setSearchParams({});
  };

  return (
    <section className="relative min-h-screen overflow-hidden bg-gradient-hero">
      {/* Decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-20 -left-20 w-96 h-96 rounded-full bg-accent/30 blur-3xl" />
        <div className="absolute bottom-20 -right-20 w-80 h-80 rounded-full bg-secondary/40 blur-3xl" />
        <div className="absolute top-1/2 left-1/3 w-64 h-64 rounded-full bg-primary/10 blur-3xl" />
      </div>

      <div className="container mx-auto px-4 pt-8">
        {/* Navbar */}
        <motion.nav 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="flex items-center justify-between py-3 px-5 glass-nav rounded-2xl"
        >
          <Logo size="md" />
          <div className="hidden md:flex items-center gap-8 font-body text-muted-foreground">
            <a href="#how-it-works" className="hover:text-foreground transition-colors">איך זה עובד</a>
            <button onClick={() => navigate("/shops")} className="hover:text-foreground transition-colors cursor-pointer">חנויות</button>
            <button onClick={() => navigate("/gallery")} className="hover:text-foreground transition-colors cursor-pointer">גלריה</button>
            <button onClick={() => navigate("/about")} className="hover:text-foreground transition-colors cursor-pointer">אודות</button>
          </div>
          {user ? (
            <div className="flex items-center gap-2">
              {isAdmin && <span className="text-xs text-primary font-medium bg-primary/10 px-2 py-1 rounded-full">מנהלת</span>}
              {(isShopOwner || isAdmin) && (
                <Button variant="hero" size="sm" className="rounded-xl gap-2" onClick={() => navigate("/dashboard")}>
                  <LayoutDashboard className="w-4 h-4" />
                  ניהול
                </Button>
              )}
              <Button variant="hero-outline" size="sm" onClick={signOut}>
                <LogOut className="w-4 h-4 ml-1" />
                התנתקות
              </Button>
            </div>
          ) : (
            <Button variant="hero-outline" size="sm" onClick={() => navigate("/auth")}>
              התחברות
            </Button>
          )}
        </motion.nav>

        {/* Hero Content */}
        <div className="grid md:grid-cols-2 gap-8 md:gap-12 items-center min-h-[calc(100vh-120px)] py-8 md:py-0">
          {/* Left side - Text & Search */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.2, ease: "easeOut" }}
            className="space-y-6 lg:space-y-8 text-center"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1.2, ease: "easeOut" }}
              className="flex items-center justify-center gap-4 mb-2 lg:mb-4"
            >
              <Logo size="lg" showText={false} />
              <span
                className="text-5xl md:text-6xl lg:text-7xl text-foreground tracking-wide"
                style={{ fontFamily: "'Pacifico', cursive" }}
              >
                Flori
              </span>
            </motion.div>
            <p className="text-base md:text-lg lg:text-xl text-muted-foreground font-body max-w-lg leading-relaxed mx-auto lg:mx-0">
              גלו חנויות פרחים באזור שלכם וקבלו את הזר המושלם ישירות עד הבית 🌷
            </p>

            {/* Search Bar */}
            <motion.div
              initial={{ opacity: 0, y: 25 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.6, ease: "easeOut" }}
              className="relative max-w-lg mx-auto lg:mx-0"
            >
              <div className="relative" ref={suggestionsRef}>
                <div className="glass-card rounded-2xl p-2 shadow-elevated flex items-center gap-2">
                  <div className="flex items-center gap-2 flex-1 pr-4">
                    <MapPin className="w-5 h-5 text-blush-dark shrink-0" />
                    <input
                      ref={inputRef}
                      type="text"
                      placeholder="הזינו עיר..."
                      value={searchQuery}
                      onChange={(e) => {
                        setSearchQuery(e.target.value);
                        setShowSuggestions(true);
                      }}
                      onFocus={() => searchQuery.length >= 1 && setShowSuggestions(true)}
                      onKeyDown={(e) => { if (e.key === "Enter") { setShowSuggestions(false); openResults(); } }}
                      className="w-full bg-transparent outline-none font-body text-foreground placeholder:text-muted-foreground"
                    />
                  </div>
                  <Button variant="hero" size="lg" className="rounded-xl gap-2" onClick={() => { setShowSuggestions(false); openResults(); }}>
                    <Search className="w-4 h-4" />
                    חיפוש
                  </Button>
                </div>
                {/* Autocomplete dropdown */}
                {showSuggestions && filteredCities.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-card border border-border/50 rounded-xl shadow-elevated z-50 overflow-hidden">
                    {filteredCities.map((city) => (
                      <button
                        key={city}
                        onClick={() => selectCity(city)}
                        className="w-full text-right px-4 py-3 text-sm font-body text-foreground hover:bg-primary/10 transition-colors flex items-center gap-2"
                      >
                        <MapPin className="w-3.5 h-3.5 text-primary/60 shrink-0" />
                        {city}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>

          {/* Right side - Rotating bouquet images */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, delay: 0.4 }}
            className="relative flex items-center justify-center order-first md:order-none mb-6 md:mb-0"
          >
            <div className="relative w-56 h-56 sm:w-64 sm:h-64 lg:w-80 lg:h-80 xl:w-96 xl:h-96">
              {/* Glass frame */}
              <div className="absolute inset-0 rounded-3xl glass-card shadow-elevated overflow-hidden">
                <AnimatePresence mode="wait">
                  <motion.img
                    key={currentImage}
                    src={bouquetImages[currentImage].src}
                    alt={bouquetImages[currentImage].label}
                    initial={{ opacity: 0, scale: 1.1 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.8, ease: "easeInOut" }}
                    className="w-full h-full object-cover"
                  />
                </AnimatePresence>
                {/* Gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-foreground/40 via-transparent to-transparent" />
                {/* Label */}
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentImage}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.5, delay: 0.3 }}
                    className="absolute bottom-4 right-4 left-4"
                  >
                    <div className="glass-card rounded-xl px-4 py-2.5 flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-primary" />
                      <span className="font-body font-semibold text-foreground text-sm">
                        {bouquetImages[currentImage].label}
                      </span>
                      <span className="text-xs text-muted-foreground mr-auto">✨</span>
                    </div>
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* Dots indicator */}
              <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 flex gap-2">
                {bouquetImages.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentImage(i)}
                    className={`w-2 h-2 rounded-full transition-all duration-300 ${
                      i === currentImage ? "bg-primary w-6" : "bg-primary/30"
                    }`}
                  />
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
      <ShopSearchResults open={showResults} onClose={closeResults} searchQuery={searchQuery} />
    </section>
  );
};

export default Hero;

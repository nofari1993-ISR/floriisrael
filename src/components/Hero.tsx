import { motion } from "framer-motion";
import { Search, MapPin, LogOut, LayoutDashboard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import ShopSearchResults from "@/components/ShopSearchResults";
import { useAuth } from "@/hooks/useAuth";
import { useShopOwner } from "@/hooks/useShopOwner";
import Logo from "@/components/Logo";

const Hero = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchParams, setSearchParams] = useSearchParams();
  const showResults = searchParams.get("shops") === "open";
  const { user, isAdmin, signOut } = useAuth();
  const { isShopOwner } = useShopOwner();
  const navigate = useNavigate();

  useEffect(() => {
    const q = searchParams.get("q");
    if (q) setSearchQuery(q);
  }, []);

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
            <a href="#shops" className="hover:text-foreground transition-colors">חנויות</a>
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
        <div className="flex items-center justify-center min-h-[calc(100vh-120px)] py-8 lg:py-0">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="space-y-6 lg:space-y-8 text-center max-w-2xl mx-auto"
          >
            <div className="space-y-4 lg:space-y-6">
              <Logo size="lg" layout="vertical" className="mb-2 lg:mb-4" />
              <p className="text-base md:text-lg lg:text-xl text-muted-foreground font-body max-w-lg leading-relaxed mx-auto">
                גלו חנויות פרחים באזור שלכם וקבלו את הזר המושלם ישירות עד הבית 🌷
              </p>
            </div>

            {/* Search Bar */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="relative max-w-lg"
            >
              <div className="glass-card rounded-2xl p-2 shadow-elevated flex items-center gap-2">
                <div className="flex items-center gap-2 flex-1 pr-4">
                  <MapPin className="w-5 h-5 text-blush-dark shrink-0" />
                  <input
                    type="text"
                    placeholder="הזינו כתובת או עיר..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-transparent outline-none font-body text-foreground placeholder:text-muted-foreground"
                  />
                </div>
                <Button variant="hero" size="lg" className="rounded-xl gap-2" onClick={openResults}>
                  <Search className="w-4 h-4" />
                  חיפוש
                </Button>
              </div>
            </motion.div>

          </motion.div>


        </div>
      </div>
      <ShopSearchResults open={showResults} onClose={closeResults} searchQuery={searchQuery} />
    </section>
  );
};

export default Hero;

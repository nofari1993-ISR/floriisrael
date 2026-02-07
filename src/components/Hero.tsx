import { motion } from "framer-motion";
import { Search, MapPin, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import heroImage from "@/assets/hero-flowers.jpg";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import ShopSearchResults from "@/components/ShopSearchResults";
import { useAuth } from "@/hooks/useAuth";
import Logo from "@/components/Logo";

const Hero = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [showResults, setShowResults] = useState(false);
  const { user, isAdmin, signOut } = useAuth();
  const navigate = useNavigate();

  return (
    <section className="relative min-h-screen overflow-hidden bg-gradient-hero">
      {/* Decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-20 -left-20 w-96 h-96 rounded-full bg-secondary/30 blur-3xl" />
        <div className="absolute bottom-20 -right-20 w-80 h-80 rounded-full bg-sage-light/40 blur-3xl" />
      </div>

      <div className="container mx-auto px-4 pt-8">
        {/* Navbar */}
        <motion.nav 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="flex items-center justify-between py-4"
        >
          <Logo size="md" />
          <div className="hidden md:flex items-center gap-8 font-body text-muted-foreground">
            <a href="#how-it-works" className="hover:text-foreground transition-colors">איך זה עובד</a>
            <a href="#bouquet-builder" className="hover:text-foreground transition-colors">עיצוב זר עצמאי</a>
            <a href="#shops" className="hover:text-foreground transition-colors">חנויות</a>
            <a href="#ai-chat" className="hover:text-foreground transition-colors">בניית זר AI</a>
          </div>
          {user ? (
            <div className="flex items-center gap-2">
              {isAdmin && <span className="text-xs text-primary font-medium bg-primary/10 px-2 py-1 rounded-full">מנהלת</span>}
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
        <div className="grid lg:grid-cols-2 gap-12 items-center min-h-[calc(100vh-120px)]">
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="space-y-8"
          >
            <div className="space-y-6">
              <Logo size="lg" layout="vertical" className="mb-4" />
              <p className="text-xl text-muted-foreground font-body max-w-lg leading-relaxed">
                גלו חנויות פרחים באזור שלכם, בנו את הזר המושלם בעצמכם או תנו ל-AI החכם שלנו לעזור לכם
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
                <Button variant="hero" size="lg" className="rounded-xl gap-2" onClick={() => setShowResults(true)}>
                  <Search className="w-4 h-4" />
                  חיפוש
                </Button>
              </div>
            </motion.div>

          </motion.div>

          {/* Hero Image */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, delay: 0.3 }}
            className="relative hidden lg:block"
          >
            <div className="relative rounded-3xl overflow-hidden shadow-elevated max-w-md mx-auto">
              <img
                src={heroImage}
                alt="זרי פרחים יפהפיים"
                className="w-full h-[400px] object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-foreground/10 to-transparent" />
            </div>
            {/* Floating Card */}
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              className="absolute -bottom-6 -right-6 glass-card rounded-2xl p-4 shadow-card"
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-gradient-blush flex items-center justify-center text-2xl">
                  🌷
                </div>
                <div>
                  <div className="font-display font-semibold text-foreground">זר רומנטי</div>
                  <div className="text-sm text-muted-foreground">נוצר עכשיו ע״י AI</div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>
      <ShopSearchResults open={showResults} onClose={() => setShowResults(false)} searchQuery={searchQuery} />
    </section>
  );
};

export default Hero;

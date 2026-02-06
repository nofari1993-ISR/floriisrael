import { motion } from "framer-motion";
import { Search, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import heroImage from "@/assets/hero-flowers.jpg";
import { useState } from "react";

const Hero = () => {
  const [searchQuery, setSearchQuery] = useState("");

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
          <div className="flex items-center gap-2">
            <span className="text-3xl">🌸</span>
            <span className="font-display text-2xl font-bold text-foreground">בלום</span>
          </div>
          <div className="hidden md:flex items-center gap-8 font-body text-muted-foreground">
            <a href="#how-it-works" className="hover:text-foreground transition-colors">איך זה עובד</a>
            <a href="#bouquet-builder" className="hover:text-foreground transition-colors">בנה זר</a>
            <a href="#shops" className="hover:text-foreground transition-colors">חנויות</a>
            <a href="#ai-chat" className="hover:text-foreground transition-colors">צ׳אט חכם</a>
          </div>
          <Button variant="hero-outline" size="sm">
            התחברות
          </Button>
        </motion.nav>

        {/* Hero Content */}
        <div className="grid lg:grid-cols-2 gap-12 items-center min-h-[calc(100vh-120px)]">
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="space-y-8"
          >
            <div className="space-y-4">
              <motion.span
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="inline-block px-4 py-1.5 rounded-full bg-secondary/60 text-secondary-foreground text-sm font-medium"
              >
                ✨ המרקטפלייס הראשון לפרחים בישראל
              </motion.span>
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-display font-bold leading-tight text-foreground">
                כל הפרחים,{" "}
                <span className="text-gradient-sage">במקום אחד</span>
              </h1>
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
                <Button variant="hero" size="lg" className="rounded-xl gap-2">
                  <Search className="w-4 h-4" />
                  חיפוש
                </Button>
              </div>
            </motion.div>

            {/* Stats */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
              className="flex gap-8 pt-4"
            >
              {[
                { number: "150+", label: "חנויות פרחים" },
                { number: "10K+", label: "זרים נשלחו" },
                { number: "4.9", label: "דירוג ממוצע ⭐" },
              ].map((stat) => (
                <div key={stat.label} className="text-center">
                  <div className="text-2xl font-display font-bold text-foreground">{stat.number}</div>
                  <div className="text-sm text-muted-foreground font-body">{stat.label}</div>
                </div>
              ))}
            </motion.div>
          </motion.div>

          {/* Hero Image */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, delay: 0.3 }}
            className="relative hidden lg:block"
          >
            <div className="relative rounded-3xl overflow-hidden shadow-elevated">
              <img
                src={heroImage}
                alt="זרי פרחים יפהפיים"
                className="w-full h-[550px] object-cover"
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
    </section>
  );
};

export default Hero;

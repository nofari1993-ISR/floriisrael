import { motion } from "framer-motion";
import { Flower2, Sparkles, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const CTASection = () => {
  const navigate = useNavigate();

  return (
    <section className="py-20 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-sage opacity-90" />
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-20 -right-20 w-96 h-96 rounded-full bg-accent/20 blur-3xl" />
        <div className="absolute -bottom-20 -left-20 w-80 h-80 rounded-full bg-secondary/20 blur-3xl" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center space-y-8 max-w-3xl mx-auto"
        >
          <div className="flex justify-center gap-3">
            <motion.div animate={{ rotate: [-5, 5, -5] }} transition={{ duration: 2, repeat: Infinity }}>
              <Flower2 className="w-8 h-8 text-secondary" />
            </motion.div>
            <motion.div animate={{ y: [-3, 3, -3] }} transition={{ duration: 1.5, repeat: Infinity }}>
              <Heart className="w-8 h-8 text-secondary" />
            </motion.div>
            <motion.div animate={{ rotate: [5, -5, 5] }} transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}>
              <Sparkles className="w-8 h-8 text-secondary" />
            </motion.div>
          </div>

          <h2 className="text-4xl md:text-5xl font-display font-bold text-primary-foreground leading-tight">
            מוכנים ליצור את הזר<br />המושלם שלכם?
          </h2>
          <p className="text-xl text-primary-foreground/80 font-body max-w-xl mx-auto">
            הצטרפו לאלפי לקוחות מרוצים שכבר גילו את הדרך הקלה והיפה ביותר להזמין פרחים
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button
              variant="blush"
              size="lg"
              className="rounded-2xl gap-2 text-lg px-8 py-6"
              onClick={() => navigate("/ai-chat")}
            >
              <Sparkles className="w-5 h-5" />
              בניית זר עם AI
            </Button>
            <Button
              variant="hero-outline"
              size="lg"
              className="rounded-2xl gap-2 text-lg px-8 py-6 border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground"
              onClick={() => navigate("/diy")}
            >
              <Flower2 className="w-5 h-5" />
              עיצוב DIY
            </Button>
          </div>

          {/* Social proof */}
          <div className="flex items-center justify-center gap-8 pt-4">
            <div className="text-center">
              <div className="text-2xl font-display font-bold text-primary-foreground">2,500+</div>
              <div className="text-sm text-primary-foreground/60 font-body">זרים נוצרו</div>
            </div>
            <div className="w-px h-10 bg-primary-foreground/20" />
            <div className="text-center">
              <div className="text-2xl font-display font-bold text-primary-foreground">4.9 ⭐</div>
              <div className="text-sm text-primary-foreground/60 font-body">דירוג ממוצע</div>
            </div>
            <div className="w-px h-10 bg-primary-foreground/20" />
            <div className="text-center">
              <div className="text-2xl font-display font-bold text-primary-foreground">50+</div>
              <div className="text-sm text-primary-foreground/60 font-body">חנויות שותפות</div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default CTASection;

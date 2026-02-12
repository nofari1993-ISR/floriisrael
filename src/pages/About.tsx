import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import Logo from "@/components/Logo";
import Footer from "@/components/Footer";
import logoImage from "@/assets/logo.png";

const About = () => {
  const navigate = useNavigate();

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

        <motion.article
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="max-w-2xl mx-auto glass-card rounded-3xl p-8 md:p-12 shadow-elevated space-y-8 font-body text-foreground leading-relaxed"
        >
          <h1 className="text-3xl md:text-4xl font-display font-bold text-center flex items-center justify-center gap-3 flex-wrap">
            נעים להכיר, אנחנו
            <span className="inline-flex items-center gap-2">
              <img src={logoImage} alt="Flori" className="w-10 h-10 object-contain mix-blend-multiply inline-block" />
              <span style={{ fontFamily: "'Pacifico', cursive" }}>Flori</span>
            </span>
            . 🌸
          </h1>

          <p className="text-lg text-center text-muted-foreground">
            המקום שבו הפרחים שלכם מתחילים בדמיון ומסתיימים בזר מושלם.
          </p>

          <p>
            אנחנו ב-Flori מאמינים שעיצוב פרחים לא צריך להיות "חתול בשק". נמאס לנו להזמין זר מהאינטרנט ולקוות שהוא ייראה כמו בתמונה. לכן, הקמנו פלטפורמה ששמה את הכוח היצירתי בידיים שלכם.
          </p>

          <div className="space-y-4">
            <h2 className="text-2xl font-display font-bold">מה הופך אותנו לשונים?</h2>
            <p>אנחנו לא עוד חנות פרחים, אנחנו הסטודיו הדיגיטלי האישי שלכם:</p>

            <div className="space-y-4">
              <div className="glass-card rounded-2xl p-5 border border-primary/10">
                <h3 className="font-display font-bold text-primary mb-1">You Design It</h3>
                <p className="text-sm text-muted-foreground">
                  מערכת חכמה שמאפשרת לכם לבחור, להזיז ולעצב את הזר בדיוק לפי הטעם האישי שלכם.
                </p>
              </div>
              <div className="glass-card rounded-2xl p-5 border border-primary/10">
                <h3 className="font-display font-bold text-primary mb-1">What You See Is What You Get</h3>
                <p className="text-sm text-muted-foreground">
                  בלי הפתעות. הזר שעיצבתם על המסך הוא הזר שיגיע לדלת.
                </p>
              </div>
              <div className="glass-card rounded-2xl p-5 border border-primary/10">
                <h3 className="font-display font-bold text-primary mb-1">Zero Effort, Maximum Style</h3>
                <p className="text-sm text-muted-foreground">
                  חוויה טכנולוגית חלקה שהופכת את תהליך ההזמנה לכיפי, מהיר ומלא בסטייל.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <h2 className="text-2xl font-display font-bold">החזון שלנו</h2>
            <p>
              להפוך כל משלוח פרחים למחווה אישית באמת. אנחנו כאן כדי לגשר על הפער בין הטבע לטכנולוגיה, ולהעניק לכם דרך חדשה, מרגשת ופשוטה להכניס צבע וריח הביתה (או למי שאתם אוהבים).
            </p>
          </div>

          <blockquote className="text-center text-lg font-display font-semibold text-primary border-t border-b border-primary/20 py-6">
            "כי כשאתם מעצבים את הזר בעצמכם, הרגש כבר נמצא בפנים."
          </blockquote>
        </motion.article>
      </div>

      <Footer />
    </div>
  );
};

export default About;

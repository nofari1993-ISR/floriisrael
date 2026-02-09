import { ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Logo from "@/components/Logo";
import Footer from "@/components/Footer";

const Terms = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-xl border-b border-border/50">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors font-body"
          >
            <ArrowRight className="w-5 h-5" />
            חזרה
          </button>
          <Logo size="sm" />
        </div>
      </div>

      {/* Content */}
      <main className="container mx-auto px-4 py-12 max-w-3xl">
        <h1 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-10 text-center">
          תנאי שימוש עבור פלטפורמת Flori
        </h1>

        <div className="prose-custom space-y-8 font-body text-foreground/90 leading-relaxed">
          {/* Section 1 */}
          <section className="space-y-3">
            <h2 className="text-xl font-display font-bold text-foreground">1. כללי</h2>
            <p>
              האתר "Flori" (להלן: "הפלטפורמה") משמש כזירה מקוונת המקשרת בין לקוחות לבין חנויות פרחים (להלן: "הספקים") באמצעות טכנולוגיית בינה מלאכותית מתקדמת לעיצוב זרים. השימוש בפלטפורמה, לרבות ביצוע הזמנות, מהווה הסכמה מלאה לתנאים המפורטים להלן.
            </p>
          </section>

          {/* Section 2 */}
          <section className="space-y-3">
            <h2 className="text-xl font-display font-bold text-foreground">2. טכנולוגיית העיצוב (AI)</h2>
            <p>
              הממשק לעיצוב הזרים מבוסס על בינה מלאכותית. התמונות הנוצרות בתהליך העיצוב הן לצורכי המחשה בלבד.
            </p>
            <p>
              Flori עושה כל מאמץ לסנכרן את המלאי הזמין אצל הספקים בזמן אמת. עם זאת, ייתכנו שינויים קלים בין התמונה לבין הזר הסופי בשל הבדלי עונתיות, זמינות הפרח הספציפי ביום ההזמנה, או יד האמן של השוזר.
            </p>
          </section>

          {/* Section 3 */}
          <section className="space-y-3">
            <h2 className="text-xl font-display font-bold text-foreground">3. תשלום וביצוע הזמנה</h2>
            <p>המחירים המוצגים כוללים מע"מ אלא אם צוין אחרת.</p>
            <p>
              התשלום מבוצע באופן מאובטח. ההזמנה תיחשב כמאושרת רק לאחר קבלת אישור סופי ממערכת הסליקה.
            </p>
          </section>

          {/* Section 4 */}
          <section className="space-y-3">
            <h2 className="text-xl font-display font-bold text-foreground">4. מדיניות ביטולים והחזרים</h2>
            <ul className="list-disc pr-6 space-y-2">
              <li>
                <strong>ביטול הזמנה:</strong> מאחר שמדובר בפרחים (מוצרים פסידים ומתכלים), ניתן לבטל הזמנה ולקבל זיכוי מלא עד מספר שעות לפני מועד המשלוח המבוקש.
              </li>
              <li>
                <strong>לאחר תחילת העבודה:</strong> מרגע שהספק החל בשזירת הזר או בהכנתו, לא ניתן לבטל את ההזמנה או לקבל החזר כספי.
              </li>
              <li>
                <strong>איכות וטריות:</strong> במקרה של תלונה על איכות המוצר, יש לפנות לשירות הלקוחות בצירוף צילום הזר בתוך 12 שעות מרגע המסירה.
              </li>
            </ul>
          </section>

          {/* Section 5 */}
          <section className="space-y-3">
            <h2 className="text-xl font-display font-bold text-foreground">5. הגבלת אחריות</h2>
            <p>
              Flori פועלת כמתווכת טכנולוגית בלבד. האחריות על איכות הפרחים, טריותם, עמידה בלוחות זמנים של משלוח וטיב השירות חלה באופן בלעדי על הספק (חנות הפרחים) שנבחרה.
            </p>
            <p>
              הפלטפורמה לא תישא באחריות לנזקים עקיפים או תוצאתיים הנובעים משימוש באתר או מתקלות טכניות בצדדים שלישיים.
            </p>
          </section>

          {/* Section 6 */}
          <section className="space-y-3">
            <h2 className="text-xl font-display font-bold text-foreground">6. קניין רוחני</h2>
            <p>
              כל הזכויות בעיצובים המופקים על ידי ה-AI ובתוכן האתר שייכות ל-Flori.
            </p>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Terms;

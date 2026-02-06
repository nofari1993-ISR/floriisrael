import { Heart } from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-foreground py-16">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-4 gap-8 mb-12">
          <div className="md:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-3xl">🌸</span>
              <span className="font-display text-2xl font-bold text-primary-foreground">בלום</span>
            </div>
            <p className="text-primary-foreground/60 font-body max-w-sm leading-relaxed">
              המרקטפלייס הראשון לפרחים בישראל. מחברים בין לקוחות לחנויות פרחים באמצעות טכנולוגיה חכמה ועיצוב DIY.
            </p>
          </div>

          <div>
            <h4 className="font-display font-semibold text-primary-foreground mb-4">קישורים</h4>
            <ul className="space-y-2 font-body">
              <li><a href="#how-it-works" className="text-primary-foreground/60 hover:text-primary-foreground transition-colors">איך זה עובד</a></li>
              <li><a href="#bouquet-builder" className="text-primary-foreground/60 hover:text-primary-foreground transition-colors">בנה זר</a></li>
              <li><a href="#shops" className="text-primary-foreground/60 hover:text-primary-foreground transition-colors">חנויות</a></li>
              <li><a href="#ai-chat" className="text-primary-foreground/60 hover:text-primary-foreground transition-colors">צ׳אט AI</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-display font-semibold text-primary-foreground mb-4">צרו קשר</h4>
            <ul className="space-y-2 font-body text-primary-foreground/60">
              <li>hello@bloom.co.il</li>
              <li>054-1234567</li>
              <li>תל אביב, ישראל</li>
            </ul>
          </div>
        </div>

        <div className="border-t border-primary-foreground/10 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-primary-foreground/40 text-sm font-body flex items-center gap-1">
            נבנה עם <Heart className="w-3 h-3 fill-blush-dark text-blush-dark" /> ב-2026
          </p>
          <div className="flex gap-6 text-primary-foreground/40 text-sm font-body">
            <a href="#" className="hover:text-primary-foreground/70 transition-colors">תנאי שימוש</a>
            <a href="#" className="hover:text-primary-foreground/70 transition-colors">מדיניות פרטיות</a>
            <a href="#" className="hover:text-primary-foreground/70 transition-colors">נגישות</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

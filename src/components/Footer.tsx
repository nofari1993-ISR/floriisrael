import { Heart } from "lucide-react";
import { motion } from "framer-motion";
import Logo from "@/components/Logo";

const fadeInUp = {
  initial: { opacity: 0, y: 30 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
};

const Footer = () => {
  return (
    <footer className="bg-foreground py-16">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-4 gap-8 mb-12">
          <motion.div
            {...fadeInUp}
            transition={{ duration: 0.6 }}
            className="md:col-span-2"
          >
            <div className="mb-4">
              <Logo size="md" />
            </div>
            <p className="text-primary-foreground/60 font-body max-w-sm leading-relaxed">
              מרקטפלייס פרחים חכם. מחברים בין לקוחות לחנויות פרחים באמצעות טכנולוגיה חכמה ועיצוב DIY.
            </p>
          </motion.div>

          <motion.div
            {...fadeInUp}
            transition={{ duration: 0.6, delay: 0.15 }}
          >
            <h4 className="font-display font-semibold text-primary-foreground mb-4">קישורים</h4>
            <ul className="space-y-2 font-body">
              <li><a href="#how-it-works" className="text-primary-foreground/60 hover:text-primary-foreground transition-colors">איך זה עובד</a></li>
              <li><a href="#shops" className="text-primary-foreground/60 hover:text-primary-foreground transition-colors">חנויות</a></li>
              <li><a href="/about" className="text-primary-foreground/60 hover:text-primary-foreground transition-colors">אודות</a></li>
            </ul>
          </motion.div>

          <motion.div
            {...fadeInUp}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <h4 className="font-display font-semibold text-primary-foreground mb-4">צרו קשר</h4>
            <ul className="space-y-2 font-body text-primary-foreground/60">
              <li>nofari1993@gmail.com</li>
              <li>052-6972020</li>
              <li>תל אביב, ישראל</li>
            </ul>
          </motion.div>
        </div>

        <motion.div
          {...fadeInUp}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="border-t border-primary-foreground/10 pt-8 flex flex-col md:flex-row items-center justify-between gap-4"
        >
          <p className="text-primary-foreground/40 text-sm font-body">
            © 2026 Flori - All Rights Reserved
          </p>
          <div className="flex gap-6 text-primary-foreground/40 text-sm font-body">
            <a href="/terms" className="hover:text-primary-foreground/70 transition-colors">תנאי שימוש</a>
            <a href="#" className="hover:text-primary-foreground/70 transition-colors">מדיניות פרטיות</a>
            <a href="#" className="hover:text-primary-foreground/70 transition-colors">נגישות</a>
          </div>
        </motion.div>
      </div>
    </footer>
  );
};

export default Footer;

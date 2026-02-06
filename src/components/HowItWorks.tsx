import { motion } from "framer-motion";
import { MapPin, Palette, Sparkles, Truck } from "lucide-react";

const steps = [
  {
    icon: MapPin,
    title: "חפשו חנות",
    description: "מצאו חנויות פרחים באזור שלכם לפי מיקום, דירוג וזמינות",
    color: "bg-sage-light text-primary",
  },
  {
    icon: Palette,
    title: "בנו את הזר",
    description: "בחרו פרחים בעצמכם בסגנון DIY או בעזרת הצ׳אט החכם שלנו",
    color: "bg-secondary text-secondary-foreground",
  },
  {
    icon: Sparkles,
    title: "AI מתאים לכם",
    description: "ספרו לנו על האירוע, התקציב והסגנון - ונמליץ על הזר המושלם",
    color: "bg-accent/30 text-accent-foreground",
  },
  {
    icon: Truck,
    title: "משלוח עד הבית",
    description: "הזר יוכן בחנות הקרובה אליכם וישלח ישירות ליעד",
    color: "bg-blush/40 text-foreground",
  },
];

const HowItWorks = () => {
  return (
    <section id="how-it-works" className="py-24 bg-background">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <span className="inline-block px-4 py-1.5 rounded-full bg-sage-light text-primary text-sm font-medium mb-4">
            פשוט וקל
          </span>
          <h2 className="text-4xl md:text-5xl font-display font-bold text-foreground mb-4">
            איך זה עובד?
          </h2>
          <p className="text-lg text-muted-foreground font-body max-w-2xl mx-auto">
            ב-4 צעדים פשוטים תקבלו את הזר המושלם ישירות מחנות הפרחים הקרובה אליכם
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step, index) => (
            <motion.div
              key={step.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.15 }}
              className="relative group"
            >
              <div className="bg-card rounded-2xl p-8 shadow-soft hover:shadow-card transition-all duration-300 h-full border border-border/50 hover:border-primary/20">
                <div className="flex flex-col items-center text-center space-y-4">
                  <div className={`w-16 h-16 rounded-2xl ${step.color} flex items-center justify-center transition-transform duration-300 group-hover:scale-110`}>
                    <step.icon className="w-7 h-7" />
                  </div>
                  <span className="text-sm font-bold text-muted-foreground">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <h3 className="text-xl font-display font-bold text-foreground">
                    {step.title}
                  </h3>
                  <p className="text-muted-foreground font-body leading-relaxed">
                    {step.description}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;

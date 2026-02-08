import { motion } from "framer-motion";
import { MapPin, Palette, Truck } from "lucide-react";

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
    icon: Truck,
    title: "משלוח עד הבית",
    description: "הזר יוכן בחנות הקרובה אליכם וישלח ישירות ליעד",
    color: "bg-blush/40 text-foreground",
  },
];

const HowItWorks = () => {
  return (
    <section id="how-it-works" className="py-16 md:py-24 bg-background">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-10 md:mb-16"
        >
          <span className="inline-block px-4 py-1.5 rounded-full bg-sage-light text-primary text-sm font-medium mb-3 md:mb-4">
            פשוט וקל
          </span>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-display font-bold text-foreground mb-3 md:mb-4">
            איך זה עובד?
          </h2>
          <p className="text-base md:text-lg text-muted-foreground font-body max-w-2xl mx-auto">
            ב-3 צעדים פשוטים תקבלו את הזר המושלם ישירות מחנות הפרחים הקרובה אליכם
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-4 md:gap-8">
          {steps.map((step, index) => (
            <motion.div
              key={step.title}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.6, delay: index * 0.2, ease: "easeOut" }}
              className="relative group"
            >
              <div className="glass-card rounded-2xl p-6 md:p-8 shadow-soft hover:shadow-card transition-all duration-300 h-full hover:border-primary/20">
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

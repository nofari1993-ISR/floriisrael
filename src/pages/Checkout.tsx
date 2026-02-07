import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Send, User, MapPin, Calendar, MessageSquare } from "lucide-react";
import { format } from "date-fns";
import { he } from "date-fns/locale";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import Logo from "@/components/Logo";

const checkoutSchema = z.object({
  recipientName: z.string().trim().min(2, "שם חייב להכיל לפחות 2 תווים").max(100),
  address: z.string().trim().min(5, "כתובת חייבת להכיל לפחות 5 תווים").max(300),
  deliveryDate: z.date({ required_error: "יש לבחור תאריך משלוח" }),
  greeting: z.string().max(500, "כרטיס ברכה עד 500 תווים").optional(),
});

type CheckoutFormData = z.infer<typeof checkoutSchema>;

const Checkout = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    recipientName: "",
    address: "",
    greeting: "",
  });
  const [deliveryDate, setDeliveryDate] = useState<Date | undefined>();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const result = checkoutSchema.safeParse({
      ...formData,
      deliveryDate,
    });

    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        if (err.path[0]) {
          fieldErrors[err.path[0] as string] = err.message;
        }
      });
      setErrors(fieldErrors);
      return;
    }

    setIsSubmitting(true);
    // Simulate order submission
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setIsSubmitting(false);

    toast({
      title: "ההזמנה נשלחה בהצלחה! 🎉",
      description: `הזר ישלח ל${formData.recipientName} בתאריך ${deliveryDate ? format(deliveryDate, "dd/MM/yyyy") : ""}`,
    });

    navigate("/");
  };

  return (
    <div className="min-h-screen bg-background">
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
      <div className="container mx-auto px-4 py-10 max-w-xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-10"
        >
          <h1 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-2">
            השלמת הזמנה
          </h1>
          <p className="text-muted-foreground font-body">
            מלאו את פרטי המשלוח כדי לשלוח את הזר
          </p>
        </motion.div>

        <motion.form
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          onSubmit={handleSubmit}
          className="bg-card rounded-2xl border border-border/50 shadow-card p-6 md:p-8 space-y-6"
        >
          {/* Recipient Name */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-medium text-foreground font-body">
              <User className="w-4 h-4 text-primary/60" />
              שם המקבל/ת
            </label>
            <input
              type="text"
              value={formData.recipientName}
              onChange={(e) => setFormData((prev) => ({ ...prev, recipientName: e.target.value }))}
              placeholder="לדוגמה: נופר כהן"
              className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm font-body text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-ring transition-shadow"
            />
            {errors.recipientName && (
              <p className="text-sm text-destructive font-body">{errors.recipientName}</p>
            )}
          </div>

          {/* Address */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-medium text-foreground font-body">
              <MapPin className="w-4 h-4 text-primary/60" />
              כתובת מלאה למשלוח
            </label>
            <input
              type="text"
              value={formData.address}
              onChange={(e) => setFormData((prev) => ({ ...prev, address: e.target.value }))}
              placeholder="רחוב, מספר, עיר"
              className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm font-body text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-ring transition-shadow"
            />
            {errors.address && (
              <p className="text-sm text-destructive font-body">{errors.address}</p>
            )}
          </div>

          {/* Delivery Date */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-medium text-foreground font-body">
              <Calendar className="w-4 h-4 text-primary/60" />
              תאריך משלוח
            </label>
            <Popover>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  className={cn(
                    "w-full bg-background border border-border rounded-xl px-4 py-3 text-sm font-body text-right outline-none focus:ring-2 focus:ring-ring transition-shadow flex items-center justify-between",
                    !deliveryDate && "text-muted-foreground"
                  )}
                >
                  {deliveryDate ? format(deliveryDate, "dd/MM/yyyy") : "בחרו תאריך"}
                  <Calendar className="w-4 h-4 opacity-50" />
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <CalendarComponent
                  mode="single"
                  selected={deliveryDate}
                  onSelect={setDeliveryDate}
                  disabled={(date) => date < new Date()}
                  initialFocus
                  className={cn("p-3 pointer-events-auto")}
                />
              </PopoverContent>
            </Popover>
            {errors.deliveryDate && (
              <p className="text-sm text-destructive font-body">{errors.deliveryDate}</p>
            )}
          </div>

          {/* Greeting Card */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-medium text-foreground font-body">
              <MessageSquare className="w-4 h-4 text-primary/60" />
              כרטיס ברכה (אופציונלי)
            </label>
            <textarea
              value={formData.greeting}
              onChange={(e) => setFormData((prev) => ({ ...prev, greeting: e.target.value }))}
              placeholder="כתבו ברכה אישית שתצורף לזר..."
              rows={4}
              maxLength={500}
              className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm font-body text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-ring transition-shadow resize-none"
            />
            <p className="text-xs text-muted-foreground text-left">{formData.greeting.length}/500</p>
          </div>

          {/* Submit */}
          <Button
            type="submit"
            variant="hero"
            size="lg"
            className="w-full rounded-xl gap-2"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              "שולח הזמנה..."
            ) : (
              <>
                <Send className="w-4 h-4" />
                שליחת הזמנה
              </>
            )}
          </Button>
        </motion.form>
      </div>
    </div>
  );
};

export default Checkout;

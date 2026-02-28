import { useState, useCallback } from "react";
import { useNavigate, useSearchParams, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Send, User, MapPin, Calendar, MessageSquare, CheckCircle2, Store, Truck, Clock, ShoppingBag, CreditCard, Phone } from "lucide-react";
import { format } from "date-fns";
import { he } from "date-fns/locale";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import Logo from "@/components/Logo";
import { supabase } from "@/integrations/supabase/client";
import PayPalButton from "@/components/checkout/PayPalButton";

const DELIVERY_FEE = 30;

const TIME_SLOTS = [
  { id: "morning", label: "בוקר", hours: "08:00 - 13:00" },
  { id: "afternoon", label: "אחה״צ - ערב", hours: "13:00 - 19:00" },
] as const;

type TimeSlotId = typeof TIME_SLOTS[number]["id"];

const checkoutSchema = z.object({
  recipientName: z.string().trim().min(2, "שם חייב להכיל לפחות 2 תווים").max(100),
  recipientPhone: z.string().max(15, "מספר טלפון לא תקין").optional(),
  address: z.string().max(300).optional(),
  deliveryDate: z.date({ required_error: "יש לבחור תאריך" }),
  timeSlot: z.enum(["morning", "afternoon"], { required_error: "יש לבחור טווח שעות" }),
  greeting: z.string().max(500, "כרטיס ברכה עד 500 תווים").optional(),
  customerName: z.string().trim().min(2, "שם חייב להכיל לפחות 2 תווים").max(100),
  customerPhone: z.string().trim().min(9, "מספר טלפון לא תקין").max(15, "מספר טלפון לא תקין"),
  deliveryMethod: z.enum(["delivery", "pickup"]),
}).refine((data) => {
  if (data.deliveryMethod === "delivery") {
    return data.address && data.address.trim().length >= 5;
  }
  return true;
}, {
  message: "כתובת חייבת להכיל לפחות 5 תווים",
  path: ["address"],
}).refine((data) => {
  if (data.deliveryMethod === "delivery") {
    return data.recipientPhone && data.recipientPhone.trim().length >= 9;
  }
  return true;
}, {
  message: "מספר טלפון לא תקין",
  path: ["recipientPhone"],
});

type CheckoutFormData = z.infer<typeof checkoutSchema>;

interface OrderSuccess {
  orderId: string;
  shopPhone: string | null;
  shopName: string;
  recipientName: string;
  deliveryDate: string;
}

interface DIYItem {
  flower_name: string;
  flower_id: string;
  quantity: number;
  unit_price: number;
  color: string;
}

const Checkout = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const shopId = searchParams.get("shopId");

  // DIY data from navigation state
  const diyState = location.state as { diyItems?: DIYItem[]; totalPrice?: number; isDIY?: boolean; bouquetImageUrl?: string | null } | null;
  const isDIY = diyState?.isDIY || false;
  const diyItems = diyState?.diyItems || [];
  const diyTotalPrice = diyState?.totalPrice || 0;
  const bouquetImageUrl = diyState?.bouquetImageUrl || null;

  const [formData, setFormData] = useState({
    recipientName: "",
    recipientPhone: "",
    address: "",
    deliveryNotes: "",
    greeting: "",
    customerName: "",
    customerPhone: "",
  });
  const [deliveryMethod, setDeliveryMethod] = useState<"delivery" | "pickup">("delivery");
  const [deliveryDate, setDeliveryDate] = useState<Date | undefined>();
  const [timeSlot, setTimeSlot] = useState<TimeSlotId | undefined>();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState<OrderSuccess | null>(null);
  const [showPayment, setShowPayment] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"paypal" | "cash">("paypal");

  const calculateTotal = () => {
    const deliveryFee = deliveryMethod === "delivery" ? DELIVERY_FEE : 0;
    return isDIY ? diyTotalPrice + deliveryFee : deliveryFee;
  };

  const handleProceedToPayment = (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const result = checkoutSchema.safeParse({
      ...formData,
      deliveryDate,
      timeSlot,
      deliveryMethod,
    });

    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        if (err.path[0]) {
          fieldErrors[err.path[0] as string] = err.message;
        }
      });
      setErrors(fieldErrors);
      const firstError = result.error.errors[0]?.message || "יש למלא את כל השדות הנדרשים";
      toast({ title: "חסרים פרטים", description: firstError, variant: "destructive" });
      // Scroll to first error
      setTimeout(() => {
        const errorEl = document.querySelector(".text-destructive");
        errorEl?.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 100);
      return;
    }

    if (!shopId) {
      toast({ title: "שגיאה", description: "לא נמצא מזהה חנות", variant: "destructive" });
      return;
    }

    setShowPayment(true);
  };

  const createOrder = async (paymentRef: string) => {
    setIsSubmitting(true);

    try {
      const isPickup = deliveryMethod === "pickup";
      const deliveryFee = isPickup ? 0 : DELIVERY_FEE;
      const selectedSlot = TIME_SLOTS.find(s => s.id === timeSlot);
      const timeSlotNote = selectedSlot ? `שעות ${isPickup ? "איסוף" : "משלוח"}: ${selectedSlot.hours}` : "";
      const diyNote = isDIY ? "זר מעוצב אישית (DIY)" : "";
      const paymentNote = paymentRef === "cash" ? "תשלום: מזומן" : `PayPal: ${paymentRef}`;
      const deliveryNotesText = formData.deliveryNotes?.trim() ? `הערות לשליח: ${formData.deliveryNotes.trim()}` : "";
      const recipientPhoneNote = formData.recipientPhone?.trim() ? `טלפון מקבל/ת: ${formData.recipientPhone.trim()}` : "";
      const noteParts = [diyNote, timeSlotNote, recipientPhoneNote, deliveryNotesText, paymentNote].filter(Boolean).join(" | ");

      const deliveryDateStr = format(deliveryDate!, "yyyy-MM-dd");
      const orderPayload = {
        shop_id: shopId!,
        customer_name: formData.customerName,
        customer_phone: formData.customerPhone || null,
        recipient_name: formData.recipientName,
        delivery_address: isPickup ? "איסוף עצמי" : formData.address,
        delivery_date: deliveryDateStr,
        greeting: formData.greeting || null,
        total_price: isDIY ? diyTotalPrice + deliveryFee : deliveryFee,
        notes: noteParts || null,
        items: isDIY ? diyItems.map((item) => ({
          flower_name: item.flower_name,
          flower_id: item.flower_id || null,
          quantity: item.quantity,
          unit_price: item.unit_price,
        })) : undefined,
      };

      let orderId: string;
      let shopName = "החנות";
      let shopPhone: string | null = null;

      if (isDIY && diyItems.length > 0) {
        const { data: fnData, error: fnError } = await supabase.functions.invoke("create-order", {
          body: orderPayload,
        });

        if (fnError) throw fnError;
        if (!fnData?.success) throw new Error(fnData?.error || "שגיאה ביצירת ההזמנה");

        orderId = fnData.order_id;
        shopName = fnData.shop_name || shopName;
        shopPhone = fnData.shop_phone || null;
      } else {
        const { data: order, error: orderError } = await supabase
          .from("orders")
          .insert({
            shop_id: shopId!,
            customer_name: formData.customerName,
            customer_phone: formData.customerPhone || null,
            recipient_name: formData.recipientName,
            delivery_address: isPickup ? "איסוף עצמי" : formData.address,
            delivery_date: deliveryDateStr,
            greeting: formData.greeting || null,
            notes: noteParts || null,
            total_price: deliveryFee,
          })
          .select("id")
          .single();

        if (orderError) throw orderError;
        orderId = order.id;

        const { data: shop } = await supabase
          .from("shops")
          .select("name, phone")
          .eq("id", shopId!)
          .single();

        shopName = shop?.name || shopName;
        shopPhone = shop?.phone || null;
      }

      setOrderSuccess({
        orderId,
        shopPhone,
        shopName,
        recipientName: formData.recipientName,
        deliveryDate: format(deliveryDate!, "dd/MM/yyyy"),
      });

      toast({
        title: "ההזמנה נשלחה בהצלחה! 🎉",
        description: isPickup
          ? `הזר ל${formData.recipientName} יהיה מוכן לאיסוף בתאריך ${format(deliveryDate!, "dd/MM/yyyy")}`
          : `הזר ישלח ל${formData.recipientName} בתאריך ${format(deliveryDate!, "dd/MM/yyyy")}`,
      });
    } catch (err: any) {
      console.error("Order creation error:", err);
      toast({
        title: "שגיאה ביצירת ההזמנה",
        description: err.message || "נסו שוב מאוחר יותר",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePayPalApprove = useCallback((paypalOrderId: string, _details: any) => {
    createOrder(paypalOrderId);
  }, [formData, deliveryDate, timeSlot, deliveryMethod, shopId, isDIY, diyItems, diyTotalPrice]);

  const handleCashPayment = useCallback(() => {
    createOrder("cash");
  }, [formData, deliveryDate, timeSlot, deliveryMethod, shopId, isDIY, diyItems, diyTotalPrice]);

  const handlePayPalError = useCallback((error: any) => {
    console.error("PayPal payment error:", error);
    toast({
      title: "שגיאה בתשלום",
      description: "אירעה שגיאה בעיבוד התשלום. נסו שוב.",
      variant: "destructive",
    });
  }, []);

  const getWhatsAppUrl = () => {
    if (!orderSuccess?.shopPhone) return null;
    const phone = orderSuccess.shopPhone.replace(/[^0-9]/g, "");
    const phoneFormatted = phone.startsWith("0") ? `972${phone.slice(1)}` : phone;
    const deliveryText = deliveryMethod === "pickup" ? "תאריך איסוף" : "תאריך משלוח";
    const selectedSlot = TIME_SLOTS.find(s => s.id === timeSlot);
    const timeText = selectedSlot ? `\nשעות: ${selectedSlot.hours}` : "";
    const message = encodeURIComponent(
      `שלום! 🌸\nביצעתי הזמנת זר דרך האתר.\nשם מקבל/ת: ${orderSuccess.recipientName}\n${deliveryText}: ${orderSuccess.deliveryDate}${timeText}\n${deliveryMethod === "pickup" ? "איסוף עצמי 🏪" : ""}\nמספר הזמנה: ${orderSuccess.orderId.slice(0, 8)}`
    );
    return `https://wa.me/${phoneFormatted}?text=${message}`;
  };

  // Success screen
  if (orderSuccess) {
    const waUrl = getWhatsAppUrl();
    return (
      <div className="min-h-screen bg-background">
        <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-xl border-b border-border/50">
          <div className="container mx-auto px-4 py-3 flex items-center justify-center">
            <Logo size="sm" />
          </div>
        </div>
        <div className="container mx-auto px-4 py-16 max-w-md text-center">
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring" }}>
            <CheckCircle2 className="w-20 h-20 text-primary mx-auto mb-6" />
          </motion.div>
          <h1 className="text-2xl font-display font-bold text-foreground mb-2">ההזמנה התקבלה!</h1>
          <p className="text-muted-foreground font-body mb-2">
            {deliveryMethod === "pickup"
              ? `הזר ל${orderSuccess.recipientName} יהיה מוכן לאיסוף בתאריך ${orderSuccess.deliveryDate}`
              : `הזר ל${orderSuccess.recipientName} ישלח בתאריך ${orderSuccess.deliveryDate}`}
            {timeSlot && ` (${TIME_SLOTS.find(s => s.id === timeSlot)?.hours})`}
          </p>
          <p className="text-xs text-muted-foreground font-body mb-8">
            מספר הזמנה: {orderSuccess.orderId.slice(0, 8)}
          </p>

          <div className="space-y-3">
            {waUrl && (
              <a
                href={waUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full bg-[#25D366] hover:bg-[#20BD5A] text-white font-body font-medium py-3 px-4 rounded-xl transition-colors"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
                שלחו הודעה לחנות בוואטסאפ
              </a>
            )}
            <Button
              variant="hero-outline"
              className="w-full rounded-xl"
              onClick={() => navigate("/")}
            >
              חזרה לדף הבית
            </Button>
          </div>
        </div>
      </div>
    );
  }

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
            מלאו את הפרטים כדי להשלים את ההזמנה
          </p>
        </motion.div>

        <motion.form
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          onSubmit={handleProceedToPayment}
          className="bg-card rounded-2xl border border-border/50 shadow-card p-6 md:p-8 space-y-6"
        >
          {/* DIY Items Summary */}
          {isDIY && diyItems.length > 0 && (
            <div className="space-y-3">
              <label className="flex items-center gap-2 text-sm font-medium text-foreground font-body">
                <ShoppingBag className="w-4 h-4 text-primary/60" />
                הזר שלכם
              </label>
              {bouquetImageUrl && (
                <div className="relative rounded-xl overflow-hidden mb-2">
                  <img src={bouquetImageUrl} alt="הזר שלכם" className="w-full h-48 object-cover rounded-xl" />
                  <div className="absolute bottom-2 right-2 bg-black/60 backdrop-blur-sm text-white text-[10px] px-2 py-0.5 rounded-full">
                    ✨ נוצר ב-AI
                  </div>
                </div>
              )}
              <div className="bg-muted/30 rounded-xl p-4 space-y-2">
                {diyItems.map((item, i) => (
                  <div key={i} className="flex items-center justify-between text-sm font-body">
                    <span className="text-foreground">
                      {item.color ? `${item.color} ` : ""}{item.flower_name} × {item.quantity}
                    </span>
                    <span className="text-muted-foreground">₪{item.unit_price * item.quantity}</span>
                  </div>
                ))}
                {deliveryMethod === "delivery" && (
                  <div className="flex items-center justify-between text-sm font-body">
                    <span className="text-foreground flex items-center gap-1">
                      <Truck className="w-3.5 h-3.5" /> דמי משלוח
                    </span>
                    <span className="text-muted-foreground">₪{DELIVERY_FEE}</span>
                  </div>
                )}
                <div className="flex items-center justify-between pt-2 border-t border-border/30 font-display font-bold text-sm">
                  <span>סה״כ</span>
                  <span className="text-primary">₪{diyTotalPrice + (deliveryMethod === "delivery" ? DELIVERY_FEE : 0)}</span>
                </div>
              </div>
            </div>
          )}

          {/* Customer Name */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-medium text-foreground font-body">
              <User className="w-4 h-4 text-primary/60" />
              השם שלך (המזמין/ה)
            </label>
            <input
              type="text"
              value={formData.customerName}
              onChange={(e) => setFormData((prev) => ({ ...prev, customerName: e.target.value }))}
              placeholder="לדוגמה: ישראל ישראלי"
              className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm font-body text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-ring transition-shadow"
            />
            {errors.customerName && (
              <p className="text-sm text-destructive font-body">{errors.customerName}</p>
            )}
          </div>

          {/* Customer Phone */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-medium text-foreground font-body">
              <MessageSquare className="w-4 h-4 text-primary/60" />
              מספר טלפון
            </label>
            <input
              type="tel"
              value={formData.customerPhone}
              onChange={(e) => setFormData((prev) => ({ ...prev, customerPhone: e.target.value }))}
              placeholder="050-1234567"
              className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm font-body text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-ring transition-shadow"
              dir="ltr"
            />
            {errors.customerPhone && (
              <p className="text-sm text-destructive font-body">{errors.customerPhone}</p>
            )}
          </div>

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

          {/* Recipient Phone (only for delivery) */}
          {deliveryMethod === "delivery" && (
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium text-foreground font-body">
                <Phone className="w-4 h-4 text-primary/60" />
                טלפון מקבל/ת המשלוח
              </label>
              <input
                type="tel"
                value={formData.recipientPhone}
                onChange={(e) => setFormData((prev) => ({ ...prev, recipientPhone: e.target.value }))}
                placeholder="050-1234567"
                className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm font-body text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-ring transition-shadow"
                dir="ltr"
              />
              {errors.recipientPhone && (
                <p className="text-sm text-destructive font-body">{errors.recipientPhone}</p>
              )}
            </div>
          )}

          {/* Delivery Method Toggle */}
          <div className="space-y-3">
            <label className="flex items-center gap-2 text-sm font-medium text-foreground font-body">
              <Truck className="w-4 h-4 text-primary/60" />
              אופן קבלת הזר
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setDeliveryMethod("delivery")}
                className={cn(
                  "flex flex-col items-center gap-2 py-4 px-3 rounded-xl border-2 transition-all font-body text-sm",
                  deliveryMethod === "delivery"
                    ? "border-primary bg-primary/5 text-foreground shadow-sm"
                    : "border-border text-muted-foreground hover:border-primary/30"
                )}
              >
                <Truck className="w-5 h-5" />
                <span className="font-medium">משלוח</span>
                <span className="text-xs text-muted-foreground">עד הדלת</span>
              </button>
              <button
                type="button"
                onClick={() => setDeliveryMethod("pickup")}
                className={cn(
                  "flex flex-col items-center gap-2 py-4 px-3 rounded-xl border-2 transition-all font-body text-sm",
                  deliveryMethod === "pickup"
                    ? "border-primary bg-primary/5 text-foreground shadow-sm"
                    : "border-border text-muted-foreground hover:border-primary/30"
                )}
              >
                <Store className="w-5 h-5" />
                <span className="font-medium">איסוף עצמי</span>
                <span className="text-xs text-muted-foreground">ללא דמי משלוח</span>
              </button>
            </div>
          </div>

          {/* Address (only for delivery) */}
          {deliveryMethod === "delivery" && (
            <div className="space-y-4">
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

              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-medium text-foreground font-body">
                  <MessageSquare className="w-4 h-4 text-primary/60" />
                  הערות לשליח (אופציונלי)
                </label>
                <textarea
                  value={formData.deliveryNotes}
                  onChange={(e) => setFormData((prev) => ({ ...prev, deliveryNotes: e.target.value }))}
                  placeholder="למשל: קומה 3, דלת שמאל, לצלצל פעמיים..."
                  className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm font-body text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-ring transition-shadow resize-none min-h-[70px]"
                  maxLength={200}
                />
              </div>
            </div>
          )}

          {/* Delivery Date */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-medium text-foreground font-body">
              <Calendar className="w-4 h-4 text-primary/60" />
              {deliveryMethod === "delivery" ? "תאריך משלוח" : "תאריך איסוף"}
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

          {/* Time Slot */}
          <div className="space-y-3">
            <label className="flex items-center gap-2 text-sm font-medium text-foreground font-body">
              <Clock className="w-4 h-4 text-primary/60" />
              {deliveryMethod === "delivery" ? "טווח שעות למשלוח" : "טווח שעות לאיסוף"}
            </label>
            <div className="grid grid-cols-2 gap-3">
              {TIME_SLOTS.map((slot) => (
                <button
                  key={slot.id}
                  type="button"
                  onClick={() => setTimeSlot(slot.id)}
                  className={cn(
                    "flex flex-col items-center gap-1 py-3 px-3 rounded-xl border-2 transition-all font-body text-sm",
                    timeSlot === slot.id
                      ? "border-primary bg-primary/5 text-foreground shadow-sm"
                      : "border-border text-muted-foreground hover:border-primary/30"
                  )}
                >
                  <span className="font-medium">{slot.label}</span>
                  <span className="text-xs text-muted-foreground">{slot.hours}</span>
                </button>
              ))}
            </div>
            {errors.timeSlot && (
              <p className="text-sm text-destructive font-body">{errors.timeSlot}</p>
            )}
          </div>

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

          {/* Payment Section */}
          {showPayment ? (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm font-medium text-foreground font-body">
                <CreditCard className="w-4 h-4 text-primary/60" />
                בחרו אמצעי תשלום
              </div>

              {/* Payment method toggle */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setPaymentMethod("paypal")}
                  className={cn(
                    "flex flex-col items-center gap-2 py-3 px-3 rounded-xl border-2 transition-all font-body text-sm",
                    paymentMethod === "paypal"
                      ? "border-primary bg-primary/5 text-foreground shadow-sm"
                      : "border-border text-muted-foreground hover:border-primary/30"
                  )}
                >
                  <CreditCard className="w-5 h-5" />
                  <span className="font-medium">PayPal</span>
                  <span className="text-xs text-muted-foreground">תשלום מקוון</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod("cash")}
                  className={cn(
                    "flex flex-col items-center gap-2 py-3 px-3 rounded-xl border-2 transition-all font-body text-sm",
                    paymentMethod === "cash"
                      ? "border-primary bg-primary/5 text-foreground shadow-sm"
                      : "border-border text-muted-foreground hover:border-primary/30"
                  )}
                >
                  <span className="text-xl">💵</span>
                  <span className="font-medium">מזומן</span>
                  <span className="text-xs text-muted-foreground">תשלום בקבלה</span>
                </button>
              </div>

              {paymentMethod === "paypal" ? (
                <div className="bg-muted/20 rounded-xl p-4 border border-border/30">
                  <PayPalButton
                    amount={calculateTotal()}
                    onApprove={handlePayPalApprove}
                    onError={handlePayPalError}
                    disabled={isSubmitting}
                  />
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="bg-muted/20 rounded-xl p-4 border border-border/30 text-center">
                    <p className="text-sm font-body text-muted-foreground mb-1">סכום לתשלום במזומן</p>
                    <p className="text-2xl font-display font-bold text-primary">₪{calculateTotal()}</p>
                    <p className="text-xs text-muted-foreground mt-1">התשלום יתבצע בעת קבלת הזר</p>
                  </div>
                  <Button
                    type="button"
                    variant="hero"
                    size="lg"
                    className="w-full rounded-xl gap-2"
                    onClick={handleCashPayment}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? "שולח הזמנה..." : "✅ אישור הזמנה במזומן"}
                  </Button>
                </div>
              )}

              <Button
                type="button"
                variant="outline"
                size="sm"
                className="w-full rounded-xl"
                onClick={() => setShowPayment(false)}
              >
                <ArrowRight className="w-4 h-4 ml-1" />
                חזרה לעריכת הפרטים
              </Button>
            </div>
          ) : (
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
                  <CreditCard className="w-4 h-4" />
                  המשך לתשלום
                </>
              )}
            </Button>
          )}
        </motion.form>
      </div>
    </div>
  );
};

export default Checkout;

import { ArrowRight, Sparkles, Loader2, CheckCircle2, RefreshCw, AlertTriangle } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useEffect, useRef, useState, useCallback } from "react";
import { motion } from "framer-motion";
import Logo from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface OrderSuccess {
  orderId: string;
  shopPhone: string | null;
  shopName: string;
  recipientName: string;
  deliveryDate: string;
}

const AIChatPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const shopId = searchParams.get("shopId");
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [inventoryReady, setInventoryReady] = useState(false);
  const [loading, setLoading] = useState(!!shopId);
  const [orderSuccess, setOrderSuccess] = useState<OrderSuccess | null>(null);
  const [iframeLoaded, setIframeLoaded] = useState(false);
  const [iframeError, setIframeError] = useState(false);
  const iframeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Send inventory to Base44 iframe via postMessage
  const sendInventoryToIframe = useCallback(async () => {
    if (!shopId) {
      setLoading(false);
      return;
    }

    const { data: flowers, error } = await supabase
      .from("flowers")
      .select("name, color, quantity, price, in_stock")
      .eq("shop_id", shopId)
      .eq("in_stock", true);

    if (error) {
      console.error("Error fetching inventory:", error.message);
      setLoading(false);
      return;
    }

    const inventory = (flowers || []).map((f) => ({
      name: f.name,
      color: f.color,
      quantity: f.quantity,
      price: f.price,
    }));

    console.log(`Loaded ${inventory.length} flowers for shop ${shopId}`);
    setInventoryReady(true);
    setLoading(false);

    // Send to iframe once it's loaded
    const sendMessage = () => {
      if (iframeRef.current?.contentWindow) {
        iframeRef.current.contentWindow.postMessage(
          {
            action: "SET_INVENTORY",
            shopId,
            flowers: inventory,
          },
          "*"
        );
        console.log("Sent inventory to Base44 iframe");
      }
    };

    // Try sending now, and also on iframe load
    sendMessage();
    if (iframeRef.current) {
      iframeRef.current.addEventListener("load", sendMessage, { once: true });
    }
  }, [shopId]);

  useEffect(() => {
    sendInventoryToIframe();
  }, [sendInventoryToIframe]);

  // Save order via edge function
  const saveOrder = async (orderData: any) => {
    try {
      console.log("Saving order from Base44:", orderData);
      const { data, error } = await supabase.functions.invoke("create-order", {
        body: {
          shop_id: shopId,
          ...orderData,
        },
      });

      if (error) throw error;

      console.log("Order saved successfully:", data);

      setOrderSuccess({
        orderId: data.order_id,
        shopPhone: data.shop_phone,
        shopName: data.shop_name,
        recipientName: orderData.recipient_name || "",
        deliveryDate: orderData.delivery_date || "",
      });

      toast({
        title: "ההזמנה נשמרה בהצלחה! 🎉",
        description: `מספר הזמנה: ${data.order_id?.slice(0, 8)}`,
      });
    } catch (err: any) {
      console.error("Error saving order:", err);
      toast({
        title: "שגיאה בשמירת ההזמנה",
        description: err.message || "נסו שוב",
        variant: "destructive",
      });
    }
  };

  // Listen for messages from Base44
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const { action } = event.data || {};

      if (action === "CHECKOUT") {
        const params = new URLSearchParams();
        if (shopId) params.set("shopId", shopId);
        navigate(`/checkout?${params.toString()}`);
      }

      // Save order directly from Base44
      if (action === "SAVE_ORDER" || action === "ORDER_COMPLETE") {
        saveOrder(event.data.orderData || event.data);
      }

      // Handle "go home" from Base44
      if (action === "GO_HOME" || action === "HOME") {
        navigate("/");
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [navigate, shopId]);

  const iframeSrc = shopId
    ? `https://nupharflowersai.com/AIBouquetBuilderEmbed?shopId=${shopId}`
    : "https://nupharflowersai.com/AIBouquetBuilderEmbed";

  // Timeout to detect iframe not loading
  useEffect(() => {
    if (!loading && !orderSuccess) {
      iframeTimeoutRef.current = setTimeout(() => {
        if (!iframeLoaded) {
          setIframeError(true);
        }
      }, 12000); // 12 seconds timeout
    }
    return () => {
      if (iframeTimeoutRef.current) clearTimeout(iframeTimeoutRef.current);
    };
  }, [loading, orderSuccess, iframeLoaded]);

  const handleIframeLoad = () => {
    setIframeLoaded(true);
    setIframeError(false);
    if (iframeTimeoutRef.current) clearTimeout(iframeTimeoutRef.current);
  };

  const handleRetry = () => {
    setIframeLoaded(false);
    setIframeError(false);
    // Force iframe reload by toggling key
    if (iframeRef.current) {
      iframeRef.current.src = iframeSrc;
    }
    iframeTimeoutRef.current = setTimeout(() => {
      if (!iframeLoaded) {
        setIframeError(true);
      }
    }, 12000);
  };

  const getWhatsAppUrl = () => {
    if (!orderSuccess?.shopPhone) return null;
    const phone = orderSuccess.shopPhone.replace(/[^0-9]/g, "");
    const phoneFormatted = phone.startsWith("0") ? `972${phone.slice(1)}` : phone;
    const message = encodeURIComponent(
      `שלום! 🌸\nביצעתי הזמנת זר דרך האתר.\nשם מקבל/ת: ${orderSuccess.recipientName}\nתאריך משלוח: ${orderSuccess.deliveryDate}\nמספר הזמנה: ${orderSuccess.orderId?.slice(0, 8)}`
    );
    return `https://wa.me/${phoneFormatted}?text=${message}`;
  };

  // Success screen after order saved
  if (orderSuccess) {
    const waUrl = getWhatsAppUrl();
    return (
      <div className="h-screen flex flex-col bg-gradient-hero">
        <div className="flex-shrink-0 bg-background/80 backdrop-blur-xl border-b border-border/50">
          <div className="container mx-auto px-4 py-2 flex items-center justify-center">
            <Logo size="sm" />
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center px-4">
          <div className="max-w-md w-full text-center">
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring" }}>
              <CheckCircle2 className="w-20 h-20 text-primary mx-auto mb-6" />
            </motion.div>
            <h1 className="text-2xl font-display font-bold text-foreground mb-2">ההזמנה התקבלה!</h1>
            <p className="text-muted-foreground font-body mb-2">
              {orderSuccess.recipientName && `הזר ל${orderSuccess.recipientName} `}
              {orderSuccess.deliveryDate && `ישלח בתאריך ${orderSuccess.deliveryDate}`}
            </p>
            <p className="text-xs text-muted-foreground font-body mb-8">
              מספר הזמנה: {orderSuccess.orderId?.slice(0, 8)}
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
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gradient-hero">
      {/* Header */}
      <div className="flex-shrink-0 bg-background/80 backdrop-blur-xl border-b border-border/50">
        <div className="container mx-auto px-4 py-2 flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors font-body text-sm"
          >
            <ArrowRight className="w-4 h-4" />
            חזרה
          </button>
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" />
            <Logo size="sm" />
          </div>
        </div>
      </div>

      {/* Page content - fills remaining height */}
      <div className="flex-1 min-h-0">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <span className="mr-3 text-muted-foreground font-body">טוען מלאי חנות...</span>
          </div>
        ) : (
          <div className="relative w-full h-full">
            {/* Loading overlay - shown until iframe loads */}
            {!iframeLoaded && !iframeError && (
              <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-background">
                <Loader2 className="w-10 h-10 animate-spin text-primary mb-4" />
                <p className="text-muted-foreground font-body">טוען את בונה הזרים...</p>
              </div>
            )}

            {/* Error fallback */}
            {iframeError && (
              <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-background px-6">
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-center max-w-md"
                >
                  <AlertTriangle className="w-16 h-16 text-primary/60 mx-auto mb-4" />
                  <h2 className="text-xl font-display font-bold text-foreground mb-2">
                    בונה הזרים לא זמין כרגע
                  </h2>
                  <p className="text-muted-foreground font-body mb-6">
                    נראה שיש בעיה בטעינת בונה הזרים החיצוני. נסו שוב או חזרו מאוחר יותר.
                  </p>
                  <div className="flex gap-3 justify-center">
                    <Button variant="hero" className="rounded-xl gap-2" onClick={handleRetry}>
                      <RefreshCw className="w-4 h-4" />
                      נסו שוב
                    </Button>
                    <Button variant="hero-outline" className="rounded-xl" onClick={() => navigate(-1)}>
                      חזרה
                    </Button>
                  </div>
                </motion.div>
              </div>
            )}

            <iframe
              ref={iframeRef}
              src={iframeSrc}
              title="AI Bouquet Builder Chat"
              onLoad={handleIframeLoad}
              style={{
                width: "100%",
                height: "100%",
                border: "none",
                display: "block",
              }}
              allow="clipboard-write"
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default AIChatPage;

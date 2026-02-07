import { ArrowRight, Sparkles, Loader2 } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useEffect, useRef, useState, useCallback } from "react";
import Logo from "@/components/Logo";
import { supabase } from "@/integrations/supabase/client";

const AIChatPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const shopId = searchParams.get("shopId");
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [inventoryReady, setInventoryReady] = useState(false);
  const [loading, setLoading] = useState(!!shopId);

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

  // Listen for messages from Base44
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.action === "CHECKOUT") {
        const params = new URLSearchParams();
        if (shopId) params.set("shopId", shopId);
        navigate(`/checkout?${params.toString()}`);
      }
      // Handle "go home" from Base44
      if (event.data?.action === "GO_HOME" || event.data?.action === "HOME") {
        navigate("/");
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [navigate, shopId]);

  const iframeSrc = shopId
    ? `https://nupharflowersai.com/AIBouquetBuilderEmbed?shopId=${shopId}`
    : "https://nupharflowersai.com/AIBouquetBuilderEmbed";

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
          <iframe
            ref={iframeRef}
            src={iframeSrc}
            title="AI Bouquet Builder Chat"
            style={{
              width: "100%",
              height: "100%",
              border: "none",
              display: "block",
            }}
            allow="clipboard-write"
          />
        )}
      </div>
    </div>
  );
};

export default AIChatPage;

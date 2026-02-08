import { useEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";

const PAYPAL_CLIENT_ID = "AYdTJKHvNqAjIfN8N8SAjqCuzxUl85_F26eHMO7C-hEStW2a9c7H1s7Lo0vmv4zplZ_AhU3wAqjc2eDG";

interface PayPalButtonProps {
  amount: number;
  currency?: string;
  onApprove: (orderId: string, details: any) => void;
  onError: (error: any) => void;
  disabled?: boolean;
}

declare global {
  interface Window {
    paypal?: any;
  }
}

const PayPalButton = ({ amount, currency = "ILS", onApprove, onError, disabled }: PayPalButtonProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [sdkReady, setSdkReady] = useState(false);
  const [loading, setLoading] = useState(true);
  const renderedRef = useRef(false);

  // Load PayPal SDK
  useEffect(() => {
    if (window.paypal) {
      setSdkReady(true);
      setLoading(false);
      return;
    }

    const existingScript = document.querySelector(`script[src*="paypal.com/sdk/js"]`);
    if (existingScript) {
      existingScript.addEventListener("load", () => {
        setSdkReady(true);
        setLoading(false);
      });
      return;
    }

    const script = document.createElement("script");
    script.src = `https://www.paypal.com/sdk/js?client-id=${PAYPAL_CLIENT_ID}&currency=${currency}`;
    script.async = true;
    script.onload = () => {
      setSdkReady(true);
      setLoading(false);
    };
    script.onerror = () => {
      setLoading(false);
      onError(new Error("Failed to load PayPal SDK"));
    };
    document.body.appendChild(script);
  }, [currency, onError]);

  // Render PayPal buttons
  useEffect(() => {
    if (!sdkReady || !window.paypal || !containerRef.current || disabled || renderedRef.current) return;

    renderedRef.current = true;

    window.paypal.Buttons({
      style: {
        layout: "vertical",
        color: "gold",
        shape: "pill",
        label: "pay",
        height: 48,
      },
      createOrder: (_data: any, actions: any) => {
        return actions.order.create({
          purchase_units: [
            {
              amount: {
                value: amount.toFixed(2),
                currency_code: currency,
              },
              description: "הזמנת זר פרחים - Bloom",
            },
          ],
        });
      },
      onApprove: async (data: any, actions: any) => {
        try {
          const details = await actions.order.capture();
          onApprove(data.orderID, details);
        } catch (err) {
          onError(err);
        }
      },
      onError: (err: any) => {
        console.error("PayPal error:", err);
        onError(err);
      },
    }).render(containerRef.current);
  }, [sdkReady, amount, currency, onApprove, onError, disabled]);

  // Reset rendered ref when amount changes to allow re-render
  useEffect(() => {
    if (renderedRef.current && containerRef.current) {
      containerRef.current.innerHTML = "";
      renderedRef.current = false;
    }
  }, [amount]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-6 gap-2 text-muted-foreground font-body text-sm">
        <Loader2 className="w-4 h-4 animate-spin" />
        טוען אמצעי תשלום...
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div ref={containerRef} className={disabled ? "opacity-50 pointer-events-none" : ""} />
      <p className="text-[11px] text-muted-foreground text-center font-body">
        🔒 התשלום מאובטח דרך PayPal (Sandbox)
      </p>
    </div>
  );
};

export default PayPalButton;

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface Order {
  id: string;
  shop_id: string;
  customer_name: string;
  customer_email: string | null;
  customer_phone: string | null;
  recipient_name: string;
  delivery_address: string;
  delivery_date: string;
  greeting: string | null;
  status: string;
  notes: string | null;
  total_price: number;
  created_at: string | null;
  updated_at: string | null;
}

export const ORDER_STATUSES = [
  { value: "ממתינה", label: "ממתינה", color: "bg-muted text-muted-foreground" },
  { value: "בהכנה", label: "בהכנה", color: "bg-secondary text-secondary-foreground" },
  { value: "מוכנה למשלוח", label: "מוכנה למשלוח", color: "bg-accent text-accent-foreground" },
  { value: "נשלחה", label: "נשלחה", color: "bg-primary/20 text-primary" },
  { value: "נמסרה", label: "נמסרה", color: "bg-sage-light text-sage" },
  { value: "בוטלה", label: "בוטלה", color: "bg-destructive/10 text-destructive" },
];

export const useOrders = (shopId: string | undefined) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchOrders = useCallback(async () => {
    if (!shopId) return;
    setLoading(true);

    const { data, error } = await supabase
      .from("orders")
      .select("*")
      .eq("shop_id", shopId)
      .order("created_at", { ascending: false });

    if (error) {
      toast({ title: "שגיאה בטעינת הזמנות", description: error.message, variant: "destructive" });
    } else {
      setOrders(
        (data || []).map((o) => ({
          id: o.id,
          shop_id: o.shop_id,
          customer_name: o.customer_name,
          customer_email: o.customer_email,
          customer_phone: o.customer_phone,
          recipient_name: o.recipient_name,
          delivery_address: o.delivery_address,
          delivery_date: o.delivery_date,
          greeting: o.greeting,
          status: o.status,
          notes: o.notes,
          total_price: Number(o.total_price) || 0,
          created_at: o.created_at,
          updated_at: o.updated_at,
        }))
      );
    }
    setLoading(false);
  }, [shopId, toast]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const updateOrderStatus = async (orderId: string, status: string) => {
    const { error } = await supabase
      .from("orders")
      .update({ status })
      .eq("id", orderId);

    if (error) {
      toast({ title: "שגיאה בעדכון סטטוס", description: error.message, variant: "destructive" });
      return false;
    }

    toast({ title: `סטטוס עודכן ל-${status}` });
    await fetchOrders();
    return true;
  };

  const updateOrderNotes = async (orderId: string, notes: string) => {
    const { error } = await supabase
      .from("orders")
      .update({ notes })
      .eq("id", orderId);

    if (error) {
      toast({ title: "שגיאה בעדכון הערות", description: error.message, variant: "destructive" });
      return false;
    }

    toast({ title: "הערות עודכנו" });
    await fetchOrders();
    return true;
  };

  return { orders, loading, updateOrderStatus, updateOrderNotes, refetch: fetchOrders };
};

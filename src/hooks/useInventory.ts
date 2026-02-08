import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface Flower {
  id: string;
  shop_id: string;
  name: string;
  color: string | null;
  price: number;
  quantity: number;
  image: string | null;
  in_stock: boolean;
  created_at: string | null;
  shelf_life_days: number;
  last_restocked_at: string | null;
}

export const useInventory = (shopId: string | undefined) => {
  const [flowers, setFlowers] = useState<Flower[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchFlowers = useCallback(async () => {
    if (!shopId) return;
    setLoading(true);

    const { data, error } = await supabase
      .from("flowers")
      .select("*")
      .eq("shop_id", shopId)
      .order("name", { ascending: true })
      .order("color", { ascending: true });

    if (error) {
      toast({ title: "שגיאה בטעינת מלאי", description: error.message, variant: "destructive" });
    } else {
      setFlowers(
        (data || []).map((f: any) => ({
          id: f.id,
          shop_id: f.shop_id,
          name: f.name,
          color: f.color,
          price: Number(f.price) || 0,
          quantity: f.quantity ?? 0,
          image: f.image,
          in_stock: f.in_stock ?? true,
          created_at: f.created_at,
          shelf_life_days: f.shelf_life_days ?? 7,
          last_restocked_at: f.last_restocked_at,
        }))
      );
    }
    setLoading(false);
  }, [shopId, toast]);

  useEffect(() => {
    fetchFlowers();
  }, [fetchFlowers]);

  const addFlower = async (flowerData: {
    name: string;
    color?: string;
    price: number;
    quantity: number;
    image?: string;
    shelf_life_days?: number;
  }) => {
    if (!shopId) return false;

    const { error } = await supabase.from("flowers").insert({
      shop_id: shopId,
      name: flowerData.name,
      color: flowerData.color || null,
      price: flowerData.price,
      quantity: flowerData.quantity,
      image: flowerData.image || null,
      in_stock: flowerData.quantity > 0,
      shelf_life_days: flowerData.shelf_life_days ?? 7,
      last_restocked_at: new Date().toISOString(),
    });

    if (error) {
      toast({ title: "שגיאה בהוספת פרח", description: error.message, variant: "destructive" });
      return false;
    }

    toast({ title: "פרח נוסף בהצלחה! 🌸" });
    await fetchFlowers();
    return true;
  };

  const updateFlower = async (id: string, updates: Partial<Flower>) => {
    const updatePayload: any = {
      ...updates,
      in_stock: (updates.quantity ?? 0) > 0,
    };
    // If quantity increased, reset the restock date
    if (updates.quantity !== undefined) {
      updatePayload.last_restocked_at = new Date().toISOString();
    }
    const { error } = await supabase
      .from("flowers")
      .update(updatePayload)
      .eq("id", id);

    if (error) {
      toast({ title: "שגיאה בעדכון פרח", description: error.message, variant: "destructive" });
      return false;
    }

    toast({ title: "פרח עודכן" });
    await fetchFlowers();
    return true;
  };

  const removeFlower = async (id: string) => {
    const { error } = await supabase.from("flowers").delete().eq("id", id);

    if (error) {
      toast({ title: "שגיאה במחיקת פרח", description: error.message, variant: "destructive" });
      return false;
    }

    toast({ title: "פרח הוסר" });
    await fetchFlowers();
    return true;
  };

  return { flowers, loading, addFlower, updateFlower, removeFlower, refetch: fetchFlowers };
};

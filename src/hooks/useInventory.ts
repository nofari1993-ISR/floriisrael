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
  is_available: boolean;
  is_boosted: boolean;
  created_at: string | null;
  shelf_life_days: number;
  last_restocked_at: string | null;
  boosted: boolean;
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
          is_available: f.is_available ?? true,
          is_boosted: f.is_boosted ?? false,
          created_at: f.created_at,
          shelf_life_days: f.shelf_life_days ?? 7,
          last_restocked_at: f.last_restocked_at,
          boosted: f.boosted ?? false,
        }))
      );
    }
    setLoading(false);
  }, [shopId, toast]);

  useEffect(() => {
    fetchFlowers();
  }, [fetchFlowers]);

  // ── Realtime: refresh card automatically when image is generated ──
  useEffect(() => {
    if (!shopId) return;
    const channel = supabase
      .channel(`flowers-realtime-${shopId}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "flowers", filter: `shop_id=eq.${shopId}` },
        () => { fetchFlowers(); }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [shopId, fetchFlowers]);

  // ── Generate flower image via edge function (fire-and-forget) ──
  const generateFlowerImage = async (flowerId: string, name: string, color?: string) => {
    try {
      const { error } = await supabase.functions.invoke("generate-flower-image", {
        body: { flowerId, name, color },
      });
      if (error) console.error("[generateFlowerImage] error:", error);
    } catch (e) {
      console.error("[generateFlowerImage] error:", e);
    }
  };

  const addFlower = async (flowerData: {
    name: string;
    color?: string;
    price: number;
    quantity: number;
    image?: string;
    shelf_life_days?: number;
  }) => {
    if (!shopId) return false;

    const { data, error } = await supabase
      .from("flowers")
      .insert({
        shop_id: shopId,
        name: flowerData.name,
        color: flowerData.color || null,
        price: flowerData.price,
        quantity: flowerData.quantity,
        image: flowerData.image || null,
        in_stock: true,
        is_available: true,
        is_boosted: false,
        shelf_life_days: flowerData.shelf_life_days ?? 7,
        last_restocked_at: new Date().toISOString(),
      })
      .select("id")
      .single();

    if (error) {
      toast({ title: "שגיאה בהוספת פרח", description: error.message, variant: "destructive" });
      return false;
    }

    toast({ title: "פרח נוסף! 🌸 מייצר תמונה..." });
    await fetchFlowers();

    // Generate image in background — Realtime will update the card when done
    if (data?.id) {
      generateFlowerImage(data.id, flowerData.name, flowerData.color);
    }

    return true;
  };

  const updateFlower = async (id: string, updates: Partial<Flower>) => {
    const updatePayload: any = { ...updates };
    // Only update in_stock and restock date when quantity is explicitly provided
    if (updates.quantity !== undefined) {
      updatePayload.in_stock = updates.quantity > 0;
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

  // Toggle is_available (binary on/off). Turning off also removes boost.
  const toggleAvailability = async (flower: Flower) => {
    const newAvailable = !flower.is_available;
    const updatePayload: any = { is_available: newAvailable };
    if (!newAvailable) {
      updatePayload.is_boosted = false;
      updatePayload.boosted = false;
      updatePayload.boosted_at = null;
    }
    const { error } = await supabase.from("flowers").update(updatePayload).eq("id", flower.id);
    if (error) {
      toast({ title: "שגיאה בעדכון זמינות", description: error.message, variant: "destructive" });
      return false;
    }
    await fetchFlowers();
    return true;
  };

  // Toggle is_boosted — only allowed when flower is available
  const toggleBoost = async (flower: Flower) => {
    if (!flower.is_available) return false;
    const newBoosted = !flower.is_boosted;
    const updatePayload: any = {
      is_boosted: newBoosted,
      boosted: newBoosted,
      boosted_at: newBoosted ? new Date().toISOString() : null,
    };
    const { error } = await supabase.from("flowers").update(updatePayload).eq("id", flower.id);
    if (error) {
      toast({ title: "שגיאה בעדכון קידום", description: error.message, variant: "destructive" });
      return false;
    }
    toast({
      title: newBoosted ? `✨ ${flower.name} מקודם! ה-AI יתעדף אותו` : `${flower.name} הוסר מקידום`,
    });
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

  return { flowers, loading, addFlower, updateFlower, toggleAvailability, toggleBoost, removeFlower, refetch: fetchFlowers };
};

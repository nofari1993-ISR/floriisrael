import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface Shop {
  id: string;
  name: string;
  location: string;
  rating: number;
  reviews: number;
  speciality: string;
  image: string;
  hours: string;
  tags: string[];
}

export const useShops = (searchQuery?: string) => {
  const [shops, setShops] = useState<Shop[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchShops = async () => {
    setLoading(true);
    let query = supabase.from("shops").select("*").order("created_at", { ascending: false });

    const { data, error } = await query;
    if (error) {
      toast({ title: "שגיאה בטעינת חנויות", description: error.message, variant: "destructive" });
    } else {
      setShops(
        (data || []).map((s) => ({
          id: s.id,
          name: s.name,
          location: s.location,
          rating: Number(s.rating) || 5,
          reviews: s.reviews || 0,
          speciality: s.speciality || "כללי",
          image: s.image || "🌼",
          hours: s.hours || "09:00 - 18:00",
          tags: s.tags || [],
        }))
      );
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchShops();
  }, []);

  const filteredShops = searchQuery
    ? shops.filter(
        (shop) =>
          shop.name.includes(searchQuery) ||
          shop.location.includes(searchQuery) ||
          shop.speciality.includes(searchQuery)
      )
    : shops;

  const addShop = async (shopData: {
    name: string;
    location: string;
    speciality?: string;
    hours?: string;
    tags?: string[];
  }) => {
    const { error } = await supabase.from("shops").insert({
      name: shopData.name,
      location: shopData.location,
      speciality: shopData.speciality || "כללי",
      hours: shopData.hours || "09:00 - 18:00",
      tags: shopData.tags || [],
    });

    if (error) {
      toast({ title: "שגיאה בהוספת חנות", description: error.message, variant: "destructive" });
      return false;
    }

    toast({ title: "חנות נוספה בהצלחה! 🎉" });
    await fetchShops();
    return true;
  };

  const removeShop = async (id: string) => {
    const { error } = await supabase.from("shops").delete().eq("id", id);

    if (error) {
      toast({ title: "שגיאה במחיקת חנות", description: error.message, variant: "destructive" });
      return false;
    }

    toast({ title: "חנות הוסרה" });
    await fetchShops();
    return true;
  };

  return { shops: filteredShops, loading, addShop, removeShop, refetch: fetchShops };
};

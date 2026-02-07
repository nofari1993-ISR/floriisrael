import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export interface OwnedShop {
  id: string;
  name: string;
  location: string;
  speciality: string | null;
  hours: string | null;
}

export const useShopOwner = () => {
  const { user, isAdmin } = useAuth();
  const [shops, setShops] = useState<OwnedShop[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setShops([]);
      setLoading(false);
      return;
    }

    const fetchOwnedShops = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("shops")
        .select("id, name, location, speciality, hours")
        .eq("owner_id", user.id);

      if (!error && data) {
        setShops(data);
      } else {
        setShops([]);
      }
      setLoading(false);
    };

    fetchOwnedShops();
  }, [user]);

  const isShopOwner = shops.length > 0;

  return { shops, isShopOwner, isAdmin, loading, user };
};

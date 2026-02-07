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
  const { user, isAdmin, loading: authLoading } = useAuth();
  const [shops, setShops] = useState<OwnedShop[]>([]);
  const [shopsLoading, setShopsLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      setShops([]);
      setShopsLoading(false);
      return;
    }

    const fetchOwnedShops = async () => {
      setShopsLoading(true);
      const { data, error } = await supabase
        .from("shops")
        .select("id, name, location, speciality, hours")
        .eq("owner_id", user.id);

      if (!error && data) {
        setShops(data);
      } else {
        setShops([]);
      }
      setShopsLoading(false);
    };

    fetchOwnedShops();
  }, [user, authLoading]);

  const isShopOwner = shops.length > 0;
  const loading = authLoading || shopsLoading;

  return { shops, isShopOwner, isAdmin, loading, user };
};

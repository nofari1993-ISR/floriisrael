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

      let query = supabase
        .from("shops")
        .select("id, name, location, speciality, hours");

      // Admins see all shops; shop owners see only their own
      if (!isAdmin) {
        query = query.eq("owner_id", user.id);
      }

      const { data, error } = await query.order("name");

      if (!error && data) {
        setShops(data);
      } else {
        setShops([]);
      }
      setShopsLoading(false);
    };

    fetchOwnedShops();
  }, [user, authLoading, isAdmin]);

  const isShopOwner = shops.length > 0;
  const loading = authLoading || shopsLoading;

  return { shops, isShopOwner, isAdmin, loading, user };
};

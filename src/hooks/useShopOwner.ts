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
  const [shop, setShop] = useState<OwnedShop | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setShop(null);
      setLoading(false);
      return;
    }

    const fetchOwnedShop = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("shops")
        .select("id, name, location, speciality, hours")
        .eq("owner_id", user.id)
        .maybeSingle();

      if (!error && data) {
        setShop(data);
      } else {
        setShop(null);
      }
      setLoading(false);
    };

    fetchOwnedShop();
  }, [user]);

  const isShopOwner = !!shop;

  return { shop, isShopOwner, isAdmin, loading, user };
};

import { useState, useEffect, useCallback } from "react";
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
  latitude: number | null;
  longitude: number | null;
  distance?: number; // km
}

/** Calculate distance between two lat/lng points using Haversine formula */
function haversineDistance(
  lat1: number, lon1: number,
  lat2: number, lon2: number
): number {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export const useShops = (searchQuery?: string) => {
  const [shops, setShops] = useState<Shop[]>([]);
  const [loading, setLoading] = useState(true);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchShops = useCallback(async () => {
    setLoading(true);
    const query = supabase.from("shops").select("*").order("created_at", { ascending: false });

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
          latitude: s.latitude ?? null,
          longitude: s.longitude ?? null,
        }))
      );
    }
    setLoading(false);
  }, [toast]);

  useEffect(() => {
    fetchShops();
  }, [fetchShops]);

  /** Request user's location from browser */
  const requestLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setLocationError("הדפדפן שלך לא תומך באיתור מיקום");
      return;
    }

    setLocationLoading(true);
    setLocationError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
        setLocationLoading(false);
      },
      (err) => {
        console.error("Geolocation error:", err);
        setLocationError(
          err.code === 1
            ? "נדרשת הרשאת מיקום כדי למצוא חנויות קרובות"
            : "לא הצלחנו לזהות את המיקום שלך"
        );
        setLocationLoading(false);
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 }
    );
  }, []);

  // Compute distances and sort
  const shopsWithDistance: Shop[] = shops.map((shop) => {
    if (userLocation && shop.latitude && shop.longitude) {
      const dist = haversineDistance(
        userLocation.lat, userLocation.lng,
        shop.latitude, shop.longitude
      );
      return { ...shop, distance: Math.round(dist * 10) / 10 };
    }
    return shop;
  });

  // Sort: if user location is available, sort by distance; otherwise keep original order
  const sortedShops = userLocation
    ? [...shopsWithDistance].sort((a, b) => (a.distance ?? Infinity) - (b.distance ?? Infinity))
    : shopsWithDistance;

  const filteredShops = searchQuery
    ? sortedShops.filter(
        (shop) =>
          shop.name.includes(searchQuery) ||
          shop.location.includes(searchQuery) ||
          shop.speciality.includes(searchQuery)
      )
    : sortedShops;

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

    // Geocode the new shop in the background
    supabase.functions.invoke("geocode-shops", {
      body: { action: "geocode-one", address: shopData.location },
    }).catch(() => {});

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

  return {
    shops: filteredShops,
    loading,
    addShop,
    removeShop,
    refetch: fetchShops,
    userLocation,
    locationLoading,
    locationError,
    requestLocation,
  };
};

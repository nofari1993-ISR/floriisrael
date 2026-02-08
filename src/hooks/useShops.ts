import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

/** Default flower catalog seeded into every new shop */
const DEFAULT_FLOWERS = [
  // ורדים
  { name: "ורד", color: "אדום", price: 12, image: "/flowers/roses.png?v=2" },
  { name: "ורד", color: "ורוד", price: 12, image: "/flowers/roses.png?v=2" },
  { name: "ורד", color: "לבן", price: 12, image: "/flowers/roses.png?v=2" },
  { name: "ורד", color: "צהוב", price: 12, image: "/flowers/roses.png?v=2" },
  { name: "ורד", color: "כתום", price: 12, image: "/flowers/roses.png?v=2" },
  { name: "ורד", color: "סגול", price: 12, image: "/flowers/roses.png?v=2" },
  // טוליפים
  { name: "טוליפ", color: "ורוד", price: 9, image: "/flowers/tulips.png" },
  { name: "טוליפ", color: "אדום", price: 9, image: "/flowers/tulips.png" },
  { name: "טוליפ", color: "לבן", price: 9, image: "/flowers/tulips.png" },
  { name: "טוליפ", color: "צהוב", price: 9, image: "/flowers/tulips.png" },
  { name: "טוליפ", color: "סגול", price: 9, image: "/flowers/tulips.png" },
  // גרברות
  { name: "גרברה", color: "ורוד", price: 8, image: "/flowers/gerbera.png" },
  { name: "גרברה", color: "כתום", price: 8, image: "/flowers/gerbera.png" },
  { name: "גרברה", color: "צהוב", price: 8, image: "/flowers/gerbera.png" },
  { name: "גרברה", color: "אדום", price: 8, image: "/flowers/gerbera.png" },
  { name: "גרברה", color: "לבן", price: 8, image: "/flowers/gerbera.png" },
  // כלניות
  { name: "כלנית", color: "אדום", price: 8, image: "/flowers/anemones.png" },
  { name: "כלנית", color: "סגול", price: 8, image: "/flowers/anemones.png" },
  { name: "כלנית", color: "לבן", price: 8, image: "/flowers/anemones.png" },
  // חמנייה
  { name: "חמנייה", color: "צהוב", price: 10, image: "/flowers/sunflower.png" },
  // ליזיאנטוס
  { name: "ליזיאנטוס", color: "לבן", price: 10, image: "/flowers/lisianthus.png" },
  { name: "ליזיאנטוס", color: "סגול", price: 10, image: "/flowers/lisianthus.png" },
  { name: "ליזיאנטוס", color: "ורוד", price: 10, image: "/flowers/lisianthus.png" },
  // לילי
  { name: "לילי", color: "לבן", price: 15, image: "/flowers/lily.png" },
  { name: "לילי", color: "ורוד", price: 15, image: "/flowers/lily.png" },
  // פיוני
  { name: "פיוני", color: "ורוד", price: 18, image: "/flowers/peonies.png" },
  { name: "פיוני", color: "לבן", price: 18, image: "/flowers/peonies.png" },
  // לבנדר
  { name: "לבנדר", color: "סגול", price: 7, image: "/flowers/lavender.png" },
  // גיבסנית
  { name: "גיבסנית", color: "לבן", price: 6, image: "/flowers/babys-breath.png" },
  { name: "גיבסנית", color: "ורוד", price: 6, image: "/flowers/babys-breath.png" },
  // ציפורן
  { name: "ציפורן", color: "אדום", price: 7, image: "/flowers/carnation.png" },
  { name: "ציפורן", color: "ורוד", price: 7, image: "/flowers/carnation.png" },
  { name: "ציפורן", color: "לבן", price: 7, image: "/flowers/carnation.png" },
  // פרזיה
  { name: "פרזיה", color: "צהוב", price: 9, image: "/flowers/freesia.png" },
  { name: "פרזיה", color: "לבן", price: 9, image: "/flowers/freesia.png" },
  { name: "פרזיה", color: "סגול", price: 9, image: "/flowers/freesia.png" },
  // סחלב
  { name: "סחלב", color: "לבן", price: 20, image: "/flowers/orchid.png" },
  { name: "סחלב", color: "ורוד", price: 20, image: "/flowers/orchid.png" },
  { name: "סחלב", color: "סגול", price: 20, image: "/flowers/orchid.png" },
  // ירק - עלים
  { name: "אקליפטוס", color: "ירוק", price: 5, image: "/flowers/eucalyptus.png" },
  { name: "רוסקוס", color: "ירוק", price: 5, image: "/flowers/ruscus.png" },
  { name: "שרך", color: "ירוק", price: 4, image: "/flowers/fern.png" },
];

const SHOP_PLACEHOLDER_IMAGES = [
  "/shop-images/flowers-pink.jpg",
  "/shop-images/flowers-sunny.jpg",
  "/shop-images/flowers-purple.jpg",
];

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
        (data || []).map((s: any) => ({
          id: s.id,
          name: s.name,
          location: s.location,
          rating: Number(s.rating) || 5,
          reviews: s.reviews || 0,
          speciality: s.speciality || "כללי",
          image: s.image || "🌼",
          hours: s.hours || "09:00 - 18:00",
          tags: s.tags || [],
          latitude: s.latitude != null ? Number(s.latitude) : null,
          longitude: s.longitude != null ? Number(s.longitude) : null,
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
    owner_id?: string;
  }) => {
    const { data: newShop, error } = await supabase.from("shops").insert({
      name: shopData.name,
      location: shopData.location,
      speciality: shopData.speciality || "כללי",
      hours: shopData.hours || "09:00 - 18:00",
      tags: shopData.tags || [],
      owner_id: shopData.owner_id || null,
      image: SHOP_PLACEHOLDER_IMAGES[Math.floor(Math.random() * SHOP_PLACEHOLDER_IMAGES.length)],
    }).select("id").single();

    if (error) {
      toast({ title: "שגיאה בהוספת חנות", description: error.message, variant: "destructive" });
      return false;
    }

    // Seed default flower inventory for the new shop
    const defaultInventory = DEFAULT_FLOWERS.map((f) => ({
      shop_id: newShop.id,
      name: f.name,
      color: f.color,
      price: f.price,
      image: f.image,
      quantity: 50,
      in_stock: true,
      shelf_life_days: 7,
    }));

    const { error: flowerError } = await supabase.from("flowers").insert(defaultInventory);
    if (flowerError) {
      console.error("Error seeding flowers:", flowerError.message);
    }

    toast({ title: "חנות נוספה בהצלחה! 🎉", description: "מלאי ברירת מחדל נוסף אוטומטית" });

    // Geocode the new shop in the background
    supabase.functions.invoke("geocode-shops", {
      body: { action: "geocode-one", address: shopData.location },
    }).catch(() => {});

    await fetchShops();
    return true;
  };

  const removeShop = async (id: string) => {
    // Delete related order_items via orders
    const { data: orders } = await supabase.from("orders").select("id").eq("shop_id", id);
    if (orders && orders.length > 0) {
      const orderIds = orders.map((o) => o.id);
      await supabase.from("order_items").delete().in("order_id", orderIds);
      await supabase.from("orders").delete().eq("shop_id", id);
    }

    // Delete related flowers
    await supabase.from("flowers").delete().eq("shop_id", id);

    // Delete the shop
    const { error } = await supabase.from("shops").delete().eq("id", id);

    if (error) {
      toast({ title: "שגיאה במחיקת חנות", description: error.message, variant: "destructive" });
      return false;
    }

    toast({ title: "החנות וכל הנתונים שלה נמחקו בהצלחה 🗑️" });
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

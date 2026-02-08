import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error("Missing Supabase credentials");
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const body = await req.json();
    const { action, shopId, address } = body;

    console.log(`[geocode-shops] action=${action}`);

    // Common Hebrew city names to English for better geocoding
    const cityMap: Record<string, string> = {
      "תל אביב": "Tel Aviv",
      "ירושלים": "Jerusalem",
      "חיפה": "Haifa",
      "הרצליה": "Herzliya",
      "רמת גן": "Ramat Gan",
      "פתח תקווה": "Petah Tikva",
      "ראשון לציון": "Rishon LeZion",
      "נתניה": "Netanya",
      "באר שבע": "Beer Sheva",
      "אשדוד": "Ashdod",
      "רחובות": "Rehovot",
      "כפר סבא": "Kfar Saba",
      "רעננה": "Raanana",
      "הוד השרון": "Hod HaSharon",
      "בת ים": "Bat Yam",
      "גבעתיים": "Givatayim",
      "מודיעין": "Modiin",
      "אילת": "Eilat",
      "עפולה": "Afula",
      "טבריה": "Tiberias",
      "נצרת": "Nazareth",
    };

    async function geocodeAddress(addr: string): Promise<{ lat: number; lon: number } | null> {
      try {
        // Translate Hebrew city names to English for Nominatim
        let translatedAddr = addr;
        for (const [heb, eng] of Object.entries(cityMap)) {
          if (addr.includes(heb)) {
            translatedAddr = addr.replace(heb, eng);
            break;
          }
        }

        const encoded = encodeURIComponent(translatedAddr + ", Israel");
        const url = `https://nominatim.openstreetmap.org/search?q=${encoded}&format=json&limit=1&countrycodes=il`;
        
        console.log(`[geocode-shops] Geocoding: "${addr}" -> "${translatedAddr}"`);
        
        const resp = await fetch(url, {
          headers: { "User-Agent": "NupharFlowersAI/1.0" },
        });

        if (!resp.ok) {
          console.error(`Nominatim error: ${resp.status}`);
          return null;
        }

        const results = await resp.json();
        if (results && results.length > 0) {
          const lat = parseFloat(results[0].lat);
          const lon = parseFloat(results[0].lon);
          console.log(`[geocode-shops] Found: ${lat}, ${lon}`);
          return { lat, lon };
        }

        console.warn(`[geocode-shops] No results for "${translatedAddr}"`);
        return null;
      } catch (err) {
        console.error(`[geocode-shops] Geocode error for "${addr}":`, err);
        return null;
      }
    }

    if (action === "geocode-all") {
      // Geocode all shops that don't have coordinates yet
      const { data: shops, error } = await supabase
        .from("shops")
        .select("id, location, latitude, longitude")
        .is("latitude", null);

      if (error) throw error;

      console.log(`[geocode-shops] Found ${shops?.length || 0} shops without coordinates`);

      let updated = 0;
      for (const shop of (shops || [])) {
        const coords = await geocodeAddress(shop.location);
        if (coords) {
          const { error: updateError } = await supabase
            .from("shops")
            .update({ latitude: coords.lat, longitude: coords.lon })
            .eq("id", shop.id);

          if (updateError) {
            console.error(`Failed to update shop ${shop.id}:`, updateError.message);
          } else {
            updated++;
          }
        }
        // Respect Nominatim rate limit: max 1 request per second
        await new Promise((r) => setTimeout(r, 1100));
      }

      return new Response(
        JSON.stringify({ success: true, total: shops?.length || 0, updated }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    } else if (action === "geocode-one") {
      // Geocode a single shop
      if (!address) {
        return new Response(
          JSON.stringify({ error: "Missing address" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const coords = await geocodeAddress(address);

      if (shopId && coords) {
        await supabase
          .from("shops")
          .update({ latitude: coords.lat, longitude: coords.lon })
          .eq("id", shopId);
      }

      return new Response(
        JSON.stringify({ success: true, coordinates: coords }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    } else {
      return new Response(
        JSON.stringify({ error: "Invalid action" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
  } catch (e) {
    console.error("[geocode-shops] error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

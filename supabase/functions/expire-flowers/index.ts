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
    // ── Access Control: Only allow requests with valid cron secret ──
    const cronSecret = req.headers.get("x-cron-secret");
    const expectedSecret = Deno.env.get("CRON_SECRET");

    // If CRON_SECRET is configured, enforce it
    if (expectedSecret && cronSecret !== expectedSecret) {
      console.warn("[expire-flowers] Unauthorized request - invalid or missing cron secret");
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // If CRON_SECRET is NOT configured, check for Authorization header as fallback
    if (!expectedSecret) {
      const authHeader = req.headers.get("Authorization");
      if (!authHeader?.startsWith("Bearer ")) {
        console.warn("[expire-flowers] Unauthorized request - no auth header and no cron secret configured");
        return new Response(
          JSON.stringify({ error: "Unauthorized" }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Validate the JWT
      const supabaseAuth = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_ANON_KEY")!,
        { global: { headers: { Authorization: authHeader } } }
      );

      const token = authHeader.replace("Bearer ", "");
      const { data: claims, error: claimsError } = await supabaseAuth.auth.getClaims(token);
      if (claimsError || !claims?.claims) {
        console.warn("[expire-flowers] Invalid JWT token");
        return new Response(
          JSON.stringify({ error: "Unauthorized" }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      console.log(`[expire-flowers] Authenticated user: ${claims.claims.sub}`);
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: flowers, error: fetchError } = await supabase
      .from("flowers")
      .select("id, name, color, quantity, shelf_life_days, last_restocked_at, shop_id")
      .gt("quantity", 0);

    if (fetchError) {
      console.error("Error fetching flowers:", fetchError.message);
      return new Response(
        JSON.stringify({ error: fetchError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const now = new Date();
    const expiredFlowers: Array<{ id: string; name: string; color: string | null; quantity: number; shop_id: string }> = [];

    for (const flower of flowers || []) {
      const restockedAt = new Date(flower.last_restocked_at);
      const expiryDate = new Date(restockedAt.getTime() + (flower.shelf_life_days || 7) * 24 * 60 * 60 * 1000);

      if (now >= expiryDate) {
        expiredFlowers.push(flower);
      }
    }

    console.log(`Found ${expiredFlowers.length} expired flowers out of ${(flowers || []).length} total`);

    let updated = 0;
    for (const flower of expiredFlowers) {
      const { error: updateError } = await supabase
        .from("flowers")
        .update({
          quantity: 0,
          in_stock: false,
        })
        .eq("id", flower.id);

      if (updateError) {
        console.error(`Failed to expire flower ${flower.id} (${flower.name}):`, updateError.message);
      } else {
        console.log(`Expired: ${flower.name} (${flower.color || "no color"}) - was ${flower.quantity} units, shop: ${flower.shop_id}`);
        updated++;
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        checked: (flowers || []).length,
        expired: updated,
        details: expiredFlowers.map((f) => ({
          id: f.id,
          name: f.name,
          color: f.color,
          previous_quantity: f.quantity,
        })),
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Unexpected error:", err);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

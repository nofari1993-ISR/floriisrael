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
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Find all flowers where last_restocked_at + shelf_life_days < now() AND quantity > 0
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

    // Zero out expired flowers
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

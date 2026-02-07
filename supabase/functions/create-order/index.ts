import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    console.log("Received order request:", JSON.stringify(body));

    const {
      shop_id,
      customer_name,
      customer_phone,
      customer_email,
      recipient_name,
      delivery_address,
      delivery_date,
      greeting,
      items,
      total_price,
    } = body;

    // Validate required fields
    if (!shop_id || !customer_name || !recipient_name || !delivery_address || !delivery_date) {
      console.error("Missing required fields");
      return new Response(
        JSON.stringify({
          error: "Missing required fields: shop_id, customer_name, recipient_name, delivery_address, delivery_date",
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create Supabase client with service role
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Insert order
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert({
        shop_id,
        customer_name,
        customer_phone: customer_phone || null,
        customer_email: customer_email || null,
        recipient_name,
        delivery_address,
        delivery_date,
        greeting: greeting || null,
        total_price: total_price || 0,
      })
      .select("id")
      .single();

    if (orderError) {
      console.error("Order insert error:", orderError.message);
      return new Response(
        JSON.stringify({ error: orderError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Order created:", order.id);

    // Insert order items if provided
    if (items && Array.isArray(items) && items.length > 0) {
      const orderItems = items.map((item: any) => ({
        order_id: order.id,
        flower_name: item.flower_name || item.name,
        flower_id: item.flower_id || null,
        quantity: item.quantity || 1,
        unit_price: item.unit_price || item.price || 0,
      }));

      const { error: itemsError } = await supabase
        .from("order_items")
        .insert(orderItems);

      if (itemsError) {
        console.error("Order items insert error:", itemsError.message);
        // Don't fail the whole order, just log
      } else {
        console.log(`Inserted ${orderItems.length} order items`);
      }
    }

    // Fetch shop info for WhatsApp
    const { data: shop } = await supabase
      .from("shops")
      .select("name, phone")
      .eq("id", shop_id)
      .single();

    return new Response(
      JSON.stringify({
        success: true,
        order_id: order.id,
        shop_name: shop?.name || "",
        shop_phone: shop?.phone || null,
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
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// ── Rate Limiting (per-instance) ──
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(ip: string, maxRequests: number, windowMs: number): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (entry && now < entry.resetAt) {
    if (entry.count >= maxRequests) return false;
    entry.count++;
  } else {
    rateLimitMap.set(ip, { count: 1, resetAt: now + windowMs });
  }
  if (rateLimitMap.size > 1000) {
    for (const [key, val] of rateLimitMap) {
      if (now > val.resetAt) rateLimitMap.delete(key);
    }
  }
  return true;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // ── Rate limit: 5 orders per hour per IP ──
    const clientIP = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
                     req.headers.get("x-real-ip") || "unknown";
    if (!checkRateLimit(clientIP, 5, 3600000)) {
      console.warn(`[create-order] Rate limit exceeded for IP: ${clientIP}`);
      return new Response(
        JSON.stringify({ error: "יותר מדי הזמנות. נסו שוב בעוד שעה." }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const body = await req.json();
    console.log(`[create-order] Received order request, IP: ${clientIP}`);

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

    // ── Input Validation ──
    const errors: string[] = [];

    if (!shop_id || typeof shop_id !== "string") errors.push("shop_id is required");
    if (!customer_name || typeof customer_name !== "string") errors.push("customer_name is required");
    if (!recipient_name || typeof recipient_name !== "string") errors.push("recipient_name is required");
    if (!delivery_address || typeof delivery_address !== "string") errors.push("delivery_address is required");
    if (!delivery_date || typeof delivery_date !== "string") errors.push("delivery_date is required");

    if (typeof customer_name === "string" && customer_name.length > 100) errors.push("customer_name too long (max 100)");
    if (typeof recipient_name === "string" && recipient_name.length > 100) errors.push("recipient_name too long (max 100)");
    if (typeof delivery_address === "string" && delivery_address.length > 300) errors.push("delivery_address too long (max 300)");
    if (typeof greeting === "string" && greeting.length > 500) errors.push("greeting too long (max 500)");

    if (customer_email && typeof customer_email === "string" && customer_email.length > 0) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(customer_email)) errors.push("Invalid email format");
      if (customer_email.length > 255) errors.push("customer_email too long (max 255)");
    }

    if (customer_phone && typeof customer_phone === "string" && customer_phone.length > 0) {
      const phoneRegex = /^[0-9\-+() ]{9,15}$/;
      if (!phoneRegex.test(customer_phone)) errors.push("Invalid phone format");
    }

    if (typeof delivery_date === "string" && !/^\d{4}-\d{2}-\d{2}$/.test(delivery_date)) {
      errors.push("Invalid delivery_date format (expected YYYY-MM-DD)");
    }

    if (total_price !== undefined && (typeof total_price !== "number" || total_price < 0 || total_price > 50000)) {
      errors.push("total_price must be a positive number up to 50000");
    }

    if (items !== undefined && items !== null) {
      if (!Array.isArray(items) || items.length > 50) {
        errors.push("items must be an array with max 50 entries");
      } else {
        for (let i = 0; i < items.length; i++) {
          const item = items[i];
          if (!item.flower_name && !item.name) errors.push(`items[${i}]: flower_name is required`);
          if (item.quantity !== undefined && (typeof item.quantity !== "number" || item.quantity < 1 || item.quantity > 1000)) {
            errors.push(`items[${i}]: quantity must be 1-1000`);
          }
        }
      }
    }

    if (errors.length > 0) {
      console.error("Validation errors:", errors);
      return new Response(
        JSON.stringify({ error: "Validation failed", details: errors }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

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
      } else {
        console.log(`Inserted ${orderItems.length} order items`);
      }

      for (const item of orderItems) {
        if (item.flower_id) {
          const { data: flower } = await supabase
            .from("flowers")
            .select("quantity")
            .eq("id", item.flower_id)
            .single();

          if (flower) {
            const newQuantity = Math.max(0, (flower.quantity || 0) - (item.quantity || 1));
            const { error: updateError } = await supabase
              .from("flowers")
              .update({
                quantity: newQuantity,
                in_stock: newQuantity > 0,
              })
              .eq("id", item.flower_id);

            if (updateError) {
              console.error(`Failed to deduct inventory for flower ${item.flower_id}:`, updateError.message);
            } else {
              console.log(`Deducted ${item.quantity} from flower ${item.flower_id}, new qty: ${newQuantity}`);
            }
          }
        }
      }
    }

    const { data: shop } = await supabase
      .from("shops")
      .select("name, phone")
      .eq("id", shop_id)
      .single();

    // ── Send WhatsApp notification to shop owner ──
    try {
      const waToken = Deno.env.get("WHATSAPP_ACCESS_TOKEN");
      const waPhoneId = Deno.env.get("WHATSAPP_PHONE_NUMBER_ID");
      const shopPhone = shop?.phone;

      if (waToken && waPhoneId && shopPhone) {
        // Format phone for WhatsApp API (Israel: 05x -> 9725x)
        const rawPhone = shopPhone.replace(/[^0-9]/g, "");
        const waRecipient = rawPhone.startsWith("0") ? `972${rawPhone.slice(1)}` : rawPhone;

        const itemsSummary = items && Array.isArray(items) && items.length > 0
          ? items.map((i: any) => `${i.flower_name || i.name} x${i.quantity || 1}`).join(", ")
          : "ללא פירוט";

        const waBody = JSON.stringify({
          messaging_product: "whatsapp",
          to: waRecipient,
          type: "text",
          text: {
            body: `🌸 הזמנה חדשה התקבלה!\n\nלקוח: ${customer_name}\nנמען: ${recipient_name}\nתאריך משלוח: ${delivery_date}\nכתובת: ${delivery_address}\nסה״כ: ₪${total_price || 0}\n\nפריטים: ${itemsSummary}\n\nמספר הזמנה: ${order.id.slice(0, 8)}`
          }
        });

        const waRes = await fetch(
          `https://graph.facebook.com/v21.0/${waPhoneId}/messages`,
          {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${waToken}`,
              "Content-Type": "application/json",
            },
            body: waBody,
          }
        );

        if (!waRes.ok) {
          const waErr = await waRes.text();
          console.error(`[create-order] WhatsApp send failed [${waRes.status}]:`, waErr);
        } else {
          console.log("[create-order] WhatsApp notification sent to shop owner");
        }
      } else {
        console.log("[create-order] WhatsApp not configured or shop has no phone, skipping notification");
      }
    } catch (waError) {
      // Don't fail the order if WhatsApp fails
      console.error("[create-order] WhatsApp notification error:", waError);
    }

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

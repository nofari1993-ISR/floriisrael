const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const WHAPI_TOKEN = Deno.env.get("WHAPI_TOKEN");
    if (!WHAPI_TOKEN) {
      console.error("[whapi-notify] WHAPI_TOKEN is not configured");
      return new Response(JSON.stringify({ error: "WHAPI_TOKEN not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Parse the webhook payload from Supabase
    const payload = await req.json();
    const record = payload.record;

    if (!record) {
      console.error("[whapi-notify] No record in payload");
      return new Response(JSON.stringify({ error: "No record" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`[whapi-notify] New order received: ${record.id}`);

    // Format items list
    let itemsSummary = "ללא פירוט";
    if (Array.isArray(record.items) && record.items.length > 0) {
      itemsSummary = record.items
        .map((i: any) => `• ${i.flower_name || i.name || "פריט"} x${i.quantity || 1}`)
        .join("\n");
    }

    // Build Hebrew message
    const message =
      `🌸 *הזמנה חדשה באתר!*\n\n` +
      `👤 *שם הלקוח:* ${record.customer_name || "לא צוין"}\n` +
      `💐 *נמען:* ${record.recipient_name || "לא צוין"}\n` +
      `📅 *תאריך משלוח:* ${record.delivery_date || "לא צוין"}\n` +
      `📍 *כתובת:* ${record.delivery_address || "לא צוין"}\n\n` +
      `🛒 *פריטים:*\n${itemsSummary}\n\n` +
      `💰 *סה״כ לתשלום:* ₪${record.total_price || 0}\n` +
      `🔖 *מספר הזמנה:* ${String(record.id).slice(0, 8)}`;

    // Send WhatsApp message via Whapi.cloud
    const response = await fetch("https://gate.whapi.cloud/messages/text", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${WHAPI_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        to: "972546407207@s.whatsapp.net",
        body: message,
      }),
    });

    const responseText = await response.text();

    if (!response.ok) {
      console.error(`[whapi-notify] Whapi error [${response.status}]:`, responseText);
      return new Response(JSON.stringify({ error: "Whapi send failed", details: responseText }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`[whapi-notify] Message sent successfully for order ${record.id}`);
    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (err) {
    console.error("[whapi-notify] Unexpected error:", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

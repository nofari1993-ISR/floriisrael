/**
 * notify-owner
 * Sends an outbound WhatsApp template message to a shop owner
 * via the Meta Cloud API.
 *
 * POST body (JSON):
 * {
 *   phone:        string   // owner's phone in E.164 format, e.g. "972501234567"
 *   customerName: string   // customer's name
 *   orderId:      string   // order identifier
 *   items:        string   // free-text description of ordered items
 *   total:        string   // total price, e.g. "₪350"
 * }
 *
 * Required Supabase Secrets:
 *   WHATSAPP_ACCESS_TOKEN  – Meta permanent / system-user token
 *   WHATSAPP_PHONE_NUMBER_ID – the sender's Phone Number ID from Meta
 *   WHATSAPP_TEMPLATE_NAME   – template name approved in Meta (default: "order_notification")
 *   WHATSAPP_TEMPLATE_LANG   – template language code        (default: "he")
 */

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface NotifyPayload {
  phone: string;
  customerName: string;
  orderId: string;
  items: string;
  total: string;
}

Deno.serve(async (req) => {
  // CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  // ── Read secrets ──────────────────────────────────────────────────────────
  const ACCESS_TOKEN    = Deno.env.get("WHATSAPP_ACCESS_TOKEN");
  const PHONE_NUMBER_ID = Deno.env.get("WHATSAPP_PHONE_NUMBER_ID");
  const TEMPLATE_NAME   = Deno.env.get("WHATSAPP_TEMPLATE_NAME") ?? "order_notification";
  const TEMPLATE_LANG   = Deno.env.get("WHATSAPP_TEMPLATE_LANG") ?? "he";

  if (!ACCESS_TOKEN || !PHONE_NUMBER_ID) {
    console.error("[notify-owner] Missing required secrets");
    return new Response(
      JSON.stringify({ error: "Server misconfiguration: missing secrets" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  // ── Parse request body ────────────────────────────────────────────────────
  let payload: NotifyPayload;
  try {
    payload = await req.json();
  } catch {
    return new Response(
      JSON.stringify({ error: "Invalid JSON body" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  const { phone, customerName, orderId, items, total } = payload;

  if (!phone || !customerName || !orderId || !items || !total) {
    return new Response(
      JSON.stringify({ error: "Missing required fields: phone, customerName, orderId, items, total" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  // ── Build WhatsApp template message ───────────────────────────────────────
  //
  // This assumes your approved Meta template ("order_notification") has
  // 4 body parameters in this order:
  //   {{1}} customerName
  //   {{2}} orderId
  //   {{3}} items
  //   {{4}} total
  //
  // Adjust the parameters array to match your actual approved template.
  //
  const messageBody = {
    messaging_product: "whatsapp",
    to: phone,
    type: "template",
    template: {
      name: TEMPLATE_NAME,
      language: { code: TEMPLATE_LANG },
      components: [
        {
          type: "body",
          parameters: [
            { type: "text", text: customerName },
            { type: "text", text: orderId },
            { type: "text", text: items },
            { type: "text", text: total },
          ],
        },
      ],
    },
  };

  // ── Send via Meta Cloud API ────────────────────────────────────────────────
  const metaUrl = `https://graph.facebook.com/v20.0/${PHONE_NUMBER_ID}/messages`;

  console.log(`[notify-owner] Sending template "${TEMPLATE_NAME}" to ${phone}`);

  const metaRes = await fetch(metaUrl, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${ACCESS_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(messageBody),
  });

  const metaData = await metaRes.json();

  if (!metaRes.ok) {
    console.error("[notify-owner] Meta API error:", JSON.stringify(metaData));
    return new Response(
      JSON.stringify({ error: "Meta API error", details: metaData }),
      { status: metaRes.status, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  console.log("[notify-owner] Message sent successfully:", JSON.stringify(metaData));

  return new Response(
    JSON.stringify({ success: true, messageId: metaData.messages?.[0]?.id }),
    { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
  );
});

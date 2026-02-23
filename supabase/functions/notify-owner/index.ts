const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  const ACCESS_TOKEN    = Deno.env.get("WHATSAPP_ACCESS_TOKEN");
  const PHONE_NUMBER_ID = Deno.env.get("WHATSAPP_PHONE_NUMBER_ID");
  const TEMPLATE_NAME   = Deno.env.get("WHATSAPP_TEMPLATE_NAME") ?? "order_notification";
  const TEMPLATE_LANG   = Deno.env.get("WHATSAPP_TEMPLATE_LANG") ?? "he";

  if (!ACCESS_TOKEN || !PHONE_NUMBER_ID) {
    return new Response(
      JSON.stringify({ error: "Missing secrets" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  let payload;
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
      JSON.stringify({ error: "Missing required fields" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

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

  const metaRes = await fetch(
    `https://graph.facebook.com/v20.0/${PHONE_NUMBER_ID}/messages`,
    {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${ACCESS_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(messageBody),
    }
  );

  const metaData = await metaRes.json();

  if (!metaRes.ok) {
    return new Response(
      JSON.stringify({ error: "Meta API error", details: metaData }),
      { status: metaRes.status, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  return new Response(
    JSON.stringify({ success: true, messageId: metaData.messages?.[0]?.id }),
    { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
  );
});

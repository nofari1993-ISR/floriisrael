const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const url = new URL(req.url);

  // ── GET: WhatsApp webhook verification ──
  if (req.method === "GET") {
    const mode      = url.searchParams.get("hub.mode");
    const token     = url.searchParams.get("hub.verify_token");
    const challenge = url.searchParams.get("hub.challenge");

    const VERIFY_TOKEN = Deno.env.get("WHATSAPP_VERIFY_TOKEN");

    if (!VERIFY_TOKEN) {
      console.error("[super-task] WHATSAPP_VERIFY_TOKEN is not configured");
      return new Response("Server misconfiguration", { status: 500 });
    }

    if (mode === "subscribe" && token === VERIFY_TOKEN) {
      console.log("[super-task] Webhook verified successfully");
      return new Response(challenge ?? "", {
        status: 200,
        headers: { "Content-Type": "text/plain" },
      });
    }

    console.warn("[super-task] Verification failed - token mismatch");
    return new Response("Forbidden", { status: 403 });
  }

  // ── POST: Incoming WhatsApp messages ──
  if (req.method === "POST") {
    try {
      const body = await req.json();
      console.log("[super-task] Incoming event:", JSON.stringify(body));

      const entry   = body?.entry?.[0];
      const changes = entry?.changes?.[0];
      const value   = changes?.value;

      if (value?.messages?.length) {
        const msg    = value.messages[0];
        const from   = msg.from;
        const text   = msg.text?.body ?? "";
        const msgId  = msg.id;

        console.log(`[super-task] Message from ${from}: "${text}" (id: ${msgId})`);

        // TODO: add your business logic here (e.g. save to DB, auto-reply, etc.)
      }

      return new Response(JSON.stringify({ status: "ok" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    } catch (e) {
      console.error("[super-task] Failed to parse POST body:", e);
      return new Response("Bad Request", { status: 400 });
    }
  }

  return new Response("Method Not Allowed", { status: 405 });
});

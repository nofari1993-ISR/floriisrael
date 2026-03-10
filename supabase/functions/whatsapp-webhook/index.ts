import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// ─── Constants ────────────────────────────────────────────────────────────────
const VERIFY_TOKEN    = Deno.env.get("WHATSAPP_WEBHOOK_VERIFY_TOKEN") ?? "flori_webhook";
const ACCESS_TOKEN    = Deno.env.get("WHATSAPP_ACCESS_TOKEN")!;
const PHONE_NUMBER_ID = Deno.env.get("WHATSAPP_PHONE_NUMBER_ID")!;
const CUSTOMER_TMPL   = Deno.env.get("WHATSAPP_CUSTOMER_TEMPLATE") ?? "order_is_here";
const TEMPLATE_LANG   = Deno.env.get("WHATSAPP_TEMPLATE_LANG") ?? "en";

// ─── Handler ──────────────────────────────────────────────────────────────────
Deno.serve(async (req) => {
  // ── Meta webhook verification (GET) ──
  if (req.method === "GET") {
    const url       = new URL(req.url);
    const mode      = url.searchParams.get("hub.mode");
    const token     = url.searchParams.get("hub.verify_token");
    const challenge = url.searchParams.get("hub.challenge");

    if (mode === "subscribe" && token === VERIFY_TOKEN) {
      console.log("[webhook] Verification successful");
      return new Response(challenge ?? "", { status: 200 });
    }
    console.warn("[webhook] Verification failed — wrong token");
    return new Response("Forbidden", { status: 403 });
  }

  // ── Incoming events (POST) ──
  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  let body: any;
  try { body = await req.json(); } catch {
    return new Response("Invalid JSON", { status: 400 });
  }

  const messages = body?.entry?.[0]?.changes?.[0]?.value?.messages ?? [];

  for (const msg of messages) {
    let payload: string | undefined;

    // Template quick reply button click
    if (msg.type === "button" && msg.button?.payload) {
      payload = msg.button.payload;
    }
    // Interactive button reply (some Meta setups send this format)
    if (msg.type === "interactive" && msg.interactive?.type === "button_reply") {
      payload = msg.interactive.button_reply?.id;
    }

    if (payload?.startsWith("ORDER_READY_")) {
      const orderId = payload.replace("ORDER_READY_", "");
      console.log(`[webhook] "הזמנה מוכנה" clicked, orderId: ${orderId}`);
      await handleOrderReady(orderId);
    }
  }

  // Always return 200 — Meta retries otherwise
  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
});

// ─── Business Logic ───────────────────────────────────────────────────────────
async function handleOrderReady(orderId: string) {
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  // 1. Look up order
  const { data: order, error } = await supabase
    .from("orders")
    .select("id, customer_phone, recipient_name")
    .eq("id", orderId)
    .single();

  if (error || !order) {
    console.error(`[webhook] Order not found: ${orderId}`, error?.message);
    return;
  }

  // 2. Mark order as ready
  await supabase
    .from("orders")
    .update({ status: "ready" })
    .eq("id", orderId);

  console.log(`[webhook] Order ${orderId} marked as ready`);

  // 3. Send customer notification (only if phone exists)
  if (!order.customer_phone) {
    console.log(`[webhook] No customer phone for order ${orderId} — skipping customer notification`);
    return;
  }

  await sendCustomerNotification(order);
}

async function sendCustomerNotification(order: {
  customer_phone: string;
  recipient_name: string;
}) {
  if (!ACCESS_TOKEN || !PHONE_NUMBER_ID) {
    console.error("[webhook] Missing Meta credentials");
    return;
  }

  const raw     = order.customer_phone.replace(/[^0-9]/g, "");
  const toPhone = raw.startsWith("0") ? `972${raw.slice(1)}` : raw;

  const payload = {
    messaging_product: "whatsapp",
    to: toPhone,
    type: "template",
    template: {
      name: CUSTOMER_TMPL,
      language: { code: TEMPLATE_LANG },
      components: [
        {
          type: "body",
          parameters: [
            { type: "text", parameter_name: "recipient_name", text: order.recipient_name },
          ],
        },
      ],
    },
  };

  const res = await fetch(
    `https://graph.facebook.com/v22.0/${PHONE_NUMBER_ID}/messages`,
    {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${ACCESS_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    },
  );

  const data = await res.json();
  if (!res.ok) {
    console.error("[webhook] Customer notification failed:", JSON.stringify(data));
  } else {
    console.log(`[webhook] Customer notified → ${toPhone}, msgId: ${data.messages?.[0]?.id}`);
  }
}

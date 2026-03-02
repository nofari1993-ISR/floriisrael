import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const payload = await req.json();
    const record = payload.record;

    if (!record) {
      console.error("[notify] No record in payload");
      return new Response("No record", { status: 400 });
    }

    console.log(`[notify] New order: ${record.id}, shop_id: ${record.shop_id}`);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // ── Fetch shop details ──
    const { data: shop } = await supabase
      .from("shops")
      .select("name, phone, email")
      .eq("id", record.shop_id)
      .single();

    const shopPhone = shop?.phone || "";
    const shopEmail = (shop as any)?.email || "";
    const rawPhone = shopPhone.replace(/[^0-9]/g, "");
    const phone972 = rawPhone.startsWith("0") ? `972${rawPhone.slice(1)}` : rawPhone;
    const phone0 = rawPhone.startsWith("972") ? `0${rawPhone.slice(3)}` : rawPhone;

    // ── Wait briefly so create-order finishes inserting order_items ──
    await new Promise((resolve) => setTimeout(resolve, 4000));

    // ── Fetch order items ──
    const { data: orderItems } = await supabase
      .from("order_items")
      .select("flower_name, quantity, unit_price")
      .eq("order_id", record.id);

    const itemsSummary = orderItems && orderItems.length > 0
      ? orderItems.map((i: any) => `• ${i.flower_name} x${i.quantity}`).join("\n")
      : "ללא פירוט";

    const itemsHtml = orderItems && orderItems.length > 0
      ? orderItems.map((i: any) => `
          <tr>
            <td style="padding:8px 12px;border-bottom:1px solid #f0e6f6;">${i.flower_name}</td>
            <td style="padding:8px 12px;border-bottom:1px solid #f0e6f6;text-align:center;">${i.quantity}</td>
            <td style="padding:8px 12px;border-bottom:1px solid #f0e6f6;text-align:right;">₪${(i.unit_price * i.quantity).toFixed(0)}</td>
          </tr>`).join("")
      : `<tr><td colspan="3" style="padding:8px 12px;color:#888;">ללא פירוט</td></tr>`;

    const shortId = record.id?.slice(0, 8) || "";

    // ════════════════════════════════════
    // 1. TELEGRAM NOTIFICATION
    // ════════════════════════════════════
    const telegramResult = await (async () => {
      try {
        const botToken = Deno.env.get("TELEGRAM_BOT_TOKEN");
        if (!botToken) return { ok: false, error: "No bot token" };

        const { data: regs } = await supabase
          .from("telegram_registrations")
          .select("chat_id")
          .or(`phone.eq.${phone972},phone.eq.${phone0}`)
          .limit(1);

        const chatId = regs?.[0]?.chat_id;
        if (!chatId) return { ok: false, error: `No registration for ${phone972}` };

        const message =
          `🌸 <b>הזמנה חדשה ב-Flori!</b> 🌸\n\n` +
          `👤 <b>לקוח:</b> ${record.customer_name || ""}\n` +
          `💐 <b>פריטים:</b>\n${itemsSummary}\n\n` +
          `💰 <b>סה"כ:</b> ₪${record.total_price || 0}\n` +
          `📍 <b>כתובת:</b> ${record.delivery_address || ""}\n` +
          `📞 <b>טלפון לקוח:</b> ${record.customer_phone || "לא צוין"}\n` +
          `📅 <b>תאריך משלוח:</b> ${record.delivery_date || ""}\n` +
          `🔖 <b>מספר הזמנה:</b> ${shortId}`;

        const res = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ chat_id: chatId, text: message, parse_mode: "HTML" }),
        });
        const data = await res.json();
        if (!res.ok) return { ok: false, error: JSON.stringify(data) };
        console.log(`[notify] Telegram sent to chat ${chatId}`);
        return { ok: true };
      } catch (e) {
        return { ok: false, error: String(e) };
      }
    })();

    // ════════════════════════════════════
    // 2. EMAIL NOTIFICATION (Resend)
    // ════════════════════════════════════
    const emailResult = await (async () => {
      try {
        const resendKey = Deno.env.get("RESEND_API_KEY");
        if (!resendKey) return { ok: false, error: "No Resend API key" };
        if (!shopEmail) return { ok: false, error: "No shop email configured" };

        const html = `
<!DOCTYPE html>
<html dir="rtl" lang="he">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#fdf8ff;font-family:Arial,sans-serif;direction:rtl;">
  <div style="max-width:600px;margin:32px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(180,120,200,0.10);">

    <!-- Header -->
    <div style="background:linear-gradient(135deg,#c084fc,#e879f9);padding:32px 24px;text-align:center;">
      <div style="font-size:36px;margin-bottom:8px;">🌸</div>
      <h1 style="color:#fff;margin:0;font-size:22px;font-weight:bold;">הזמנה חדשה התקבלה!</h1>
      <p style="color:rgba(255,255,255,0.85);margin:6px 0 0;font-size:14px;">מספר הזמנה: ${shortId}</p>
    </div>

    <!-- Body -->
    <div style="padding:28px 24px;">

      <!-- Order details table -->
      <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin-bottom:24px;">
        <tr style="background:#f9f0ff;">
          <td style="padding:10px 12px;font-weight:bold;color:#6b21a8;border-bottom:2px solid #e9d5ff;">פרט</td>
          <td style="padding:10px 12px;font-weight:bold;color:#6b21a8;border-bottom:2px solid #e9d5ff;">מידע</td>
        </tr>
        <tr>
          <td style="padding:10px 12px;border-bottom:1px solid #f3e8ff;color:#555;">👤 שם לקוח</td>
          <td style="padding:10px 12px;border-bottom:1px solid #f3e8ff;font-weight:bold;">${record.customer_name || "—"}</td>
        </tr>
        <tr style="background:#fdf8ff;">
          <td style="padding:10px 12px;border-bottom:1px solid #f3e8ff;color:#555;">📞 טלפון</td>
          <td style="padding:10px 12px;border-bottom:1px solid #f3e8ff;">${record.customer_phone || "לא צוין"}</td>
        </tr>
        <tr>
          <td style="padding:10px 12px;border-bottom:1px solid #f3e8ff;color:#555;">📍 כתובת</td>
          <td style="padding:10px 12px;border-bottom:1px solid #f3e8ff;">${record.delivery_address || "—"}</td>
        </tr>
        <tr style="background:#fdf8ff;">
          <td style="padding:10px 12px;border-bottom:1px solid #f3e8ff;color:#555;">📅 תאריך משלוח</td>
          <td style="padding:10px 12px;border-bottom:1px solid #f3e8ff;">${record.delivery_date || "—"}</td>
        </tr>
      </table>

      <!-- Items table -->
      <h3 style="color:#6b21a8;margin:0 0 12px;font-size:16px;">💐 פריטים שהוזמנו</h3>
      <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin-bottom:24px;">
        <tr style="background:#f9f0ff;">
          <th style="padding:8px 12px;text-align:right;color:#6b21a8;font-size:13px;border-bottom:2px solid #e9d5ff;">פריט</th>
          <th style="padding:8px 12px;text-align:center;color:#6b21a8;font-size:13px;border-bottom:2px solid #e9d5ff;">כמות</th>
          <th style="padding:8px 12px;text-align:right;color:#6b21a8;font-size:13px;border-bottom:2px solid #e9d5ff;">מחיר</th>
        </tr>
        ${itemsHtml}
      </table>

      <!-- Total -->
      <div style="background:#f9f0ff;border-radius:12px;padding:16px 20px;text-align:center;">
        <span style="font-size:18px;font-weight:bold;color:#6b21a8;">💰 סה"כ לתשלום: ₪${record.total_price || 0}</span>
      </div>

    </div>

    <!-- Footer -->
    <div style="background:#f3e8ff;padding:16px 24px;text-align:center;">
      <p style="margin:0;font-size:12px;color:#9333ea;">Flori — פלטפורמת חנויות פרחים 🌸</p>
    </div>
  </div>
</body>
</html>`;

        const res = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${resendKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: "Flori <onboarding@resend.dev>",
            to: [shopEmail],
            subject: `🌸 הזמנה חדשה #${shortId} — ${record.customer_name || "לקוח"}`,
            html,
          }),
        });

        const data = await res.json();
        if (!res.ok) return { ok: false, error: JSON.stringify(data) };
        console.log(`[notify] Email sent via Resend, id: ${data.id}`);
        return { ok: true, id: data.id };
      } catch (e) {
        return { ok: false, error: String(e) };
      }
    })();

    // ── Log results ──
    if (!telegramResult.ok) console.error(`[notify] Telegram failed: ${telegramResult.error}`);
    if (!emailResult.ok) console.error(`[notify] Email failed: ${emailResult.error}`);

    return new Response(
      JSON.stringify({ telegram: telegramResult, email: emailResult }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (err) {
    console.error("[notify] Unexpected error:", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

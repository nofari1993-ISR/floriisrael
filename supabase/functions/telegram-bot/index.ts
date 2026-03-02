import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

const BOT_TOKEN = Deno.env.get("TELEGRAM_BOT_TOKEN")!;

async function sendMessage(chatId: number | string, text: string, extra?: object) {
  await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: "HTML", ...extra }),
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const message = body.message;

    if (!message) {
      return new Response("ok", { headers: corsHeaders });
    }

    const chatId = message.chat.id;
    const text = message.text || "";

    // ── /start command – ask for phone number ──
    if (text.startsWith("/start")) {
      await sendMessage(chatId,
        `🌸 <b>ברוכים הבאים ל-Flori!</b>\n\nלקבלת התראות על הזמנות חדשות, לחצו על הכפתור למטה לשיתוף מספר הטלפון שלכם.`,
        {
          reply_markup: {
            keyboard: [[{ text: "📱 שתף מספר טלפון", request_contact: true }]],
            resize_keyboard: true,
            one_time_keyboard: true,
          },
        }
      );
      return new Response("ok", { headers: corsHeaders });
    }

    // ── Contact shared – save phone → chat_id ──
    if (message.contact) {
      const rawPhone = message.contact.phone_number.replace(/[^0-9]/g, "");
      // Normalize to Israeli format: store both 972XXXXXXXX and 0XXXXXXXX
      const phone972 = rawPhone.startsWith("972") ? rawPhone : rawPhone.startsWith("0") ? `972${rawPhone.slice(1)}` : rawPhone;
      const phone0 = rawPhone.startsWith("0") ? rawPhone : rawPhone.startsWith("972") ? `0${rawPhone.slice(3)}` : rawPhone;
      const username = message.contact.username || message.from?.username || null;

      // Save both formats so we can match either way
      await supabase.from("telegram_registrations").upsert([
        { phone: phone972, chat_id: String(chatId), username },
        { phone: phone0, chat_id: String(chatId), username },
      ]);

      await sendMessage(chatId,
        `✅ <b>נרשמת בהצלחה!</b>\n\nמעכשיו תקבל/י הודעת טלגרם על כל הזמנה חדשה בחנות שלך 🌸`,
        { reply_markup: { remove_keyboard: true } }
      );

      console.log(`[telegram-bot] Registered phone ${phone972} → chat_id ${chatId}`);
      return new Response("ok", { headers: corsHeaders });
    }

    // ── Default response ──
    await sendMessage(chatId, `שלחי /start כדי להירשם לקבלת התראות 🌸`);

    return new Response("ok", { headers: corsHeaders });
  } catch (err) {
    console.error("[telegram-bot] Error:", err);
    return new Response("ok", { headers: corsHeaders }); // Always return 200 to Telegram
  }
});

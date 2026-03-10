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
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // ── Rate limit: 20 messages per hour per IP ──
    const clientIP = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
                     req.headers.get("x-real-ip") || "unknown";
    if (!checkRateLimit(clientIP, 20, 3600000)) {
      console.warn(`[chat] Rate limit exceeded for IP: ${clientIP}`);
      return new Response(
        JSON.stringify({ error: "יותר מדי בקשות. נסו שוב בעוד מספר דקות." }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { messages, shopId } = await req.json();

    // ── Input Validation ──
    if (!Array.isArray(messages) || messages.length === 0) {
      return new Response(
        JSON.stringify({ error: "Messages must be a non-empty array" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (messages.length > 20) {
      return new Response(
        JSON.stringify({ error: "Too many messages (max 20)" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    for (const msg of messages) {
      if (!msg.role || !msg.content) {
        return new Response(
          JSON.stringify({ error: "Invalid message format" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (typeof msg.content !== "string" || msg.content.length > 2000) {
        return new Response(
          JSON.stringify({ error: "Message content too long (max 2000 chars)" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (!["user", "assistant", "system"].includes(msg.role)) {
        return new Response(
          JSON.stringify({ error: "Invalid message role" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!LOVABLE_API_KEY) {
      console.error("LOVABLE_API_KEY is not configured");
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    console.log(`[chat] Request: ${messages.length} messages, shopId: ${shopId}, IP: ${clientIP}`);

    // 1. Fetch inventory from database
    let inventoryList = "המלאי כרגע לא זמין.";

    if (shopId && SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY) {
      const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
      const { data: inventory, error } = await supabase
        .from("flowers")
        .select("name, color, price, is_available, is_boosted")
        .eq("shop_id", shopId)
        .eq("is_available", true);

      if (error) {
        console.error("Error fetching inventory:", error.message);
      } else if (inventory && inventory.length > 0) {
        const boosted = inventory.filter((item: any) => item.is_boosted);
        const boostedSection = boosted.length > 0
          ? `\n\n⭐ פרחים מקודמים (תעדף אותם בהמלצות!):\n${boosted.map((item: any) => `- ${item.name}${item.color ? ` (${item.color})` : ""}: ${item.price}₪`).join("\n")}`
          : "";

        inventoryList = inventory
          .map(
            (item: any) =>
              `- ${item.name}${item.color ? ` (${item.color})` : ""}: ${item.price}₪${item.is_boosted ? " ⭐" : ""}`
          )
          .join("\n") + boostedSection;
        console.log(`Loaded ${inventory.length} available flowers for shop ${shopId}, ${boosted.length} boosted`);
      } else {
        inventoryList = "אין כרגע פרחים זמינים במלאי.";
        console.log("No available flowers found for shop", shopId);
      }
    }

    // 2. Build system prompt with inventory
    const systemPrompt = `אתה יועץ פרחים מומחה של Nuphar Flowers AI. 
משימה: עזור ללקוח להרכיב זר מהמלאי הזמין בלבד.

המלאי העדכני של החנות כרגע:
${inventoryList}

כללים:
- אל תציע פרחים שלא מופיעים במלאי או שהכמות שלהם היא 0
- תענה תמיד בעברית
- השתמש באימוג׳ים של פרחים 🌸🌹🌷🌻🌿💐🌺
- תן המלצות ספציפיות עם מחירים מהמלאי בלבד
- תהיה חם, ידידותי ומקצועי
- כשמתאים, הצע שילובי צבעים ופרחים מהמלאי
- ציין זמינות עונתית כשרלוונטי
- אם הלקוח מבקש פרח שלא מופיע ברשימה (לא זמין), הצע חלופות - תעדף פרחים מסומנים ב-⭐
- פרחים מסומנים ב-⭐ הם פרחים מקודמים - תעדף אותם בהמלצות שלך ותשלב אותם בזרים כשזה מתאים`;

    const response = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            { role: "system", content: systemPrompt },
            ...messages,
          ],
          stream: true,
        }),
      }
    );

    if (!response.ok) {
      console.error("AI gateway error:", response.status);
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "יותר מדי בקשות, נסו שוב בעוד רגע." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "נדרש תשלום, אנא הוסיפו קרדיטים." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const t = await response.text();
      console.error("Response body:", t);
      return new Response(
        JSON.stringify({ error: "שגיאה בשירות AI" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Streaming response back to client");
    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("chat error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "שגיאה לא ידועה" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { messages, shopId } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!LOVABLE_API_KEY) {
      console.error("LOVABLE_API_KEY is not configured");
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    console.log("Chat request received with", messages.length, "messages", "shopId:", shopId);

    // 1. Fetch inventory from database
    let inventoryList = "המלאי כרגע לא זמין.";

    if (shopId && SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY) {
      const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
      const { data: inventory, error } = await supabase
        .from("flowers")
        .select("name, color, quantity, price, in_stock, boosted")
        .eq("shop_id", shopId)
        .eq("in_stock", true);

      if (error) {
        console.error("Error fetching inventory:", error.message);
      } else if (inventory && inventory.length > 0) {
        const boosted = inventory.filter((item: any) => item.boosted && item.quantity > 0);
        const boostedSection = boosted.length > 0
          ? `\n\n⭐ פרחים מקודמים (תעדף אותם בהמלצות!):\n${boosted.map((item: any) => `- ${item.name}${item.color ? ` (${item.color})` : ""}: ${item.quantity} יחידות, מחיר: ${item.price}₪`).join("\n")}`
          : "";

        inventoryList = inventory
          .map(
            (item: any) =>
              `- ${item.name}${item.color ? ` (${item.color})` : ""}: ${item.quantity} יחידות, מחיר: ${item.price}₪${item.boosted ? " ⭐" : ""}`
          )
          .join("\n") + boostedSection;
        console.log(`Loaded ${inventory.length} flowers for shop ${shopId}, ${boosted.length} boosted`);
      } else {
        inventoryList = "אין כרגע פרחים זמינים במלאי.";
        console.log("No flowers found for shop", shopId);
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
- אם הלקוח מבקש פרח שלא קיים במלאי, הצע חלופות מהמלאי הזמין
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

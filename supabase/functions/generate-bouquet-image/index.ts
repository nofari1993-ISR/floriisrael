const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { flowers } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    if (!flowers || flowers.length === 0) {
      throw new Error("No flowers provided");
    }

    const numberWords: Record<number, string> = {
      1: "ONE", 2: "TWO", 3: "THREE", 4: "FOUR", 5: "FIVE",
      6: "SIX", 7: "SEVEN", 8: "EIGHT", 9: "NINE", 10: "TEN",
      11: "ELEVEN", 12: "TWELVE", 13: "THIRTEEN", 14: "FOURTEEN", 15: "FIFTEEN",
    };

    const flowersList = flowers
      .map((item: any) => {
        const colorInfo = item.color ? `${item.color} ` : "";
        const flowerName = item.name;
        const numWord = numberWords[item.quantity] || String(item.quantity);
        return `- ${numWord} (${item.quantity}) ${colorInfo}${flowerName} - MAXIMUM ${item.quantity}, do not exceed this number`;
      })
      .join("\n");

    const prompt = `Professional photograph of a hand-held flower bouquet.

STRICT flower quantities - DO NOT EXCEED these numbers:
${flowersList}

CRITICAL RULES:
1. Each flower type MUST have AT MOST the quantity specified above
2. It's better to have FEWER flowers than MORE
3. DO NOT add any flowers not listed above
4. If unsure about quantities, use FEWER rather than more

Style: Elegant arrangement wrapped in decorative paper with satin ribbon bow, soft natural lighting, clean white background, professional photography.`;

    console.log("[generate-bouquet-image] Generating image...");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-image",
        messages: [
          { role: "user", content: prompt },
        ],
        modalities: ["image", "text"],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`AI gateway error: ${response.status}`, errorText);
      throw new Error("Failed to generate image");
    }

    const data = await response.json();
    const imageUrl = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;

    if (!imageUrl) {
      console.error("[generate-bouquet-image] No image in response:", JSON.stringify(data).slice(0, 200));
      throw new Error("No image generated");
    }

    console.log("[generate-bouquet-image] Image generated successfully");

    return new Response(
      JSON.stringify({ image_url: imageUrl }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("[generate-bouquet-image] error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "שגיאה לא ידועה" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

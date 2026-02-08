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

    // Build a precise, countable description
    const totalFlowers = flowers.reduce((sum: number, item: any) => sum + (item.quantity || 1), 0);

    const flowerDescriptions = flowers.map((item: any) => {
      const color = item.color || "";
      const name = item.name;
      const qty = item.quantity || 1;
      return `exactly ${qty} ${color} ${name}`.trim();
    });

    const flowerListForPrompt = flowerDescriptions.join(", ");

    const prompt = `Create a realistic top-down photograph of a small hand-tied bouquet on a clean white surface.

The bouquet contains EXACTLY ${totalFlowers} flowers total, no more, no less:
${flowerDescriptions.map((d: string) => `• ${d}`).join("\n")}

ABSOLUTE RULES:
- The total number of flower heads visible must be EXACTLY ${totalFlowers}. Count them.
- Each flower must be clearly distinguishable and countable individually.
- DO NOT add any extra flowers, leaves, or filler greenery unless explicitly listed above.
- If only ${totalFlowers} flowers are listed, show only ${totalFlowers} flower heads. A bouquet of 2 flowers is perfectly fine.
- NO artistic license to add more flowers for aesthetics.

Arrangement: ${totalFlowers <= 3 ? "Simple and minimal, each stem clearly visible" : "Neatly arranged, each flower clearly visible and countable"}.
Wrapping: Light kraft paper or tissue, tied with a simple ribbon.
Photography: Clean white background, soft natural light, overhead view so every flower head is visible and countable.`;

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

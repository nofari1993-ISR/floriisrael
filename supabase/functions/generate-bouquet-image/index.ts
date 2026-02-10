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
    // ── Rate limit: 10 image generations per hour per IP ──
    const clientIP = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
                     req.headers.get("x-real-ip") || "unknown";
    if (!checkRateLimit(clientIP, 10, 3600000)) {
      console.warn(`[generate-bouquet-image] Rate limit exceeded for IP: ${clientIP}`);
      return new Response(
        JSON.stringify({ error: "יותר מדי בקשות. נסו שוב בעוד מספר דקות." }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { flowers } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    // ── Input Validation ──
    if (!Array.isArray(flowers) || flowers.length === 0) {
      return new Response(
        JSON.stringify({ error: "Flowers must be a non-empty array" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (flowers.length > 20) {
      return new Response(
        JSON.stringify({ error: "Too many flower types (max 20)" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    for (const flower of flowers) {
      if (!flower.name || typeof flower.name !== "string" || flower.name.length > 50) {
        return new Response(
          JSON.stringify({ error: "Invalid flower name" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (flower.color && (typeof flower.color !== "string" || flower.color.length > 30)) {
        return new Response(
          JSON.stringify({ error: "Invalid color" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (flower.quantity !== undefined && (typeof flower.quantity !== "number" || flower.quantity < 1 || flower.quantity > 100)) {
        return new Response(
          JSON.stringify({ error: "Invalid quantity (must be 1-100)" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
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

    // Build a numbered list so the model "sees" each flower individually
    const numberedList: string[] = [];
    let counter = 1;
    for (const item of flowers) {
      const color = item.color || "";
      const name = item.name;
      const qty = item.quantity || 1;
      for (let i = 0; i < qty; i++) {
        numberedList.push(`${counter}. one ${color} ${name}`.trim());
        counter++;
      }
    }

    const prompt = `Create a realistic top-down flat-lay photograph on a clean white surface.

Show EXACTLY ${totalFlowers} individual flower heads laid out neatly in organized rows, like a botanical catalog photo. Each flower is numbered below:

${numberedList.join("\n")}

CRITICAL RULES:
1. There must be EXACTLY ${totalFlowers} flower heads visible. Not ${totalFlowers - 1}, not ${totalFlowers + 1}. Exactly ${totalFlowers}.
2. Lay each flower SEPARATELY with space between them so they can be individually counted.
3. Arrange them in neat rows (like a grid) — ${totalFlowers <= 6 ? "1-2 rows" : totalFlowers <= 12 ? "2-3 rows" : "3-5 rows"}.
4. Each flower head must be FULLY visible from above, no overlapping, no hiding.
5. DO NOT add ANY flowers, greenery, or decorations not in the list above.
6. After arranging, a light ribbon or twine loosely groups them to suggest a bouquet.

Style: Clean editorial flat-lay on white background, soft natural overhead lighting, each flower clearly distinct and countable.`;

    console.log(`[generate-bouquet-image] Generating image for ${totalFlowers} flowers, IP: ${clientIP}`);

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

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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
    const { flowerId, name, color } = await req.json();

    if (!flowerId || !name) {
      return new Response(
        JSON.stringify({ error: "flowerId and name are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const GOOGLE_AI_KEY = Deno.env.get("GOOGLE_AI_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!GOOGLE_AI_KEY) throw new Error("GOOGLE_AI_KEY is not configured");
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) throw new Error("Supabase env vars missing");

    const colorDesc = color ? `${color} ` : "";
    const prompt = `Create a beautiful, realistic close-up product photograph of a single ${colorDesc}${name} flower on a clean white background. Professional product photography style, soft natural light, sharp focus on the flower petals and details, centered composition, no vase, no bouquet — just the single flower with some green stem/leaves visible.`;

    console.log(`[generate-flower-image] Generating image for: ${colorDesc}${name} (id: ${flowerId})`);

    const imageResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-image-preview:generateContent?key=${GOOGLE_AI_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { responseModalities: ["IMAGE"] },
        }),
      }
    );

    if (!imageResponse.ok) {
      const errText = await imageResponse.text();
      console.error(`[generate-flower-image] Gemini error ${imageResponse.status}:`, errText.slice(0, 300));
      throw new Error(`Gemini API error ${imageResponse.status}`);
    }

    const imageData = await imageResponse.json();
    const parts = imageData.candidates?.[0]?.content?.parts || [];

    let base64Data: string | null = null;
    let mimeType = "image/png";
    for (const part of parts) {
      if (part.inlineData?.mimeType?.startsWith("image/")) {
        base64Data = part.inlineData.data;
        mimeType = part.inlineData.mimeType;
        break;
      }
    }

    if (!base64Data) {
      console.error("[generate-flower-image] No image in response:", JSON.stringify(imageData).slice(0, 300));
      throw new Error("No image generated");
    }

    // Upload to Supabase Storage
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const fileExt = mimeType === "image/jpeg" ? "jpg" : "png";
    const filePath = `flowers/${flowerId}.${fileExt}`;

    const imageBuffer = Uint8Array.from(atob(base64Data), (c) => c.charCodeAt(0));

    const { error: uploadError } = await supabase.storage
      .from("flower-images")
      .upload(filePath, imageBuffer, { contentType: mimeType, upsert: true });

    if (uploadError) {
      console.error("[generate-flower-image] Storage upload error:", uploadError.message);
      throw new Error(`Storage upload error: ${uploadError.message}`);
    }

    const { data: { publicUrl } } = supabase.storage.from("flower-images").getPublicUrl(filePath);

    // Update flower record with image URL
    const { error: updateError } = await supabase
      .from("flowers")
      .update({ image: publicUrl })
      .eq("id", flowerId);

    if (updateError) {
      console.error("[generate-flower-image] DB update error:", updateError.message);
    }

    console.log(`[generate-flower-image] Done — publicUrl: ${publicUrl}`);

    return new Response(
      JSON.stringify({ image_url: publicUrl }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("[generate-flower-image] error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "שגיאה לא ידועה" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

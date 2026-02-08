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
    const body = await req.json();
    const { action, shopId, answers, currentBouquet, userMessage, flowerName, flowerColor } = body;

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    console.log(`[bouquet-ai] action=${action}, shopId=${shopId}`);

    // Fetch inventory
    let flowersContext = "אין פרחים זמינים במלאי.";
    let flowersList: any[] = [];
    let boostedFlowers: any[] = [];

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
        flowersList = inventory;
        boostedFlowers = inventory.filter((f: any) => f.boosted && f.quantity > 0);
        flowersContext = inventory
          .filter((f: any) => f.quantity > 0)
          .map((f: any) => `- ${f.name}${f.color ? ` (${f.color})` : ""}: ${f.quantity} יח', ₪${f.price}${f.boosted ? " ⭐ מקודם" : ""}`)
          .join("\n");
        console.log(`Loaded ${inventory.length} flowers for shop ${shopId}, ${boostedFlowers.length} boosted`);
      }
    }

    let prompt = "";

    if (action === "generate") {
      // Generate initial bouquet recommendation
      const budget = parseFloat(answers.budget) || 200;
      const budgetForFlowers = budget / 1.05;

      // Build boosted flowers instruction
      const boostedInstruction = boostedFlowers.length > 0
        ? `\n# ⭐ פרחים מקודמים (עדיפות גבוהה - בעל החנות מבקש לתעדף אותם!):\n${boostedFlowers.map((f: any) => `- ${f.name}${f.color ? ` (${f.color})` : ""}: ${f.quantity} יח', ₪${f.price}`).join("\n")}\nחובה לשלב לפחות פרח מקודם אחד בזר אם הוא מתאים לבקשה!\n`
        : "";

      prompt = `אתה מעצב זרי פרחים מקצועי. בנה זר מגוון עם מספר סוגי פרחים שונים.

# פרחים זמינים במלאי:
${flowersContext}
${boostedInstruction}
# בקשת הלקוח:
- למי: ${answers.recipient || "לא צוין"}
- אירוע: ${answers.occasion || "לא צוין"}
- צבעים: ${answers.colors || "לא צוין"}
- תקציב לפרחים: ₪${Math.floor(budgetForFlowers)}
- הערות: ${answers.notes && answers.notes !== "המשך" ? answers.notes : "אין"}

# חובה:
1. בנה זר עם 2-4 סוגי פרחים שונים (לא רק סוג אחד!)
2. אל תחרוג מ-₪${Math.floor(budgetForFlowers)} - זה קריטי!
3. השתמש רק בפרחים מהמלאי הזמין
4. אם פרח לא זמין, הצע חלופה
5. כל רשומה בזר = צבע אחד בלבד של הפרח
6. ${boostedFlowers.length > 0 ? "תעדף את הפרחים המקודמים (⭐) ותן להם כמות גבוהה יותר בזר" : "בחר פרחים שמתאימים לבקשה"}

# ההודעה שלך (message):
כתוב הודעה חמה ואישית (2-3 משפטים) שמסבירה למה בחרת בפרחים האלה ואיך הם מתאימים לאירוע.
אל תציין מספרים או יחידות של פרחים בטקסט! הלקוח רואה אותם ברשימה.

# פורמט JSON בלבד:
{"message": "הודעה אישית", "flowers": [{"name": "שם מדויק מהמלאי", "quantity": מספר, "color": "צבע"}]}`;
    } else if (action === "modify") {
      // Modify existing bouquet
      const budget = parseFloat(answers?.budget) || 200;
      const budgetForFlowers = budget / 1.05;
      const currentFlowersList = (currentBouquet?.flowers || [])
        .map((f: any) => `- ${f.quantity} ${f.color || ""} ${f.name} (₪${f.unit_price || 0} ליחידה)`)
        .join("\n");

      const boostedModifyInstruction = boostedFlowers.length > 0
        ? `\n# ⭐ פרחים מקודמים (עדיפות גבוהה):\n${boostedFlowers.map((f: any) => `- ${f.name}${f.color ? ` (${f.color})` : ""}`).join("\n")}\nאם הלקוח מבקש להוסיף פרחים, תעדף את המקודמים.\n`
        : "";

      prompt = `אתה עורך זר פרחים קיים. בצע את השינוי שהלקוח ביקש והחזר את כל הזר המלא.

# הזר הנוכחי:
${currentFlowersList}
סה"כ: ₪${currentBouquet?.total_price || 0}

# פרחים זמינים במלאי:
${flowersContext}
${boostedModifyInstruction}
# תקציב: ₪${Math.floor(budgetForFlowers)}

# הלקוח ביקש:
"${userMessage}"

# חוקים:
1. זהה מה הלקוח רוצה לשנות (להוסיף/להוריד/להחליף/לשנות צבע/כמות)
2. החזר את הזר המלא המעודכן - כל הפרחים
3. אל תחרוג מהתקציב
4. בטקסט - אל תציין מספרים, רק סוגי פרחים והרגשה

# פורמט JSON בלבד:
{"message": "הסבר מה שינית", "flowers": [{"name": "שם", "quantity": מספר, "color": "צבע"}]}`;
    } else if (action === "high-stock") {
      // Find flowers with highest stock and create a bouquet that uses them
      const highStockFlowers = flowersList
        .filter((f: any) => f.quantity > 0)
        .sort((a: any, b: any) => b.quantity - a.quantity);

      const topFlowers = highStockFlowers.slice(0, 10);
      const topFlowersText = topFlowers
        .map((f: any) => `- ${f.name}${f.color ? ` (${f.color})` : ""}: ${f.quantity} יח', ₪${f.price}`)
        .join("\n");

      prompt = `אתה מעצב זרי פרחים מקצועי. בעל החנות מבקש ממך ליצור זר מיוחד שישתמש בעיקר בפרחים שיש ממנו מלאי גבוה.

# פרחים עם מלאי גבוה (עדיפות גבוהה):
${topFlowersText}

# כל הפרחים הזמינים:
${flowersContext}

# הנחיות:
1. **עדיפות עליונה**: השתמש בפרחים מהמלאי הגבוה ביותר
2. צור זר יפה ומגוון עם 3-5 סוגי פרחים שונים
3. שלב גם ירק/עלווה אם זמין
4. תקציב: עד ₪250 לפרחים
5. הודעה: כתוב הודעה שמסבירה שהזר הזה מכיל פרחים טריים שיש מהם מלאי מלא - פרחים באיכות הכי טובה

# פורמט JSON בלבד:
{"message": "הודעה אישית", "flowers": [{"name": "שם מדויק מהמלאי", "quantity": מספר, "color": "צבע"}]}`;
    } else if (action === "promote-flower") {
      // Create a bouquet that prominently features a specific flower
      if (!flowerName) {
        return new Response(
          JSON.stringify({ error: "Missing flowerName parameter" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const colorText = flowerColor ? ` בצבע ${flowerColor}` : "";
      console.log(`[bouquet-ai] Promoting flower: ${flowerName}${colorText}`);

      prompt = `אתה מעצב זרי פרחים מקצועי. בעל החנות מבקש ממך ליצור זר מיוחד שישתמש בעיקר ב**${flowerName}${colorText}**.

# פרחים זמינים במלאי:
${flowersContext}

# הנחיות:
1. **הפרח המרכזי של הזר חייב להיות ${flowerName}${colorText}** - תן לו את הכמות הגבוהה ביותר בזר
2. השלם עם 2-3 פרחים נוספים מהמלאי שמתאימים בצבעים ובסגנון
3. שלב ירק/עלווה אם זמין (אקליפטוס, רוסקוס, שרך)
4. תקציב: עד ₪250 לפרחים
5. הודעה: הסבר למה בחרת את השילוב הזה ואיך ${flowerName} נותן לזר את האופי המרכזי שלו

# פורמט JSON בלבד:
{"message": "הודעה אישית", "flowers": [{"name": "שם מדויק מהמלאי", "quantity": מספר, "color": "צבע"}]}`;
    } else {
      return new Response(
        JSON.stringify({ error: "Invalid action" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`[bouquet-ai] Sending prompt to AI, action=${action}`);

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: "אתה מחזיר תמיד JSON תקין בלבד, ללא טקסט נוסף מסביב. ענה בעברית." },
          { role: "user", content: prompt },
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`AI gateway error: ${response.status}`, errorText);
      return new Response(
        JSON.stringify({ error: "שגיאה בשירות AI" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const aiData = await response.json();
    const content = aiData.choices?.[0]?.message?.content || "{}";
    console.log("[bouquet-ai] Raw AI response:", content);

    let parsed;
    try {
      parsed = JSON.parse(content);
    } catch {
      // Try extracting JSON from markdown code block
      const match = content.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (match) {
        parsed = JSON.parse(match[1]);
      } else {
        throw new Error("Could not parse AI response as JSON");
      }
    }

    // Validate and adjust flowers against real inventory
    const validatedFlowers: any[] = [];
    let totalCost = 0;
    const budget = action === "high-stock" ? 250 : (parseFloat(answers?.budget) || 200);
    const budgetForFlowers = budget / 1.05;

    for (const aiFlower of (parsed.flowers || [])) {
      const realFlower = flowersList.find((f: any) => f.name === aiFlower.name);
      if (!realFlower) {
        console.warn(`"${aiFlower.name}" not found in inventory, skipping`);
        continue;
      }

      let quantity = Math.floor(aiFlower.quantity || 1);
      quantity = Math.min(quantity, realFlower.quantity); // Cap at stock

      const potentialTotal = totalCost + (realFlower.price * quantity);
      if (potentialTotal > budgetForFlowers) {
        const maxAffordable = Math.floor((budgetForFlowers - totalCost) / realFlower.price);
        quantity = Math.min(maxAffordable, realFlower.quantity);
      }

      if (quantity <= 0) continue;

      const lineTotal = realFlower.price * quantity;
      totalCost += lineTotal;

      validatedFlowers.push({
        name: aiFlower.name,
        quantity,
        unit_price: realFlower.price,
        color: aiFlower.color || realFlower.color || "",
        line_total: lineTotal,
      });

      if (totalCost >= budgetForFlowers * 0.95) break;
    }

    const digitalDesignFee = Math.round(totalCost * 0.05);
    const totalPrice = totalCost + digitalDesignFee;

    console.log(`[bouquet-ai] Final: ${validatedFlowers.length} flowers, total=₪${totalPrice}`);

    // Generate bouquet image
    let bouquetImageUrl: string | null = null;

    if (validatedFlowers.length > 0) {
      try {
        const flowerDescriptions = validatedFlowers
          .map((f: any) => `${f.quantity} ${f.color} ${f.name}`)
          .join(", ");

        const imagePrompt = `Create a beautiful, realistic photograph of a professional florist bouquet containing exactly: ${flowerDescriptions}. The bouquet should be elegantly wrapped in kraft paper with a ribbon. Studio lighting, white background, high quality product photography. The flowers should be clearly identifiable and match their described colors precisely.`;

        console.log("[bouquet-ai] Generating bouquet image...");

        const imageResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${LOVABLE_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "google/gemini-2.5-flash-image",
            messages: [{ role: "user", content: imagePrompt }],
            modalities: ["image", "text"],
          }),
        });

        if (imageResponse.ok) {
          const imageData = await imageResponse.json();
          const imageUrl = imageData.choices?.[0]?.message?.images?.[0]?.image_url?.url;
          if (imageUrl) {
            bouquetImageUrl = imageUrl;
            console.log("[bouquet-ai] Image generated successfully");
          } else {
            console.warn("[bouquet-ai] No image in response");
          }
        } else {
          const errText = await imageResponse.text();
          console.error("[bouquet-ai] Image generation failed:", imageResponse.status, errText);
        }
      } catch (imgErr) {
        console.error("[bouquet-ai] Image generation error:", imgErr);
        // Continue without image — non-critical
      }
    }

    return new Response(
      JSON.stringify({
        message: parsed.message || "הנה הזר שלכם! 💐",
        flowers: validatedFlowers,
        flowers_cost: totalCost,
        digital_design_fee: digitalDesignFee,
        total_price: Math.round(totalPrice),
        image_url: bouquetImageUrl,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("[bouquet-ai] error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "שגיאה לא ידועה" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

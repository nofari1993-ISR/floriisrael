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
  // Cleanup old entries periodically
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
    // ── Rate limit: 10 requests per hour per IP ──
    const clientIP = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
                     req.headers.get("x-real-ip") || "unknown";
    if (!checkRateLimit(clientIP, 10, 3600000)) {
      console.warn(`[bouquet-ai] Rate limit exceeded for IP: ${clientIP}`);
      return new Response(
        JSON.stringify({ error: "יותר מדי בקשות. נסו שוב בעוד מספר דקות." }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const body = await req.json();
    const { action, shopId, answers, currentBouquet, userMessage, flowerName, flowerColor } = body;

    // ── Input Validation ──
    if (!action || typeof action !== "string" || !["generate", "modify", "high-stock", "promote-flower"].includes(action)) {
      return new Response(
        JSON.stringify({ error: "Invalid action" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (answers) {
      if (answers.budget && (isNaN(parseFloat(answers.budget)) || parseFloat(answers.budget) > 10000)) {
        return new Response(JSON.stringify({ error: "Invalid budget" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      if (answers.recipient && (typeof answers.recipient !== "string" || answers.recipient.length > 100)) {
        return new Response(JSON.stringify({ error: "Recipient name too long" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      if (answers.occasion && (typeof answers.occasion !== "string" || answers.occasion.length > 200)) {
        return new Response(JSON.stringify({ error: "Occasion text too long" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      if (answers.style && (typeof answers.style !== "string" || answers.style.length > 100)) {
        return new Response(JSON.stringify({ error: "Style text too long" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      if (answers.notes && (typeof answers.notes !== "string" || answers.notes.length > 500)) {
        return new Response(JSON.stringify({ error: "Notes too long" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
    }

    if (userMessage && (typeof userMessage !== "string" || userMessage.length > 500)) {
      return new Response(JSON.stringify({ error: "Message too long" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (flowerName && (typeof flowerName !== "string" || flowerName.length > 50)) {
      return new Response(JSON.stringify({ error: "Flower name too long" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (flowerColor && (typeof flowerColor !== "string" || flowerColor.length > 30)) {
      return new Response(JSON.stringify({ error: "Color name too long" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    console.log(`[bouquet-ai] action=${action}, shopId=${shopId}, IP=${clientIP}`);

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
      const budget = parseFloat(answers.budget) || 200;
      const budgetForFlowers = budget;

      const boostedInstruction = boostedFlowers.length > 0
        ? `\n# ⭐ פרחים מקודמים (עדיפות גבוהה - בעל החנות מבקש לתעדף אותם!):\n${boostedFlowers.map((f: any) => `- ${f.name}${f.color ? ` (${f.color})` : ""}: ${f.quantity} יח', ₪${f.price}`).join("\n")}\nחובה לשלב לפחות פרח מקודם אחד בזר אם הוא מתאים לבקשה!\n`
        : "";

      const colorsRequested = answers.colors || "לא צוין";
      const isColorful = colorsRequested === "צבעוני" || colorsRequested.includes("צבעוני");
      const colorInstruction = isColorful
        ? `הלקוח ביקש זר צבעוני! חובה לשלב לפחות 3-4 צבעים שונים ומגוונים (למשל: אדום, צהוב, כתום, סגול, ורוד, לבן). אל תשתמש רק בגוונים דומים!`
        : `צבעים מועדפים: ${colorsRequested}`;

      const styleRequested = answers.style || "לא צוין";
      const styleInstruction = styleRequested !== "לא צוין"
        ? `סגנון מועדף: ${styleRequested}. התאם את בחירת הפרחים, הכמויות והמראה הכללי לסגנון הזה.`
        : "";

      const flowerTypesRange = budgetForFlowers >= 500 ? "4-8" : budgetForFlowers >= 300 ? "3-6" : "2-4";
      const bouquetSize = budgetForFlowers >= 500 ? "זר גדול ועשיר במיוחד" : budgetForFlowers >= 300 ? "זר בינוני-גדול" : "זר";
      const quantityInstruction = budgetForFlowers >= 500
        ? "השתמש בכמויות גדולות מכל פרח (5-15 יחידות מכל סוג) כדי ליצור זר עשיר ומרשים. נצל את מרבית התקציב!"
        : budgetForFlowers >= 300
          ? "השתמש בכמויות נדיבות (3-8 יחידות מכל סוג) כדי ליצור זר מלא ויפה."
          : "";

      prompt = `אתה מעצב זרי פרחים מקצועי. בנה ${bouquetSize} מגוון עם מספר סוגי פרחים שונים.

# פרחים זמינים במלאי:
${flowersContext}
${boostedInstruction}
# בקשת הלקוח:
- למי: ${answers.recipient || "לא צוין"}
- אירוע: ${answers.occasion || "לא צוין"}
- ${colorInstruction}
${styleInstruction ? `- ${styleInstruction}` : ""}
- תקציב לפרחים: ₪${Math.floor(budgetForFlowers)}
- הערות: ${answers.notes && answers.notes !== "המשך" ? answers.notes : "אין"}

# חובה:
1. בנה ${bouquetSize} עם ${flowerTypesRange} סוגי פרחים שונים (לא רק סוג אחד!)
2. אל תחרוג מ-₪${Math.floor(budgetForFlowers)} - זה קריטי!
3. השתמש רק בפרחים מהמלאי הזמין
4. אם פרח לא זמין, הצע חלופה
5. כל רשומה בזר = צבע אחד בלבד של הפרח
6. ${boostedFlowers.length > 0 ? "תעדף את הפרחים המקודמים (⭐) ותן להם כמות גבוהה יותר בזר" : "בחר פרחים שמתאימים לבקשה"}
${isColorful ? "7. **קריטי**: הזר חייב להיות צבעוני באמת — שלב פרחים מצבעים שונים לחלוטין (אדום + צהוב + סגול + כתום וכו'). לא רק ורוד ואדום!" : ""}
${budgetForFlowers <= 200 ? "8. **חובה**: בתקציב עד ₪200, הזר חייב לכלול צמחי מילוי וירק (כמו אקליפטוס, רוסקוס, שרך, גיבסנית) כדי לתת לזר נפח ומלאות. שלב לפחות 1-2 סוגי ירק/מילוי!" : ""}
${styleRequested !== "לא צוין" ? `9. **סגנון**: התאם את הזר לסגנון "${styleRequested}" — בחר פרחים, כמויות ומבנה שמשדרים את האסתטיקה הזו.` : ""}
${quantityInstruction ? `10. **כמויות**: ${quantityInstruction}` : ""}
${budgetForFlowers >= 500 ? `11. **חשוב**: עם תקציב של ₪${Math.floor(budgetForFlowers)}, הזר חייב להיות גדול, מלא ומרשים. נצל לפחות 80% מהתקציב!` : ""}

# ההודעה שלך (message):
כתוב הודעה חמה ואישית (2-3 משפטים) שמסבירה למה בחרת בפרחים האלה ואיך הם מתאימים לאירוע.
אל תציין מספרים או יחידות של פרחים בטקסט! הלקוח רואה אותם ברשימה.

# פורמט JSON בלבד:
{"message": "הודעה אישית", "flowers": [{"name": "שם מדויק מהמלאי", "quantity": מספר, "color": "צבע"}]}`;
    } else if (action === "modify") {
      const budget = parseFloat(answers?.budget) || 200;
      const budgetForFlowers = budget;
      const currentFlowersList = (currentBouquet?.flowers || [])
        .map((f: any) => `- ${f.quantity} ${f.color || ""} ${f.name} (₪${f.unit_price || 0} ליחידה)`)
        .join("\n");

      const boostedModifyInstruction = boostedFlowers.length > 0
        ? `\n# ⭐ פרחים מקודמים (רקע בלבד):\n${boostedFlowers.map((f: any) => `- ${f.name}${f.color ? ` (${f.color})` : ""}`).join("\n")}\n**חשוב**: השתמש בפרחים מקודמים רק אם הלקוח לא ציין פרח ספציפי (למשל "תוסיף עוד פרחים" בלי לציין איזה). אם הלקוח מבקש פרח מסוים — תמיד תעדיף את בקשת הלקוח!\n`
        : "";

      prompt = `אתה עורך זר פרחים קיים. **המשימה שלך: לבצע בדיוק את מה שהלקוח ביקש.**

# הזר הנוכחי:
${currentFlowersList}
סה"כ: ₪${currentBouquet?.total_price || 0}

# פרחים זמינים במלאי (השתמש רק בשמות המדויקים האלה!):
${flowersContext}
${boostedModifyInstruction}
# תקציב מקסימלי: ₪${Math.floor(budgetForFlowers)}

# הלקוח ביקש:
"${userMessage}"

# חוקים קריטיים (לפי סדר עדיפות!):
1. **עדיפות עליונה — בקשת הלקוח**: בצע בדיוק את מה שהלקוח ביקש. אם הוא ביקש להוסיף חמניות — תוסיף חמניות. אם ביקש להוריד ורדים — תוריד ורדים. לא להחליף לפרחים אחרים!
2. **קריטי**: החזר את הזר המלא המעודכן — כולל כל הפרחים הקודמים + השינויים
3. **קריטי**: השתמש בשמות פרחים מדויקים מרשימת המלאי למעלה (לא שמות חופשיים!)
4. אם הלקוח מבקש להוסיף פרח — הוסף אותו. **כדי להישאר בתקציב**, מותר לך להפחית כמות מפרחים שיש מהם כמות גדולה בזר (למשל אם יש 8 גיבסניות, אפשר להוריד ל-5 כדי לפנות תקציב). עדיף להפחית מפרחי מילוי/ירק לפני פרחים מרכזיים.
5. אם הלקוח מבקש להוריד פרח — הסר רק אותו מהרשימה. השאר את כל השאר!
6. אם הלקוח מבקש לשנות צבע — שנה את שדה color של הפרח הרלוונטי (רק אם הצבע קיים במלאי)
7. אם הלקוח מבקש לשנות כמות — עדכן את quantity בהתאם
8. **נסה להישאר בתקציב** על ידי איזון כמויות. אם בכל זאת חייבים לחרוג — זה בסדר, אבל העדף לאזן.
9. בהודעה (message) — תאר את השינוי שביצעת כולל מה הפחתת כדי לפנות תקציב, בלי מספרים מדויקים
10. **אל תסיר לגמרי פרח שהלקוח לא ביקש להסיר!** אפשר להפחית כמות, אבל לא להסיר סוג שלם.

# פורמט JSON בלבד:
{"message": "הסבר מה שינית", "flowers": [{"name": "שם מדויק מהמלאי", "quantity": מספר, "color": "צבע"}]}`;
    } else if (action === "high-stock") {
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
    const budgetForFlowers = budget;

    const greenNames = ["אקליפטוס", "רוסקוס", "שרך", "גיבסנית"];
    const aiFlowers = parsed.flowers || [];
    const skipBudgetCap = action === "modify"; // Let frontend handle budget approval for modifications

    // Normalize Hebrew flower names for fuzzy matching
    const normalize = (s: string) => s.replace(/[ןםךףץ]/g, (c) => {
      const map: Record<string, string> = { "ן": "נ", "ם": "מ", "ך": "כ", "ף": "פ", "ץ": "צ" };
      return map[c] || c;
    }).replace(/יי/g, "י").replace(/ות$/g, "").replace(/ים$/g, "").trim();

    const findFlowerInInventory = (aiFlower: any) => {
      // 1. Exact match
      let match = flowersList.find((f: any) => f.name === aiFlower.name);
      if (match) return match;

      // 2. Normalized match
      const normalizedAI = normalize(aiFlower.name);
      match = flowersList.find((f: any) => normalize(f.name) === normalizedAI);
      if (match) return match;

      // 3. Contains match (either direction)
      match = flowersList.find((f: any) =>
        f.name.includes(aiFlower.name) || aiFlower.name.includes(f.name)
      );
      if (match) return match;

      // 4. Normalized contains match
      match = flowersList.find((f: any) =>
        normalize(f.name).includes(normalizedAI) || normalizedAI.includes(normalize(f.name))
      );
      if (match) return match;

      // 5. Color-qualified name (e.g. AI returns "ורד אדום" but inventory has "ורד")
      if (aiFlower.color) {
        match = flowersList.find((f: any) =>
          aiFlower.name.includes(f.name) && (!f.color || f.color === aiFlower.color)
        );
        if (match) return match;
      }

      return null;
    };

    const shouldPrioritizeGreens = budgetForFlowers <= 200;
    let orderedFlowers = aiFlowers;
    if (shouldPrioritizeGreens) {
      const greens = aiFlowers.filter((f: any) => greenNames.includes(f.name));
      const nonGreens = aiFlowers.filter((f: any) => !greenNames.includes(f.name));
      orderedFlowers = [...greens, ...nonGreens];
    }

    for (const aiFlower of orderedFlowers) {
      const realFlower = findFlowerInInventory(aiFlower);
      if (!realFlower) {
        console.warn(`[bouquet-ai] "${aiFlower.name}" not found in inventory (normalized: "${normalize(aiFlower.name)}"), skipping`);
        continue;
      }

      // Check if we already have this flower in validated list (avoid duplicates)
      const existingIdx = validatedFlowers.findIndex((f: any) => f.name === realFlower.name && f.color === (aiFlower.color || realFlower.color || ""));
      if (existingIdx !== -1) {
        // Merge quantities
        const existing = validatedFlowers[existingIdx];
        const addQty = Math.min(Math.floor(aiFlower.quantity || 1), realFlower.quantity - existing.quantity);
        if (addQty > 0) {
          existing.quantity += addQty;
          existing.line_total = existing.unit_price * existing.quantity;
          totalCost += existing.unit_price * addQty;
        }
        continue;
      }

      let quantity = Math.floor(aiFlower.quantity || 1);
      quantity = Math.min(quantity, realFlower.quantity);

      const potentialTotal = totalCost + (realFlower.price * quantity);
      if (!skipBudgetCap && potentialTotal > budgetForFlowers) {
        const maxAffordable = Math.floor((budgetForFlowers - totalCost) / realFlower.price);
        quantity = Math.min(maxAffordable, realFlower.quantity);
      }

      if (quantity <= 0) continue;

      const lineTotal = realFlower.price * quantity;
      totalCost += lineTotal;

      validatedFlowers.push({
        name: realFlower.name,  // Use inventory name, not AI name
        quantity,
        unit_price: realFlower.price,
        color: aiFlower.color || realFlower.color || "",
        line_total: lineTotal,
      });

      if (!skipBudgetCap && totalCost >= budgetForFlowers * 0.98) break;
    }

    const digitalDesignFee = 0;
    const totalPrice = totalCost;

    console.log(`[bouquet-ai] Final: ${validatedFlowers.length} flowers, total=₪${totalPrice}`);

    // Generate bouquet image
    let bouquetImageUrl: string | null = null;

    if (validatedFlowers.length > 0) {
      try {
        // Use reduced quantities to avoid showing MORE flowers than listed
        const flowerDescriptions = validatedFlowers
          .map((f: any) => `${Math.max(1, Math.floor(f.quantity * 0.95))} ${f.color} ${f.name}`)
          .join(", ");

        const imagePrompt = `Generate a realistic photograph of a single beautiful florist bouquet, held upright as if on display in a flower shop. The bouquet is wrapped in elegant kraft paper with a ribbon.

The bouquet contains: ${flowerDescriptions}.

Style: Front-facing view, the bouquet is standing upright with flowers visible at the top, professional product photography, soft studio lighting, clean white or light background. Show exactly one bouquet with fewer flowers rather than more. Do not add flowers not listed.`;


        console.log("[bouquet-ai] Generating bouquet image...");

        const imgController = new AbortController();
        const imgTimeout = setTimeout(() => imgController.abort(), 55000); // 55s timeout

        const imageResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${LOVABLE_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "google/gemini-3-pro-image-preview",
            messages: [{ role: "user", content: imagePrompt }],
            modalities: ["image", "text"],
          }),
          signal: imgController.signal,
        });
        clearTimeout(imgTimeout);

        if (imageResponse.ok) {
          const rawText = await imageResponse.text();
          try {
            const imageData = JSON.parse(rawText);
            const imageUrl = imageData.choices?.[0]?.message?.images?.[0]?.image_url?.url;
            if (imageUrl) {
              bouquetImageUrl = imageUrl;
              console.log("[bouquet-ai] Image generated successfully");
            } else {
              console.warn("[bouquet-ai] No image in response");
            }
          } catch (parseErr) {
            console.error("[bouquet-ai] Image response parse error, length:", rawText.length);
          }
        } else {
          const errText = await imageResponse.text();
          console.error("[bouquet-ai] Image generation failed:", imageResponse.status, errText.substring(0, 200));
        }
      } catch (imgErr) {
        console.error("[bouquet-ai] Image generation error:", imgErr);
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

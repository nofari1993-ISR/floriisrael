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
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

    // Verify the caller is an admin
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "לא מורשה" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const anonClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: authError } = await anonClient.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "לא מורשה" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check admin role using service role client
    const serviceClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const { data: isAdmin } = await serviceClient.rpc("has_role", {
      _user_id: user.id,
      _role: "admin",
    });

    if (!isAdmin) {
      console.warn(`[manage-shop-owners] Non-admin user ${user.id} attempted access`);
      return new Response(
        JSON.stringify({ error: "אין הרשאת מנהל" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let body: any;
    try {
      const bodyText = await req.text();
      body = JSON.parse(bodyText);
    } catch (e) {
      return new Response(
        JSON.stringify({ error: "Invalid request body" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    const { action } = body;

    if (!action || !["list", "assign", "remove", "updatePhone"].includes(action)) {
      return new Response(
        JSON.stringify({ error: "Invalid action" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ── LIST: Get all shops with their owner info ──
    if (action === "list") {
      const { data: shops, error: shopsError } = await serviceClient
        .from("shops")
        .select("id, name, location, owner_id, phone")
        .order("name");

      if (shopsError) throw shopsError;

      // Fetch owner emails for shops that have owners
      const ownerIds = shops?.filter((s) => s.owner_id).map((s) => s.owner_id!) || [];
      const ownerEmails: Record<string, string> = {};

      if (ownerIds.length > 0) {
        // Use auth admin to get user emails
        for (const ownerId of ownerIds) {
          const { data: userData } = await serviceClient.auth.admin.getUserById(ownerId);
          if (userData?.user?.email) {
            ownerEmails[ownerId] = userData.user.email;
          }
        }
      }

      const result = shops?.map((shop) => ({
        id: shop.id,
        name: shop.name,
        location: shop.location,
        owner_id: shop.owner_id,
        owner_email: shop.owner_id ? ownerEmails[shop.owner_id] || "לא ידוע" : null,
        phone: shop.phone || null,
      }));

      console.log(`[manage-shop-owners] Listed ${result?.length} shops`);

      return new Response(
        JSON.stringify({ shops: result }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ── ASSIGN: Set a user as shop owner by email ──
    if (action === "assign") {
      const { shopId, email } = body;

      if (!shopId || !email) {
        return new Response(
          JSON.stringify({ error: "חסר shopId או email" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (typeof email !== "string" || email.length > 255) {
        return new Response(
          JSON.stringify({ error: "כתובת מייל לא תקינה" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Look up user by email
      const { data: usersData, error: usersError } = await serviceClient.auth.admin.listUsers();
      if (usersError) throw usersError;

      const targetUser = usersData.users.find(
        (u) => u.email?.toLowerCase() === email.toLowerCase().trim()
      );

      if (!targetUser) {
        return new Response(
          JSON.stringify({ error: `לא נמצא משתמש עם המייל: ${email}` }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Update shop owner
      const { error: updateError } = await serviceClient
        .from("shops")
        .update({ owner_id: targetUser.id })
        .eq("id", shopId);

      if (updateError) throw updateError;

      console.log(`[manage-shop-owners] Assigned user ${targetUser.id} (${email}) to shop ${shopId}`);

      return new Response(
        JSON.stringify({ success: true, owner_id: targetUser.id, owner_email: targetUser.email }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ── REMOVE: Remove owner from a shop ──
    if (action === "remove") {
      const { shopId } = body;

      if (!shopId) {
        return new Response(
          JSON.stringify({ error: "חסר shopId" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const { error: updateError } = await serviceClient
        .from("shops")
        .update({ owner_id: null })
        .eq("id", shopId);

      if (updateError) throw updateError;

      console.log(`[manage-shop-owners] Removed owner from shop ${shopId}`);

      return new Response(
        JSON.stringify({ success: true }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ── UPDATE PHONE: Set or clear shop phone for WhatsApp notifications ──
    if (action === "updatePhone") {
      const { shopId, phone } = body;

      if (!shopId) {
        return new Response(
          JSON.stringify({ error: "חסר shopId" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const cleanPhone = phone ? String(phone).replace(/[^\d]/g, "") : null;
      if (cleanPhone && (cleanPhone.length < 9 || cleanPhone.length > 15)) {
        return new Response(
          JSON.stringify({ error: "מספר טלפון לא תקין" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const { error: updateError } = await serviceClient
        .from("shops")
        .update({ phone: cleanPhone })
        .eq("id", shopId);

      if (updateError) throw updateError;

      console.log(`[manage-shop-owners] Updated phone for shop ${shopId}: ${cleanPhone}`);

      return new Response(
        JSON.stringify({ success: true, phone: cleanPhone }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ error: "Unknown action" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("[manage-shop-owners] error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "שגיאה לא ידועה" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

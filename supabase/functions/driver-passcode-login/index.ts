import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

type LookupResult = {
  ok: boolean;
  user_id?: string;
  driver_code?: string;
  error?: string;
  reason?: string;
};

function json(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return json({ error: "method_not_allowed" }, 405);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!supabaseUrl || !serviceRoleKey) {
    console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
    return json({ error: "server_misconfigured" }, 500);
  }

  let loginId: string;
  let passcode: string;
  try {
    const body = await req.json();
    loginId = String(
      body?.employee_id ?? body?.driver_code ?? "",
    ).trim();
    passcode = String(body?.passcode ?? "").trim();
  } catch {
    return json({ error: "invalid_credentials" }, 401);
  }

  if (!loginId || !passcode) {
    return json({ error: "invalid_credentials" }, 401);
  }

  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: lookupRaw, error: lookupError } = await admin.rpc(
    "driver_app_lookup_by_passcode",
    { p_driver_code: loginId, p_passcode: passcode },
  );

  if (lookupError) {
    console.error("lookup rpc error", lookupError.message);
    return json({ error: "invalid_credentials" }, 401);
  }

  const lookup = lookupRaw as LookupResult;
  if (!lookup?.ok || !lookup.user_id) {
    if (lookup?.error === "driver_blocked") {
      return json(
        {
          error: "driver_blocked",
          reason:
            typeof (lookup as { reason?: unknown }).reason === "string"
              ? (lookup as { reason?: string }).reason
              : null,
        },
        403,
      );
    }
    const err =
      lookup?.error === "driver_not_active"
        ? "driver_not_active"
        : lookup?.error === "driver_archived"
          ? "driver_archived"
          : "invalid_credentials";
    return json({ error: err }, 401);
  }

  const userId = lookup.user_id;

  const { data: userData, error: userError } =
    await admin.auth.admin.getUserById(userId);

  if (userError || !userData?.user?.email) {
    console.error("getUserById error", userError?.message);
    return json({ error: "invalid_credentials" }, 401);
  }

  const email = userData.user.email;

  const { data: linkData, error: linkError } =
    await admin.auth.admin.generateLink({
      type: "magiclink",
      email,
    });

  if (linkError || !linkData?.properties?.hashed_token) {
    console.error("generateLink error", linkError?.message);
    return json({ error: "invalid_credentials" }, 401);
  }

  const { data: sessionData, error: verifyError } = await admin.auth.verifyOtp({
    token_hash: linkData.properties.hashed_token,
    type: "magiclink",
  });

  if (verifyError || !sessionData?.session) {
    console.error("verifyOtp error", verifyError?.message);
    return json({ error: "invalid_credentials" }, 401);
  }

  const session = sessionData.session;

  return json({
    access_token: session.access_token,
    refresh_token: session.refresh_token,
    user_id: userId,
    driver_code: lookup.driver_code ?? loginId,
  });
});

import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const getGitHubMemoryStatus = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await context.supabase.from("github_memory_repos").select("github_login,repo_full_name,last_synced_at,last_error").eq("user_id", context.userId).maybeSingle();
    return data ? { connected: true as const, ...data } : { connected: false as const };
  });

export const startGitHubConnect = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { authorizeAppUserOAuth } = await import("@/integrations/lovable/appUserConnector");
    const { GATEWAY_BASE_URL, GITHUB_SCOPES } = await import("@/lib/github-memory.server");
    const clientAPIKey = process.env["GITHUB_APP_USER_CONNECTOR_CLIENT_API_KEY"];
    if (!clientAPIKey) throw new Error("Connexion GitHub pas encore configurée.");
    const request = getRequest();
    const url = new URL(request.url);
    const sandboxHost = url.hostname === "localhost" ? request.headers.get("x-forwarded-host") : null;
    const returnUrl = new URL("/api/oauth/github/return", sandboxHost ? `https://${sandboxHost}` : url.origin).toString();
    const { authorizationUrl } = await authorizeAppUserOAuth({ gatewayBaseUrl: GATEWAY_BASE_URL, connectorId: "github", appUserId: context.userId, clientAPIKey, returnUrl, credentialsConfiguration: { scopes: GITHUB_SCOPES } });
    return { authorizationUrl };
  });

export const completeGitHubConnect = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { code: string }) => { if (typeof input?.code !== "string" || input.code.length > 2000) throw new Error("Code invalide"); return input; })
  .handler(async ({ data, context }) => {
    const { exchangeAppUserOAuthCode } = await import("@/integrations/lovable/appUserConnector");
    const { saveConnectionKeyForUser } = await import("@/lib/appUserConnections.server");
    const { GATEWAY_BASE_URL, ensureMemoryRepo } = await import("@/lib/github-memory.server");
    const { connectionAPIKey, connectorId } = await exchangeAppUserOAuthCode(GATEWAY_BASE_URL, data.code);
    if (connectorId !== "github") throw new Error("Mauvais service retourné.");
    await saveConnectionKeyForUser(context.userId, "github", connectionAPIKey);
    return ensureMemoryRepo(context.userId);
  });

export const disconnectGitHub = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { disconnectAppUser } = await import("@/integrations/lovable/appUserConnector");
    const { getConnectionKeyForUser, deleteConnectionKeyForUser } = await import("@/lib/appUserConnections.server");
    const { GATEWAY_BASE_URL } = await import("@/lib/github-memory.server");
    const key = await getConnectionKeyForUser(context.userId, "github");
    if (key) await disconnectAppUser({ gatewayBaseUrl: GATEWAY_BASE_URL, connectionAPIKey: key, connectorId: "github" }).catch(e => console.error("[github] disconnect", e instanceof Error ? e.message : e));
    await deleteConnectionKeyForUser(context.userId, "github");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin.from("github_memory_repos").delete().eq("user_id", context.userId);
    return { ok: true };
  });

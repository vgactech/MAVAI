import { callAsAppUser, appUserReconnectRequired } from "@/integrations/lovable/appUserConnector";
import { getConnectionKeyForUser } from "@/lib/appUserConnections.server";
import { memoryRepoName, rootManifest, turnFiles, type TurnInput } from "@/lib/github-memory-layout";

export const GATEWAY_BASE_URL = "https://connector-gateway.lovable.dev";
export const GITHUB_SCOPES = ["read:user", "repo"];

async function gh(key: string, path: string, init?: RequestInit) {
  const headers = new Headers(init?.headers);
  headers.set("Accept", "application/vnd.github+json");
  if (init?.body) headers.set("Content-Type", "application/json");
  const res = await callAsAppUser({ gatewayBaseUrl: GATEWAY_BASE_URL, connectionAPIKey: key, connectorId: "github", path, init: { ...init, headers }, requiredScopes: GITHUB_SCOPES });
  if (await appUserReconnectRequired(res)) throw new Error("RECONNECT_REQUIRED");
  return res;
}
async function ghJson<T>(key: string, path: string, init?: RequestInit): Promise<T> {
  const res = await gh(key, path, init);
  if (!res.ok) throw new Error(`GitHub ${res.status}: ${(await res.text()).slice(0, 300)}`);
  return res.json() as Promise<T>;
}

/** One atomic commit with many files (Git Data API). */
async function commitFiles(key: string, repo: string, files: Record<string, string>, message: string) {
  const ref = await ghJson<{ object: { sha: string } }>(key, `/repos/${repo}/git/ref/heads/main`);
  const parent = await ghJson<{ tree: { sha: string } }>(key, `/repos/${repo}/git/commits/${ref.object.sha}`);
  const tree = await ghJson<{ sha: string }>(key, `/repos/${repo}/git/trees`, { method: "POST", body: JSON.stringify({ base_tree: parent.tree.sha, tree: Object.entries(files).map(([path, content]) => ({ path, mode: "100644", type: "blob", content })) }) });
  const commit = await ghJson<{ sha: string }>(key, `/repos/${repo}/git/commits`, { method: "POST", body: JSON.stringify({ message, tree: tree.sha, parents: [ref.object.sha] }) });
  await ghJson(key, `/repos/${repo}/git/refs/heads/main`, { method: "PATCH", body: JSON.stringify({ sha: commit.sha }) });
  return commit.sha;
}

/** Creates (or re-adopts) the user's private memory repo and records it with an owner marker. */
export async function ensureMemoryRepo(userId: string) {
  const key = await getConnectionKeyForUser(userId, "github");
  if (!key) throw new Error("NOT_CONNECTED");
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const user = await ghJson<{ login: string }>(key, "/user");
  const { data: existing } = await supabaseAdmin.from("github_memory_repos").select("*").eq("user_id", userId).maybeSingle();
  const name = memoryRepoName(userId);
  let repo: { id: number; full_name: string; owner: { login: string } };
  const found = await gh(key, `/repos/${user.login}/${name}`);
  if (found.ok) repo = await found.json();
  else if (found.status === 404) repo = await ghJson(key, "/user/repos", { method: "POST", body: JSON.stringify({ name, private: true, auto_init: true, description: "Mémoire MAVAI : prompts, raisonnements, tâches et commandes. Ne pas renommer." }) });
  else throw new Error(`GitHub ${found.status}`);
  if (repo.owner.login !== user.login) throw new Error("Dépôt mémoire appartenant à un autre compte.");
  let marker = existing?.owner_marker;
  if (!existing || existing.repo_id !== repo.id) {
    const { data, error } = await supabaseAdmin.from("github_memory_repos").upsert({ user_id: userId, github_login: user.login, repo_full_name: repo.full_name, repo_id: repo.id, updated_at: new Date().toISOString() }, { onConflict: "user_id" }).select("owner_marker").single();
    if (error) throw error;
    marker = data.owner_marker;
  }
  // auto_init commit can lag a moment after creation; retry the first write briefly.
  for (let i = 0; i < 4; i++) {
    try { await commitFiles(key, repo.full_name, { "manifest.json": JSON.stringify(rootManifest(userId, marker!, user.login), null, 2) + "\n", "README.md": "# Mémoire MAVAI\n\nDépôt privé géré par MAVAI. Chaque échange y est rangé : `conversations/`, `ai-runs/`, `tasks/`, `events/`.\n" }, "MAVAI: initialisation de la mémoire"); break; }
    catch (e) { if (i === 3) throw e; await new Promise(r => setTimeout(r, 1500)); }
  }
  return { login: user.login, repo: repo.full_name };
}

/** Writes one chat turn. Verifies repo id and owner marker before writing so nothing lands in the wrong place. */
export async function syncTurnToGitHub(t: Omit<TurnInput, "ownerMarker">) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data: link } = await supabaseAdmin.from("github_memory_repos").select("*").eq("user_id", t.ownerId).maybeSingle();
  if (!link) return;
  try {
    const key = await getConnectionKeyForUser(t.ownerId, "github");
    if (!key) return;
    const repo = await ghJson<{ id: number }>(key, `/repos/${link.repo_full_name}`);
    if (repo.id !== link.repo_id) throw new Error("Identifiant du dépôt différent : écriture refusée.");
    const mf = await ghJson<{ content: string }>(key, `/repos/${link.repo_full_name}/contents/manifest.json`);
    const manifest = JSON.parse(Buffer.from(mf.content, "base64").toString("utf8")) as { owner_id?: string; owner_marker?: string };
    if (manifest.owner_id !== t.ownerId || manifest.owner_marker !== link.owner_marker) throw new Error("Marqueur du propriétaire différent : écriture refusée.");
    await commitFiles(key, link.repo_full_name, turnFiles({ ...t, ownerMarker: link.owner_marker }), `MAVAI: échange ${t.assistantMessageId}`);
    await supabaseAdmin.from("github_memory_repos").update({ last_synced_at: new Date().toISOString(), last_error: null }).eq("user_id", t.ownerId);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Erreur inconnue";
    console.error("[github-memory] sync failed", msg);
    await supabaseAdmin.from("github_memory_repos").update({ last_error: msg === "RECONNECT_REQUIRED" ? "Reconnexion GitHub nécessaire" : msg.slice(0, 300) }).eq("user_id", t.ownerId);
  }
}

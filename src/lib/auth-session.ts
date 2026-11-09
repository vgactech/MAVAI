import { supabase } from "@/integrations/supabase/client";

export type MAVAIUser = { id: string; email?: string; name?: string; avatar_url?: string };

/** Returns the signed-in user from Lovable Cloud, or null. */
export async function getCurrentUser(): Promise<MAVAIUser | null> {
  const { data } = await supabase.auth.getSession();
  const u = data.session?.user;
  if (!u) return null;
  const meta = (u.user_metadata ?? {}) as Record<string, unknown>;
  const user: MAVAIUser = { id: u.id };
  if (u.email) user.email = u.email;
  const name = (meta["full_name"] ?? meta["name"]) as string | undefined;
  if (name) user.name = name;
  const avatar = meta["avatar_url"] as string | undefined;
  if (avatar) user.avatar_url = avatar;
  return user;
}

export async function signOutUser(): Promise<void> {
  await supabase.auth.signOut();
}

// Lovable OAuth integration — no Supabase dependency
import { createLovableAuth } from "@lovable.dev/cloud-auth-js";
import type { OAuthProvider } from "@lovable.dev/cloud-auth-js";

const lovableAuth = createLovableAuth();

type SignInOptions = {
  redirect_uri?: string;
  extraParams?: Record<string, string>;
};

// Session stored in sessionStorage to survive soft navigation
const SESSION_KEY = "klerio_session";

export type KlerioSession = {
  access_token: string;
  refresh_token?: string;
  user: {
    id: string;
    email?: string;
    name?: string;
    avatar_url?: string;
  };
};

export const lovable = {
  auth: {
    signInWithOAuth: async (provider: OAuthProvider, opts?: SignInOptions) => {
      const result = await lovableAuth.signInWithOAuth(provider, {
        ...opts,
        extraParams: {
          ...opts?.extraParams,
        },
      });

      if (result.redirected) return result;
      if (result.error) return result;

      // Store tokens locally (no Supabase)
      if (result.tokens) {
        const tokens = result.tokens as unknown as Record<string, unknown>;
        const rawUser = (tokens["user"] ?? {}) as unknown as Record<string, unknown>;
        const meta = (rawUser["user_metadata"] ?? {}) as unknown as Record<string, unknown>;
        const userId = (rawUser["id"] as string | undefined) ?? crypto.randomUUID();
        const userEmail = rawUser["email"] as string | undefined;
        const userName = meta["name"] as string | undefined;
        const userAvatar = meta["avatar_url"] as string | undefined;
        const sessionUser: KlerioSession["user"] = { id: userId };
        if (userEmail !== undefined) sessionUser.email = userEmail;
        if (userName !== undefined) sessionUser.name = userName;
        if (userAvatar !== undefined) sessionUser.avatar_url = userAvatar;
        const session: KlerioSession = {
          access_token: result.tokens.access_token,
          refresh_token: result.tokens.refresh_token,
          user: sessionUser,
        };
        sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
      }
      return result;
    },

    getSession: (): KlerioSession | null => {
      if (typeof sessionStorage === "undefined") return null;
      const raw = sessionStorage.getItem(SESSION_KEY);
      if (!raw) return null;
      try {
        return JSON.parse(raw) as KlerioSession;
      } catch {
        return null;
      }
    },

    signOut: (): void => {
      if (typeof sessionStorage !== "undefined") {
        sessionStorage.removeItem(SESSION_KEY);
      }
    },
  },
};

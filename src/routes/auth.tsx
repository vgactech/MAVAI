import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, type FormEvent } from "react";
import { toast } from "sonner";
import { lovable } from "@/integrations/lovable";
import { getCurrentUser } from "@/lib/auth-session";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { MavaiMark } from "@/components/MavaiMark";
import { ThemeToggle } from "@/components/ThemeToggle";
import { SentinelVideo } from "@/components/SentinelVideo";
import sentinelAsset from "@/assets/videos/binance-sentinel-mavai.mp4.asset.json";
import sentinelPoster from "@/assets/videos/binance-sentinel-mavai-poster.png.asset.json";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
       { title: "Connexion — MAVAI" },
      { name: "description", content: "Connecte-toi ou crée ton compte MAVAI." },
      { property: "og:title", content: "Connexion — MAVAI" },
      { property: "og:description", content: "Connecte-toi ou crée ton compte MAVAI." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();

  // If already logged in, redirect straight to chat
  useEffect(() => {
    const go = () => navigate({ to: "/dashboard", replace: true });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      if (session) go();
    });
    // Retour OAuth plein écran : les jetons arrivent dans l'ancre de l'URL.
    const hash = new URLSearchParams(window.location.hash.slice(1));
    const access_token = hash.get("access_token");
    const refresh_token = hash.get("refresh_token");
    if (access_token && refresh_token) {
      window.history.replaceState(null, "", window.location.pathname);
      void supabase.auth.setSession({ access_token, refresh_token }).then(({ error }) => {
        if (error) toast.error(error.message);
      });
    } else {
      void getCurrentUser().then((u) => {
        if (u) go();
      });
    }
    return () => sub.subscription.unsubscribe();
  }, [navigate]);

  async function social(provider: "google" | "lovable") {
    const res = await lovable.auth.signInWithOAuth(provider, {
      redirect_uri: window.location.origin + "/auth",
    });
    if (res && "error" in res && res.error) {
      toast.error(String((res.error as { message?: string }).message ?? res.error));
    } else if (!("redirected" in res && res.redirected)) {
      // After OAuth redirect, session is stored → go to dashboard
      navigate({ to: "/dashboard", replace: true });
    }
  }

  // Simple email/password form — sends magic link via Lovable
  async function handleEmailForm(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const email = String(fd.get("email") ?? "");
    if (!email) return;
    toast.info(
      "Fonctionnalité e-mail bientôt disponible — utilise Google ou Lovable pour l'instant.",
    );
  }

  return (
    <main className="min-h-dvh bg-background text-foreground">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-5xl items-center gap-3 px-4 py-4 sm:px-6">
          <MavaiMark className="size-8" />
          <span className="font-display font-semibold">MAVAI</span>
          <div className="flex-1" />
          <ThemeToggle />
        </div>
      </header>
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-12">
        <SentinelVideo videoUrl={sentinelAsset.url} posterUrl={sentinelPoster.url} />
      <div className="mx-auto mt-10 w-full max-w-sm space-y-6 rounded-lg border border-border bg-card p-6">
        <h1 className="text-2xl font-semibold text-card-foreground">MAVAI</h1>

        <div className="space-y-2">
          <Button variant="outline" className="w-full" onClick={() => social("google")}>
            Continuer avec Google
          </Button>
          <Button variant="outline" className="w-full" onClick={() => social("lovable")}>
            Continuer avec Lovable
          </Button>
        </div>

        <form onSubmit={handleEmailForm} className="space-y-3">
          <p className="text-xs text-muted-foreground text-center">ou par e-mail (bientôt)</p>
          <input
            name="email"
            type="email"
            placeholder="ton@email.com"
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
          />
          <Button type="submit" className="w-full" variant="secondary">
            Envoyer un lien magique
          </Button>
        </form>
      </div>
      </div>
    </main>
  );
}

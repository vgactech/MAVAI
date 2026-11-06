import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, type FormEvent } from "react";
import { toast } from "sonner";
import { lovable } from "@/integrations/lovable";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
       { title: "Connexion — Owly" },
      { name: "description", content: "Connecte-toi ou crée ton compte Owly." },
      { property: "og:title", content: "Connexion — Owly" },
      { property: "og:description", content: "Connecte-toi ou crée ton compte Owly." },
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
    const session = lovable.auth.getSession();
    if (session) {
      navigate({ to: "/dashboard", replace: true });
    }
  }, [navigate]);

  async function social(provider: "google" | "lovable") {
    const res = await lovable.auth.signInWithOAuth(provider, {
      redirect_uri: window.location.origin + "/auth",
    });
    if (res && "error" in res && res.error) {
      toast.error(String((res.error as { message?: string }).message ?? res.error));
    } else {
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
    <main className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm space-y-6 rounded-xl border border-border bg-card p-6">
        <h1 className="text-2xl font-semibold text-card-foreground">Owly</h1>

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
    </main>
  );
}

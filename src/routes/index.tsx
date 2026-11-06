import { createFileRoute, Link } from "@tanstack/react-router";
import { lovable } from "@/integrations/lovable";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "MAVAI" },
      { name: "description", content: "MAVAI — Mémoire Artificielle Visuelle & IA. Plateforme universelle d'intelligence artificielle." },
      { property: "og:title", content: "MAVAI" },
      { property: "og:description", content: "MAVAI — Powered by ARTcB blockchain." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Home,
});

function Home() {
  const session = lovable.auth.getSession();
  const signedIn = !!session;

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 bg-background px-4 text-center">
      <h1 className="text-5xl font-semibold tracking-tight text-foreground">MAVAI</h1>
      <p className="text-sm text-muted-foreground max-w-md">
        Mémoire Artificielle Visuelle &amp; IA — plateforme universelle d'intelligence artificielle, hébergée sur ARTcB.
      </p>
      <Button asChild>
        <Link to={signedIn ? "/dashboard" : "/auth"}>
          {signedIn ? "Mon espace MAVAI" : "Se connecter / S'inscrire"}
        </Link>
      </Button>
    </main>
  );
}

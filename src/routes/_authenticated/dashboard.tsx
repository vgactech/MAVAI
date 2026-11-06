import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { lovable } from "@/integrations/lovable";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Mon espace — Owly" },
      { name: "description", content: "Ton espace personnel Owly." },
      { property: "og:title", content: "Mon espace — Owly" },
      { property: "og:description", content: "Ton espace personnel Owly." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const { user } = Route.useRouteContext();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  function signOut() {
    queryClient.cancelQueries();
    queryClient.clear();
    lovable.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  return (
    <main className="mx-auto max-w-2xl space-y-6 px-4 py-16">
      <h1 className="text-3xl font-semibold text-foreground">Bienvenue sur Owly</h1>
      <p className="text-muted-foreground">
        Connecté en tant que{" "}
        <span className="font-medium">{user.email ?? user.name ?? user.id}</span>
      </p>
      <div className="flex gap-3">
        <Button asChild>
          {/* /play — sélecteur de classe Owly */}
          <Link to={"/play" as "/"}>Choisir ma classe</Link>
        </Button>
        <Button asChild variant="secondary">
          {/* /chat added to route tree — type cast until routeTree.gen.ts is regenerated */}
          <Link to={"/chat" as "/"}>Ouvrir le chat</Link>
        </Button>
        <Button variant="outline" onClick={signOut}>
          Se déconnecter
        </Button>
      </div>
    </main>
  );
}

import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { Brain, Clapperboard, LogOut, MessageSquare, Radar, Users } from "lucide-react";
import { signOutUser } from "@/lib/auth-session";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { MavaiMark } from "@/components/MavaiMark";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Tableau de bord — MAVAI" },
      { name: "description", content: "Votre espace MAVAI : chat, mémoire, agents et Signal Desk." },
      { property: "og:title", content: "Tableau de bord — MAVAI" },
      { property: "og:description", content: "Votre espace MAVAI." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Dashboard,
});

const MODULES = [
  { icon: Users, title: "Character Studio", to: "/character-studio" as const, text: "Identités visuelles, références et versions de personnages." },
  { icon: Clapperboard, title: "Productions", to: "/projects" as const, text: "Scènes, plans, références et décisions artistiques." },
  { icon: Brain, title: "Continuité", to: "/continuity" as const, text: "Comparaison de références visuelles." },
  { icon: Clapperboard, title: "Audio Studio", to: "/audio-studio" as const, text: "Pistes indépendantes, mixage et export WAV." },
  { icon: Clapperboard, title: "Frame Control", to: "/frame-control" as const, text: "Extraction d’images et corrections localisées." },
  {
    icon: Radar,
    title: "Signal Desk",
    to: "/signal-desk" as const,
    text: "Recherche vidéo, sujets émergents et briefings éditoriaux sourcés.",
  },
  {
    icon: Brain,
    title: "Mémoire",
    to: "/memoire" as const,
    text: "Une mémoire persistante de vos échanges, documents et décisions.",
  },
  {
    icon: Users,
    title: "Agents",
    to: "/agents" as const,
    text: "Des spécialistes qui se répartissent les tâches et vérifient les résultats.",
  },
  {
    icon: Clapperboard,
    title: "Studio",
    to: "/studio" as const,
    text: "Création d’images à partir de votre direction artistique.",
  },
];

function Dashboard() {
  const { user } = Route.useRouteContext();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const firstName = (user.name ?? user.email ?? "").split(/[ @]/)[0];

  async function signOut() {
    queryClient.clear();
    await signOutUser();
    navigate({ to: "/auth", replace: true });
  }

  return (
    <div className="min-h-dvh bg-background text-foreground">
      <header className="flex items-center gap-3 border-b border-border px-6 py-3">
        <Link to="/" className="flex items-center gap-2">
          <MavaiMark className="size-7" />
          <span className="font-display font-semibold">MAVAI</span>
        </Link>
        <div className="flex-1" />
        <span className="hidden text-xs text-muted-foreground sm:inline">{user.email}</span>
        <ThemeToggle />
        <Button variant="ghost" size="icon" onClick={signOut} aria-label="Se déconnecter">
          <LogOut className="size-4" />
        </Button>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-12">
        <p className="text-sm text-muted-foreground">Votre espace de production</p>
        <h1 className="mt-1 text-3xl font-semibold sm:text-4xl">
          Bonjour{firstName ? ` ${firstName}` : ""}.
        </h1>

        <Link
          to="/chat"
          className="group mt-8 flex flex-col gap-4 rounded-3xl bg-primary p-8 text-primary-foreground transition hover:opacity-95 sm:flex-row sm:items-center"
        >
          <MessageSquare className="size-10 shrink-0" />
          <div className="flex-1">
            <h2 className="text-xl font-semibold">Parler à MAVAI</h2>
            <p className="mt-1 text-sm opacity-80">
              Écrivez, parlez au micro ou envoyez une image. MAVAI répond à l'écrit ou à voix haute.
            </p>
          </div>
          <span className="rounded-full bg-primary-foreground px-5 py-2 text-sm font-medium text-primary">
            Ouvrir le chat →
          </span>
        </Link>

        <h2 className="mt-12 text-lg font-semibold">Modules MAVAI</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {MODULES.map(({ icon: Icon, title, text, to }) => (
            <Link key={title} to={to} className="rounded-2xl border border-border bg-card p-6 transition hover:border-foreground/30">
              <div className="flex items-center justify-between">
                <Icon className="size-6 text-accent" />
                <span className="text-sm text-muted-foreground">Ouvrir →</span>
              </div>
              <h3 className="mt-4 font-semibold">{title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{text}</p>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}

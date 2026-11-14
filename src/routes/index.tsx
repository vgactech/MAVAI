import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  AlertTriangle,
  Brain,
  CheckCircle2,
  Clapperboard,
  FileSearch,
  Layers,
  Network,
  Radar,
  ShieldCheck,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { MavaiMark } from "@/components/MavaiMark";
import { getCurrentUser } from "@/lib/auth-session";
import { QRCodeSVG } from "qrcode.react";

const PUBLIC_URL = "https://mavaidrmanathan.lovable.app";
import sentinelPoster from "@/assets/videos/binance-sentinel-mavai-poster.png.asset.json";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "MAVAI — Production audiovisuelle assistée" },
      {
        name: "description",
        content:
          "MAVAI : mémoire artificielle, agents spécialisés et preuves traçables. Une intelligence centrale pour comprendre la vidéo, créer et décider.",
      },
      { property: "og:title", content: "MAVAI — L'intelligence qui se souvient et vérifie" },
      {
        property: "og:description",
        content: "Mémoire persistante, agents spécialisés et traçabilité des preuves, sur l'infrastructure ARTcB.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Home,
});

const PROBLEMS = [
  {
    icon: Brain,
    title: "Les IA oublient",
    text: "Chaque conversation repart de zéro. Le contexte, les décisions et les documents se perdent.",
  },
  {
    icon: AlertTriangle,
    title: "Des réponses sans preuves",
    text: "Impossible de savoir d'où vient une conclusion, ni si elle est vraiment justifiée.",
  },
  {
    icon: FileSearch,
    title: "La vidéo reste opaque",
    text: "Les conversations publiques passent par la vidéo, mais les outils ne lisent que les hashtags et descriptions.",
  },
  {
    icon: Layers,
    title: "Des outils éparpillés",
    text: "Recherche, création, analyse : un outil par usage, aucune intelligence commune.",
  },
];

const SOLUTIONS = [
  {
    icon: Brain,
    title: "Mémoire persistante",
    text: "MAVAI se souvient de vos échanges, documents et décisions dans le temps.",
  },
  {
    icon: Users,
    title: "Agents spécialisés",
    text: "Recherche, compréhension, synthèse et vérification : chaque tâche à son spécialiste.",
  },
  {
    icon: ShieldCheck,
    title: "Traçabilité de bout en bout",
    text: "De la source originale à la synthèse finale, chaque conclusion est reliée à sa preuve.",
  },
  {
    icon: Network,
    title: "Un seul cerveau, plusieurs produits",
    text: "Studio, Signal Desk, Mémoire et Agents partagent la même intelligence centrale.",
  },
];

const AGENTS = [
  "Planificateur",
  "Chercheur",
  "Rédacteur",
  "Vérificateur",
];

const PRODUCTS = [
  { icon: Clapperboard, name: "MAVAI Studio", text: "Cinéma, animation, jeux et création." },
  { icon: Radar, name: "MAVAI Signal Desk", text: "Recherche vidéo, tendances et briefing éditorial." },
  { icon: Brain, name: "MAVAI Memory", text: "Mémoire globale et connaissances évaluées." },
  { icon: Users, name: "MAVAI Agents", text: "Spécialistes, délégation et exécution." },
];

function Home() {
  const [signedIn, setSignedIn] = useState(false);
  useEffect(() => {
    void getCurrentUser().then((u) => setSignedIn(!!u));
  }, []);
  const cta = signedIn ? "/dashboard" : "/auth";

  return (
    <div className="min-h-dvh bg-background text-foreground">
      <header className="sticky top-0 z-10 border-b border-border bg-background/85 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-6 py-3">
          <MavaiMark className="size-7" />
          <span className="font-display font-semibold">MAVAI</span>
          <nav className="ml-6 hidden gap-5 text-sm text-muted-foreground md:flex">
            <a href="#probleme" className="hover:text-foreground">Problème</a>
            <a href="#solution" className="hover:text-foreground">Solution</a>
            <a href="#fonctionnement" className="hover:text-foreground">Fonctionnement</a>
            <a href="#produits" className="hover:text-foreground">Produits</a>
          </nav>
          <div className="flex-1" />
          <ThemeToggle />
          <Button asChild size="sm">
            <Link to={cta}>{signedIn ? "Mon espace" : "Se connecter"}</Link>
          </Button>
        </div>
      </header>

      {/* Hero */}
      <section className="relative border-b border-border">
        <img src={sentinelPoster.url} alt="Binance Sentinel, simulation audiovisuelle MAVAI" className="absolute inset-0 h-full w-full object-cover opacity-15" />
        <div className="relative mx-auto grid max-w-6xl gap-10 px-6 pb-16 pt-16 sm:pt-24 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
        <div className="min-w-0">
        <p className="text-sm font-medium text-accent">Mémoire Artificielle Visuelle & IA</p>
        <h1 className="mt-4 max-w-4xl text-4xl font-semibold leading-[1.05] sm:text-6xl">
          MAVAI
        </h1>
        <p className="mt-6 max-w-2xl text-lg text-muted-foreground">
          Votre atelier de production audiovisuelle : personnages, scénarios, plans, continuité et son.
          Des références conservées, des propositions assistées et vos décisions artistiques au centre.
        </p>
        <div className="mt-10 flex flex-wrap gap-3">
          <Button asChild size="lg">
            <Link to={cta}>Parler à MAVAI</Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <a href="#probleme">Voir le pitch</a>
          </Button>
        </div>
        </div>
        <figure className="flex flex-col items-center gap-4 justify-self-center rounded-2xl border border-border bg-background p-6 shadow-lg lg:justify-self-end">
          <QRCodeSVG value={PUBLIC_URL} size={384} marginSize={2} title="QR code vers la plateforme MAVAI DR MANATHAN" className="h-auto w-64 max-w-full rounded bg-background sm:w-80 lg:w-96" />
          <figcaption className="text-center text-sm">
            <span className="block font-semibold">Scannez pour accéder à la plateforme</span>
            <a href={PUBLIC_URL} className="mt-1 block break-all text-muted-foreground underline">{PUBLIC_URL.replace("https://", "")}</a>
          </figcaption>
        </figure>
        </div>
      </section>

      {/* Problem */}
      <section id="probleme" className="border-t border-border bg-card">
        <div className="mx-auto max-w-6xl px-6 py-20">
          <SlideLabel n="01" label="Le problème" />
          <h2 className="mt-3 max-w-3xl text-3xl font-semibold sm:text-4xl">
            Les IA actuelles parlent beaucoup, retiennent peu et ne prouvent rien.
          </h2>
          <div className="mt-12 grid gap-4 sm:grid-cols-2">
            {PROBLEMS.map(({ icon: Icon, title, text }) => (
              <div key={title} className="rounded-2xl border border-border bg-background p-6">
                <Icon className="size-6 text-destructive" />
                <h3 className="mt-4 text-lg font-semibold">{title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Solution */}
      <section id="solution" className="border-t border-border">
        <div className="mx-auto max-w-6xl px-6 py-20">
          <SlideLabel n="02" label="La solution" />
          <h2 className="mt-3 max-w-3xl text-3xl font-semibold sm:text-4xl">
            MAVAI : un cerveau unique qui mémorise, coordonne et vérifie.
          </h2>
          <div className="mt-12 grid gap-4 sm:grid-cols-2">
            {SOLUTIONS.map(({ icon: Icon, title, text }) => (
              <div key={title} className="rounded-2xl border border-border bg-card p-6">
                <Icon className="size-6 text-accent" />
                <h3 className="mt-4 text-lg font-semibold">{title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="fonctionnement" className="border-t border-border bg-primary text-primary-foreground">
        <div className="mx-auto max-w-6xl px-6 py-20">
          <SlideLabel n="03" label="Fonctionnement" inverted />
          <h2 className="mt-3 max-w-3xl text-3xl font-semibold sm:text-4xl">
            Une mission, quatre agents, un livrable à vérifier.
          </h2>
          <p className="mt-4 max-w-2xl opacity-75">
            Du brief au scénario, MAVAI répartit la préparation et la vérification du travail :
          </p>
          <ol className="mt-10 grid gap-3 sm:grid-cols-3">
            {AGENTS.map((a, i) => (
              <li key={a} className="rounded-2xl border border-primary-foreground/20 p-5">
                <span className="text-xs opacity-60">Agent {i + 1}</span>
                <p className="mt-1 font-semibold">{a}</p>
              </li>
            ))}
          </ol>
          <ul className="mt-10 grid gap-3 text-sm sm:grid-cols-2">
            {[
              "Vidéos pertinentes et sujets émergents",
              "Positions, arguments et évolution dans le temps",
              "Preuves consultables pour chaque conclusion",
              "Briefing éditorial exportable",
            ].map((r) => (
              <li key={r} className="flex items-center gap-2">
                <CheckCircle2 className="size-4 shrink-0" /> {r}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Products */}
      <section id="produits" className="border-t border-border">
        <div className="mx-auto max-w-6xl px-6 py-20">
          <SlideLabel n="04" label="Écosystème" />
          <h2 className="mt-3 max-w-3xl text-3xl font-semibold sm:text-4xl">
            Créer de nouveaux produits sans reconstruire le cerveau.
          </h2>
          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {PRODUCTS.map(({ icon: Icon, name, text }) => (
              <div key={name} className="rounded-2xl border border-border bg-card p-6">
                <Icon className="size-6 text-accent" />
                <h3 className="mt-4 font-semibold">{name}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{text}</p>
              </div>
            ))}
          </div>
          <div className="mt-6 grid gap-4 text-sm sm:grid-cols-3">
            {[
              ["ARTcB", "Infrastructure, identité, hébergement et services"],
              ["LUMVORAX2", "Calcul natif et traitements spécialisés"],
              ["ARTCB-TERMINATOR", "Supervision, sécurité et provenance"],
            ].map(([n, t]) => (
              <div key={n} className="rounded-2xl bg-secondary p-5">
                <p className="font-semibold">{n}</p>
                <p className="mt-1 text-muted-foreground">{t}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-border bg-card">
        <div className="mx-auto flex max-w-6xl flex-col items-start gap-6 px-6 py-20 sm:flex-row sm:items-center">
          <h2 className="flex-1 text-3xl font-semibold">Essayez MAVAI maintenant.</h2>
          <Button asChild size="lg">
            <Link to={cta}>{signedIn ? "Ouvrir mon espace" : "Créer mon compte"}</Link>
          </Button>
        </div>
      </section>

      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-6xl items-center gap-2 px-6 py-8 text-xs text-muted-foreground">
          <MavaiMark className="size-5" /> MAVAI × ARTcB — {new Date().getFullYear()}
        </div>
      </footer>
    </div>
  );
}

function SlideLabel({ n, label, inverted }: { n: string; label: string; inverted?: boolean }) {
  return (
    <p className={"text-sm font-medium " + (inverted ? "opacity-70" : "text-accent")}>
      {n} — {label}
    </p>
  );
}

import { projectSearch } from "@/lib/project-scope";
import { createFileRoute } from "@tanstack/react-router";
import { ModuleShell } from "@/components/ModuleShell";
import { WorkModule } from "@/components/WorkModule";

export const Route = createFileRoute("/_authenticated/signal-desk")({ validateSearch: projectSearch,
  head: () => ({
    meta: [
      { title: "Signal Desk — MAVAI" },
      { name: "description", content: "Briefings éditoriaux, sujets émergents et angles vidéo générés par MAVAI." },
      { property: "og:title", content: "Signal Desk — MAVAI" },
      { property: "og:description", content: "Briefings éditoriaux générés par MAVAI." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => (
    <ModuleShell title="Signal Desk" subtitle="Donnez un sujet : MAVAI prépare un briefing éditorial avec sujets émergents et angles vidéo.">
      <WorkModule
        kind="briefing"
        placeholder="Sujet du briefing (ex. l'IA dans l'éducation)…"
        action="Générer le briefing"
        busyLabel="Rédaction…"
        examples={["Intelligence artificielle et emploi", "Blockchain en Afrique", "Tendances YouTube tech"]}
      />
    </ModuleShell>
  ),
});

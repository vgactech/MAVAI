import { projectSearch } from "@/lib/project-scope";
import { createFileRoute } from "@tanstack/react-router";
import { ModuleShell } from "@/components/ModuleShell";
import { WorkModule } from "@/components/WorkModule";

export const Route = createFileRoute("/_authenticated/studio")({ validateSearch: projectSearch,
  head: () => ({
    meta: [
      { title: "Studio — MAVAI" },
      { name: "description", content: "Créez des images et visuels avec le Studio MAVAI." },
      { property: "og:title", content: "Studio — MAVAI" },
      { property: "og:description", content: "Création visuelle MAVAI." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => (
    <ModuleShell title="Studio" subtitle="Décrivez une image : MAVAI la crée pour vous.">
      <WorkModule
        kind="image"
        placeholder="Décrivez l'image (ex. un œil futuriste en néon bleu, style affiche)…"
        action="Créer l'image"
        busyLabel="Création…"
        examples={["Logo minimaliste d'un œil", "Personnage robot amical, style 3D", "Affiche futuriste d'une ville"]}
      />
    </ModuleShell>
  ),
});

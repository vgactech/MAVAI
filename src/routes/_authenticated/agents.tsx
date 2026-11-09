import { projectSearch } from "@/lib/project-scope";
import { createFileRoute } from "@tanstack/react-router";
import { ModuleShell } from "@/components/ModuleShell";
import { WorkModule } from "@/components/WorkModule";

export const Route = createFileRoute("/_authenticated/agents")({ validateSearch: projectSearch,
  head: () => ({
    meta: [
      { title: "Agents — MAVAI" },
      { name: "description", content: "Quatre agents MAVAI planifient, cherchent, rédigent et vérifient vos missions." },
      { property: "og:title", content: "Agents — MAVAI" },
      { property: "og:description", content: "Agents spécialisés MAVAI." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => (
    <ModuleShell
      title="Agents"
      subtitle="Planificateur → Chercheur → Rédacteur → Vérificateur. Confiez une mission, les agents se la répartissent."
    >
      <WorkModule
        kind="agents"
        placeholder="Votre mission (ex. rédiger un plan marketing pour lancer MAVAI)…"
        action="Lancer les agents"
        busyLabel="Les agents travaillent (~1 min)…"
        examples={["Plan de lancement de MAVAI", "Résumé d'investissement ARTcB", "Script vidéo de 2 minutes"]}
      />
    </ModuleShell>
  ),
});

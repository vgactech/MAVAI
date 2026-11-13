import { projectSearch } from "@/lib/project-scope";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { MessageSquare, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ModuleShell } from "@/components/ModuleShell";
import { GitHubMemoryCard } from "@/components/GitHubMemoryCard";
import {
  addMemory,
  deleteConversation,
  deleteMemory,
  listConversations,
  listMemories,
} from "@/lib/modules.functions";

export const Route = createFileRoute("/_authenticated/memoire")({ validateSearch: projectSearch,
  head: () => ({
    meta: [
      { title: "Mémoire — MAVAI" },
      { name: "description", content: "Vos conversations et faits mémorisés par MAVAI." },
      { property: "og:title", content: "Mémoire — MAVAI" },
      { property: "og:description", content: "La mémoire persistante de MAVAI." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: MemoryPage,
});

function MemoryPage() {
  const {project:projectId}=Route.useSearch();
  const qc = useQueryClient();
  const convs = useServerFn(listConversations);
  const mems = useServerFn(listMemories);
  const add = useServerFn(addMemory);
  const delMem = useServerFn(deleteMemory);
  const delConv = useServerFn(deleteConversation);
  const { data: conversations = [] } = useQuery({ queryKey: ["convs",projectId], queryFn: () => convs({data:{projectId}}) });
  const { data: memories = [] } = useQuery({ queryKey: ["mems",projectId], queryFn: () => mems({data:{projectId}}) });
  const [fact, setFact] = useState("");

  async function save() {
    if (!projectId || !fact.trim()) return;
    try {
      await add({ data: { content: fact,projectId } });
      setFact("");
      qc.invalidateQueries({ queryKey: ["mems",projectId] });
      toast.success("MAVAI s'en souviendra.");
    } catch {
      toast.error("Impossible d'enregistrer.");
    }
  }

  return (
    <ModuleShell title="Mémoire" subtitle="Ce que MAVAI retient de vous, et l'historique de vos conversations.">
      <GitHubMemoryCard />
      <section>
        <h2 className="font-semibold">Ce que MAVAI sait de vous</h2>
        <p className="text-xs text-muted-foreground">Ces faits sont utilisés dans chaque conversation.</p>
        <form
          className="mt-3 flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            void save();
          }}
        >
          <Input
            value={fact}
            onChange={(e) => setFact(e.target.value)}
            placeholder="Ex. Je m'appelle Gabriel, je dirige ARTcB."
            aria-label="Nouveau fait à retenir"
          />
          <Button type="submit">
            <Plus className="size-4" /> Retenir
          </Button>
        </form>
        <ul className="mt-4 space-y-2">
          {memories.map((m) => (
            <li key={m.id} className="flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2 text-sm">
              <span className="flex-1">{m.content}</span>
              <Button
                variant="ghost"
                size="icon"
                aria-label="Oublier"
                onClick={async () => {
                  await delMem({ data: { id: m.id } });
                  qc.invalidateQueries({ queryKey: ["mems",projectId] });
                }}
              >
                <Trash2 className="size-4" />
              </Button>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-12">
        <h2 className="font-semibold">Conversations</h2>
        {conversations.length === 0 && (
          <p className="mt-2 text-sm text-muted-foreground">Aucune conversation enregistrée pour l'instant.</p>
        )}
        <ul className="mt-3 space-y-2">
          {conversations.map((c) => (
            <li key={c.id} className="flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2 text-sm">
              <MessageSquare className="size-4 text-muted-foreground" />
              <Link to="/chat" search={{ c: c.id, project:projectId }} className="flex-1 hover:underline">
                {c.title}
              </Link>
              <span className="text-xs text-muted-foreground">
                {new Date(c.updated_at).toLocaleDateString("fr-FR")}
              </span>
              <Button
                variant="ghost"
                size="icon"
                aria-label="Supprimer la conversation"
                onClick={async () => {
                  await delConv({ data: { id: c.id } });
                  qc.invalidateQueries({ queryKey: ["convs",projectId] });
                }}
              >
                <Trash2 className="size-4" />
              </Button>
            </li>
          ))}
        </ul>
      </section>
    </ModuleShell>
  );
}

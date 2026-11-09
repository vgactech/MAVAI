import { useSelectedProject } from "./ProjectWorkspace";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";
import { Loader2, Sparkles, Trash2 } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { type WorkResult, deleteWork, listWorks, runAgents, runBriefing, runStudio } from "@/lib/modules.functions";

type Kind = "briefing" | "agents" | "image";

export function Markdown({ children }: { children: string }) {
  return (
    <div className="prose-mavai text-sm leading-relaxed">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{children}</ReactMarkdown>
    </div>
  );
}

function Result({ kind, result, prompt }: { kind: Kind; result: WorkResult; prompt: string }) {
  if (kind === "image")
    return (
      <div className="space-y-2">
        <img src={String(result.image ?? "")} alt={prompt} className="w-full max-w-lg rounded-xl" />
        <a href={String(result.image ?? "")} download="mavai-studio.jpg" className="text-xs underline">
          Télécharger
        </a>
      </div>
    );
  if (kind === "agents") {
    const steps = result.steps ?? [];
    return (
      <div className="space-y-4">
        {steps.map((s) => (
          <details key={s.agent} open={s.agent === "Rédacteur"} className="rounded-xl border border-border p-4">
            <summary className="cursor-pointer font-medium">Agent {s.agent}</summary>
            <div className="mt-3">
              <Markdown>{s.text}</Markdown>
            </div>
          </details>
        ))}
      </div>
    );
  }
  return <Markdown>{result.text ?? ""}</Markdown>;
}

export function WorkModule({
  kind,
  placeholder,
  action,
  busyLabel,
  examples,
}: {
  kind: Kind;
  placeholder: string;
  action: string;
  busyLabel: ReactNode;
  examples: string[];
}) {
  const projectId=useSelectedProject();
  const qc = useQueryClient();
  const list = useServerFn(listWorks);
  const del = useServerFn(deleteWork);
  const run = useServerFn(kind === "briefing" ? runBriefing : kind === "agents" ? runAgents : runStudio);
  const key = ["works", kind,projectId];
  const { data: works = [] } = useQuery<Awaited<ReturnType<typeof list>>>({ queryKey: key, enabled:!!projectId, queryFn: () => {if(!projectId)throw new Error("Choisir un projet.");return list({ data: { kind,projectId } });} });
  const [prompt, setPrompt] = useState("");
  const [busy, setBusy] = useState(false);

  async function go() {
    if (!projectId || prompt.trim().length < 2 || busy) return;
    setBusy(true);
    try {
      const res = await run({ data: { prompt,projectId } });
      if (!res.ok) toast.error(res.error);
      else {
        setPrompt("");
        await qc.invalidateQueries({ queryKey: key });
      }
    } catch {
      toast.error("Connexion perdue. Réessayez.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-8">
      <div className="rounded-2xl border border-input bg-card p-3 shadow-sm">
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          rows={3}
          placeholder={placeholder}
          aria-label={placeholder}
          disabled={busy}
          className="block w-full resize-none bg-transparent p-2 text-sm outline-none placeholder:text-muted-foreground"
        />
        <div className="flex flex-wrap items-center gap-2 pt-2">
          {examples.map((ex) => (
            <button
              key={ex}
              type="button"
              onClick={() => setPrompt(ex)}
              className="rounded-full bg-secondary px-3 py-1 text-xs text-secondary-foreground"
            >
              {ex}
            </button>
          ))}
          <div className="flex-1" />
          <Button onClick={go} disabled={busy || prompt.trim().length < 2}>
            {busy ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
            {busy ? busyLabel : action}
          </Button>
        </div>
      </div>

      {works.length === 0 && !busy && (
        <p className="text-center text-sm text-muted-foreground">Aucun résultat pour l'instant.</p>
      )}
      {works.map((w) => (
        <article key={w.id} className="rounded-2xl border border-border bg-card p-6">
          <div className="mb-4 flex items-start gap-3">
            <div className="flex-1">
              <h2 className="font-semibold">{w.prompt}</h2>
              <p className="text-xs text-muted-foreground">{new Date(w.created_at).toLocaleString("fr-FR")}</p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Supprimer"
              onClick={async () => {
                await del({ data: { id: w.id } });
                qc.invalidateQueries({ queryKey: key });
              }}
            >
              <Trash2 className="size-4" />
            </Button>
          </div>
          <Result kind={kind} result={w.result} prompt={w.prompt} />
        </article>
      ))}
    </div>
  );
}

import { useQuery } from '@tanstack/react-query';
import { useServerFn } from '@tanstack/react-start';
import { getChatHealth } from '@/lib/chat-health.functions';
import { cn } from '@/lib/utils';

type Tone = 'ok' | 'busy' | 'off' | 'error' | 'unknown';
const toneClass: Record<Tone, string> = {
  ok: 'bg-success shadow-[0_0_6px_var(--success)]',
  busy: 'bg-warning shadow-[0_0_6px_var(--warning)] animate-pulse',
  off: 'bg-muted-foreground/40',
  error: 'bg-destructive shadow-[0_0_6px_var(--destructive)]',
  unknown: 'bg-muted-foreground/25 animate-pulse',
};

function Dot({ label, tone, detail }: { label: string; tone: Tone; detail: string }) {
  return (
    <span className="inline-flex items-center gap-1.5" title={`${label} : ${detail}`}>
      <span aria-hidden className={cn('size-2 rounded-full', toneClass[tone])} />
      <span className="text-[11px] text-muted-foreground">{label}</span>
      <span className="sr-only">{detail}</span>
    </span>
  );
}

/** KLERIO-style status lights: model, internet, ARTcB, GitHub memory, and the current run. */
export function ChatDiodes({ running, failed }: { running: boolean; failed: boolean }) {
  const check = useServerFn(getChatHealth);
  const q = useQuery({ queryKey: ['chat-health'], queryFn: () => check(), refetchInterval: 60_000, staleTime: 30_000 });
  const d = q.data;
  const pick = (x: { ok: boolean; detail: string } | undefined, offWhenFalse = false): [Tone, string] =>
    !x ? (q.isError ? ['error', 'Vérification impossible'] : ['unknown', 'Vérification…']) : [x.ok ? 'ok' : offWhenFalse ? 'off' : 'error', x.detail];
  const [mt, md] = pick(d?.model);
  const [wt, wd] = pick(d?.web);
  const [at, ad] = pick(d?.artcb);
  const [gt, gd] = pick(d?.github, !d?.githubConnected);
  const runTone: Tone = failed ? 'error' : running ? 'busy' : 'ok';
  return (
    <div role="group" aria-label="État des services" data-chat-diodes className="flex flex-wrap items-center gap-x-3 gap-y-1">
      <Dot label="Modèle" tone={mt} detail={md} />
      <Dot label="Internet" tone={wt} detail={wd} />
      <Dot label="ARTcB" tone={at} detail={ad} />
      <Dot label="GitHub" tone={gt} detail={gd} />
      <Dot label="Exécution" tone={runTone} detail={failed ? 'Erreur' : running ? 'En cours' : 'Prête'} />
    </div>
  );
}

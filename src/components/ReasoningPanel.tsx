import { AlertCircle, Check, Loader2, MinusCircle } from 'lucide-react';
import type { ChatStep, MavaiUIMessage } from '@/lib/chat-steps';
import { MessageResponse } from './ai-elements/message';

type Part = MavaiUIMessage['parts'][number];
const icons = {
  running: <Loader2 className="size-3.5 shrink-0 animate-spin text-accent" aria-hidden />,
  done: <Check className="size-3.5 shrink-0 text-accent" aria-hidden />,
  skipped: <MinusCircle className="size-3.5 shrink-0 text-muted-foreground" aria-hidden />,
  error: <AlertCircle className="size-3.5 shrink-0 text-destructive" aria-hidden />,
} as const;
const statusLabel = { running: 'en cours', done: 'terminé', skipped: 'ignoré', error: 'erreur' } as const;

/** Live, persistent view of how MAVAI prepared an answer: preparation steps then the model's own thinking. */
export function ReasoningPanel({ parts, live }: { parts: readonly Part[]; live: boolean }) {
  const steps = parts.filter((p): p is Extract<Part, { type: 'data-step' }> => p.type === 'data-step').map(p => p.data as ChatStep);
  const thoughts = parts.filter((p): p is Extract<Part, { type: 'reasoning' }> => p.type === 'reasoning' && Boolean(p.text));
  if (!steps.length && !thoughts.length && !live) return null;
  const thinking = live || steps.some(s => s.status === 'running') || thoughts.some(t => t.state === 'streaming');
  return <details open data-reasoning-panel aria-live="polite" className="w-full rounded-lg border border-border bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
    <summary className="flex cursor-pointer items-center gap-2 font-medium text-foreground">
      {thinking ? <Loader2 className="size-3.5 animate-spin text-accent" aria-hidden /> : <Check className="size-3.5 text-accent" aria-hidden />}
      {thinking ? 'Raisonnement en temps réel…' : `Raisonnement · ${steps.length} étape${steps.length > 1 ? 's' : ''}${thoughts.length ? ' + réflexion' : ''}`}
    </summary>
    {steps.length > 0 && <ol aria-label="Étapes de préparation" className="mt-2 space-y-1.5">
      {steps.map((s, i) => <li key={i} className="flex items-start gap-2">
        <span className="mt-0.5">{icons[s.status]}</span>
        <span className="min-w-0"><span className="text-foreground">{s.label}</span><span className="sr-only"> ({statusLabel[s.status]})</span>{s.detail && <span className="block break-words">{s.detail}</span>}</span>
      </li>)}
    </ol>}
    {live && !steps.length && <p role="status" className="mt-2 animate-pulse">Envoi du message…</p>}
    {thoughts.length > 0 && <div className="mt-3 max-h-80 overflow-y-auto border-t border-border pt-2">
      <p className="font-medium text-foreground">Réflexion du modèle{thoughts.some(t => t.state === 'streaming') ? ' (en direct)' : ''}</p>
      {thoughts.map((t, i) => <MessageResponse key={i} className="text-xs text-muted-foreground">{t.text}</MessageResponse>)}
    </div>}
  </details>;
}

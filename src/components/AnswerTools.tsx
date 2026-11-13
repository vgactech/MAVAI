import { useEffect, useRef, useState, type RefObject } from 'react';
import { Check, Copy, Loader2, Play, Volume2, X } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { speechChunks } from '@/lib/voice-text';
import { Button } from './ui/button';

async function copyText(text: string) { await navigator.clipboard.writeText(text); }

/** Copies the full answer text. */
export function CopyAnswer({ text }: { text: string }) {
  const [done, setDone] = useState(false);
  return <Button type="button" size="icon-sm" variant="ghost" aria-label="Copier la réponse" title="Copier la réponse" onClick={() => void copyText(text).then(() => { setDone(true); setTimeout(() => setDone(false), 1500); }).catch(() => toast.error('Copie impossible.'))}>
    {done ? <Check className="size-4" /> : <Copy className="size-4" />}</Button>;
}

/** Audio bar under an answer: voices it on first play, then a normal player (replay, seek, volume). */
export function AnswerAudio({ text }: { text: string }) {
  const [url, setUrl] = useState<string | null>(null); const [loading, setLoading] = useState(false);
  const player = useRef<HTMLAudioElement>(null);
  useEffect(() => () => { if (url) URL.revokeObjectURL(url); }, [url]);
  useEffect(() => { if (url) void player.current?.play().catch(() => undefined); }, [url]);
  async function generate() {
    setLoading(true);
    try {
      const { data } = await supabase.auth.getSession(); if (!data.session) throw new Error('Session expirée. Reconnectez-vous.');
      const blobs: Blob[] = [];
      for (const chunk of speechChunks(text)) {
        const r = await fetch('/api/voice', { method: 'POST', body: JSON.stringify({ text: chunk }), headers: { Authorization: `Bearer ${data.session.access_token}`, 'Content-Type': 'application/json' } });
        if (!r.ok) throw new Error((await r.json().catch(() => null))?.error ?? 'Lecture vocale indisponible.');
        blobs.push(await r.blob());
      }
      setUrl(URL.createObjectURL(new Blob(blobs, { type: 'audio/mpeg' })));
    } catch (e) { toast.error(e instanceof Error ? e.message : 'Lecture vocale indisponible.'); } finally { setLoading(false); }
  }
  return <div className="mt-2 flex w-full items-center gap-2 rounded-lg border border-border bg-muted/40 px-2 py-1.5">
    <Volume2 className="size-4 shrink-0 text-muted-foreground" aria-hidden />
    {url ? <audio ref={player} src={url} controls className="h-8 w-full min-w-0" aria-label="Lecture de la réponse" />
      : <><Button type="button" size="icon-sm" variant="ghost" aria-label="Écouter la réponse" disabled={loading} onClick={() => void generate()}>{loading ? <Loader2 className="size-4 animate-spin" /> : <Play className="size-4" />}</Button>
        <div className="h-1 flex-1 rounded-full bg-border" aria-hidden /><span className="text-xs text-muted-foreground">{loading ? 'Préparation…' : '0:00'}</span></>}
  </div>;
}

/** Floating bubble over a text selection inside the chat: copy it, or ignore it. */
export function SelectionBubble({ container }: { container: RefObject<HTMLElement | null> }) {
  const [box, setBox] = useState<{ x: number; y: number; text: string } | null>(null);
  useEffect(() => {
    const update = () => {
      const sel = window.getSelection(); const text = sel?.toString().trim() ?? '';
      if (!sel || !text || !sel.rangeCount || !container.current?.contains(sel.anchorNode)) { setBox(null); return; }
      const r = sel.getRangeAt(0).getBoundingClientRect();
      setBox({ x: Math.min(Math.max(r.left + r.width / 2, 80), window.innerWidth - 80), y: Math.max(r.top - 8, 48), text });
    };
    document.addEventListener('selectionchange', update);
    return () => document.removeEventListener('selectionchange', update);
  }, [container]);
  if (!box) return null;
  return <div role="toolbar" aria-label="Sélection" style={{ left: box.x, top: box.y }} className="fixed z-50 flex -translate-x-1/2 -translate-y-full items-center gap-1 rounded-full border border-border bg-popover p-1 text-popover-foreground shadow-lg" onMouseDown={e => e.preventDefault()}>
    <Button type="button" size="sm" variant="ghost" className="rounded-full" onClick={() => void copyText(box.text).then(() => { toast.success('Sélection copiée'); window.getSelection()?.removeAllRanges(); }).catch(() => toast.error('Copie impossible.'))}><Copy className="size-4" />Copier</Button>
    <Button type="button" size="icon-sm" variant="ghost" className="rounded-full" aria-label="Ignorer la sélection" onClick={() => window.getSelection()?.removeAllRanges()}><X className="size-4" /></Button>
  </div>;
}

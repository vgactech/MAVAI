import { useState } from 'react';
import { useServerFn } from '@tanstack/react-start';
import { useQueryClient } from '@tanstack/react-query';
import { Plus } from 'lucide-react';
import { toast } from 'sonner';
import { createProject } from '@/lib/production.functions';
import { Button } from './ui/button';
import { Input } from './ui/input';

/** One-step project creation; the caller decides where to go next (usually straight into a new chat). */
export function QuickProjectForm({ onCreated, submitLabel = 'Créer' }: { onCreated?: (project: { id: string; title: string }) => void; submitLabel?: string }) {
  const create = useServerFn(createProject); const queryClient = useQueryClient();
  const [title, setTitle] = useState(''); const [busy, setBusy] = useState(false);
  return <form className="flex w-full gap-2" onSubmit={async e => {
    e.preventDefault(); if (!title.trim() || busy) return; setBusy(true);
    try { const project = await create({ data: { title } }); setTitle(''); await queryClient.invalidateQueries({ queryKey: ['production-projects'] }); onCreated?.(project); }
    catch (error) { toast.error(error instanceof Error ? error.message : 'Création impossible.'); }
    finally { setBusy(false); }
  }}>
    <Input aria-label="Nom du projet" placeholder="Nom de la production" value={title} onChange={e => setTitle(e.target.value)} maxLength={160} required className="min-w-0" />
    <Button disabled={busy || !title.trim()} className="shrink-0"><Plus className="size-4" />{busy ? 'Création…' : submitLabel}</Button>
  </form>;
}

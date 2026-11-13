import { useServerFn } from '@tanstack/react-start';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { getLinkedConversations, listConversations, setLinkedConversations } from '@/lib/modules.functions';
import { listProjects } from '@/lib/production.functions';
import { Button } from './ui/button';
import { Checkbox } from './ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog';

/** Pick other chats (any project) whose full history this chat can read as memory. */
export function LinkMemoryDialog({ id, title, open, onOpenChange }: { id: string; title: string; open: boolean; onOpenChange: (o: boolean) => void }) {
  const qc = useQueryClient();
  const getLinked = useServerFn(getLinkedConversations); const save = useServerFn(setLinkedConversations);
  const listAll = useServerFn(listConversations); const listP = useServerFn(listProjects);
  const { data: chats = [] } = useQuery({ queryKey: ['project-conversations', 'all-for-link'], queryFn: () => listAll({ data: { all: true } }), enabled: open });
  const { data: projects = [] } = useQuery({ queryKey: ['production-projects'], queryFn: () => listP(), enabled: open });
  const { data: linked } = useQuery({ queryKey: ['linked-conversations', id], queryFn: () => getLinked({ data: { id } }), enabled: open });
  const [picked, setPicked] = useState<Set<string>>(new Set()); const [busy, setBusy] = useState(false);
  useEffect(() => { if (linked) setPicked(new Set(linked)); }, [linked]);
  const name = (pid: string | null) => projects.find(p => p.id === pid)?.title ?? 'Sans projet';
  const others = chats.filter(c => c.id !== id);
  const submit = async () => {
    setBusy(true);
    try { const r = await save({ data: { id, linkedIds: [...picked] } }); await qc.invalidateQueries({ queryKey: ['linked-conversations', id] }); toast.success(r.count ? `${r.count} chat(s) connecté(s) en mémoire complète` : 'Aucun chat connecté'); onOpenChange(false); }
    catch (e) { toast.error((e as Error).message); } finally { setBusy(false); }
  };
  return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent className="max-w-lg">
    <DialogHeader><DialogTitle>Connecter la mémoire</DialogTitle><DialogDescription>« {title} » pourra relire l’historique complet des chats cochés, même dans d’autres projets. Les chats liés ne sont pas modifiés.</DialogDescription></DialogHeader>
    <div className="max-h-80 space-y-1 overflow-y-auto">
      {others.length === 0 && <p className="text-sm text-muted-foreground">Aucun autre chat.</p>}
      {others.map(c => <label key={c.id} className="flex cursor-pointer items-center gap-3 rounded-md px-2 py-2 hover:bg-accent">
        <Checkbox checked={picked.has(c.id)} onCheckedChange={v => setPicked(s => { const n = new Set(s); if (v) n.add(c.id); else n.delete(c.id); return n; })} />
        <span className="min-w-0 flex-1"><span className="block truncate text-sm">{c.title}</span><span className="block truncate text-xs text-muted-foreground">{name(c.project_id)}</span></span>
      </label>)}
    </div>
    <DialogFooter><Button variant="ghost" onClick={() => onOpenChange(false)}>Annuler</Button><Button onClick={() => void submit()} disabled={busy}>Enregistrer</Button></DialogFooter>
  </DialogContent></Dialog>;
}

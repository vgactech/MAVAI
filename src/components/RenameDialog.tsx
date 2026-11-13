import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from './ui/dialog';

export function RenameDialog({ open, onOpenChange, title, kind, save }: { open: boolean; onOpenChange: (open: boolean) => void; title: string; kind: 'projet' | 'chat'; save: (title: string) => Promise<unknown> }) {
  const [value, setValue] = useState(title); const [busy, setBusy] = useState(false);
  useEffect(() => { if (open) setValue(title); }, [open, title]);
  return <Dialog open={open} onOpenChange={next => { if (!busy) onOpenChange(next); }}><DialogContent>
    <DialogHeader><DialogTitle>Renommer le {kind}</DialogTitle><DialogDescription>Les contenus et leur historique restent conservés.</DialogDescription></DialogHeader>
    <form onSubmit={async e => { e.preventDefault(); if (!value.trim() || busy) return; setBusy(true); try { await save(value.trim()); onOpenChange(false); toast.success(`${kind === 'projet' ? 'Projet' : 'Chat'} renommé`); } catch (error) { toast.error(error instanceof Error ? error.message : 'Renommage impossible.'); } finally { setBusy(false); } }}>
      <label htmlFor={`rename-${kind}`} className="mb-2 block text-sm">Nom du {kind}</label><Input id={`rename-${kind}`} value={value} onChange={e => setValue(e.target.value)} maxLength={160} required autoFocus />
      <DialogFooter className="mt-4"><Button type="button" variant="outline" disabled={busy} onClick={() => onOpenChange(false)}>Annuler</Button><Button disabled={busy || !value.trim()}>{busy ? 'Enregistrement…' : 'Enregistrer'}</Button></DialogFooter>
    </form>
  </DialogContent></Dialog>;
}
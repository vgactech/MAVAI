import { useNavigate, useSearch } from '@tanstack/react-router';
import { useServerFn } from '@tanstack/react-start';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Archive, ArchiveRestore, FolderInput, MoreHorizontal, Trash2, Pencil } from 'lucide-react';
import { useState } from 'react';
import { RenameDialog } from './RenameDialog';
import { toast } from 'sonner';
import { listProjects } from '@/lib/production.functions';
import { deleteConversation, updateConversation, renameConversation } from '@/lib/modules.functions';
import { Button } from './ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuSub, DropdownMenuSubContent, DropdownMenuSubTrigger, DropdownMenuTrigger } from './ui/dropdown-menu';

/** ChatGPT-style "…" menu on a conversation row: move, archive, delete. */
export function ConversationActions({ id, title, projectId, archived = false }: { id: string; title: string; projectId: string | null; archived?: boolean }) {
  const qc = useQueryClient(); const navigate = useNavigate(); const open = (useSearch({ strict: false }) as { c?: string }).c;
  const [renaming, setRenaming] = useState(false); const rename = useServerFn(renameConversation);
  const list = useServerFn(listProjects); const remove = useServerFn(deleteConversation); const update = useServerFn(updateConversation);
  const { data: projects = [] } = useQuery({ queryKey: ['production-projects'], queryFn: () => list() });
  const done = async (message: string, leave: boolean) => {
    await qc.invalidateQueries({ queryKey: ['project-conversations'] }); toast.success(message);
    if (leave && open === id) void navigate({ to: '/chat' });
  };
  const run = (fn: () => Promise<unknown>, message: string, leave: boolean) => void fn().then(() => done(message, leave)).catch((e: Error) => toast.error(e.message));
  return <><DropdownMenu>
    <DropdownMenuTrigger asChild><Button size="icon-sm" variant="ghost" aria-label={`Actions du chat ${title}`} className="shrink-0" onClick={e => e.stopPropagation()}><MoreHorizontal className="size-4" /></Button></DropdownMenuTrigger>
    <DropdownMenuContent align="end" className="w-56">
      <DropdownMenuItem onSelect={() => setRenaming(true)}><Pencil className="size-4" />Renommer</DropdownMenuItem>
      <DropdownMenuSub><DropdownMenuSubTrigger><FolderInput className="size-4" />Déplacer vers un projet</DropdownMenuSubTrigger>
        <DropdownMenuSubContent className="max-h-72 overflow-y-auto">
          {projects.filter(p => p.id !== projectId).length === 0 && <DropdownMenuItem disabled>Aucun autre projet</DropdownMenuItem>}
          {projects.filter(p => p.id !== projectId).map(p => <DropdownMenuItem key={p.id} onSelect={() => run(() => update({ data: { id, projectId: p.id } }), `Déplacé vers « ${p.title} »`, false)}>{p.title}</DropdownMenuItem>)}
        </DropdownMenuSubContent></DropdownMenuSub>
      <DropdownMenuItem onSelect={() => run(() => update({ data: { id, archived: !archived } }), archived ? 'Chat restauré' : 'Chat archivé', !archived)}>{archived ? <ArchiveRestore className="size-4" /> : <Archive className="size-4" />}{archived ? 'Désarchiver' : 'Archiver'}</DropdownMenuItem>
      <DropdownMenuSeparator />
      <DropdownMenuItem className="text-destructive focus:text-destructive" onSelect={() => { if (window.confirm(`Supprimer définitivement « ${title} » et tous ses messages ?`)) run(() => remove({ data: { id } }), 'Chat supprimé', true); }}><Trash2 className="size-4" />Supprimer</DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu><RenameDialog open={renaming} onOpenChange={setRenaming} title={title} kind="chat" save={async title => { await rename({ data: { id, title } }); await qc.invalidateQueries({ queryKey: ['project-conversations'] }); }} /></>;
}

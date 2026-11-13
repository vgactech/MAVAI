import { useState } from 'react';
import { useServerFn } from '@tanstack/react-start';
import { useQueryClient } from '@tanstack/react-query';
import { MoreHorizontal, Pencil } from 'lucide-react';
import { renameProject } from '@/lib/production.functions';
import { Button } from './ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from './ui/dropdown-menu';
import { RenameDialog } from './RenameDialog';

export function ProjectActions({ id, title }: { id: string; title: string }) {
  const [open, setOpen] = useState(false); const rename = useServerFn(renameProject); const qc = useQueryClient();
  return <><DropdownMenu><DropdownMenuTrigger asChild><Button variant="ghost" size="icon-sm" aria-label={`Actions du projet ${title}`}><MoreHorizontal className="size-4" /></Button></DropdownMenuTrigger><DropdownMenuContent align="end"><DropdownMenuItem onSelect={() => setOpen(true)}><Pencil className="size-4" />Renommer</DropdownMenuItem></DropdownMenuContent></DropdownMenu>
    <RenameDialog open={open} onOpenChange={setOpen} title={title} kind="projet" save={async title => { await rename({ data: { id, title } }); await Promise.all([qc.invalidateQueries({ queryKey: ['production-projects'] }), qc.invalidateQueries({ queryKey: ['production-project', id] })]); }} />
  </>;
}
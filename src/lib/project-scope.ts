import { z } from 'zod';
export const projectSearch = z.object({ project: z.string().uuid().optional() });
export function projectMatches(rowProject: string | null, selected: string | undefined) {
  return selected ? rowProject === selected : rowProject === null;
}
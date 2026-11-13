import { z } from 'zod';
export const renameProjectSchema = z.object({ id: z.string().uuid(), title: z.string().trim().min(1).max(160) });
export const renameConversationSchema = z.object({ id: z.string().uuid(), title: z.string().trim().min(1).max(160) });
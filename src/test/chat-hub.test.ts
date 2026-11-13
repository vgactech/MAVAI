import { describe, expect, it } from 'vitest';
import { conversationTitleFrom, groupConversationsByProject, modelContextParts } from '@/lib/chat-steps';
import { formatWhen } from '@/lib/format-when';

describe('chat hub rules', () => {
  it('groups every conversation under its project, most recent first', () => {
    const groups = groupConversationsByProject([
      { id: 'a', title: 'A', updated_at: '2026-11-10T10:00:00Z', project_id: 'p1' },
      { id: 'b', title: 'B', updated_at: '2026-11-12T10:00:00Z', project_id: 'p1' },
      { id: 'c', title: 'C', updated_at: '2026-11-11T10:00:00Z', project_id: null },
    ]);
    expect(groups.get('p1')?.map(c => c.id)).toEqual(['b', 'a']);
    expect(groups.get(null)?.map(c => c.id)).toEqual(['c']);
  });

  it('names a conversation after its first message, capped at 60 characters', () => {
    expect(conversationTitleFrom('  Écris le   synopsis\n du court métrage ')).toBe('Écris le synopsis du court métrage');
    const long = conversationTitleFrom('x'.repeat(200));
    expect(long).toHaveLength(60);
    expect(long?.endsWith('…')).toBe(true);
    expect(conversationTitleFrom('   ')).toBeNull();
  });

  it('labels yesterday activity as "hier"', () => {
    expect(formatWhen('2026-11-12T09:00:00', new Date('2026-11-13T18:00:00'))).toBe('hier');
  });
});

describe('live reasoning', () => {
  it('keeps reasoning and progress steps out of the model history', () => {
    const parts = [{ type: 'data-step', data: {} }, { type: 'step-start' }, { type: 'reasoning', text: 'r' }, { type: 'text', text: '391' }, { type: 'file', url: 'data:' }];
    expect(modelContextParts(parts).map(p => p.type)).toEqual(['text', 'file']);
  });
});

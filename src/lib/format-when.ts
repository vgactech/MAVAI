/** Short French "last activity" label: time today, "hier", otherwise day and month (year if different). */
export function formatWhen(iso: string, now: Date = new Date()): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  const day = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const diff = Math.round((day(now) - day(date)) / 86_400_000);
  if (diff === 0) return `aujourd’hui ${date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`;
  if (diff === 1) return 'hier';
  return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', ...(date.getFullYear() !== now.getFullYear() ? { year: 'numeric' } : {}) });
}

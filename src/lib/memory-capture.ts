// Detects standing rules the user asks MAVAI to remember, so they are saved as durable memory.
const TRIGGERS = /(rappel+e[- ]?toi|souviens[- ]toi|retiens|m[ée]morise|n['’]oublie (pas|jamais)|[àa] chaque (fois|r[ée]ponse)|dor[ée]navant|d[ée]sormais|toujours|ne plus jamais|r[èe]gle|interdit)/i;
export function extractMemoryRule(text: string): string | null {
  const clean = text.trim();
  if (clean.length < 15 || !TRIGGERS.test(clean)) return null;
  return clean.slice(0, 2000);
}

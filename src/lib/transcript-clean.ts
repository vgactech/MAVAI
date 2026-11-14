// Removes sound-event tags like "[background noise]" or "(rires)" so only spoken words reach the chat.
export function cleanTranscript(text: string): string {
  return text.replace(/\[[^\]]*\]|\([^)]*\)/g, " ").replace(/\s+/g, " ").trim();
}

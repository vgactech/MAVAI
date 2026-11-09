/** Each ElevenLabs multilingual v2 request stays below its 5000-character guidance. */
export function speechChunks(text: string, limit = 4500): string[] {
  if (limit < 1) throw new Error('Invalid speech chunk limit');
  const chunks: string[] = [];
  let rest = text;
  while (rest.length > limit) {
    const candidate = rest.slice(0, limit);
    const boundary = Math.max(candidate.lastIndexOf('\n'), candidate.lastIndexOf('. '), candidate.lastIndexOf(' '));
    const end = boundary > limit / 2 ? boundary + 1 : limit;
    chunks.push(rest.slice(0, end)); rest = rest.slice(end);
  }
  if (rest) chunks.push(rest);
  return chunks;
}

export function audioExtension(mime: string) {
  return mime.includes('wav') ? 'wav' : mime.includes('mp4') ? 'm4a' : mime.includes('ogg') ? 'ogg' : mime.includes('mpeg') ? 'mp3' : 'webm';
}
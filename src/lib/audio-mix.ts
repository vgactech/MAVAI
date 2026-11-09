// CERTIFIED_100=false | unique_human_proven=false | DEBUG
export type MixTrack = { buffer: AudioBuffer; volume: number; muted: boolean; solo: boolean; offset: number };
export function trackGain(track: Pick<MixTrack, "volume" | "muted" | "solo">, anySolo: boolean) {
  return track.muted || (anySolo && !track.solo) ? 0 : track.volume;
}
export async function renderMix(tracks: MixTrack[]) {
  if (!tracks.length) throw new Error("Aucune piste.");
  const rate = 44100; const duration = Math.max(...tracks.map(t => t.buffer.duration + t.offset));
  const context = new OfflineAudioContext(2, Math.ceil(duration * rate), rate);
  const anySolo = tracks.some(t => t.solo);
  for (const track of tracks) { const source = context.createBufferSource(); source.buffer = track.buffer; const gain = context.createGain(); gain.gain.value = trackGain(track, anySolo); source.connect(gain).connect(context.destination); source.start(track.offset); }
  return context.startRendering();
}
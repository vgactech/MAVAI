import { writeFile } from 'node:fs/promises';

const key = process.env.MAVAI_DR_MANATHAN?.trim();
const proof = { provider: 'ElevenLabs', variable: 'MAVAI_DR_MANATHAN', checked_at: new Date().toISOString(), tts_characters: 9 };
try {
  if (!key) throw new Error('absent');
  const speech = await fetch('https://api.elevenlabs.io/v1/text-to-speech/EXAVITQu4vr4xnSDxMaL?output_format=mp3_44100_128', {
    method: 'POST', redirect: 'error', signal: AbortSignal.timeout(45000),
    headers: { 'xi-api-key': key, 'Content-Type': 'application/json' },
    body: JSON.stringify({ text: 'Oui chef.', model_id: 'eleven_multilingual_v2' }),
  });
  proof.tts_http_status = speech.status;
  if (speech.ok && speech.headers.get('content-type')?.startsWith('audio/')) {
    const bytes = new Uint8Array(await speech.arrayBuffer());
    proof.audio_bytes = bytes.length;
    if (bytes.length > 0 && bytes.length < 10_000_000) {
      await writeFile('/workspace/work/voice-smoke.mp3', bytes, { mode: 0o600 });
      const data = new FormData();
      data.set('model_id', 'scribe_v1');
      data.set('file', new Blob([bytes], { type: 'audio/mpeg' }), 'voice-smoke.mp3');
      const transcript = await fetch('https://api.elevenlabs.io/v1/speech-to-text', {
        method: 'POST', redirect: 'error', signal: AbortSignal.timeout(45000), headers: { 'xi-api-key': key }, body: data,
      });
      proof.stt_http_status = transcript.status;
      if (transcript.ok) {
        const result = await transcript.json();
        proof.nonempty_transcript = typeof result.text === 'string' && !!result.text.trim();
        proof.expected_words_recognized = typeof result.text === 'string' && result.text.toLowerCase().replace(/[^a-z ]/g, '').trim() === 'oui chef';
      }
    }
  }
} catch {
  proof.blocker = key ? 'network_or_processing_error_details_redacted' : 'secret_absent';
}
await writeFile('/workspace/work/voice-proof.json', JSON.stringify(proof, null, 2));
console.log(JSON.stringify(proof, null, 2));

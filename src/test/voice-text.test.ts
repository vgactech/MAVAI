import {describe,it,expect} from 'vitest';
import {speechChunks,audioExtension} from '../lib/voice-text';
describe('Complete voice response',()=>{
  it('retains every character beyond the previous 2500 cutoff',()=>{
    const text=('Voici une réponse complète. ').repeat(400)+'DERNIER MOT';
    const chunks=speechChunks(text);
    expect(chunks.join('')).toBe(text);
    expect(chunks.every(c=>c.length<=4500)).toBe(true);
    expect(chunks.at(-1)?.endsWith('DERNIER MOT')).toBe(true);
  });
  it('does not label WAV recordings as webm',()=>{expect(audioExtension('audio/wav')).toBe('wav');});
});
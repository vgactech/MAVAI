import { describe, expect, it } from 'vitest';
import { SerialTurnQueue } from '../components/voice/serial-turn-queue';
const tick = () => new Promise(resolve => setTimeout(resolve, 0));
describe('MAVAI noninterrupting voice handoff', () => {
  it('explicitly rejects a full queue rather than silently losing a turn',()=>{
    const q=new SerialTurnQueue();q.enqueue(()=>new Promise(()=>{}));
    for(let i=1;i<10;i++)q.enqueue(async()=>{});
    expect(()=>q.enqueue(async()=>{})).toThrow('File pleine');q.close();
  });
  it('does not process speech captured during an answer until its audible output ends', async () => {
    const seen: string[] = []; let finish: () => void = () => {};
    const ended = new Promise<void>(resolve => { finish = resolve; });
    const queue = new SerialTurnQueue();
    queue.enqueue(async () => { seen.push('generation1'); await ended; seen.push('audio1-ended'); });
    queue.enqueue(async () => { seen.push('generation2'); });
    await tick(); expect(seen).toEqual(['generation1']);
    finish(); await tick(); expect(seen).toEqual(['generation1', 'audio1-ended', 'generation2']);
  });
  it('keeps two human follow-ups in their capture order', async () => {
    const seen: number[] = []; const queue = new SerialTurnQueue();
    [1, 2, 3].forEach(n => queue.enqueue(async () => { await tick(); seen.push(n); }));
    await new Promise(resolve => setTimeout(resolve, 30)); expect(seen).toEqual([1, 2, 3]);
  });
  it('pauses after failure and never automatically retries a failed utterance', async () => {
    let attempts = 0; let next = 0; const queue = new SerialTurnQueue();
    queue.enqueue(async () => { attempts++; throw new Error('403'); });
    queue.enqueue(async () => { next++; });
    await tick(); expect(attempts).toBe(1); expect(next).toBe(0);
    queue.resume(); await tick(); expect(attempts).toBe(1); expect(next).toBe(1);
  });
  it('clears follow-ups on explicit Stop without starting a new answer', async () => {
    let finish: () => void = () => {}; let next = 0;
    const ended = new Promise<void>(resolve => { finish = resolve; }); const queue = new SerialTurnQueue();
    queue.enqueue(() => ended); queue.enqueue(async () => { next++; }); queue.close();
    finish(); await tick(); expect(next).toBe(0);
  });
});

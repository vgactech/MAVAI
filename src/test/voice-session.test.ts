import {describe,it,expect,vi} from 'vitest';
import {VoiceSession,type VoiceAdapters} from '../components/voice/voice-session';
const tick=()=>new Promise(resolve=>setTimeout(resolve,0));
function setup(){
  vi.stubGlobal('crypto',{randomUUID:()=>`turn-${++sequence}`});
  vi.stubGlobal('cancelAnimationFrame',()=>{});
  let sequence=0;
  const audio={src:'',onended:null as null|(()=>void),onerror:null as null|(()=>void),play:vi.fn(async()=>{}),pause:vi.fn(),removeAttribute:vi.fn(),load:vi.fn()} as unknown as HTMLAudioElement;
  const answer=vi.fn<VoiceAdapters['answer']>(async(text)=>({text,audioUrls:['https://example.test/one.mp3','https://example.test/two.mp3']}));
  const adapters:VoiceAdapters={answer,transcribe:async()=>'',onTranscript:()=>{},onState:()=>{},onAnalysers:()=>{}};
  return {audio,answer,session:new VoiceSession(audio,adapters)};
}
describe('VoiceSession full playback ownership',()=>{
  it('waits for the final segment to end before the next answer',async()=>{
    const {audio,answer,session}=setup();session.enqueueText('A',true);session.enqueueText('B',true);
    await tick();expect(answer.mock.calls.map(c=>c[0])).toEqual(['A']);
    audio.dispatchEvent?.(new Event('ended'));audio.onended?.call(audio,new Event('ended'));await tick();
    expect(audio.src).toBe('https://example.test/two.mp3');expect(answer).toHaveBeenCalledTimes(1);
    audio.onended?.call(audio,new Event('ended'));await tick();expect(answer.mock.calls.map(c=>c[0])).toEqual(['A','B']);session.stop();
  });
  it('explicit Stop aborts the provider and discards queued follow-ups',async()=>{
    const {audio,answer,session}=setup();session.enqueueText('A',true);session.enqueueText('B',true);await tick();
    const signal=answer.mock.calls[0]?.[1];session.stop();await tick();
    expect(signal?.aborted).toBe(true);expect(answer).toHaveBeenCalledTimes(1);expect(audio.pause).toHaveBeenCalled();
  });
});
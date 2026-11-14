import { SerialTurnQueue } from './serial-turn-queue';
export type VoicePhase = 'idle' | 'listening' | 'generating' | 'speaking' | 'playback-blocked' | 'error';
export type VoiceReply = { text: string; audioUrls: string[] };
export type VoiceAdapters = {
  transcribe: (blob: Blob, signal: AbortSignal) => Promise<string>;
  answer: (text: string, signal: AbortSignal, id: string, voice: boolean, files?: Array<{type:'file';mediaType:string;url:string}>) => Promise<VoiceReply>;
  onTranscript: (id: string, role: 'user' | 'assistant', text: string) => void;
  onState: (state: { phase: VoicePhase; pending: number; muted: boolean; error: string | null; transcribing?: number }) => void;
  onAnalysers: (nodes: { human: AnalyserNode | null; assistant: AnalyserNode | null } | null) => void;
  /** Deterministic order router, run BEFORE the FIFO so controls never wait behind answers. Returns true when handled. */
  command?: (text: string, source: 'text' | 'voice', id: string) => boolean;
};
/** Browser-only controller. Construct/start in a click handler, never during SSR. */
export class VoiceSession {
  private stream?: MediaStream;
  private context?: AudioContext;
  private input?: MediaStreamAudioSourceNode;
  private output?: MediaElementAudioSourceNode;
  private recorder: MediaRecorder | undefined;
  private frame = 0;
  private muted = false;
  private speechOn = true;
  private closed = false;
  private phase: VoicePhase = 'idle';
  private error: string | null = null;
  private pending = 0;
  private transcribing = 0;
  private abort = new AbortController();
  private sttTail: Promise<void> = Promise.resolve();
  private finishPlayback: ((error?: Error) => void) | undefined;
  private queue: SerialTurnQueue;
  constructor(private audio: HTMLAudioElement, private adapters: VoiceAdapters) {
    this.queue = new SerialTurnQueue((pending, paused) => {
      this.pending = pending;
      if (paused) this.phase = 'error';
      this.emit();
    }, error => { if (!this.closed) {
      this.error = error instanceof Error ? error.message : 'Service vocal indisponible.';
      this.phase = 'error'; this.emit();
    }});
  }
  private emit() { if (!this.closed) this.adapters.onState({ phase: this.phase, pending: this.pending, muted: this.muted, error: this.error, transcribing: this.transcribing }); }
  private setPhase(phase: VoicePhase) { this.phase = phase; this.emit(); }
  async start() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true } });
      if (this.closed) { stream.getTracks().forEach(t => t.stop()); return; }
      this.stream = stream;
      if (!this.context) await this.prepareAudio();
      const context = this.context;
      if (!context) throw new Error('Audio indisponible.');
      await context.resume();
      if (this.closed) { await context.close(); stream.getTracks().forEach(t => t.stop()); return; }
      const human = context.createAnalyser(); human.fftSize = 2048;
      this.input = context.createMediaStreamSource(stream); this.input.connect(human);
      this.adapters.onAnalysers({ human, assistant: this.assistantAnalyser ?? null });
      if (this.phase === 'idle') this.setPhase('listening');
      const data = new Float32Array(human.fftSize);
      const tick = () => {
        if (this.closed) return;
        human.getFloatTimeDomainData(data);
        const rms = Math.sqrt(data.reduce((n, v) => n + v * v, 0) / data.length);
        this.capture(rms);
        this.frame = requestAnimationFrame(tick);
      };
      tick();
    } catch (error) {
      this.stop();
      this.adapters.onState({ phase: 'error', pending: 0, muted: false, error: error instanceof Error ? error.message : 'Micro inaccessible.' });
      throw error;
    }
  }
  private assistantAnalyser?: AnalyserNode;
  async prepareAudio() {
    if (this.context) return;
    this.context = new AudioContext(); await this.context.resume();
    this.assistantAnalyser = this.context.createAnalyser(); this.assistantAnalyser.fftSize = 2048;
    this.output = this.context.createMediaElementSource(this.audio);
    this.output.connect(this.assistantAnalyser); this.assistantAnalyser.connect(this.context.destination);
    this.adapters.onAnalysers({human:null, assistant:this.assistantAnalyser});
  }
  enqueueText(text: string, voice: boolean, files?: Array<{type:'file';mediaType:string;url:string}>) {
    const id = crypto.randomUUID();
    if (!files?.length && this.adapters.command?.(text,'text',id)) return;
    this.queue.enqueue(async () => this.runAnswer(text,id,voice,files));
    this.adapters.onTranscript(id,'user',text);
  }
  private async runAnswer(text: string, id: string, voice: boolean, files?: Array<{type:'file';mediaType:string;url:string}>) {
    if (this.closed) return;
    this.setPhase('generating');
    const spoken = voice && this.speechOn;
    const answer = await this.adapters.answer(text,this.abort.signal,id,spoken,files);
    if (this.closed) return;
    if (spoken && this.speechOn && !answer.audioUrls.length) throw new Error('Réponse écrite reçue, mais lecture vocale indisponible.');
    try { for (const url of answer.audioUrls) { if (this.closed || !this.speechOn) break; await this.play(url); } }
    finally { answer.audioUrls.forEach(url => { if (url.startsWith('blob:')) URL.revokeObjectURL(url); }); }
    if (!this.closed) this.setPhase(this.stream ? 'listening' : 'idle');
  }
  private heard = false;
  private silentSince = 0;
  private recordedSince = 0;
  private capture(rms: number) {
    if (this.muted || this.phase === 'error' || !this.stream || this.closed) return;
    const now = performance.now();
    if (!this.recorder) this.beginRecording();
    if (rms > 0.025) { this.heard = true; this.silentSince = 0; }
    else if (this.heard) this.silentSince ||= now;
    // Listening NEVER checks generation/playback busy. Segment at silence, not at assistant onset.
    if ((this.silentSince && now - this.silentSince >= 1200) || now - this.recordedSince >= 30000) this.endRecording(false);
  }
  private beginRecording() {
    if (!this.stream) return;
    const mime = ['audio/webm;codecs=opus', 'audio/mp4', 'audio/ogg;codecs=opus'].find(t => MediaRecorder.isTypeSupported(t));
    const recorder = mime ? new MediaRecorder(this.stream, { mimeType: mime }) : new MediaRecorder(this.stream);
    const chunks: Blob[] = []; this.recorder = recorder;
    this.heard = false; this.silentSince = 0; this.recordedSince = performance.now();
    let discard = false;
    recorder.ondataavailable = event => { if (event.data.size) chunks.push(event.data); };
    recorder.onstop = () => {
      if (this.closed || discard) return;
      const blob = new Blob(chunks, { type: recorder.mimeType });
      if (blob.size) this.enqueue(blob);
    };
    recorder.addEventListener('discard', () => { discard = true; });
    recorder.start(250);
  }
  private endRecording(discard: boolean) {
    const recorder = this.recorder; this.recorder = undefined;
    if (!recorder || recorder.state === 'inactive') return;
    if (discard || !this.heard) recorder.dispatchEvent(new Event('discard'));
    recorder.stop();
  }
  private enqueue(blob: Blob) {
    if (this.closed) return;
    const id = crypto.randomUUID();
    // STT is serial but independent from assistant playback. Immediate catch avoids unhandled rejections.
    let reserved = false;
    const transcript = this.sttTail.then(async () => {
      if (!reserved) throw new Error('File pleine.');
      if (this.closed) throw new Error('Session fermée.');
      this.transcribing++; this.emit();
      try {
      const text = (await this.adapters.transcribe(blob, this.abort.signal)).trim();
      if (!text) throw new Error('Aucune parole reconnue.');
      if (this.adapters.command?.(text,'voice',id)) return { ok: true as const, text, handled: true };
      if (!this.closed) this.adapters.onTranscript(id, 'user', text);
      return { ok: true as const, text, handled: false };
      } finally { this.transcribing--; this.emit(); }
    }).catch(error => ({ ok: false as const, error }));
    this.sttTail = transcript.then(() => {});
    try { this.queue.enqueue(async () => {
      const result = await transcript;
      if (!result.ok) throw result.error;
      if (this.closed || result.handled) return;
      await this.runAnswer(result.text,id,true);
    }); reserved = true; } catch(error) { this.error = error instanceof Error ? error.message : 'File pleine.'; this.emit(); }
  }
  private play(url: string) {
    return new Promise<void>((resolve, reject) => {
      this.finishPlayback = error => {
        this.audio.onended = null; this.audio.onerror = null; this.finishPlayback = undefined;
        if (error) reject(error); else resolve();
      };
      this.audio.onended = () => this.finishPlayback?.();
      this.audio.onerror = () => this.finishPlayback?.(new Error('Lecture audio impossible.'));
      this.audio.src = url; this.setPhase('speaking');
      void this.audio.play().catch(() => this.setPhase('playback-blocked'));
    });
  }
  resumePlayback() {
    if (this.phase !== 'playback-blocked') return;
    void this.context?.resume();
    void this.audio.play().then(() => this.setPhase('speaking')).catch(() => this.setPhase('playback-blocked'));
  }
  /** Speech output is independent from the microphone: silence stops playback immediately, the mic may keep listening. */
  setSpeech(on: boolean) {
    this.speechOn = on;
    if (!on) { this.audio.pause(); this.finishPlayback?.(); if (this.phase === 'speaking' || this.phase === 'playback-blocked') this.setPhase(this.stream ? 'listening' : 'idle'); }
  }
  get speechEnabled() { return this.speechOn; }
  /** Speak a short acknowledgement right away, outside the FIFO. */
  async speakNow(url: string) { if (!this.speechOn || this.closed || this.phase === 'speaking') return; try { await this.prepareAudio(); this.audio.src = url; await this.audio.play(); } catch { /* text ack stays visible */ } }
  mute(value: boolean) {
    this.muted = value; this.endRecording(true);
    this.stream?.getAudioTracks().forEach(track => { track.enabled = !value; }); this.emit();
  }
  /** Continue pending turns after an explicit error acknowledgement, never auto-retry failed turn. */
  resumePending() { if (this.closed) return; this.error = null; this.setPhase(this.stream ? 'listening' : 'idle'); this.queue.resume(); }
  stop() {
    if (this.closed) return;
    this.closed = true; this.abort.abort(); this.queue.close(); this.endRecording(true);
    cancelAnimationFrame(this.frame); this.audio.pause(); this.finishPlayback?.();
    this.audio.removeAttribute('src'); this.audio.load();
    this.stream?.getTracks().forEach(t => t.stop()); this.input?.disconnect(); this.output?.disconnect();
    void this.context?.close(); this.adapters.onAnalysers(null);
    this.adapters.onState({ phase: 'idle', pending: 0, muted: false, error: null });
  }
}

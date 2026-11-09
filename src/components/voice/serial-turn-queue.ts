/** A turn owns generation and playback until resolution. No automatic replay on error. */
export class SerialTurnQueue {
  private jobs: Array<() => Promise<void>> = [];
  private running = false;
  private paused = false;
  private closed = false;
  constructor(private changed: (pending: number, paused: boolean) => void = () => {}, private failed: (error: unknown) => void = () => {}, private limit = 10) {}
  enqueue(job: () => Promise<void>) {
    if (this.closed) throw new Error('Session fermée.');
    if (this.jobs.length + Number(this.running) >= this.limit) throw new Error('File pleine (10 demandes). Attendez avant de parler ou envoyer.');
    this.jobs.push(job); this.notify(); void this.drain();
  }
  resume() { if (!this.closed) { this.paused = false; this.notify(); void this.drain(); } }
  close() { this.closed = true; this.jobs = []; this.notify(); }
  private notify() { this.changed(this.jobs.length + Number(this.running), this.paused); }
  private async drain() {
    if (this.running || this.paused || this.closed) return;
    const job = this.jobs.shift(); if (!job) return;
    this.running = true; this.notify();
    try { await job(); }
    catch (error) { this.paused = true; this.failed(error); }
    finally { this.running = false; this.notify(); }
    if (!this.closed && !this.paused) void this.drain();
  }
}
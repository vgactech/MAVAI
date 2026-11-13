import { useEffect, useRef } from 'react';
function Track({ analyser, role }: { analyser: AnalyserNode | null; role: 'assistant' | 'human' }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current; const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    let frame = 0;
    const data = new Float32Array(analyser?.fftSize ?? 2048);
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const draw = () => {
      const styles = getComputedStyle(canvas);
      const color = styles.getPropertyValue(role === 'assistant' ? '--voice-assistant' : '--voice-human').trim();
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.strokeStyle = color; ctx.lineWidth = 2; ctx.beginPath();
      if (analyser) analyser.getFloatTimeDomainData(data); else data.fill(0);
      for (let x = 0; x < canvas.width; x++) {
        const sample = data[Math.floor(x / canvas.width * data.length)] ?? 0;
        const taper = Math.sin(Math.PI * x / (canvas.width - 1));
        const y = canvas.height / 2 - (reducedMotion ? 0 : sample) * canvas.height * 0.42 * taper;
        if (x === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.stroke(); frame = requestAnimationFrame(draw);
    };
    draw(); return () => cancelAnimationFrame(frame);
  }, [analyser, role]);
  return <div className={`voice-track voice-track-${role}`}><canvas ref={ref} width={768} height={40} aria-label={role === 'assistant' ? 'Contour audio assistant à gauche' : 'Contour audio microphone à droite'} /></div>;
}
export function AudioTracks({ assistant, human }: { assistant: AnalyserNode | null; human: AnalyserNode | null }) {
  return <section className="voice-tracks" aria-label="Contour supérieur audio"><Track role="assistant" analyser={assistant}/><Track role="human" analyser={human}/></section>;
}

import { useEffect, useRef } from 'react';

/**
 * Plays a synthesized phone-ring tone (Web Audio) while `active` is true.
 * Used for both the incoming ring (callee) and the outgoing ringback (caller).
 *
 * Note: browsers may block audio until the user has interacted with the page.
 * The caller always has a gesture (they tapped "call"); the callee usually has
 * one from navigating the app, so the ring plays in practice.
 */
export function useRingtone(active: boolean) {
  const intervalRef = useRef<any>(null);

  useEffect(() => {
    if (!active) return;
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;

    const ctx: AudioContext = new AudioCtx();
    ctx.resume?.().catch(() => {});

    const beep = (offset: number) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.value = 480;
      const t = ctx.currentTime + offset;
      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.exponentialRampToValueAtTime(0.22, t + 0.04);
      gain.gain.setValueAtTime(0.22, t + 0.35);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.45);
      osc.start(t);
      osc.stop(t + 0.5);
    };

    // Classic "ring-ring … pause" repeating every 3 seconds.
    const ring = () => {
      beep(0);
      beep(0.6);
    };
    ring();
    intervalRef.current = setInterval(ring, 3000);

    return () => {
      clearInterval(intervalRef.current);
      try {
        ctx.close();
      } catch {
        /* no-op */
      }
    };
  }, [active]);
}

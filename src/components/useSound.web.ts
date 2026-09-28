import { useCallback, useEffect, useRef, useState } from 'react';
import { SfxName } from '../game/sound';

type Wave = OscillatorType;
type Tone = [freq: number, seconds: number, wave: Wave, volume: number, delay: number];

// Same tones as src/assets/sounds/*.wav, synthesized so the web build needs no audio files.
const SFX: Record<SfxName, Tone[]> = {
  lever: [
    [330, 0.07, 'square', 0.04, 0],
    [660, 0.09, 'square', 0.03, 0.05],
  ],
  stop: [[200, 0.06, 'square', 0.05, 0]],
  win: [
    [700, 0.09, 'square', 0.04, 0],
    [940, 0.11, 'square', 0.04, 0.07],
  ],
  hit: [[140, 0.13, 'sawtooth', 0.05, 0]],
  heal: [
    [880, 0.11, 'sine', 0.05, 0],
    [1175, 0.15, 'sine', 0.05, 0.08],
  ],
  guard: [[300, 0.16, 'triangle', 0.06, 0]],
  fanfare: [523, 659, 784, 1047].map((f, i): Tone => [f, i === 3 ? 0.26 : 0.19, 'square', 0.05, i * 0.095]),
  damage: [[90, 0.26, 'sawtooth', 0.06, 0]],
};

export function useSound() {
  const [muted, setMuted] = useState(false);
  const mutedRef = useRef(false);
  const ctxRef = useRef<AudioContext | null>(null);

  const context = useCallback(() => {
    if (!ctxRef.current) {
      const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!Ctor) return null;
      ctxRef.current = new Ctor();
    }
    return ctxRef.current;
  }, []);

  // Browsers (iOS Safari in particular) only start audio from a user gesture that ends, e.g. touchend/click.
  useEffect(() => {
    const unlock = () => {
      const ctx = context();
      if (ctx && ctx.state === 'suspended') ctx.resume().catch(() => {});
    };
    const events = ['touchend', 'pointerup', 'click', 'keydown'] as const;
    events.forEach((e) => document.addEventListener(e, unlock, { passive: true }));
    return () => {
      events.forEach((e) => document.removeEventListener(e, unlock));
      ctxRef.current?.close().catch(() => {});
      ctxRef.current = null;
    };
  }, [context]);

  const play = useCallback(
    (name: SfxName) => {
      if (mutedRef.current) return;
      const ctx = context();
      if (!ctx) return;
      if (ctx.state === 'suspended') ctx.resume().catch(() => {});
      SFX[name].forEach(([freq, seconds, wave, volume, delay]) => {
        const t = ctx.currentTime + delay;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = wave;
        osc.frequency.setValueAtTime(freq, t);
        gain.gain.setValueAtTime(volume, t);
        gain.gain.exponentialRampToValueAtTime(0.0001, t + seconds);
        osc.connect(gain).connect(ctx.destination);
        osc.start(t);
        osc.stop(t + seconds + 0.02);
      });
    },
    [context],
  );

  const toggleMuted = useCallback(() => {
    mutedRef.current = !mutedRef.current;
    setMuted(mutedRef.current);
  }, []);

  return { play, muted, toggleMuted };
}

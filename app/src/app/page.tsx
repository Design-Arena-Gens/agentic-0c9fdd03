'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

const SCENE_DURATION_MS = 12000;

export default function Home() {
  return (
    <div className="relative flex min-h-screen items-center justify-center bg-[#05070c] pb-20 pt-24 text-slate-100">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(87,_124,_204,_0.3),_transparent_60%)]" />
      <main className="relative z-10 flex w-full max-w-[520px] flex-col items-center gap-10 px-6">
        <header className="flex flex-col items-center gap-3 text-center">
          <span className="text-sm uppercase tracking-[0.6em] text-slate-400/80">
            Frozen Flower Break
          </span>
          <h1 className="text-3xl font-semibold text-slate-50">Whisper of Ice</h1>
          <p className="max-w-[36ch] text-pretty text-base text-slate-300">
            Immersive studio macro sequence — twelve seconds of crystalline tension melting into delicate bloom.
          </p>
        </header>
        <FrozenFlowerScene />
        <SoundPanel />
        <footer className="text-xs uppercase tracking-[0.3em] text-slate-500/80">
          Aspect 9:16 · Duration 12s · Macro ASMR
        </footer>
      </main>
    </div>
  );
}

function FrozenFlowerScene() {
  return (
    <section className="scene-card">
      <div className="scene-gradient" aria-hidden />
      <div className="scene-pan">
        <div className="scene-glow" aria-hidden />
        <div className="ice-cube">
          <div className="ice-facet facet-top" />
          <div className="ice-facet facet-side" />
          <div className="ice-frost" />
          <div className="ice-glint" />
          <div className="knife" />
          <div className="crack-lines">
            <span className="crack crack-1" />
            <span className="crack crack-2" />
            <span className="crack crack-3" />
          </div>
          <div className="rose-core">
            <div className="petal petal-outer" />
            <div className="petal petal-mid" />
            <div className="petal petal-inner" />
            <div className="petal filament" />
          </div>
          <div className="mist-layer" />
        </div>
        <div className="snow-dust">
          {Array.from({ length: 32 }).map((_, index) => (
            <span key={index} className={`flake flake-${index % 8}`} />
          ))}
        </div>
        <div className="droplet" aria-hidden />
      </div>
    </section>
  );
}

function SoundPanel() {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const resetTimerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (resetTimerRef.current) {
        window.clearTimeout(resetTimerRef.current);
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  const triggerSoundscape = useCallback(async () => {
    if (typeof window === 'undefined') return;

    if (!audioContextRef.current) {
      const context = new AudioContext();
      audioContextRef.current = context;
      const now = context.currentTime + 0.05;

      const frostNoise = createTexturedNoise(context, {
        duration: SCENE_DURATION_MS / 1000,
        gain: 0.18,
        color: 'bright',
      });
      frostNoise.start(now);
      frostNoise.stop(now + SCENE_DURATION_MS / 1000 + 1);

      scheduleCrackleBursts(context, now + 1.5);
      scheduleWaterDrips(context, now + 6.5);
      scheduleExhale(context, now + 2.5);
    }

    const context = audioContextRef.current;
    if (!context) return;

    if (context.state === 'suspended') {
      await context.resume();
    }

    setIsPlaying(true);
    if (resetTimerRef.current) {
      window.clearTimeout(resetTimerRef.current);
    }
    resetTimerRef.current = window.setTimeout(() => {
      setIsPlaying(false);
    }, SCENE_DURATION_MS + 1500);
  }, []);

  return (
    <div className="flex w-full flex-col items-center gap-3 text-center text-sm text-slate-300">
      <button type="button" className="sound-button" onClick={triggerSoundscape}>
        {isPlaying ? 'Soundscape Active' : 'Activate ASMR Soundscape'}
      </button>
      <p className="max-w-[38ch] text-xs text-slate-400">
        Tap to blend ice crackles, micro water drips, and a soft exhale rendered in-browser. Audio plays once per interaction.
      </p>
    </div>
  );
}

type NoiseColor = 'bright' | 'soft';

type NoiseOptions = {
  duration: number;
  gain: number;
  color?: NoiseColor;
};

function createTexturedNoise(context: AudioContext, options: NoiseOptions) {
  const bufferSize = Math.floor(context.sampleRate * options.duration);
  const buffer = context.createBuffer(1, bufferSize, context.sampleRate);
  const data = buffer.getChannelData(0);
  const color = options.color ?? 'soft';

  for (let i = 0; i < bufferSize; i += 1) {
    const base = Math.random() * 2 - 1;
    const shimmer = Math.sin((i / bufferSize) * Math.PI * 2 * 14) * 0.25;
    const tone = color === 'bright' ? base * 0.7 + shimmer : base * 0.4;
    const sculpt = Math.pow(1 - i / bufferSize, 1.35);
    data[i] = tone * sculpt;
  }

  const source = context.createBufferSource();
  source.buffer = buffer;

  const gain = context.createGain();
  gain.gain.value = options.gain;

  source.connect(gain).connect(context.destination);
  return source;
}

type TransientOptions = {
  duration: number;
  gain: number;
  curve?: 'crackle' | 'tap';
};

function createTransientBuffer(context: AudioContext, options: TransientOptions) {
  const length = Math.floor(context.sampleRate * options.duration);
  const buffer = context.createBuffer(1, length, context.sampleRate);
  const data = buffer.getChannelData(0);
  const curve = options.curve ?? 'tap';

  for (let i = 0; i < length; i += 1) {
    const t = i / length;
    const envelope = curve === 'crackle' ? Math.pow(1 - t, 2.6) : 1 - t;
    const noise = Math.random() * 2 - 1;
    data[i] = noise * envelope;
  }

  const source = context.createBufferSource();
  source.buffer = buffer;

  const gain = context.createGain();
  gain.gain.value = options.gain;

  source.connect(gain).connect(context.destination);
  return source;
}

function scheduleCrackleBursts(context: AudioContext, startTime: number) {
  const bursts = 6;
  for (let i = 0; i < bursts; i += 1) {
    const offset = Math.random() * 0.6 + i * 1.1;
    const time = startTime + offset;
    const burst = createTransientBuffer(context, {
      duration: 0.2,
      gain: 0.22,
      curve: 'crackle',
    });
    burst.start(time);
    burst.stop(time + 0.4);
  }
}

function scheduleWaterDrips(context: AudioContext, startTime: number) {
  const dripBus = context.createGain();
  dripBus.gain.value = 0.18;
  dripBus.connect(context.destination);

  for (let i = 0; i < 3; i += 1) {
    const time = startTime + i * 1.15 + Math.random() * 0.25;
    const osc = context.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(680, time);
    osc.frequency.exponentialRampToValueAtTime(220, time + 0.42);

    const gain = context.createGain();
    gain.gain.setValueAtTime(0.001, time);
    gain.gain.exponentialRampToValueAtTime(1, time + 0.04);
    gain.gain.exponentialRampToValueAtTime(0.002, time + 0.6);

    osc.connect(gain).connect(dripBus);
    osc.start(time);
    osc.stop(time + 0.65);
  }
}

function scheduleExhale(context: AudioContext, startTime: number) {
  const source = createTexturedNoise(context, {
    duration: 3.5,
    gain: 0.12,
    color: 'soft',
  });
  const filter = context.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(2400, startTime);
  filter.frequency.exponentialRampToValueAtTime(1100, startTime + 3.5);

  const gain = context.createGain();
  gain.gain.setValueAtTime(0.001, startTime);
  gain.gain.exponentialRampToValueAtTime(0.22, startTime + 0.7);
  gain.gain.exponentialRampToValueAtTime(0.002, startTime + 3.6);

  source.connect(filter).connect(gain).connect(context.destination);
  source.start(startTime);
  source.stop(startTime + 4.1);
}

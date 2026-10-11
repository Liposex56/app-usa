'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import { intro } from './content';
import { KeyedVideo, type KeyedVideoHandle } from './keyed-video';

// "Enter their haven" entrance screen. A click (or Enter) plays the door being
// painted; when the blue covers the screen it fades out and the page appears.
// Escape skips it.
export function Intro({ onDone }: { onDone: () => void }) {
  const [phase, setPhase] = useState<'idle' | 'playing' | 'leaving'>('idle');
  const [canAnimate, setCanAnimate] = useState(true);
  const videoRef = useRef<KeyedVideoHandle>(null);

  const leave = useCallback(() => {
    setPhase('leaving');
    setTimeout(onDone, 700);
  }, [onDone]);

  const start = () => {
    if (phase !== 'idle') return;
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduceMotion || !canAnimate || !videoRef.current) return leave();
    setPhase('playing');
    videoRef.current.play().catch(leave);
  };

  const onUnsupported = useCallback(() => setCanAnimate(false), []);

  // Locks the page scroll while the entrance is visible.
  useEffect(() => {
    const html = document.documentElement;
    const previous = html.style.overflow;
    html.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') leave();
    };
    window.addEventListener('keydown', onKey);
    return () => {
      html.style.overflow = previous;
      window.removeEventListener('keydown', onKey);
      window.scrollTo(0, 0);
    };
  }, [leave]);

  return (
    <div
      className={`fixed inset-0 z-[100] overflow-hidden bg-hv-cream transition-opacity duration-700 ${
        phase === 'leaving' ? 'pointer-events-none opacity-0' : ''
      }`}
    >
      <div
        className={`absolute left-[8%] top-[14%] w-[min(78vw,420px)] transition-opacity duration-700 md:left-[10.2%] md:top-[62.9%] md:w-[clamp(300px,36vw,620px)] md:-translate-y-1/4 ${
          phase === 'idle' ? '' : 'opacity-0 delay-500'
        }`}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/home/images/enter-their-haven.svg" alt="Enter their haven" className="w-full" />
        {intro.hint && (
          <p className="mt-[0.9em] animate-pulse text-[clamp(14px,1.2vw,18px)] font-semibold uppercase tracking-[0.18em] text-hv-mustard">
            {intro.hint}
          </p>
        )}
      </div>

      {/* Door animation (without the black background) */}
      <KeyedVideo
        ref={videoRef}
        src={intro.animation}
        onEnded={leave}
        onUnsupported={onUnsupported}
        className="pointer-events-none absolute inset-0 h-full w-full object-cover object-[76%_50%]"
      />

      <button
        type="button"
        onClick={start}
        autoFocus
        aria-label="Enter their haven"
        className="absolute inset-0 h-full w-full cursor-pointer focus:outline-none"
      />
    </div>
  );
}

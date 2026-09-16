'use client';

import { useEffect, useState } from 'react';

const LETTERS = 'ENTER THEIR'.split('');

export function IntroSplash() {
  const [mounted, setMounted] = useState(true);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setMounted(false);
    }
  }, []);

  if (!mounted) return null;

  function leave() {
    setLeaving(true);
    window.setTimeout(() => setMounted(false), 550);
  }

  return (
    <div
      onClick={leave}
      role="button"
      aria-label="Enter Havenr"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') leave();
      }}
      className={`bone-cursor fixed inset-0 z-[999] flex items-center justify-center bg-bone transition-all duration-500 ${
        leaving ? 'pointer-events-none -translate-y-[6%] opacity-0' : ''
      }`}
    >
      <div className="text-center">
        <div className="flex justify-center gap-x-3 font-display text-5xl font-black uppercase leading-[0.95] tracking-tight text-espresso-700 sm:text-6xl lg:text-7xl">
          {LETTERS.map((letter, index) =>
            letter === ' ' ? (
              <span key={index} className="w-2 sm:w-4" />
            ) : (
              <span
                key={index}
                className="animate-letter-in inline-block opacity-0"
                style={{ animationDelay: `${index * 0.04}s` }}
              >
                {letter}
              </span>
            )
          )}
        </div>

        <div
          className="relative mx-auto mt-1 flex items-center justify-center opacity-0"
          style={{ animation: 'letter-in 0.5s ease 0.45s forwards' }}
        >
          <span className="font-display text-5xl font-black uppercase leading-[0.95] tracking-tight text-gold-500 sm:text-6xl lg:text-7xl">
            HAV
            <span className="relative inline-block">
              e
              <svg
                className="animate-sway absolute -top-7 left-1/2 -translate-x-1/2 sm:-top-9"
                width="30"
                height="22"
                viewBox="0 0 30 22"
                fill="none"
              >
                <g fill="#26100B">
                  <ellipse cx="15" cy="16" rx="10" ry="4.4" />
                  <ellipse cx="4.5" cy="9" rx="2.6" ry="3.4" transform="rotate(-18 4.5 9)" />
                  <ellipse cx="25.5" cy="9" rx="2.6" ry="3.4" transform="rotate(18 25.5 9)" />
                  <circle cx="6" cy="15" r="1.6" />
                  <circle cx="24" cy="15" r="1.6" />
                </g>
              </svg>
            </span>
            N
          </span>
        </div>

        <p
          className="mt-6 inline-flex items-center gap-2 font-display text-xs font-bold uppercase tracking-[0.3em] text-olive-500 opacity-0"
          style={{
            animation:
              'letter-in 0.5s ease 0.75s forwards, bob 3.2s ease-in-out 0.75s infinite',
          }}
        >
          Tap to come in →
        </p>
      </div>
    </div>
  );
}

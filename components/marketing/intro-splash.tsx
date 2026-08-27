'use client';

import { useEffect, useState } from 'react';

const LETTERS = 'HAVENR'.split('');

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
      className={`bone-cursor fixed inset-0 z-[999] flex items-center justify-center bg-night-band transition-all duration-500 ${
        leaving ? 'pointer-events-none -translate-y-[6%] opacity-0' : ''
      }`}
    >
      <div className="text-center">
        <div className="flex justify-center gap-0.5 font-display text-6xl font-black uppercase tracking-tight text-sand sm:text-7xl lg:text-8xl">
          {LETTERS.map((letter, index) => (
            <span
              key={index}
              className="animate-letter-in inline-block opacity-0"
              style={{ animationDelay: `${index * 0.05}s` }}
            >
              {letter}
            </span>
          ))}
        </div>
        <svg
          className="mx-auto mt-5 opacity-0"
          style={{
            animation:
              'letter-in 0.5s ease 0.75s forwards, sway 1.4s ease-in-out 0.75s infinite',
          }}
          width="26"
          height="26"
          viewBox="0 0 30 30"
          fill="none"
        >
          <g fill="#E4A93B" stroke="#F6EEDD" strokeWidth="1.6">
            <rect
              x="9"
              y="12.5"
              width="12"
              height="5"
              rx="2.5"
              transform="rotate(-28 15 15)"
            />
            <circle cx="7" cy="9" r="3.6" />
            <circle cx="10" cy="6" r="3.1" />
            <circle cx="23" cy="21" r="3.6" />
            <circle cx="20" cy="24" r="3.1" />
          </g>
        </svg>
      </div>
    </div>
  );
}

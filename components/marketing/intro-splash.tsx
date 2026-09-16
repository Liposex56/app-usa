'use client';

import { useEffect, useState } from 'react';

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
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/brand/homepage/enter-haven.svg"
        alt="Enter their haven"
        width={1440}
        height={1024}
        className="h-full w-full object-contain"
      />
      <p className="animate-bob absolute bottom-[12%] font-display text-xs font-bold uppercase tracking-[0.3em] text-olive-500">
        Tap to come in →
      </p>
    </div>
  );
}

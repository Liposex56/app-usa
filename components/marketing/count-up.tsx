'use client';

import { useEffect, useRef, useState } from 'react';

/** Counts up from 0 to `target` once it scrolls into view. */
export function CountUp({ target }: { target: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [value, setValue] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          observer.unobserve(el);
          const start = performance.now();
          const duration = 800;
          function tick(now: number) {
            const progress = Math.min(1, (now - start) / duration);
            setValue(Math.round(target * (1 - Math.pow(1 - progress, 3))));
            if (progress < 1) requestAnimationFrame(tick);
          }
          requestAnimationFrame(tick);
        });
      },
      { threshold: 0.6 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [target]);

  return <span ref={ref}>{value}</span>;
}

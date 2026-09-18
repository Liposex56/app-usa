'use client';

import { useEffect, useRef, useState } from 'react';

type Step = { step: string; title: string; body: string };
type Layout = { left: string; top: string; transform: string };

/**
 * Desktop-only scroll interaction called out on the design file itself:
 * "con cada scroll aparece cada uno" — each card should reveal one at a time
 * as the user keeps scrolling, not all at once. The fan stays pinned
 * (position: sticky) while a tall spacer beneath it gives enough scroll
 * distance for four separate reveal triggers, one per card.
 */
export function HowItWorksFan({
  steps,
  layout,
}: {
  steps: Step[];
  layout: Layout[];
}) {
  const [visible, setVisible] = useState<boolean[]>(() =>
    steps.map(() => false)
  );
  const triggerRefs = useRef<Array<HTMLDivElement | null>>([]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const index = Number(
            (entry.target as HTMLElement).dataset.hiwTrigger
          );
          setVisible((prev) => {
            if (prev[index]) return prev;
            const next = [...prev];
            next[index] = true;
            return next;
          });
          observer.unobserve(entry.target);
        });
      },
      { rootMargin: '-35% 0px -35% 0px', threshold: 0 }
    );
    triggerRefs.current.forEach((el) => el && observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <div
      className="relative mt-16 hidden sm:block"
      style={{ height: `${steps.length * 60}vh` }}
    >
      {steps.map((_, index) => (
        <div
          key={index}
          ref={(el) => {
            triggerRefs.current[index] = el;
          }}
          data-hiw-trigger={index}
          aria-hidden
          className="pointer-events-none absolute h-px w-full"
          style={{ top: `${(index / steps.length) * 100}%` }}
        />
      ))}

      <div className="container-page sticky top-28 h-[36rem]">
        {steps.map((item, index) => {
          const isVisible = visible[index];
          return (
            <div
              key={item.step}
              style={{
                left: layout[index].left,
                top: layout[index].top,
                transform: isVisible
                  ? layout[index].transform
                  : `${layout[index].transform} translateY(2.5rem)`,
              }}
              className={`absolute w-[58%] max-w-lg rounded-3xl bg-white p-7 shadow-lift transition-[opacity,transform] duration-700 ease-out hover:z-10 lg:w-[38%] ${
                isVisible ? 'opacity-100' : 'opacity-0'
              }`}
            >
              <span className="font-display text-6xl font-black text-sky-300">
                {item.step}
              </span>
              <h3 className="mt-3 font-display text-xl font-black uppercase leading-tight text-espresso-700">
                {item.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-espresso-500">
                {item.body}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

'use client';

/* eslint-disable @next/next/no-img-element */
import { useEffect, useRef, useState } from 'react';

import { howItWorks } from './content';

const GAP = 28; // gap between cards (px)
const MAX_W = 415; // max width of each card on desktop (px)
const CARD_RATIO = 1918 / 2000; // height / width of the step illustrations
const DECK_ROTATION = [0, 4, -5, 3]; // tilt of each card while they are stacked

// All steps are visible together. When the section arrives the cards are
// stacked in the middle (1 in front, the rest behind) and, as the page scrolls,
// the back ones slide until they are all in a row.
// On tablet they go two by two and on mobile one under the other, without animation.
export function HowItWorks() {
  const stageRef = useRef<HTMLOListElement>(null);
  const [progress, setProgress] = useState(0);
  const [layout, setLayout] = useState({ desktop: false, width: 0 });
  const steps = howItWorks.steps;

  useEffect(() => {
    const desktop = window.matchMedia('(min-width: 1024px)');
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    let frame = 0;

    const update = () => {
      frame = 0;
      const el = stageRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const vh = window.innerHeight;
      // 0 = the row just peeks from the bottom; 1 = its center reaches ~55% of the screen
      const start = vh;
      const end = vh * 0.55 - rect.height / 2;
      const raw = (start - rect.top) / (start - end);
      setProgress(reduceMotion.matches ? 1 : Math.min(Math.max(raw, 0), 1));
      setLayout((prev) =>
        prev.desktop === desktop.matches && prev.width === el.clientWidth
          ? prev
          : { desktop: desktop.matches, width: el.clientWidth }
      );
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };

    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      cancelAnimationFrame(frame);
    };
  }, []);

  const cardWidth = Math.min(MAX_W, (layout.width - GAP * (steps.length - 1)) / steps.length);
  const cardHeight = cardWidth * CARD_RATIO;
  const eased = 1 - Math.pow(1 - progress, 3);

  // Position of each card: from a "deck" in the middle to its place in the row
  const cardStyle = (i: number): React.CSSProperties | undefined => {
    if (!layout.desktop) return undefined;
    const slot = (i - (steps.length - 1) / 2) * (cardWidth + GAP);
    const deck = { x: i * 22, y: i * -12, rotate: DECK_ROTATION[i % DECK_ROTATION.length], scale: 1 - i * 0.05 };
    const mix = (a: number, b: number) => a + (b - a) * eased;
    return {
      width: cardWidth,
      zIndex: steps.length - i,
      transform: `translateX(calc(-50% + ${mix(deck.x, slot)}px)) translateY(${mix(deck.y, 0)}px) rotate(${mix(
        deck.rotate,
        0
      )}deg) scale(${mix(deck.scale, 1)})`,
    };
  };

  return (
    <section id="how-it-works" className="pb-[clamp(24px,4vw,56px)] pt-[clamp(56px,7.5vw,108px)]">
      <div className="mx-auto max-w-[1440px] px-5 lg:px-[70px]">
        <p className="text-[clamp(14px,1.3vw,19px)] font-medium uppercase leading-none">{howItWorks.eyebrow}</p>
        <h2 className="mt-2 text-[clamp(22px,2.45vw,35px)] font-medium uppercase leading-none">{howItWorks.title}</h2>
      </div>

      <div className="mx-auto mt-[clamp(32px,5vw,72px)] max-w-[1440px] px-5 lg:px-[70px]">
        <ol
          ref={stageRef}
          className="relative grid gap-4 md:grid-cols-2 lg:block"
          style={layout.desktop ? { height: cardHeight } : undefined}
        >
          {steps.map((step, i) => (
            <li
              key={step.n}
              style={cardStyle(i)}
              className="relative aspect-[2000/1918] w-full max-w-[676px] justify-self-center overflow-hidden rounded-[8%] shadow-[0_10px_30px_-18px_rgba(38,16,11,0.35)] will-change-transform [container-type:inline-size] lg:absolute lg:left-1/2 lg:top-0 lg:max-w-none"
            >
              {/* The illustration already has the cream background and rounded corners */}
              <img src={step.image} alt={step.alt} className="absolute inset-0 h-full w-full object-cover" loading="lazy" />
              <span className="absolute right-[6%] top-[3%] text-[length:24cqw] font-bold leading-none text-hv-sky">
                {step.n}
              </span>
              {step.title && (
                <h3 className="absolute bottom-[5%] right-[5%] max-w-[80%] rounded-full bg-hv-paper/90 px-[0.5em] py-[0.1em] text-right text-[clamp(15px,5.4cqw,27px)] font-medium leading-tight">
                  {step.title}
                </h3>
              )}
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

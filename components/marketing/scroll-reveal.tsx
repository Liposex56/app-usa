'use client';

import { useEffect } from 'react';

/**
 * Watches every [data-reveal] element on the page and adds .is-visible the
 * first time it scrolls into view. Renders nothing — the actual before/after
 * styles live in globals.css so this stays a tiny, single-purpose island.
 */
export function ScrollReveal() {
  useEffect(() => {
    const elements = document.querySelectorAll('[data-reveal]');
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: '0px 0px -60px 0px' }
    );
    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return null;
}

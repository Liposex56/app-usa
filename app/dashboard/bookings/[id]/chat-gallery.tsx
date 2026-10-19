'use client';

import { useState } from 'react';

import { Button } from '@/components/ui/button';

export type GalleryItem = {
  id: string;
  url: string;
  type: 'image' | 'video';
  caption: string | null;
  /** Already formatted, e.g. "Oct 14 · 11:50 PM". */
  when: string;
};

/** Every photo and video sent in the conversation, in one place. */
export function ChatGallery({ items }: { items: GalleryItem[] }) {
  const [open, setOpen] = useState(false);
  if (items.length === 0) return null;

  return (
    <>
      <Button size="sm" variant="secondary" onClick={() => setOpen(true)}>
        Gallery ({items.length})
      </Button>

      {open && (
        <div
          className="fixed inset-0 z-40 flex items-center justify-center bg-espresso-900/60 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="gallery-title"
          onClick={() => setOpen(false)}
        >
          <div
            className="max-h-[88vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-hv-paper p-5 shadow-lift sm:p-6"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <h2 id="gallery-title" className="text-xl font-semibold text-espresso-700">
                Photos &amp; videos
              </h2>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close"
                className="text-2xl leading-none text-espresso-500 hover:text-espresso-700"
              >
                ×
              </button>
            </div>

            <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {items.map((item) => (
                <li key={item.id} className="overflow-hidden rounded-2xl bg-bone">
                  {item.type === 'video' ? (
                    <video
                      src={item.url}
                      controls
                      playsInline
                      preload="metadata"
                      className="aspect-square w-full bg-espresso-700/5 object-cover"
                    />
                  ) : (
                    <a href={item.url} target="_blank" rel="noopener noreferrer">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={item.url}
                        alt={item.caption ?? 'Photo from the conversation'}
                        loading="lazy"
                        className="aspect-square w-full object-cover"
                      />
                    </a>
                  )}
                  <div className="px-3 py-2">
                    <p className="text-sm text-espresso-500">{item.when}</p>
                    {item.caption && (
                      <p className="mt-0.5 line-clamp-2 text-[15px] text-espresso-700">
                        {item.caption}
                      </p>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </>
  );
}

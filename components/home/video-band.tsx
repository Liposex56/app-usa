'use client';

import { useRef, useState } from 'react';

import { servicesBand } from './content';

// Full-width brand video, muted and looping. The band takes the video's own
// proportions (servicesBand.width / height), so it is shown whole — never
// cropped into another shape. The corner button turns the sound on or off.
export function VideoBand() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [muted, setMuted] = useState(true);

  const toggleSound = () => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !video.muted;
    setMuted(video.muted);
    if (!video.muted) void video.play();
  };

  return (
    <div
      className="relative w-full overflow-hidden bg-hv-ink"
      style={{ aspectRatio: `${servicesBand.width} / ${servicesBand.height}` }}
    >
      <video
        ref={videoRef}
        src={servicesBand.video}
        poster={servicesBand.poster}
        aria-label={servicesBand.label}
        autoPlay
        muted
        loop
        playsInline
        preload="metadata"
        className="h-full w-full object-contain"
      />
      <button
        type="button"
        onClick={toggleSound}
        aria-label={muted ? 'Turn sound on' : 'Turn sound off'}
        className="absolute bottom-[clamp(40px,6vw,90px)] right-5 z-20 grid h-11 w-11 place-items-center rounded-full bg-hv-cream/85 text-hv-ink backdrop-blur transition-colors hover:bg-hv-cream lg:right-10"
      >
        <svg
          viewBox="0 0 24 24"
          className="h-5 w-5"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M11 5 6 9H3v6h3l5 4V5Z" fill="currentColor" />
          {muted ? <path d="m16 9 5 6m0-6-5 6" /> : <path d="M15.5 8.5a5 5 0 0 1 0 7M18.5 5.5a9 9 0 0 1 0 13" />}
        </svg>
      </button>
    </div>
  );
}

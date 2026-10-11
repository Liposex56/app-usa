/* eslint-disable @next/next/no-img-element */
import { details } from './content';
import { CURL_PATH } from './curl-path';

// Big rounded corner of each photo, like the shaped photos of the Figma
const shapes = {
  tr: 'rounded-[10px] rounded-tr-[clamp(40px,5.5vw,80px)]',
  tl: 'rounded-[10px] rounded-tl-[clamp(40px,5.5vw,80px)]',
  bl: 'rounded-[10px] rounded-bl-[clamp(40px,5.5vw,80px)]',
};

export function Details() {
  return (
    <section className="pt-[clamp(56px,7vw,100px)]">
      <h2 className="hv-display px-5 text-center text-[clamp(52px,7.7vw,112px)] leading-[0.96]">
        {details.title[0]}
        <br />
        {details.title[1]}
        <br />
        <span className="text-white">{details.title[2]}</span>
      </h2>

      <div className="relative mx-auto mt-[clamp(40px,6.4vw,92px)] max-w-[1440px] px-5 lg:pl-[30%] lg:pr-[3.9%]">
        <Doodle className="absolute left-[4.7%] top-[2%] hidden w-[20.3%] lg:block" />

        <div className="flex flex-col gap-3">
          {details.rows.map((row, r) => (
            <div key={r} className="flex flex-col gap-3 sm:h-[clamp(200px,21.5vw,310px)] sm:flex-row">
              {row.map((tile) => (
                <figure
                  key={tile.label}
                  className={`relative h-56 overflow-hidden bg-hv-greige sm:h-auto sm:basis-0 sm:[flex-grow:var(--grow)] ${shapes[tile.shape]}`}
                  style={{ '--grow': tile.grow } as React.CSSProperties}
                >
                  <img
                    src={tile.image}
                    alt=""
                    className="h-full w-full object-cover"
                    style={{ objectPosition: tile.position }}
                    loading="lazy"
                  />
                  <figcaption className="absolute bottom-[11px] right-[4px] whitespace-nowrap rounded-full bg-hv-paper px-[0.75em] py-[0.08em] text-[clamp(16px,2.2vw,32px)] font-medium leading-tight">
                    {tile.label}
                  </figcaption>
                </figure>
              ))}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// White shape with the golden "e" that appears at the left of the mosaic
function Doodle({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 480 255" className={className} aria-hidden="true">
      <g fill="white">
        <circle cx="78" cy="148" r="48" />
        <ellipse cx="198" cy="157" rx="84" ry="54" transform="rotate(-14 198 157)" />
        <ellipse cx="300" cy="123" rx="28" ry="82" transform="rotate(-16 300 123)" />
        <ellipse cx="370" cy="124" rx="40" ry="88" transform="rotate(2 370 124)" />
      </g>
      <path d={CURL_PATH} fill="#be8210" transform="translate(272 92) scale(1.35) translate(-7 -13)" />
    </svg>
  );
}

/* eslint-disable @next/next/no-img-element */
import { hero, links } from './content';
import { ArrowButton } from './arrow-button';

// On large screens the hero is a "stage" with the proportions of the Figma
// (1440 x 910). Everything is positioned in % and text sizes use cqw (1cqw = 1%
// of the stage width), so it looks the same at any desktop width.
// On mobile/tablet the elements stack.
export function Hero() {
  return (
    <section id="top" className="relative overflow-hidden">
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 26% 32% at 23% 44%, rgba(160,202,238,.9), rgba(194,220,244,0) 100%), radial-gradient(ellipse 30% 26% at 62% 88%, rgba(255,246,196,.9), rgba(255,246,196,0) 100%), radial-gradient(ellipse 30% 30% at 100% 8%, rgba(250,244,206,.8), rgba(250,244,206,0) 100%)',
        }}
      />

      <div className="relative mx-auto max-w-[1440px] [container-type:inline-size]">
        <div className="relative flex flex-col gap-8 px-5 pb-12 pt-8 lg:block lg:aspect-[1440/910] lg:p-0">
          <p className="order-first text-sm font-semibold leading-tight lg:absolute lg:left-[89.7%] lg:top-[1.8%] lg:text-[length:1.1cqw]">
            {hero.tagline[0]}
            <br />
            {hero.tagline[1]}
          </p>

          <h1 className="hv-display text-[clamp(56px,15vw,96px)] leading-[0.89] lg:absolute lg:left-[3.2%] lg:top-[8.1%] lg:text-[length:6.66cqw]">
            {hero.title.before} <span className="text-hv-sky">{hero.title.highlight}</span>
            {hero.title.after.map((line) => (
              <span key={line} className="block">
                {line}
              </span>
            ))}
          </h1>

          <p className="max-w-md text-justify text-lg font-medium leading-snug lg:absolute lg:left-[3.2%] lg:top-[39%] lg:w-[30.2%] lg:max-w-none lg:text-[length:1.72cqw] lg:leading-[1.1]">
            {hero.text}
          </p>

          <HeroMedia />

          <ArrowButton
            href={links.findHaven}
            className="self-end lg:absolute lg:left-[79.8%] lg:top-[80.6%] lg:w-[18.5%] lg:py-[0.32em] lg:pl-[0.6em] lg:text-[length:1.95cqw]"
          >
            {hero.cta}
          </ArrowButton>
        </div>
      </div>
    </section>
  );
}

// Space of the hero video. If `hero.video` has a path the video plays;
// otherwise the still illustration (person + dog + leash) is shown, built from
// the files in the ILUSTRACIONES folder.
function HeroMedia() {
  return (
    <div className="relative -mx-5 aspect-[966/600] [container-type:inline-size] lg:absolute lg:left-[32.9%] lg:top-[17.6%] lg:mx-0 lg:w-[67.1%]">
      {hero.video ? (
        <video
          className="absolute inset-0 h-full w-full object-contain"
          src={hero.video}
          autoPlay
          muted
          loop
          playsInline
        />
      ) : (
        <HeroIllustration />
      )}
    </div>
  );
}

function HeroIllustration() {
  return (
    <>
      {/* Both layers come from ilustracion (2).png and (3).png, flipped horizontally */}
      <img
        src="/home/images/hero-dog.png"
        alt=""
        className="absolute left-[12.7%] top-[3.8%] w-[86.7%] max-w-none select-none"
        draggable="false"
      />
      <img
        src="/home/images/hero-person.png"
        alt="A woman running with her dog on a leash"
        className="absolute left-0 top-[16.7%] w-[98.1%] max-w-none select-none"
        draggable="false"
      />

      {/* Leash */}
      <svg viewBox="0 0 966 600" className="absolute inset-0 h-full w-full" fill="none" aria-hidden="true">
        <path
          d="M328 419 C322 398 334 368 341 373 C352 381 340 412 335 437 C330 466 360 490 398 488 C431 486 460 452 475 412 C483 390 487 368 478 373 C465 380 466 414 485 440 C515 474 566 500 620 497 C676 494 716 455 741 412 C750 397 757 381 763 372 C766 366 769 362 772 362 C776 362 777 367 775 371 C778 379 785 386 793 386 C801 386 807 382 808 375 L808 370"
          stroke="#26100B"
          strokeWidth="5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>

      <p className="absolute right-[1.5%] top-[16.7%] whitespace-nowrap font-hand text-[length:2cqw] leading-none text-hv-ink/70">
        {hero.notes.question}
      </p>
      <div className="absolute left-[60.5%] top-[37%] w-[16%] text-center font-hand text-[length:2.05cqw] leading-[0.85] text-hv-ink/70">
        {hero.notes.answer.map((line, i) => (
          <span key={line} className={`block ${i === 0 ? 'mb-[0.6em] text-left' : ''}`}>
            {line}
          </span>
        ))}
      </div>
    </>
  );
}

/* eslint-disable @next/next/no-img-element */
import Link from 'next/link';

import { closing, links } from './content';

// Page closing: main button, the three-dogs illustration and the final bar.
// On desktop it uses a 1440 x 1000 "stage" as in the Figma.
export function Closing() {
  return (
    <section className="relative mx-auto max-w-[1440px] overflow-hidden [container-type:inline-size]">
      <div className="relative flex flex-col items-start gap-6 px-5 pt-12 lg:block lg:aspect-[1440/1000] lg:p-0">
        {/* Blue ribbon (bow): enters from the top right, loops behind the dogs
            and goes down until it disappears behind the final bar.
            Traced from the Figma; sits behind the illustration. */}
        <svg
          viewBox="0 0 1440 1000"
          className="pointer-events-none absolute inset-0 hidden h-full w-full lg:block"
          fill="none"
          stroke="#c2dcf4"
          strokeWidth="40"
          strokeLinecap="round"
          aria-hidden="true"
        >
          <path d="M1470 26C1454 27 1411 28 1375 30C1340 32 1301 31 1257 36C1213 42 1153 49 1110 63C1068 77 1032 97 1002 118C973 139 951 162 933 187C915 212 902 241 894 266C887 291 886 312 888 335C890 358 898 382 908 403C918 425 932 447 947 464C962 482 981 497 998 508C1015 519 1032 530 1051 532C1070 534 1093 532 1110 522C1127 512 1145 492 1155 472C1165 452 1170 424 1169 403C1168 382 1161 360 1149 344C1138 328 1118 315 1100 305C1082 296 1061 291 1041 287C1021 283 1003 283 982 282C961 281 936 281 913 282C890 283 870 285 845 290C821 296 792 302 766 315C740 328 710 345 688 370C666 395 646 428 633 463C620 498 614 543 611 581C608 619 613 656 617 689C622 722 630 745 638 777C647 809 659 841 668 880C677 919 686 988 690 1010" />
        </svg>

        <div className="relative order-2 w-full lg:absolute lg:left-[61.4%] lg:top-[2.8%] lg:w-[40.3%]">
          <img src="/home/images/walk-dogs.png" alt="Three dogs on leashes held by one hand" className="w-full" loading="lazy" />
          <p className="absolute left-[29%] top-[20%] font-hand text-[clamp(18px,3.8cqw,26px)] text-hv-ink/70 lg:text-[length:2cqw]">
            {closing.note}
          </p>
        </div>

        <div className="relative order-1 flex flex-col items-start lg:absolute lg:left-[4.4%] lg:top-[50%] lg:w-[28.1%]">
          <img
            src="/home/images/dachshund-icon.svg"
            alt=""
            aria-hidden="true"
            className="ml-[66%] w-[clamp(52px,5cqw,72px)]"
          />
          <Link
            href={links.findHavener}
            className="w-full rounded-full bg-hv-sky px-[0.75em] py-[0.32em] text-left text-[clamp(28px,3.15cqw,45px)] font-medium uppercase leading-tight transition-colors hover:bg-[#acd0f0]"
          >
            {closing.primary}
          </Link>
          <Link
            href={links.becomeHavener}
            className="ml-[4.5%] mt-[0.75em] text-[clamp(24px,2.9cqw,41px)] font-bold uppercase text-hv-sky transition-colors hover:text-[#8fbde8]"
          >
            {closing.secondary}
          </Link>
        </div>

        <div className="relative order-3 -mx-5 w-[calc(100%+40px)] rounded-t-[clamp(40px,6.25cqw,90px)] bg-hv-sand px-[5.5cqw] py-6 lg:absolute lg:inset-x-0 lg:bottom-0 lg:top-[84.8%] lg:mx-0 lg:w-auto lg:py-[2cqw]">
          <p className="text-[clamp(16px,2.45cqw,35px)] font-medium uppercase leading-[1.05] text-hv-cream">{closing.banner}</p>
        </div>
      </div>
    </section>
  );
}

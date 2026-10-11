// Every text, image and video of the landing page lives here.
// To change a copy line or a photo you don't need to touch the components.
// (Ported as-is from the delivered Vite project `havenr-web/src/content.js`.)

// "Enter their haven" entrance screen (shown before the page).
export const intro = {
  enabled: true, // false = the page opens straight away, without the entrance
  // Plays when the visitor clicks ("Ilustración sin título.mp4", converted).
  // The other version, with the door opening, is "Ilustración sin título (1).mp4".
  animation: '/home/video/intro-door.mp4',
  hint: 'Click to enter' as string | null, // small text under the title (null removes it)
};

/** Session cookie: once the visitor has entered, the intro isn't shown again until the browser is closed. */
export const INTRO_SEEN_COOKIE = 'havenr_intro_seen';

export const nav = [
  { label: 'Services', href: '/#services' },
  { label: 'How It Works', href: '/#how-it-works' },
  { label: 'Trust & Safety', href: '/#trust' },
];

// Where each button of the landing goes.
export const links = {
  login: '/login',
  getStarted: '/signup',
  becomeHavener: '/become-a-havener',
  findHaven: '/search',
  helpMeChoose: '/services',
  findHavener: '/search',
} as const;

export const hero = {
  tagline: ['Boston-area pet care', 'actually vetted'],
  title: { before: 'Pet', highlight: 'care', after: ['you can trust,', 'booked in minutes'] },
  text: 'Havenr is a better way to find care for your pet—somewhere that feels like home. We connect families with carefully selected and vetted Haveners.',
  cta: 'Find their haven',
  // When the hero video is ready, put its path here (e.g. '/home/video/hero.mp4').
  // While it is null the still illustration (person + dog + leash) is shown.
  video: null as string | null,
  notes: {
    question: '- so... what did you do today?',
    answer: ['- oh you know..', 'went for a walk', 'played a little', 'got lots of cuddles', 'took the best nap'],
  },
};

// Video strip under the hero ("Havenr.MOV", 3840x1634, converted to MP4 for the web).
// The band is shown at the video's own proportions — set width/height to the
// real size of whatever file you put here so it is never cropped.
export const servicesBand = {
  video: '/home/video/havenr-brand.mp4',
  poster: '/home/images/havenr-brand-poster.jpg',
  width: 1920,
  height: 818,
  label: 'Havenr brand video: dogs and cats cared for by Haveners',
};

export type ServiceCardContent = {
  id: string;
  title: string;
  text: string;
  tone: 'greige' | 'khaki';
  image?: string;
  /** Page of the service (matches lib/services.ts slugs). */
  href: string;
};

export const services: ServiceCardContent[] = [
  { id: 'boarding', title: 'Boarding', text: 'Overnight care in your Havener’s home', tone: 'greige', href: '/services/boarding' },
  { id: 'daycare', title: 'Daycare', text: 'Daytime care, home by evening', tone: 'khaki', image: '/home/images/aussie.png', href: '/services/daycare' },
  { id: 'house-sitting', title: 'House sitting', text: 'Your Havener stays at your place', tone: 'greige', image: '/home/images/house-sitting.jpg', href: '/services/house-sitting' },
  { id: 'dog-walking', title: 'Dog walking', text: 'GPS-tracked walks, reported end to end', tone: 'khaki', image: '/home/images/westie.png', href: '/services/dog-walking' },
  { id: 'drop-in', title: 'Drop-in visits', text: 'Short visits, built for cats and stay-at-home pets', tone: 'greige', href: '/services/drop-in-visits' },
];

export const servicesFooter = {
  left: 'Every pet deserves a place that feels like home.',
  right: 'Not sure which one?',
};

export type TrustCheck = {
  label: string;
  bg: string;
  color: string;
  dog?: boolean;
  /** Optional text shown while the panel is open. */
  text?: string;
};

export const trust = {
  eyebrow: 'Trust & Safety',
  title: ['Four checks.', 'No', 'exceptions.'],
  // In the Figma, panels 2, 3 and 4 all say "INTERVIEW" (copy of the same frame).
  // The real names of checks 3 and 4 still have to be confirmed.
  checks: [
    { label: 'Background checked', bg: 'bg-hv-ink', color: 'text-hv-sky', dog: true },
    { label: 'Interview', bg: 'bg-hv-mustard', color: 'text-hv-cream' },
    { label: 'Check 3 (pendiente)', bg: 'bg-hv-sky', color: 'text-hv-ink' },
    { label: 'Check 4 (pendiente)', bg: 'bg-hv-cocoa', color: 'text-hv-mustard' },
  ] as TrustCheck[],
};

export const howItWorks = {
  eyebrow: 'What we offer',
  title: 'From “Who can watch my dog?” to booked',
  // Step 1 comes from the Figma and step 2 from "Frame 15.svg".
  // Step 3 is provisional: the real copy is still missing.
  steps: [
    { n: 1, title: 'Tell us about your pet' },
    { n: 2, title: 'Message, book and pay in one place' },
    { n: 3, title: 'Get updates while you’re away' },
  ],
};

export type DetailTile = {
  label: string;
  image: string;
  grow: number;
  /** Big rounded corner of each photo (as in the Figma). */
  shape: 'tr' | 'tl' | 'bl';
  position: string;
};

export const details = {
  title: ['The details that decide', 'whether', 'you sleep well'],
  rows: [
    [
      { label: 'everything stays in the app', image: '/home/images/detail-app.jpg', grow: 419, shape: 'tr', position: '50% 40%' },
      { label: 'updates you don’t have to ask for', image: '/home/images/detail-updates.jpg', grow: 520, shape: 'bl', position: '50% 30%' },
    ],
    [
      { label: 'walks you can actually verify', image: '/home/images/detail-walks.jpg', grow: 673, shape: 'tr', position: '50% 45%' },
      { label: 'private by design', image: '/home/images/detail-private.jpg', grow: 254, shape: 'tl', position: '58% 50%' },
    ],
    [
      { label: 'visits with a real checklist', image: '/home/images/detail-visits.jpg', grow: 345, shape: 'tr', position: '45% 40%' },
      { label: 'one clear total, no surprises', image: '/home/images/detail-total.jpg', grow: 592, shape: 'tl', position: '50% 40%' },
    ],
  ] as DetailTile[][],
};

export const testimonials = {
  title: 'Trust you can feel from the first message',
  // Only the first one comes in the Figma. The other two stay empty until there are real testimonials.
  items: [
    { quote: 'i never had to ask how my dog was doing — the photos just showed up, every few hours.', author: 'laura, arlington' },
    { quote: null, author: null },
    { quote: null, author: null },
  ] as Array<{ quote: string | null; author: string | null }>,
};

export const faq = {
  title: 'Quick answers',
  subtitle: 'Before you book',
  items: [
    {
      q: 'what if i need to cancel?',
      a: 'you can cancel or reschedule right in the app. we’ll show you the exact cutoff for a full refund before you confirm — no surprises.',
    },
  ],
};

export const closing = {
  primary: 'Find a Havener',
  secondary: 'Become a Havener',
  note: '-ready for a walk?',
  banner: 'Your pet already trusts you. Let’s find someone they can trust too. Creating an account is free. You only pay when you confirm a booking.',
};

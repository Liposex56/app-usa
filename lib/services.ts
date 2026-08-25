import type { ServiceType } from '@/lib/database.types';

export type ServiceDefinition = {
  type: ServiceType;
  slug: string;
  name: string;
  tagline: string;
  where: string;
  duration: string;
  /** Copy for the marketing pages. */
  description: string;
  includes: string[];
  /** Shown as the starting price on the landing page, in whole dollars. */
  fromRate: number;
  rateUnit: string;
  species: Array<'dog' | 'cat'>;
};

export const SERVICES: ServiceDefinition[] = [
  {
    type: 'boarding',
    slug: 'boarding',
    name: 'Boarding',
    tagline: 'Overnight care in your Havener’s home',
    where: 'Your Havener’s home',
    duration: 'One or more nights',
    description:
      'Your pet stays overnight in a verified Havener’s home — not a kennel. You’ll get photo and video updates every day, plus a stay summary and a highlight reel when they head home.',
    includes: [
      'Meet the home before you book',
      'Daily photo and video updates',
      'Feeding, medication and routine kept exactly as you wrote it',
      'Stay summary with everything that happened',
      'Highlight reel of the best moments',
    ],
    fromRate: 45,
    rateUnit: 'night',
    species: ['dog', 'cat'],
  },
  {
    type: 'daycare',
    slug: 'daycare',
    name: 'Daycare',
    tagline: 'Daytime care, home by evening',
    where: 'Your Havener’s home',
    duration: 'Daytime, no overnight',
    description:
      'A full day of company, play and rest at your Havener’s home while you work. Drop off in the morning, pick up in the evening, and follow along all day.',
    includes: [
      'Drop-off and pick-up times you choose',
      'Meals, water and authorized medication logged',
      'Photo and video updates during the day',
      'End-of-day summary and highlight reel',
      'Behavior notes so you know how the day really went',
    ],
    fromRate: 32,
    rateUnit: 'day',
    species: ['dog', 'cat'],
  },
  {
    type: 'house_sitting',
    slug: 'house-sitting',
    name: 'House Sitting',
    tagline: 'Your Havener stays at your place',
    where: 'Your home',
    duration: 'Hours, full days or nights',
    description:
      'Your Havener comes to you, so your pet keeps their own bed, their own yard and their own routine. Best for pets who travel badly or need the familiar.',
    includes: [
      'Your house rules, routines and access instructions',
      'Start and end times logged for every shift',
      'Photo updates and written notes',
      'Your full address shared only after you confirm the booking',
      'Care summary when the stay ends',
    ],
    fromRate: 55,
    rateUnit: 'night',
    species: ['dog', 'cat'],
  },
  {
    type: 'dog_walking',
    slug: 'dog-walking',
    name: 'Dog Walking',
    tagline: 'GPS-tracked walks, reported end to end',
    where: 'Your neighborhood',
    duration: 'Per booked walk',
    description:
      'A real walk with a real report. Your Havener starts the walk in the app and can’t finish it until the required photos and details are in.',
    includes: [
      'Live GPS map of the route',
      'Start time, end time and total duration',
      'Distance covered',
      'Pee and poop log, water and breaks',
      'Required photos and a walk report',
    ],
    fromRate: 25,
    rateUnit: 'walk',
    species: ['dog'],
  },
  {
    type: 'drop_in_visit',
    slug: 'drop-in-visits',
    name: 'Drop-In Visits',
    tagline: 'Short visits, built for cats and stay-at-home pets',
    where: 'Your home',
    duration: 'Per visit',
    description:
      'A checklist-driven visit for pets who are happiest at home. Your Havener works through the tasks you set and can’t close the visit until they’re done.',
    includes: [
      'Litter box changed or scooped',
      'Fresh food and water',
      'Playtime and company',
      'Authorized medication given',
      'Photos, notes and a wellbeing check',
    ],
    fromRate: 22,
    rateUnit: 'visit',
    species: ['cat', 'dog'],
  },
];

export const SERVICE_BY_TYPE: Record<ServiceType, ServiceDefinition> =
  SERVICES.reduce(
    (acc, service) => {
      acc[service.type] = service;
      return acc;
    },
    {} as Record<ServiceType, ServiceDefinition>
  );

export function serviceBySlug(slug: string): ServiceDefinition | undefined {
  return SERVICES.find((service) => service.slug === slug);
}

export function serviceName(type: ServiceType): string {
  return SERVICE_BY_TYPE[type]?.name ?? type;
}

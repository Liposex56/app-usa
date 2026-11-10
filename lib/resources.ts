/**
 * Guides for Haveners and for pet parents ("Resources"). Notifications and
 * emails link here. The text is a first draft for Havenr to edit.
 */
export type ResourceAudience = 'haveners' | 'owners';

export type Resource = {
  audience: ResourceAudience;
  slug: string;
  title: string;
  summary: string;
  sections: Array<{ heading: string; points: string[] }>;
};

export const AUDIENCE_LABEL: Record<ResourceAudience, string> = {
  haveners: 'For Haveners',
  owners: 'For pet parents',
};

export const RESOURCES: Resource[] = [
  // ------------------------------------------------------------- Haveners
  {
    audience: 'haveners',
    slug: 'how-booking-works',
    title: 'How the booking process works',
    summary: 'From the first message to getting paid — every step of a booking on Havenr.',
    sections: [
      {
        heading: '1. The request',
        points: [
          'A pet parent contacts you with the service, dates, times and pets. It shows up under Booking requests and in your notifications.',
          'Read the pet’s details and ask anything you need in the chat. Propose a Meet & Greet if you haven’t met.',
          'If the dates, times or price need to change, use Modify request. You can also adjust the cost or, for walks and visits, switch between 30 and 60 minutes.',
        ],
      },
      {
        heading: '2. Booking',
        points: [
          'Each of you clicks Book. The pet parent’s Book is the payment.',
          'The booking is Confirmed only when both of you have booked. Until then it is Pending.',
          'Before you can be paid you need to connect your payments (Havener profile → Payments). It takes a few minutes.',
        ],
      },
      {
        heading: '3. The service',
        points: [
          'Boarding and house sitting start and finish by themselves at the booked times. Share photos and videos in the chat at least once a day.',
          'Walks, drop-in visits and daycare: press Start, then add the photos and the summary (potty breaks, food, water) before you press Complete. A walk or visit can’t be finished before its booked length.',
        ],
      },
      {
        heading: '4. After',
        points: [
          'Both of you leave a review. Reviews appear once both are in.',
          'The pet parent can leave a tip — it goes to you in full.',
          'Stripe sends your earnings to your bank automatically.',
        ],
      },
    ],
  },
  {
    audience: 'haveners',
    slug: 'successful-meet-and-greet',
    title: 'Tips for a successful Meet & Greet',
    summary: 'A short meeting before the first booking prevents most surprises.',
    sections: [
      {
        heading: 'Before',
        points: [
          'Meet somewhere neutral or at your home, with your own pets calm and on a leash.',
          'Read the pet’s profile first so your questions go deeper than the basics.',
        ],
      },
      {
        heading: 'What to ask',
        points: [
          'Routine: feeding times, amounts, walks, sleep and where the pet usually sleeps.',
          'Health: medications, allergies, recent vet visits, and the vet’s contact.',
          'Behavior: other dogs, cats, children, strangers, noises, being left alone, escaping.',
          'What to do — and who to call — if something goes wrong.',
        ],
      },
      {
        heading: 'During',
        points: [
          'Let the pets greet each other slowly. Watch body language more than words.',
          'Show where the pet will eat, sleep and play.',
          'Be honest if it isn’t a good fit. Saying no is better than a bad stay.',
        ],
      },
    ],
  },
  {
    audience: 'haveners',
    slug: 'before-welcoming-a-pet',
    title: 'Before you welcome a new pet',
    summary: 'A checklist for the day before a new guest arrives.',
    sections: [
      {
        heading: 'Your space',
        points: [
          'Walk the yard: check the fence and gates, and pick up anything a dog could swallow.',
          'Put away food, medication, cleaning products, cables and small objects.',
          'Set up a quiet spot with water where the pet can rest away from others.',
        ],
      },
      {
        heading: 'The information',
        points: [
          'Re-read the pet’s notes on food, medication and routine. Ask in the chat if anything is unclear.',
          'Save the pet parent’s emergency contact and the vet’s number.',
          'Confirm the drop-off and pick-up times.',
        ],
      },
      {
        heading: 'On arrival',
        points: [
          'Keep the pet on a leash until the door and gate are closed.',
          'Check what was packed: food, medication, leash, collar with ID tag.',
          'Send a first photo within the hour — it is what pet parents wait for.',
        ],
      },
    ],
  },
  {
    audience: 'haveners',
    slug: 'pets-in-a-pack',
    title: 'Caring for pets from different families at once',
    summary: 'More than one guest means more planning. How to keep a group safe.',
    sections: [
      {
        heading: 'Introductions',
        points: [
          'Introduce new dogs one at a time, outside, on leashes, before they share a room.',
          'Never leave dogs that just met alone together.',
        ],
      },
      {
        heading: 'Day to day',
        points: [
          'Feed separately and pick up bowls afterwards. Most fights start around food, treats or toys.',
          'Give every dog a place to rest alone.',
          'Match play by size and energy; separate when it gets too rough.',
          'Tell each pet parent that other pets will be there — no surprises.',
        ],
      },
    ],
  },
  {
    audience: 'haveners',
    slug: 'peak-season',
    title: 'Peak season and holidays',
    summary: 'Holiday periods fill up first and are charged at the holiday rate.',
    sections: [
      {
        heading: 'How holidays work on Havenr',
        points: [
          'Havenr keeps a list of holiday periods (long weekends, Thanksgiving, Christmas, New Year…).',
          'A booking with at least one day inside a period is charged at your holiday rate for the whole booking.',
          'With automatic rates on, the holiday rate is your regular rate plus 20%.',
        ],
      },
      {
        heading: 'Getting ready',
        points: [
          'Update your availability every day in the weeks before a holiday — it also moves you up in search.',
          'Block the days you can’t work as early as you can.',
          'Don’t take more pets than you can care for well: reviews from the holidays stay all year.',
        ],
      },
    ],
  },
  {
    audience: 'haveners',
    slug: 'successful-walk',
    title: 'Guide to a great walk',
    summary: 'What a pet parent expects from a 30 or 60 minute walk.',
    sections: [
      {
        heading: 'On the walk',
        points: [
          'Check the collar or harness and the leash before leaving the house.',
          'Press Start when you begin — the route is recorded — and stay the full booked time.',
          'Keep the dog on a leash at all times, away from other dogs unless the pet parent said it’s fine.',
          'Carry water and bags.',
        ],
      },
      {
        heading: 'The report',
        points: [
          'Add photos and note pee, poop, water and anything unusual before you press Complete.',
          'Leave the home as you found it: lock up and put the key back where agreed.',
        ],
      },
    ],
  },
  {
    audience: 'haveners',
    slug: 'successful-visit',
    title: 'Guide to a great drop-in visit',
    summary: 'A short visit at the pet’s home: food, water, potty break, company.',
    sections: [
      {
        heading: 'During the visit',
        points: [
          'Follow the feeding instructions exactly, and refill water.',
          'Dogs: a potty break and some play. Cats: clean the litter box and look for them — don’t leave without seeing every pet.',
          'Stay the full booked time.',
        ],
      },
      {
        heading: 'Before you leave',
        points: [
          'Send photos and the summary (food, water, potty or litter).',
          'Check doors, windows and gates, and leave lights and alarm as agreed.',
        ],
      },
    ],
  },
  {
    audience: 'haveners',
    slug: 'successful-house-sitting',
    title: 'Guide to a great stay at the client’s home',
    summary: 'House sitting means caring for the pet and respecting the home.',
    sections: [
      {
        heading: 'Before the stay',
        points: [
          'Agree on arrival and departure times, where you sleep, what you may use, and whether visitors are allowed (the default is no).',
          'Ask about the alarm, keys, wifi, trash day and anything that needs attention.',
        ],
      },
      {
        heading: 'During the stay',
        points: [
          'Keep the pet’s routine as it is at home.',
          'Don’t leave the pet alone longer than agreed.',
          'Send photos and a short note at least once a day.',
          'Leave the home clean and as you found it.',
        ],
      },
    ],
  },
  {
    audience: 'haveners',
    slug: 'tax-season',
    title: 'Tax season',
    summary: 'What you earn on Havenr is self-employment income.',
    sections: [
      {
        heading: 'What to know',
        points: [
          'As a Havener you are an independent contractor, not an employee. You are responsible for reporting what you earn.',
          'Stripe, which processes your payouts, issues the tax forms that apply to you and keeps your earnings history.',
          'Keep your own record of earnings and expenses during the year.',
          'This is general information, not tax advice — ask a tax professional about your situation.',
        ],
      },
    ],
  },

  // --------------------------------------------------------------- Owners
  {
    audience: 'owners',
    slug: 'how-booking-works',
    title: 'How booking works',
    summary: 'From finding a Havener to picking up a happy pet.',
    sections: [
      {
        heading: '1. Find and contact',
        points: [
          'Search with your address, dates and pet. You only see Haveners who match and are free.',
          'Open a profile, press Contact this Havener, check the summary and send your message. You can contact more than one.',
          'Chat, and meet first if you like — propose a Meet & Greet from the conversation.',
        ],
      },
      {
        heading: '2. Book',
        points: [
          'Press Book to pay. The Havener presses Book too.',
          'The booking is Confirmed when both of you have booked. Until then it is Pending.',
          'You see one clear total before you pay.',
        ],
      },
      {
        heading: '3. During and after',
        points: [
          'For stays, your Havener shares photos in the chat every day. For walks and visits you get a report with photos.',
          'Afterwards, leave a review — and a tip if you’d like. Tips go to the Havener in full.',
          'To cancel a confirmed booking, send a cancellation request from the booking. Each Havener’s cancellation policy is on their profile.',
        ],
      },
    ],
  },
  {
    audience: 'owners',
    slug: 'what-to-pack',
    title: 'What to pack for your pet’s stay',
    summary: 'So your pet enjoys the stay and you have peace of mind.',
    sections: [
      {
        heading: 'Always',
        points: [
          'Food for every day plus two extra, in portions if you can, with written instructions.',
          'Medication in its original container, with dose and times.',
          'Leash, and a collar or harness with an ID tag.',
          'Your vet’s name and phone, and an emergency contact.',
        ],
      },
      {
        heading: 'Nice to have',
        points: [
          'Bed or blanket that smells like home.',
          'A favorite toy and treats.',
          'Crate, if your pet sleeps in one.',
          'For cats: their usual litter.',
        ],
      },
    ],
  },
  {
    audience: 'owners',
    slug: 'meet-and-greet',
    title: 'Meet & Greets: what to ask',
    summary: 'A short meeting before the first booking tells you most of what you need.',
    sections: [
      {
        heading: 'Questions for the Havener',
        points: [
          'Where will my pet sleep, eat and play? Can I see it?',
          'Who else is in the home — people, children, other pets, other guests?',
          'How long would my pet be alone, if at all?',
          'What would you do in an emergency?',
        ],
      },
      {
        heading: 'Tell them',
        points: [
          'Your pet’s routine, fears and habits — the things that aren’t obvious.',
          'Anything medical, and how your pet does with other animals and children.',
        ],
      },
    ],
  },
  {
    audience: 'owners',
    slug: 'peak-season',
    title: 'Peak season and holidays',
    summary: 'Holidays book early and are charged at the Havener’s holiday rate.',
    sections: [
      {
        heading: 'What to expect',
        points: [
          'Book early: the most popular Haveners fill up weeks before Thanksgiving, Christmas and New Year.',
          'If a booking includes at least one day in a holiday period, the holiday rate applies to the whole booking.',
          'You see the total before you pay.',
        ],
      },
    ],
  },
];

export function resourcesFor(audience: ResourceAudience): Resource[] {
  return RESOURCES.filter((resource) => resource.audience === audience);
}

export function findResource(audience: string, slug: string): Resource | undefined {
  return RESOURCES.find((resource) => resource.audience === audience && resource.slug === slug);
}

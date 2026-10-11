/**
 * The signed-in top navigation. One definition, used by the dashboard and by
 * every public page a signed-in person visits, so the bar they navigate with
 * never changes underneath them.
 */
export type NavLink = {
  href: string;
  label: string;
  /** Other path prefixes that should light this link up (e.g. profiles). */
  also?: string[];
};

export function buildNavLinks(
  profile: { is_owner: boolean; is_havener: boolean },
  isStaff: boolean
): NavLink[] {
  return [
    { href: '/dashboard', label: 'Dashboard' },
    ...(profile.is_owner
      ? [
          { href: '/search', label: 'Find a Havener', also: ['/sitters'] },
          { href: '/dashboard/pets', label: 'My pets' },
          { href: '/dashboard/bookings', label: 'My bookings' },
        ]
      : []),
    ...(profile.is_havener
      ? [
          { href: '/dashboard/havener', label: 'Havener profile' },
          { href: '/dashboard/havener/bookings', label: 'Booking requests' },
        ]
      : []),
    { href: '/dashboard/calendar', label: 'Calendar' },
    ...(isStaff ? [{ href: '/dashboard/admin', label: 'Admin panel' }] : []),
  ];
}

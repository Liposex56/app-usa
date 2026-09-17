import type { Metadata, Viewport } from 'next';
import { Barlow_Condensed, Source_Sans_3 } from 'next/font/google';

import './globals.css';

/**
 * Brand typography is Myriad Pro (body) + Better Vinegar (display), neither of
 * which is licensed for the web. Source Sans 3 is Adobe's open sibling to
 * Myriad. Barlow Condensed is confirmed directly from the Figma file (its
 * text layers are set in Barlow Condensed) as the practical web substitute
 * for Better Vinegar's tall, condensed display lettering.
 */
const body = Source_Sans_3({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-body',
});

const display = Barlow_Condensed({
  subsets: ['latin'],
  display: 'swap',
  weight: ['400', '500', '600', '700', '800', '900'],
  variable: '--font-display',
});

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'
  ),
  title: {
    default: 'Havenr — Trusted pet care, booked in minutes',
    template: '%s · Havenr',
  },
  description:
    'Boarding, daycare, house sitting, walks and drop-in visits with Haveners who are background checked, interviewed, home verified and insured.',
  openGraph: {
    type: 'website',
    siteName: 'Havenr',
    title: 'Havenr — Trusted pet care, booked in minutes',
    description:
      'Boarding, daycare, house sitting, walks and drop-in visits with verified Haveners.',
  },
  icons: { icon: '/favicon.ico', apple: '/brand/icon.png' },
};

export const viewport: Viewport = {
  themeColor: '#F8F5E9',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${body.variable} ${display.variable}`}>
      <body>{children}</body>
    </html>
  );
}

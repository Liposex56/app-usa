import type { Config } from 'tailwindcss';

/**
 * Havenr brand tokens.
 * Source: "Manual identidad de marca" (Leneconcept.co), ENTREGA 2026-08-17.
 * Primary palette: #BE8210 gold · #C2DCF4 sky · #FFF8CD cream
 *                  #F8F5E9 bone · #69532A olive · #26100B espresso
 */
const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        gold: {
          50: '#FBF3E1',
          100: '#F6E5BF',
          200: '#EDCB84',
          300: '#DFAE4B',
          400: '#D0982A',
          500: '#BE8210', // brand primary
          600: '#A06D0C',
          700: '#7C5409',
          800: '#573B06',
          900: '#332203',
        },
        sky: {
          50: '#F2F8FE',
          100: '#E4F0FC',
          200: '#C2DCF4', // brand secondary
          300: '#9AC3E9',
          400: '#6FA6DA',
          500: '#4A87C4',
          600: '#356A9F',
          700: '#28517A',
          800: '#1B3854',
          900: '#0F2031',
        },
        cream: '#FFF8CD',
        bone: '#F8F5E6', // page background (same as the landing's cream)
        olive: {
          400: '#8A7040',
          500: '#69532A', // brand tertiary
          600: '#544021',
          700: '#3E2F18',
        },
        espresso: {
          500: '#4A2317',
          600: '#361A10',
          700: '#26100B', // brand near-black
          800: '#1A0A07',
        },
        // Palette of the final landing design (components/home). Namespaced
        // under `hv` because its `cream` and `sky` are not the same values as
        // the app-wide ones above.
        hv: {
          ink: '#26100B',
          cream: '#F8F5E6',
          paper: '#FCF7DC',
          sky: '#C2DCF4',
          mustard: '#BE8210',
          cocoa: '#69532A',
          greige: '#D6D1C6',
          khaki: '#DCD5B1',
          butter: '#FFF8CD',
          sand: '#DCD8CC',
        },
      },
      fontFamily: {
        // One typeface for the whole product: Barlow Condensed (as on the landing).
        sans: ['var(--font-display)', 'Arial Narrow', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        display: ['var(--font-display)', 'Arial Narrow', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        'zen-loop': ['var(--font-zen-loop)', 'cursive'],
        // Wordmark ("HAVENR") and the hand-written notes on the landing.
        logo: ['var(--font-logo)', 'Futura', 'sans-serif'],
        hand: ['var(--font-hand)', 'cursive'],
      },
      // Rounder, like the landing's cards (34px) — applies to every rounded-xl/2xl/3xl.
      borderRadius: {
        xl: '1rem',
        '2xl': '1.5rem',
        '3xl': '2.125rem',
        '4xl': '2.5rem',
      },
      // Barlow Condensed is narrower and has a smaller x-height than the body
      // face the app used before, so the small steps are a notch larger.
      // (The landing pins its own sizes and doesn't use xs/sm/base/lg.)
      fontSize: {
        xs: ['0.875rem', { lineHeight: '1.2rem' }],
        sm: ['1rem', { lineHeight: '1.4rem' }],
        base: ['1.125rem', { lineHeight: '1.6rem' }],
        lg: ['1.25rem', { lineHeight: '1.75rem' }],
      },
      boxShadow: {
        card: '0 1px 2px rgba(38, 16, 11, 0.04), 0 8px 24px -12px rgba(38, 16, 11, 0.18)',
        lift: '0 2px 4px rgba(38, 16, 11, 0.05), 0 18px 40px -16px rgba(38, 16, 11, 0.25)',
      },
      keyframes: {
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'fade-up': 'fade-up 0.5s ease-out both',
      },
    },
  },
  plugins: [],
};

export default config;

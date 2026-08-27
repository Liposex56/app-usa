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
        bone: '#F8F5E9',
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
        // Dark hero palette — the approved look for the homepage: near-black
        // grounds with cream text and a lighter amber accent, so gold/cream
        // stay legible on a dark field instead of the light espresso-on-bone
        // pairing used elsewhere on the site.
        night: {
          DEFAULT: '#1A0F09', // section ground
          band: '#2C2013', // hero background
          deep: '#120A06', // trust band / marquee, darkest
        },
        sand: {
          DEFAULT: '#F6EEDD', // primary text on night backgrounds
          soft: '#CBB99A', // secondary text on night backgrounds
        },
        amber: {
          DEFAULT: '#E4A93B', // accent on night backgrounds
          ink: '#26150E', // dark text on an amber fill
        },
      },
      fontFamily: {
        sans: ['var(--font-body)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        display: ['var(--font-display)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        '4xl': '2rem',
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

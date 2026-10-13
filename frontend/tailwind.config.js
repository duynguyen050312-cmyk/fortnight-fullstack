/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: { 900: '#14171C', 600: '#5A6270', 300: '#C9CFD8' },
        paper: '#F7F5F1',
        surface: '#FFFFFF',
        safe: '#1F7A5C',
        'safe-bg': '#E6F0EB',
        tight: '#B8791A',
        'tight-bg': '#F7EEDC',
        over: '#B33A2B',
        'over-bg': '#F8E7E4',
      },
      fontFamily: {
        sans: ['"IBM Plex Sans"', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'monospace'],
      },
      fontSize: {
        display: ['32px', { lineHeight: '38px' }],
        'numeral-xl': ['56px', { lineHeight: '56px' }],
      },
      ringColor: {
        DEFAULT: '#14171C',
      },
      gridTemplateColumns: {
        14: 'repeat(14, minmax(0, 1fr))',
      },
    },
  },
  plugins: [],
}


/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        /**
         * The royal blue of the GaragePilot wordmark (`public/GMS_Logo.png`):
         * its highlights sample around #0060D0 and its core shadow around
         * #002050, so 600 sits on the bright face of the letters and 900 on
         * the navy they are shaded with. Same token names and the same uses as
         * before — only the hue moved, from the old indigo #3366FF onto the
         * blue the logo actually uses.
         */
        primary: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#8ec5ff',
          400: '#4e9bf5',
          500: '#1472e6',
          600: '#0b5ed7',
          700: '#0a4bab',
          800: '#0d3b85',
          900: '#0a2a60',
          950: '#06183a',
        },
        /**
         * The orange half of the logo — "Pilot" and its speed lines run from
         * #F2400A up to #FFB020. Used sparingly as the accent the blue is
         * paired with: the Best Value badge, the saving on the yearly plan,
         * and the one button on the closing call to action.
         */
        accent: {
          50: '#fff7ed',
          100: '#ffedd5',
          200: '#fed7aa',
          300: '#fdba74',
          400: '#fb923c',
          500: '#f97316',
          600: '#ea580c',
          700: '#c2410c',
          800: '#9a3412',
          900: '#7c2d12',
        },
      },
      boxShadow: {
        card: '0 1px 3px 0 rgb(0 0 0 / 0.08), 0 1px 2px -1px rgb(0 0 0 / 0.08)',
        soft: '0 2px 8px -2px rgb(0 0 0 / 0.10)',
      },
    },
  },
  plugins: [],
}

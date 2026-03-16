/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/app/**/*.{js,ts,jsx,tsx}',
    './src/pages/**/*.{js,ts,jsx,tsx}',
    './src/components/**/*.{js,ts,jsx,tsx}',
    './src/components_feeder/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
            screens: {
              'hss': { 'raw': '(min-width: 1280px) and (max-width: 1295px)' },
              sl: { raw: '(max-width: 480px)' }

      },
    },
  },
  plugins: [],
};

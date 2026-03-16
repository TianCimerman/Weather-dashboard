import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",         // ✅ if you have /components at root
    "./src/components/**/*.{js,ts,jsx,tsx}",     // ✅ if you use this too
    "./src/components_feeder/**/*.{js,ts,jsx,tsx}" // ✅ your feeder folder
  ],
  theme: {
    extend: {
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic':
          'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
      },
    },
  },
  plugins: [],
}
export default config

import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        sand: '#f4e9d8',
        ocean: '#0e7490',
      },
    },
  },
  plugins: [],
};

export default config;

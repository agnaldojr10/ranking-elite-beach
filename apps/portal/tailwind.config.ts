import type { Config } from 'tailwindcss';

/** Cor semântica via CSS var (skin imersiva do jogador em globals.css). */
const token = (name: string) => `rgb(var(${name}) / <alpha-value>)`;

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: token('--c-bg'),
        'bg-2': token('--c-bg-2'),
        surface: token('--c-surface'),
        'surface-2': token('--c-surface-2'),
        ink: token('--c-ink'),
        'ink-2': token('--c-ink-2'),
        muted: token('--c-muted'),
        line: token('--c-line'),
        ocean: token('--c-ocean'),
        'ocean-ink': token('--c-ocean-ink'),
        coral: token('--c-coral'),
        gold: token('--c-gold'),
        ok: token('--c-ok'),
        warn: token('--c-warn'),
        danger: token('--c-danger'),
      },
      borderRadius: {
        xl: '16px',
        '2xl': '20px',
        '3xl': '28px',
      },
      boxShadow: {
        glow: '0 0 0 1px rgb(var(--c-line) / 0.6), 0 20px 50px -24px rgb(0 0 0 / 0.7)',
        'ocean-glow': '0 10px 40px -12px rgb(var(--c-ocean) / 0.5)',
      },
      fontFamily: {
        sans: [
          'system-ui',
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'Roboto',
          'Helvetica Neue',
          'Arial',
          'sans-serif',
        ],
      },
      keyframes: {
        'fade-up': {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'fade-up': 'fade-up 0.4s cubic-bezier(0.16, 1, 0.3, 1) both',
      },
    },
  },
  plugins: [],
};

export default config;

import type { Config } from 'tailwindcss';

/** Cor semântica via CSS var (tema claro/escuro em globals.css). */
const token = (name: string) => `rgb(var(${name}) / <alpha-value>)`;

const config: Config = {
  darkMode: 'class',
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        page: token('--c-page'),
        surface: token('--c-surface'),
        'surface-2': token('--c-surface-2'),
        ink: token('--c-ink'),
        'ink-2': token('--c-ink-2'),
        muted: token('--c-muted'),
        line: token('--c-line'),
        ocean: token('--c-ocean'),
        'ocean-ink': token('--c-ocean-ink'),
        coral: token('--c-coral'),
        ok: token('--c-ok'),
        warn: token('--c-warn'),
        danger: token('--c-danger'),
        // legado (fundo antigo) — mantém compat até o rollout completo
        sand: '#f4f1ea',
      },
      borderRadius: {
        xl: '16px',
        '2xl': '20px',
        '3xl': '28px',
      },
      boxShadow: {
        tile: '0 1px 2px rgb(15 23 42 / 0.04), 0 8px 24px -12px rgb(15 23 42 / 0.12)',
        'tile-hover': '0 2px 4px rgb(15 23 42 / 0.06), 0 16px 40px -16px rgb(15 23 42 / 0.22)',
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
    },
  },
  plugins: [],
};

export default config;

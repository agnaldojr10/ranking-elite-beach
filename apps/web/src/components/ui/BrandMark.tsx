import type { SVGProps } from 'react';

/**
 * Marca do produto (Beach Tennis): raquete de praia + bola sobre uma onda.
 * A raquete usa `currentColor` (ex.: text-ocean); a bola usa o token coral.
 */
export function BrandMark({ title, ...props }: SVGProps<SVGSVGElement> & { title?: string }) {
  return (
    <svg viewBox="0 0 48 48" fill="none" role="img" aria-label={title ?? 'Ranking Elite Beach'} {...props}>
      <g fill="currentColor">
        <path
          d="M19 4.5c6.5 0 11.5 6 11.5 13.5S25.5 31.5 19 31.5 7.5 25.5 7.5 18 12.5 4.5 19 4.5Zm0 3.2c-4.7 0-8.3 4.6-8.3 10.3S14.3 28.3 19 28.3s8.3-4.6 8.3-10.3S23.7 7.7 19 7.7Z"
          fillRule="evenodd"
        />
        <rect x="16" y="30" width="6" height="13" rx="3" />
      </g>
      <g fill="currentColor" opacity="0.5">
        <circle cx="19" cy="13.5" r="1.5" />
        <circle cx="14.5" cy="18.5" r="1.5" />
        <circle cx="23.5" cy="18.5" r="1.5" />
        <circle cx="19" cy="23" r="1.5" />
      </g>
      <circle cx="34" cy="12" r="5.5" style={{ fill: 'rgb(var(--c-coral))' }} />
      <path
        d="M6 41c3 0 3-2.4 6-2.4s3 2.4 6 2.4 3-2.4 6-2.4 3 2.4 6 2.4 3-2.4 6-2.4"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        opacity="0.45"
      />
    </svg>
  );
}

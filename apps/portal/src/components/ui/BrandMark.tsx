import type { SVGProps } from 'react';

/**
 * Marca do produto (Beach Tennis): raquete de praia + bola sobre uma onda.
 * A raquete usa `currentColor` (ex.: text-ocean); a bola usa o token coral.
 */
export function BrandMark({ title, ...props }: SVGProps<SVGSVGElement> & { title?: string }) {
  return (
    <svg viewBox="0 0 48 48" fill="none" role="img" aria-label={title ?? 'Meu Beach'} {...props}>
      {/* raquete de beach tennis */}
      <g fill="currentColor">
        <ellipse cx="19" cy="18" rx="11.5" ry="13.5" opacity="0.16" />
        <path
          d="M19 4.5c6.5 0 11.5 6 11.5 13.5S25.5 31.5 19 31.5 7.5 25.5 7.5 18 12.5 4.5 19 4.5Zm0 3.2c-4.7 0-8.3 4.6-8.3 10.3S14.3 28.3 19 28.3s8.3-4.6 8.3-10.3S23.7 7.7 19 7.7Z"
          fillRule="evenodd"
        />
        {/* cabo */}
        <rect x="16" y="30" width="6" height="13" rx="3" />
      </g>
      {/* furos da raquete */}
      <g fill="currentColor" opacity="0.5">
        <circle cx="19" cy="13.5" r="1.5" />
        <circle cx="14.5" cy="18.5" r="1.5" />
        <circle cx="23.5" cy="18.5" r="1.5" />
        <circle cx="19" cy="23" r="1.5" />
      </g>
      {/* bola */}
      <circle cx="34" cy="12" r="5.5" style={{ fill: 'rgb(var(--c-coral))' }} />
      <path
        d="M30 10.2c2.6 1 5.4 1 8 0M30 13.8c2.6-1 5.4-1 8 0"
        stroke="rgb(var(--c-bg))"
        strokeWidth="1"
        strokeLinecap="round"
        opacity="0.7"
      />
      {/* onda */}
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

import type { SVGProps } from 'react';

/** Ícones em SVG (stroke 1.75, estilo Lucide) — sem emoji, tema via currentColor. */
function Base({ children, ...props }: SVGProps<SVGSVGElement> & { children: React.ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={20}
      height={20}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      {...props}
    >
      {children}
    </svg>
  );
}

export type IconProps = SVGProps<SVGSVGElement>;

export const IconUsers = (p: IconProps) => (
  <Base {...p}>
    <path d="M16 19v-1a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v1" />
    <circle cx="9" cy="7" r="4" />
    <path d="M22 19v-1a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
  </Base>
);

export const IconShield = (p: IconProps) => (
  <Base {...p}>
    <path d="M12 3l7 3v5c0 4.5-3 8-7 10-4-2-7-5.5-7-10V6l7-3Z" />
    <path d="M9.5 12l1.8 1.8L15 10" />
  </Base>
);
export const IconTrophy = (p: IconProps) => (
  <Base {...p}>
    <path d="M6 9a6 6 0 0 0 12 0V4H6z" />
    <path d="M6 5H3v2a3 3 0 0 0 3 3M18 5h3v2a3 3 0 0 1-3 3M9 21h6M12 15v6" />
  </Base>
);
export const IconCalendar = (p: IconProps) => (
  <Base {...p}>
    <rect x="3" y="4" width="18" height="18" rx="3" />
    <path d="M16 2v4M8 2v4M3 10h18" />
  </Base>
);
export const IconCourt = (p: IconProps) => (
  <Base {...p}>
    <rect x="3" y="5" width="18" height="14" rx="2" />
    <path d="M12 5v14M3 12h18" />
  </Base>
);
export const IconChart = (p: IconProps) => (
  <Base {...p}>
    <path d="M3 3v18h18" />
    <path d="M7 15l3-3 3 2 4-5" />
  </Base>
);
export const IconLayers = (p: IconProps) => (
  <Base {...p}>
    <path d="M12 2 2 7l10 5 10-5-10-5Z" />
    <path d="m2 17 10 5 10-5M2 12l10 5 10-5" />
  </Base>
);
export const IconCalendarClock = (p: IconProps) => (
  <Base {...p}>
    <path d="M21 7.5V6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2h6M16 2v4M8 2v4M3 10h18" />
    <circle cx="18" cy="17" r="4" />
    <path d="M18 15.5V17l1 1" />
  </Base>
);
export const IconHelp = (p: IconProps) => (
  <Base {...p}>
    <circle cx="12" cy="12" r="10" />
    <path d="M9.1 9a3 3 0 0 1 5.8 1c0 2-3 3-3 3M12 17h.01" />
  </Base>
);
export const IconSun = (p: IconProps) => (
  <Base {...p}>
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
  </Base>
);
export const IconMoon = (p: IconProps) => (
  <Base {...p}>
    <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z" />
  </Base>
);
export const IconChevronRight = (p: IconProps) => (
  <Base {...p}>
    <path d="m9 18 6-6-6-6" />
  </Base>
);
export const IconLogout = (p: IconProps) => (
  <Base {...p}>
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
  </Base>
);
export const IconWhistle = (p: IconProps) => (
  <Base {...p}>
    <path d="M11 11a5 5 0 1 1-5 5v-3h9l4-4-2-2-2 2H6a3 3 0 0 0-3 3" />
    <circle cx="6" cy="16" r="3" />
  </Base>
);

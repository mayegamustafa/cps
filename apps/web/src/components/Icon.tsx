import type { SVGProps } from 'react';

/**
 * Curated, dependency-free SVG icon set for City Parents School.
 * Stroke-based, 24x24 grid, consistent weight, no emojis anywhere.
 */

export type IconName =
  | 'arrow-right'
  | 'arrow-up-right'
  | 'chevron-right'
  | 'chevron-down'
  | 'menu'
  | 'close'
  | 'phone'
  | 'mail'
  | 'map-pin'
  | 'clock'
  | 'calendar'
  | 'play'
  | 'quote'
  | 'graduation-cap'
  | 'book-open'
  | 'users'
  | 'trophy'
  | 'sparkle'
  | 'globe'
  | 'shield-check'
  | 'heart-hand'
  | 'palette'
  | 'flask'
  | 'music'
  | 'whatsapp'
  | 'youtube'
  | 'instagram'
  | 'facebook'
  | 'linkedin'
  | 'tiktok'
  | 'x'
  | 'grid'
  | 'briefcase'
  | 'image'
  | 'settings'
  | 'inbox'
  | 'video'
  | 'logout'
  | 'bell'
  | 'search'
  | 'plus'
  | 'edit'
  | 'trash'
  | 'eye'
  | 'download'
  | 'megaphone'
  | 'telegram'
  | 'link'
  | 'share';

type IconProps = SVGProps<SVGSVGElement> & {
  name: IconName;
  size?: number;
  title?: string;
};

const paths: Record<IconName, React.ReactNode> = {
  'arrow-right': <path d="M5 12h14M13 6l6 6-6 6" />,
  'arrow-up-right': <path d="M7 17 17 7M8 7h9v9" />,
  'chevron-right': <path d="m9 6 6 6-6 6" />,
  'chevron-down': <path d="m6 9 6 6 6-6" />,
  menu: <path d="M4 7h16M4 12h16M4 17h16" />,
  close: <path d="M6 6l12 12M18 6 6 18" />,
  phone: (
    <path d="M5 4h3l2 5-2.5 1.5a11 11 0 0 0 5 5L16 13l5 2v3a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2Z" />
  ),
  mail: (
    <>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m3 7 9 6 9-6" />
    </>
  ),
  'map-pin': (
    <>
      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
      <circle cx="12" cy="10" r="3" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </>
  ),
  calendar: (
    <>
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M3 9h18M8 3v4M16 3v4" />
    </>
  ),
  play: <path d="M7 5v14l11-7z" />,
  quote: (
    <path d="M9 7H5a2 2 0 0 0-2 2v3a2 2 0 0 0 2 2h2v1a3 3 0 0 1-3 3M21 7h-4a2 2 0 0 0-2 2v3a2 2 0 0 0 2 2h2v1a3 3 0 0 1-3 3" />
  ),
  'graduation-cap': (
    <>
      <path d="M22 9 12 4 2 9l10 5 10-5Z" />
      <path d="M6 11v5c0 1 3 3 6 3s6-2 6-3v-5M22 9v5" />
    </>
  ),
  'book-open': (
    <path d="M12 6c-2-1.5-5-2-8-2v15c3 0 6 .5 8 2 2-1.5 5-2 8-2V4c-3 0-6 .5-8 2Zm0 0v15" />
  ),
  users: (
    <>
      <circle cx="9" cy="8" r="3" />
      <path d="M3 20a6 6 0 0 1 12 0M16 5.5a3 3 0 0 1 0 5.5M18 14a6 6 0 0 1 3 5" />
    </>
  ),
  trophy: (
    <>
      <path d="M8 4h8v5a4 4 0 0 1-8 0V4Z" />
      <path d="M16 5h3v2a3 3 0 0 1-3 3M8 5H5v2a3 3 0 0 0 3 3M12 13v3M9 20h6M10 20v-1a2 2 0 0 1 4 0v1" />
    </>
  ),
  sparkle: (
    <path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3Z" />
  ),
  globe: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18M12 3c2.5 2.5 4 6 4 9s-1.5 6.5-4 9c-2.5-2.5-4-6-4-9s1.5-6.5 4-9Z" />
    </>
  ),
  'shield-check': (
    <>
      <path d="M12 3 5 6v6c0 4 3 7 7 9 4-2 7-5 7-9V6l-7-3Z" />
      <path d="m9 12 2 2 4-4" />
    </>
  ),
  'heart-hand': (
    <path d="M12 21s-7-4.5-9-9a4.5 4.5 0 0 1 8-3 4.5 4.5 0 0 1 8 3c-2 4.5-9 9-9 9Z" />
  ),
  palette: (
    <>
      <path d="M12 3a9 9 0 1 0 0 18c1.5 0 2-1 2-2 0-1.5 1-2 2-2h1a4 4 0 0 0 4-4 9 9 0 0 0-9-8Z" />
      <circle cx="7.5" cy="11" r="1" />
      <circle cx="9.5" cy="7" r="1" />
      <circle cx="14.5" cy="7" r="1" />
      <circle cx="16.5" cy="11" r="1" />
    </>
  ),
  flask: (
    <path d="M10 3h4M10 3v6l-5 8a2 2 0 0 0 2 3h10a2 2 0 0 0 2-3l-5-8V3M7.5 14h9" />
  ),
  music: (
    <>
      <path d="M9 18V6l11-2v12" />
      <circle cx="6" cy="18" r="3" />
      <circle cx="17" cy="16" r="3" />
    </>
  ),
  whatsapp: (
    <path d="M3 21l1.6-4.5A8 8 0 1 1 12 20a8 8 0 0 1-4-1L3 21Zm6-12c0 4 3 6 5 6 1 0 2-1 2-1l-2-1-1 1c-1 0-3-2-3-3l1-1-1-2s-1 0-1 1Z" />
  ),
  youtube: (
    <>
      <rect x="3" y="6" width="18" height="12" rx="3" />
      <path d="m10 9 5 3-5 3z" />
    </>
  ),
  instagram: (
    <>
      <rect x="4" y="4" width="16" height="16" rx="4" />
      <circle cx="12" cy="12" r="3.5" />
      <circle cx="17" cy="7" r="0.6" fill="currentColor" stroke="none" />
    </>
  ),
  facebook: (
    <path d="M14 8h2V5h-2a3 3 0 0 0-3 3v2H9v3h2v6h3v-6h2l1-3h-3V8a1 1 0 0 1 1-1Z" />
  ),
  linkedin: (
    <>
      <rect x="3" y="3" width="18" height="18" rx="3" />
      <path d="M7 10v7M7 7v.01M11 17v-4a2 2 0 0 1 4 0v4M11 11v6" />
    </>
  ),
  tiktok: (
    <path d="M14 4v9a4 4 0 1 1-4-4M14 7a5 5 0 0 0 5 4" />
  ),
  x: <path d="M4 4l16 16M20 4 4 20" />,
  grid: (
    <>
      <rect x="4" y="4" width="7" height="7" rx="1.5" />
      <rect x="13" y="4" width="7" height="7" rx="1.5" />
      <rect x="4" y="13" width="7" height="7" rx="1.5" />
      <rect x="13" y="13" width="7" height="7" rx="1.5" />
    </>
  ),
  briefcase: (
    <>
      <rect x="3" y="7" width="18" height="13" rx="2" />
      <path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M3 12h18" />
    </>
  ),
  image: (
    <>
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <circle cx="8.5" cy="9.5" r="1.5" />
      <path d="m4 18 5-5 4 4 3-3 4 4" />
    </>
  ),
  settings: (
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 2v3M12 19v3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M2 12h3M19 12h3M4.9 19.1 7 17M17 7l2.1-2.1" />
    </>
  ),
  inbox: (
    <>
      <path d="M3 13h5l1.5 3h5L15 13h5" />
      <path d="M5 6h14l2 7v5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-5L5 6Z" />
    </>
  ),
  video: (
    <>
      <rect x="3" y="6" width="13" height="12" rx="2" />
      <path d="m16 10 5-3v10l-5-3z" />
    </>
  ),
  logout: <path d="M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3M10 17l-5-5 5-5M5 12h12" />,
  bell: <path d="M6 9a6 6 0 1 1 12 0c0 5 2 6 2 6H4s2-1 2-6M10 20a2 2 0 0 0 4 0" />,
  search: (
    <>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </>
  ),
  plus: <path d="M12 5v14M5 12h14" />,
  edit: <path d="M4 20h4l10-10-4-4L4 16v4ZM13.5 6.5l4 4" />,
  trash: <path d="M4 7h16M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2M6 7l1 13a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1l1-13" />,
  eye: (
    <>
      <path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7-10-7-10-7Z" />
      <circle cx="12" cy="12" r="3" />
    </>
  ),
  download: <path d="M12 3v12M7 10l5 5 5-5M5 21h14" />,
  megaphone: <path d="M3 11v2a1 1 0 0 0 1 1h2l5 4V6L6 10H4a1 1 0 0 0-1 1ZM16 8a4 4 0 0 1 0 8M11 6l9-3v18l-9-3" />,
  telegram: <path d="m21 4-2.5 15.5-6-4.5-3 3v-5l9-7-11 5-4-1.5z" />,
  link: <path d="M9 15l6-6M10.5 6.5 12 5a3.5 3.5 0 0 1 5 5l-1.5 1.5M13.5 17.5 12 19a3.5 3.5 0 0 1-5-5l1.5-1.5" />,
  share: (
    <>
      <circle cx="6" cy="12" r="2.5" />
      <circle cx="18" cy="6" r="2.5" />
      <circle cx="18" cy="18" r="2.5" />
      <path d="m8.2 10.8 7.6-3.6M8.2 13.2l7.6 3.6" />
    </>
  ),
};

export function Icon({ name, size = 24, title, ...props }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.7}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden={title ? undefined : true}
      role={title ? 'img' : undefined}
      {...props}
    >
      {title ? <title>{title}</title> : null}
      {paths[name]}
    </svg>
  );
}

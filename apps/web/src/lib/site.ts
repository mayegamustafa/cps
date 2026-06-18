/**
 * Default, admin-overridable site configuration.
 *
 * These values are the fallback shown when the API has no saved settings (or is
 * unreachable). The admin "Settings & SEO" screen edits a `site` record that is
 * deep-merged over these defaults by getSiteConfig().
 */

export type SiteConfig = {
  brand: {
    logoUrl: string;
    logoLightUrl: string;
    name: string;
    locality: string;
    foundingYear: string;
  };
  tagline: string;
  description: string;
  url: string;
  address: {
    line1: string;
    poBox: string;
    city: string;
    country: string;
    plusCode: string;
  };
  coords: { lat: number; lng: number };
  contact: { phone: string; email: string; whatsapp: string };
  social: { network: string; label: string; href: string }[];
  hero: {
    eyebrow: string;
    titleLead: string;
    titleAccent: string;
    intro: string;
    primaryCta: { label: string; href: string };
    secondaryCta: { label: string; href: string };
    stats: { value: string; label: string }[];
    live: {
      status: string;
      message: string;
      ctaLabel: string;
      chatLabel: string;
    };
  };
};

export const siteDefaults: SiteConfig = {
  brand: {
    logoUrl: '/cps.png',
    logoLightUrl: '/cps.png',
    name: 'City Parents School',
    locality: 'Kampala',
    foundingYear: '1999',
  },
  tagline: 'Nurturing brilliance, building character.',
  description:
    'City Parents School, Kampala is a premier institution shaping confident, curious and compassionate learners from Pre-Primary through Upper Primary, in day and boarding sections.',
  url: 'https://cityparents.sc.ug',
  address: {
    line1: 'Kabaka Anjagala Road',
    poBox: 'P.O. Box 26811',
    city: 'Kampala',
    country: 'Uganda',
    plusCode: '8H47+2F Kampala',
  },
  coords: { lat: 0.30537705324686104, lng: 32.5637337974885 },
  contact: {
    phone: '+256 700 000 000',
    email: 'info@cityparents.sc.ug',
    whatsapp: '256700000000',
  },
  social: [
    { network: 'youtube', label: 'YouTube', href: 'https://youtube.com' },
    { network: 'instagram', label: 'Instagram', href: 'https://instagram.com' },
    { network: 'facebook', label: 'Facebook', href: 'https://facebook.com' },
    { network: 'tiktok', label: 'TikTok', href: 'https://tiktok.com' },
    { network: 'linkedin', label: 'LinkedIn', href: 'https://linkedin.com' },
  ],
  hero: {
    eyebrow: 'Established 1999 · Kampala, Uganda',
    titleLead: 'Nurturing brilliance,',
    titleAccent: 'building character.',
    intro:
      'A premier institution shaping confident, curious and compassionate learners from Pre-Primary through Upper Primary, in day and boarding sections, in the heart of Kampala.',
    primaryCta: { label: 'Begin Admission', href: '/admissions' },
    secondaryCta: { label: 'Take the Virtual Tour', href: '/virtual-tour' },
    stats: [
      { value: '25+', label: 'Years of excellence' },
      { value: '2,400+', label: 'Pupils enrolled' },
      { value: '45', label: 'National awards' },
    ],
    live: {
      status: 'Live now · School Assembly',
      message: 'Watch school events live, wherever you are.',
      ctaLabel: 'Open Live TV',
      chatLabel: 'Chat with Admissions',
    },
  },
};

// Backwards-compatible alias used by components that only need static values.
export const site = siteDefaults;

export const primaryNav = [
  { label: 'About', href: '/about' },
  { label: 'Academics', href: '/academics' },
  { label: 'Admissions', href: '/admissions' },
  { label: 'News & Events', href: '/news' },
  { label: 'Media', href: '/gallery' },
  { label: 'Alumni', href: '/alumni' },
  { label: 'Careers', href: '/careers' },
  { label: 'Contact', href: '/contact' },
] as const;

export const footerNav = {
  Explore: [
    { label: 'About School', href: '/about' },
    { label: 'Academics', href: '/academics' },
    { label: 'Virtual Tour', href: '/virtual-tour' },
    { label: 'Live TV', href: '/live' },
    { label: 'Achievement Wall', href: '/achievements' },
  ],
  Community: [
    { label: 'News & Events', href: '/news' },
    { label: 'Gallery', href: '/gallery' },
    { label: 'Alumni', href: '/alumni' },
    { label: 'Digital Magazine', href: '/magazine' },
    { label: 'Houses', href: '/houses' },
  ],
  Resources: [
    { label: 'Admissions', href: '/admissions' },
    { label: 'Careers', href: '/careers' },
    { label: 'Downloads Center', href: '/downloads' },
    { label: 'Parent Portal', href: '/portal' },
    { label: 'Contact', href: '/contact' },
  ],
} as const;

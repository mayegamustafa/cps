import type { Metadata, Viewport } from 'next';
import './globals.css';
import { site } from '@/lib/site';
import { getSiteConfig } from '@/lib/site-config';
import { normalizeOrigin } from '@/lib/api-base';

// `new URL()` throws on a value with no scheme (e.g. "cityparentsschool.co.ug"
// set via env). Normalize first, then fall back to the default — so a
// mis-entered NEXT_PUBLIC_SITE_URL can never crash the build/metadata.
function safeUrl(raw: string | undefined): URL {
  try {
    return new URL(normalizeOrigin(raw) || 'https://cityparentsschool.co.ug');
  } catch {
    return new URL('https://cityparentsschool.co.ug');
  }
}

export async function generateMetadata(): Promise<Metadata> {
  const c = await getSiteConfig();
  // Default share/preview image for every page that doesn't set its own
  // (news & gallery pages override this). Helps link previews and search.
  const ogImage = c.hero?.backgroundImage || c.brand.logoUrl;
  return {
    metadataBase: safeUrl(c.url || site.url),
    title: {
      default: `${c.brand.name}, ${c.tagline}`,
      template: `%s · ${c.brand.name}`,
    },
    description: c.description,
    keywords: [
      c.brand.name,
      `school in ${c.brand.locality}`,
      'Uganda private school',
      'admissions',
      'pre-primary lower primary upper primary',
      'day and boarding school',
    ],
    openGraph: {
      type: 'website',
      locale: 'en_UG',
      url: c.url,
      siteName: c.brand.name,
      title: `${c.brand.name}, ${c.tagline}`,
      description: c.description,
      images: ogImage ? [{ url: ogImage }] : undefined,
    },
    twitter: { card: 'summary_large_image', title: c.brand.name, description: c.description, images: ogImage ? [ogImage] : undefined },
    robots: { index: true, follow: true },
    alternates: { canonical: c.url },
    // Favicon follows the school badge chosen in admin (defaults to /cps.png).
    icons: { icon: c.brand.logoUrl, shortcut: c.brand.logoUrl, apple: c.brand.logoUrl },
  };
}

export const viewport: Viewport = {
  themeColor: '#6e1f23',
  width: 'device-width',
  initialScale: 1,
};

// Revalidate every page at least this often so admin-saved settings (contact,
// hero, footer, etc.) appear without waiting on the long static cache. The
// admin save also triggers on-demand revalidation for near-instant updates.
export const revalidate = 30;

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const config = await getSiteConfig();
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'School',
    name: config.brand.name,
    url: config.url,
    description: config.description,
    telephone: config.contact.phone,
    email: config.contact.email,
    address: {
      '@type': 'PostalAddress',
      streetAddress: config.address.line1,
      postOfficeBoxNumber: config.address.poBox,
      addressLocality: config.address.city,
      addressCountry: config.address.country,
    },
    geo: { '@type': 'GeoCoordinates', latitude: config.coords.lat, longitude: config.coords.lng },
  };
  return (
    <html lang="en" data-theme={config.brand.theme}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600&family=Inter:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}

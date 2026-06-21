import type { Metadata, Viewport } from 'next';
import './globals.css';
import { site } from '@/lib/site';
import { getSiteConfig } from '@/lib/site-config';

export async function generateMetadata(): Promise<Metadata> {
  const c = await getSiteConfig();
  return {
    metadataBase: new URL(c.url || site.url),
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
    },
    twitter: { card: 'summary_large_image', title: c.brand.name, description: c.description },
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

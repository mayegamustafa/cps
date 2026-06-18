import type { Metadata, Viewport } from 'next';
import './globals.css';
import { site } from '@/lib/site';

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: {
    default: `${site.brand.name}, ${site.tagline}`,
    template: `%s · ${site.brand.name}`,
  },
  description: site.description,
  keywords: [
    'City Parents School',
    'school in Kampala',
    'Uganda private school',
    'admissions',
    'pre-primary lower primary upper primary',
    'day and boarding school Kampala',
  ],
  openGraph: {
    type: 'website',
    locale: 'en_UG',
    url: site.url,
    siteName: site.brand.name,
    title: `${site.brand.name}, ${site.tagline}`,
    description: site.description,
  },
  twitter: {
    card: 'summary_large_image',
    title: site.brand.name,
    description: site.description,
  },
  robots: { index: true, follow: true },
  alternates: { canonical: site.url },
};

export const viewport: Viewport = {
  themeColor: '#6e1f23',
  width: 'device-width',
  initialScale: 1,
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'School',
  name: site.brand.name,
  url: site.url,
  description: site.description,
  telephone: site.contact.phone,
  email: site.contact.email,
  address: {
    '@type': 'PostalAddress',
    streetAddress: site.address.line1,
    postOfficeBoxNumber: site.address.poBox,
    addressLocality: site.address.city,
    addressCountry: site.address.country,
  },
  geo: {
    '@type': 'GeoCoordinates',
    latitude: site.coords.lat,
    longitude: site.coords.lng,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
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

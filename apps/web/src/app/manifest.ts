import type { MetadataRoute } from 'next';
import { site } from '@/lib/site';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: site.brand.name,
    short_name: 'City Parents',
    description: site.description,
    start_url: '/',
    display: 'standalone',
    background_color: '#fbf8f3',
    theme_color: '#6e1f23',
    icons: [
      { src: '/cps.png', sizes: '192x192', type: 'image/png' },
      { src: '/cps.png', sizes: '512x512', type: 'image/png' },
    ],
  };
}

import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'costo',
    short_name: 'costo',
    description: 'Tracking de gastos multi-proyecto y multi-currency',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#ffffff',
    theme_color: '#0a0a0a',
    categories: ['finance', 'productivity', 'utilities'],
    icons: [
      {
        src: '/icon',
        sizes: '32x32',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/apple-icon',
        sizes: '180x180',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/apple-icon',
        sizes: '180x180',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  };
}

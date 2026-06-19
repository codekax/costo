import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: '/',
    name: 'costo — gastos',
    short_name: 'costo',
    description: 'Tracking de gastos multi-proyecto y multi-currency',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    // Desktop: integrate into the window title bar when supported, else a
    // plain standalone window. Both read as a real app, not a browser tab.
    display_override: ['window-controls-overlay', 'standalone'],
    background_color: '#08090a',
    theme_color: '#08090a',
    categories: ['finance', 'productivity', 'utilities'],
    icons: [
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      {
        src: '/icons/icon-maskable.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  };
}

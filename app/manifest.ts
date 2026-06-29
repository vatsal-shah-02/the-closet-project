import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'The Closet',
    short_name: 'Closet',
    description: 'Your AI wardrobe companion',
    start_url: '/wardrobe',
    display: 'standalone',
    background_color: '#F8F9FA',
    theme_color: '#4338ca',
    orientation: 'portrait',
    icons: [
      {
        src: '/icon',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/apple-icon',
        sizes: '180x180',
        type: 'image/png',
      },
    ],
  }
}

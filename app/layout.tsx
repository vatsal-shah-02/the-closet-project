import type { Metadata, Viewport } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Closet',
  description: 'Your AI wardrobe stylist',
  appleWebApp: { capable: true, statusBarStyle: 'black-translucent', title: 'Closet' },
}

export const viewport: Viewport = {
  themeColor: '#4338ca',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-white text-gray-900 antialiased">{children}</body>
    </html>
  )
}

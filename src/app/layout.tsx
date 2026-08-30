import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import Script from 'next/script'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'MySmartCard - Tap. Connect. Get Paid.',
  description: 'NFC smart card to share your profile instantly and receive payments via QR.',
  openGraph: {
    title: 'MySmartCard - Tap. Connect. Get Paid.',
    description: 'NFC smart card to share your profile instantly and receive payments via QR.',
    siteName: 'MySmartCard',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />
      </head>
      <body className={inter.className}>{children}</body>
    </html>
  )
}

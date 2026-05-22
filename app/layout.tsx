import type { Metadata } from 'next'
import { Playfair_Display, Quicksand } from 'next/font/google'
import './globals.css'

const playfair = Playfair_Display({ 
  subsets: ['latin'],
  variable: '--font-playfair',
})

const quicksand = Quicksand({ 
  subsets: ['latin'],
  variable: '--font-quicksand',
})

export const metadata: Metadata = {
  title: "Valentine's Day Scavenger Hunt",
  description: 'Find all the love hidden in the garden!',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={`${playfair.variable} ${quicksand.variable}`}>
        {children}
      </body>
    </html>
  )
}

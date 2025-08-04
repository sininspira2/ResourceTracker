import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { SessionProvider } from './components/SessionProvider'
import { ThemeProvider } from './components/ThemeProvider'
import { WhatsNewModal } from './components/WhatsNewModal'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Silver Portal',
  description: 'Resource management and Discord integration portal',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider>
          <SessionProvider>
            {children}
            <WhatsNewModal />
          </SessionProvider>
        </ThemeProvider>
      </body>
    </html>
  )
} 
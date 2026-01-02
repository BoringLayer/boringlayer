import { Inter } from "next/font/google";
import { Providers } from "./providers";
import type { Metadata } from 'next'
import './globals.css'

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: 'Boring Layer',
  description: 'Boring Layer App',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <style>{`
          body {
            background: #000084;
            margin: 0;
            padding: 0;
          }
        `}</style>
      </head>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}


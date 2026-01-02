'use client';

import { ReactNode } from 'react'
import { GlobalStyle } from './styles/globalStyles'
import { SessionProvider } from 'next-auth/react'

interface ProvidersProps {
  children: ReactNode
}

export function Providers({ children }: ProvidersProps) {
  return (
    <>
      <GlobalStyle />
      <SessionProvider>
        {children}
      </SessionProvider>
    </>
  )
} 
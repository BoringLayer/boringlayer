'use client'

import { Component, ReactNode } from 'react'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  error?: Error
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="error-container">
          <h2>Qualcosa è andato storto</h2>
          <p>{this.state.error?.message}</p>
          <button onClick={() => window.location.reload()}>
            Ricarica la pagina
          </button>
        </div>
      )
    }

    return this.props.children
  }
} 
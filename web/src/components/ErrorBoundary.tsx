import { Component, ReactNode } from 'react'

interface Props {
  children: ReactNode
}

interface State {
  error: Error | null
}

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  render() {
    if (this.state.error) {
      return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-surface p-6">
          <div className="text-center max-w-sm">
            <span className="material-symbols-outlined text-[48px] text-error mb-4">warning</span>
            <h2 className="font-title-md text-title-md text-on-surface mb-2">Something went wrong</h2>
            <p className="text-sm text-on-surface-variant mb-4">{this.state.error.message}</p>
            <button
              onClick={() => { localStorage.clear(); window.location.reload() }}
              className="px-4 py-2 bg-primary text-on-primary rounded-xl text-sm font-medium"
            >
              Reset &amp; Reload
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}

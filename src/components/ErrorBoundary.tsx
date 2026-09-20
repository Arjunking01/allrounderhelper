import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // eslint-disable-next-line no-console
    console.error('ALLROUNDER HELPER caught an error:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[60vh] flex items-center justify-center px-4">
          <div className="text-center max-w-md">
            <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-red-500/10 text-red-500 mx-auto mb-6">
              <AlertTriangle size={24} />
            </div>
            <h1 className="text-2xl font-semibold">Something went wrong</h1>
            <p className="mt-3 text-navy-500 dark:text-ink-400">
              This part of the page hit an unexpected error. Your saved data is untouched — try reloading.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="mt-6 inline-flex items-center gap-2 rounded-2xl gradient-brand text-white font-semibold px-6 py-3 shadow-lg shadow-electric-500/20"
            >
              <RotateCcw size={16} /> Reload page
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

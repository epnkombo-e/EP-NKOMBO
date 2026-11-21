import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle } from 'lucide-react';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  message: string;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  public state: ErrorBoundaryState = {
    hasError: false,
    message: '',
  };

  public static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      message: error.message || 'An unexpected error occurred.',
    };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Application error boundary caught:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-[#FBF9F5] p-6 text-[#1C1917]">
          <div className="w-full max-w-md rounded-xl border border-[#E5DFD3] bg-[#FFFFFF] p-6">
            <div className="flex items-center gap-3 text-[#B91C1C]">
              <AlertTriangle className="h-5 w-5 shrink-0" aria-hidden="true" />
              <h1 className="font-display text-xl font-medium text-[#1C1917]">
                Unable to load school content
              </h1>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-[#44403C]">
              A connection or permission issue occurred while loading data. Reload the page or sign
              in again if you were editing school records.
            </p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="mt-5 inline-flex min-h-[40px] items-center justify-center rounded-md bg-[#14532D] px-4 py-2 text-sm font-medium text-white hover:bg-[#0F3F22] cursor-pointer"
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

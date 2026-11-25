import React from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';

interface ErrorBoundaryState {
  hasError: boolean;
  message: string;
}

export class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, message: '' };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    let displayMessage = error.message || 'An unexpected error occurred.';
    try {
      const parsed = JSON.parse(error.message);
      if (parsed && typeof parsed.error === 'string') {
        displayMessage = parsed.error;
      }
    } catch {
      // Plain error message
    }
    return { hasError: true, message: displayMessage };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#131316] flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-[#1C1C21] border border-[#2C2C35] rounded-2xl p-8 text-center">
            <div className="w-11 h-11 rounded-lg bg-red-500/15 text-red-400 flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <h2 className="font-display text-xl font-semibold text-white mb-2">
              Unable to complete this view
            </h2>
            <p className="text-sm text-zinc-400 mb-6">{this.state.message}</p>
            <button
              type="button"
              onClick={() => {
                this.setState({ hasError: false, message: '' });
                window.location.reload();
              }}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-[#131316] bg-[#E8F553] hover:bg-[#DCF035] rounded-lg transition-colors cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              Reload Application
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

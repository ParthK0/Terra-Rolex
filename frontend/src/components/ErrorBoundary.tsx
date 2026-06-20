import { Component, type ErrorInfo, type ReactNode } from 'react';
import { ShieldAlert, RotateCcw } from 'lucide-react';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error in TerraRolex application shell:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.href = '/dashboard';
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-bg-base flex items-center justify-center p-6">
          <div className="max-w-md w-full premium-card bg-white p-8 space-y-6 text-center shadow-lg border border-gray-200/60">
            <div className="w-16 h-16 mx-auto rounded-full bg-accent-blue/10 flex items-center justify-center text-accent-blue">
              <ShieldAlert className="w-8 h-8" />
            </div>
            
            <div className="space-y-2">
              <h1 className="text-xl font-bold tracking-tight text-text-charcoal font-display">Something went wrong</h1>
              <p className="text-xs text-text-grey leading-relaxed">
                An unexpected error occurred in the dashboard rendering engine. Don't worry, your carbon data is safe.
              </p>
            </div>

            {this.state.error && (
              <pre className="text-[10px] text-red-500 bg-red-50/50 p-3 rounded-lg overflow-x-auto text-left font-mono border border-red-100">
                {this.state.error.message}
              </pre>
            )}

            <button
              onClick={this.handleReset}
              className="inline-flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-accent-blue text-white text-xs font-bold hover:bg-blue-600 transition-all cursor-pointer shadow-sm"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Reload Application</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle, RefreshCw, Home, Mail } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorCount: number;
}

class ErrorBoundary extends Component<Props, State> {
  private resetTimeoutId: NodeJS.Timeout | null = null;

  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorCount: 0,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const { onError } = this.props;
    const { errorCount } = this.state;

    // Log error to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('ErrorBoundary caught an error:', error, errorInfo);
    }

    // Log to external service (e.g., Sentry, LogRocket)
    this.logErrorToService(error, errorInfo);

    // Call custom error handler if provided
    if (onError) {
      onError(error, errorInfo);
    }

    // Update state with error details
    this.setState({
      errorInfo,
      errorCount: errorCount + 1,
    });

    // Auto-recover after 3 errors to prevent infinite loops
    if (errorCount >= 2) {
      this.scheduleReset(10000); // Reset after 10 seconds
    }
  }

  logErrorToService = (error: Error, errorInfo: ErrorInfo) => {
    const errorData = {
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      // Add user context if available
      user: this.getUserContext(),
    };

    // Send to logging service
    if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
      // Sentry integration
      if (typeof window !== 'undefined' && (window as any).Sentry) {
        (window as any).Sentry.captureException(error, {
          contexts: {
            react: {
              componentStack: errorInfo.componentStack,
            },
          },
          extra: errorData,
        });
      }
    }

    // Fallback: Send to custom API endpoint
    fetch('/api/errors', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(errorData),
    }).catch(console.error);
  };

  getUserContext = () => {
    // Get user context from localStorage or state management
    try {
      const authData = localStorage.getItem('auth-token');
      return authData ? { authenticated: true } : { authenticated: false };
    } catch {
      return { authenticated: false };
    }
  };

  scheduleReset = (delay: number) => {
    if (this.resetTimeoutId) {
      clearTimeout(this.resetTimeoutId);
    }
    this.resetTimeoutId = setTimeout(() => {
      this.resetErrorBoundary();
    }, delay);
  };

  componentWillUnmount() {
    if (this.resetTimeoutId) {
      clearTimeout(this.resetTimeoutId);
    }
  }

  resetErrorBoundary = () => {
    if (this.resetTimeoutId) {
      clearTimeout(this.resetTimeoutId);
      this.resetTimeoutId = null;
    }
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorCount: 0,
    });
  };

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  handleReportIssue = () => {
    const { error } = this.state;
    const subject = encodeURIComponent('Error Report: ' + (error?.message || 'Unknown Error'));
    const body = encodeURIComponent(
      `I encountered an error:\n\n` +
      `Error: ${error?.message}\n` +
      `URL: ${window.location.href}\n` +
      `Time: ${new Date().toISOString()}\n\n` +
      `Please describe what you were doing when this error occurred:`
    );
    window.location.href = `mailto:${process.env.NEXT_PUBLIC_SUPPORT_EMAIL}?subject=${subject}&body=${body}`;
  };

  render() {
    const { hasError, error, errorInfo, errorCount } = this.state;
    const { children, fallback } = this.props;

    if (hasError) {
      // Use custom fallback if provided
      if (fallback) {
        return <>{fallback}</>;
      }

      // Default error UI
      return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-4">
          <div className="max-w-2xl w-full">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 md:p-12">
              {/* Error Icon */}
              <div className="flex justify-center mb-6">
                <div className="relative">
                  <div className="absolute inset-0 bg-red-500 opacity-20 rounded-full blur-xl"></div>
                  <AlertCircle className="relative w-20 h-20 text-red-500" />
                </div>
              </div>

              {/* Error Title */}
              <h1 className="text-3xl font-bold text-center text-gray-900 dark:text-white mb-4">
                Oops! Something went wrong
              </h1>

              {/* Error Description */}
              <p className="text-center text-gray-600 dark:text-gray-400 mb-8">
                We apologize for the inconvenience. An unexpected error has occurred.
                {errorCount > 1 && (
                  <span className="block mt-2 text-sm text-orange-600 dark:text-orange-400">
                    Multiple errors detected. The page will auto-refresh in a few seconds.
                  </span>
                )}
              </p>

              {/* Error Details (Development Only) */}
              {process.env.NODE_ENV === 'development' && error && (
                <div className="mb-8 p-4 bg-gray-100 dark:bg-gray-900 rounded-lg">
                  <h3 className="font-semibold text-sm text-gray-700 dark:text-gray-300 mb-2">
                    Error Details (Development Only):
                  </h3>
                  <p className="text-xs text-red-600 dark:text-red-400 font-mono mb-2">
                    {error.message}
                  </p>
                  {error.stack && (
                    <details className="text-xs text-gray-600 dark:text-gray-400">
                      <summary className="cursor-pointer hover:text-gray-800 dark:hover:text-gray-200">
                        Stack Trace
                      </summary>
                      <pre className="mt-2 overflow-x-auto whitespace-pre-wrap font-mono text-xs">
                        {error.stack}
                      </pre>
                    </details>
                  )}
                  {errorInfo?.componentStack && (
                    <details className="mt-2 text-xs text-gray-600 dark:text-gray-400">
                      <summary className="cursor-pointer hover:text-gray-800 dark:hover:text-gray-200">
                        Component Stack
                      </summary>
                      <pre className="mt-2 overflow-x-auto whitespace-pre-wrap font-mono text-xs">
                        {errorInfo.componentStack}
                      </pre>
                    </details>
                  )}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <button
                  onClick={this.resetErrorBoundary}
                  className="flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors duration-200 shadow-lg hover:shadow-xl"
                >
                  <RefreshCw className="w-4 h-4" />
                  Try Again
                </button>

                <button
                  onClick={this.handleGoHome}
                  className="flex items-center justify-center gap-2 px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white font-medium rounded-lg transition-colors duration-200 shadow-lg hover:shadow-xl"
                >
                  <Home className="w-4 h-4" />
                  Go Home
                </button>

                <button
                  onClick={this.handleReportIssue}
                  className="flex items-center justify-center gap-2 px-6 py-3 bg-transparent hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 font-medium rounded-lg transition-colors duration-200 border border-gray-300 dark:border-gray-600"
                >
                  <Mail className="w-4 h-4" />
                  Report Issue
                </button>
              </div>

              {/* Support Information */}
              <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
                <p className="text-center text-sm text-gray-500 dark:text-gray-400">
                  If this problem persists, please contact our support team at{' '}
                  <a
                    href={`mailto:${process.env.NEXT_PUBLIC_SUPPORT_EMAIL}`}
                    className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 underline"
                  >
                    {process.env.NEXT_PUBLIC_SUPPORT_EMAIL}
                  </a>
                </p>
                <p className="text-center text-xs text-gray-400 dark:text-gray-500 mt-2">
                  Error ID: {this.generateErrorId()}
                </p>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return children;
  }

  private generateErrorId(): string {
    return `ERR-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
  }
}

// Async Error Boundary for Suspense
export const AsyncErrorBoundary: React.FC<Props> = ({ children, ...props }) => {
  return (
    <ErrorBoundary {...props}>
      <React.Suspense
        fallback={
          <div className="flex items-center justify-center min-h-screen">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        }
      >
        {children}
      </React.Suspense>
    </ErrorBoundary>
  );
};

// Hook to use error boundary programmatically
export const useErrorHandler = () => {
  const [error, setError] = React.useState<Error | null>(null);

  React.useEffect(() => {
    if (error) {
      throw error;
    }
  }, [error]);

  return setError;
};

// HOC to wrap components with error boundary
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<Props, 'children'>
) {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;

  return WrappedComponent;
}

export default ErrorBoundary;
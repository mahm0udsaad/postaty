"use client";

import { Component, type ReactNode } from "react";
import { AlertCircle, RotateCcw } from "lucide-react";

interface ErrorBoundaryProps {
  children: ReactNode;
  fallbackTitle?: string;
  fallbackMessage?: string;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("ErrorBoundary caught:", error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[50vh] flex items-center justify-center p-6">
          <div className="text-center space-y-6 max-w-md">
            <div className="w-16 h-16 bg-danger/10 rounded-full flex items-center justify-center mx-auto">
              <AlertCircle size={28} className="text-danger" />
            </div>
            <h2 className="text-2xl font-bold text-foreground">
              {this.props.fallbackTitle ?? "Something went wrong"}
            </h2>
            <p className="text-muted text-sm">
              {this.props.fallbackMessage ??
                "An unexpected error occurred. Please try again."}
            </p>
            {this.state.error?.message && (
              <p className="text-xs text-muted bg-surface-2 border border-card-border rounded-lg p-3 break-words">
                {this.state.error.message}
              </p>
            )}
            <button
              onClick={this.handleReset}
              className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-xl font-bold hover:bg-primary-hover transition-colors"
            >
              <RotateCcw size={16} />
              Try again
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

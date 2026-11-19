import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface State {
  hasError: boolean;
  errorMessage: string;
}

export class ErrorBoundary extends React.Component<{ children: React.ReactNode }, State> {
  state: State = {
    hasError: false,
    errorMessage: '',
  };

  static getDerivedStateFromError(error: Error): State {
    let msg = error.message || 'An unexpected error occurred.';
    try {
      const parsed = JSON.parse(msg);
      if (parsed && parsed.error && parsed.operationType) {
        msg = `Database permission or validation error during ${parsed.operationType} on ${parsed.path || 'record'}: ${parsed.error}`;
      }
    } catch {
      // plain error string
    }
    return { hasError: true, errorMessage: msg };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#061224] text-white flex items-center justify-center p-6">
          <div className="max-w-lg w-full bg-[#0D213F] border border-[#D4AF37]/40 rounded-2xl p-8 text-center shadow-2xl">
            <div className="mx-auto mb-4 w-14 h-14 rounded-full bg-amber-500/15 border border-amber-400/40 flex items-center justify-center text-amber-400">
              <AlertTriangle className="w-7 h-7" />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Application Notice</h2>
            <p className="text-sm text-slate-300 leading-relaxed mb-6 break-words">
              {this.state.errorMessage}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#D4AF37] text-[#071426] font-semibold text-sm hover:bg-[#E5C158] transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Reload Application
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

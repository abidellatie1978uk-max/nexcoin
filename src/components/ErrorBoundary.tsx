import React from 'react';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary capturou erro:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-black text-white flex items-center justify-center p-6">
          <div className="bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 p-6 max-w-md">
            <h2 className="text-xl mb-4">Algo deu errado</h2>
            <p className="text-white/60 text-sm mb-4">
              {this.state.error?.message || 'Erro desconhecido'}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="w-full bg-white/10 hover:bg-white/20 text-white py-3 px-4 rounded-xl transition-all"
            >
              Recarregar página
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

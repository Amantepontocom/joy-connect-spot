import React from "react";
import { Button } from "@/components/ui/button";

type Props = {
  children: React.ReactNode;
};

type State = {
  hasError: boolean;
  error?: Error;
};

export class AppErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // Make sure we get something useful in Lovable logs
    console.error("[AppErrorBoundary] Uncaught error:", error);
    console.error("[AppErrorBoundary] Component stack:", info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen w-screen bg-background text-foreground flex items-center justify-center p-6">
          <div className="w-full max-w-md bg-card border border-border rounded-2xl p-5">
            <h1 className="text-lg font-bold">Algo deu errado</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Se esta tela aparecer como “tela branca”, recarregue. Se persistir, me diga o texto do erro abaixo.
            </p>

            <pre className="mt-4 text-xs whitespace-pre-wrap break-words bg-secondary rounded-xl p-3 overflow-auto max-h-40">
              {this.state.error?.message || "Erro desconhecido"}
            </pre>

            <div className="mt-4 flex gap-2">
              <Button
                onClick={() => window.location.reload()}
                className="flex-1"
              >
                Recarregar
              </Button>
              <Button
                variant="outline"
                onClick={() => this.setState({ hasError: false, error: undefined })}
              >
                Tentar novamente
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

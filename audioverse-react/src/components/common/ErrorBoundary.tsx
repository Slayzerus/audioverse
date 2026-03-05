import { Component, type ErrorInfo, type ReactNode } from "react";
import i18n from '../../i18n/i18n';
import { logger } from '../../utils/logger';
const log = logger.scoped('ErrorBoundary');

interface ErrorBoundaryProps {
    children: ReactNode;
    /** Optional fallback UI. Receives the error and a reset callback. */
    fallback?: (error: Error, reset: () => void) => ReactNode;
}

interface ErrorBoundaryState {
    error: Error | null;
}

/**
 * Global error boundary — catches render errors in any child tree
 * and shows a recovery UI instead of a white screen.
 */
class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
    state: ErrorBoundaryState = { error: null };

    static getDerivedStateFromError(error: Error): ErrorBoundaryState {
        return { error };
    }

    componentDidCatch(error: Error, info: ErrorInfo): void {
        log.error("[ErrorBoundary]", error, info.componentStack);
    }

    private handleReset = () => {
        this.setState({ error: null });
    };

    render(): ReactNode {
        const { error } = this.state;
        if (error) {
            if (this.props.fallback) {
                return this.props.fallback(error, this.handleReset);
            }

            return (
                <div
                    style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        height: "60vh",
                        gap: "1rem",
                        padding: "2rem",
                        textAlign: "center",
                    }}
                >
                    <h2 style={{ color: "var(--error, #dc3545)" }}>{i18n.t('errorBoundary.title')}</h2>
                    <p style={{ color: "var(--text-secondary, #6c757d)", maxWidth: 480 }}>
                        {error.message || i18n.t('errorBoundary.unknownError')}
                    </p>
                    <button
                        className="btn btn-primary"
                        onClick={this.handleReset}
                    >
                        {i18n.t('errorBoundary.retry')}
                    </button>
                    <button
                        className="btn btn-outline-secondary btn-sm"
                        onClick={() => (window.location.href = "/")}
                    >
                        {i18n.t('errorBoundary.goHome')}
                    </button>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;

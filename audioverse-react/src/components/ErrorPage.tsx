import React, { useState } from "react";
import { useRouteError, isRouteErrorResponse, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

/** Generates a short pseudo-random error reference code */
const errorCode = () =>
    `ERR-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;

const ErrorPage: React.FC = () => {
    const error = useRouteError();
    const { t } = useTranslation();
    const [detailsOpen, setDetailsOpen] = useState(false);
    const [code] = useState(errorCode);

    // Extract a human-readable message
    let status: number | undefined;
    let message: string;

    if (isRouteErrorResponse(error)) {
        status = error.status;
        message = error.statusText || error.data?.message || String(error.data);
    } else if (error instanceof Error) {
        message = error.message;
    } else {
        message = String(error);
    }

    // Detailed stack / raw dump for the collapse
    const details =
        error instanceof Error && error.stack
            ? error.stack
            : JSON.stringify(error, null, 2);

    return (
        <div
            className="d-flex flex-column align-items-center justify-content-center text-center px-3"
            style={{ minHeight: "80vh" }}
        >
            {/* Icon */}
            <i
                className="fa-solid fa-dumpster-fire mb-4"
                style={{ fontSize: 96, color: "var(--bs-danger, #dc3545)", opacity: 0.85 }}
                aria-hidden="true"
            />

            {/* Heading */}
            <h1 className="fw-bold mb-2" style={{ fontSize: 28 }}>
                {t("error.title", "Przepraszamy, wystąpił nieoczekiwany błąd systemu")}
            </h1>

            {/* Error code badge */}
            <span
                className="badge bg-secondary mb-3"
                style={{ fontSize: 13, letterSpacing: 1, fontFamily: "monospace" }}
            >
                {code}
            </span>

            {/* Subtitle */}
            {status && (
                <p className="text-muted mb-1" style={{ fontSize: 15 }}>
                    HTTP {status}
                </p>
            )}
            <p className="text-muted mb-1" style={{ fontSize: 13, maxWidth: 500, fontFamily: "monospace" }}>
                {message}
            </p>
            <p className="text-muted mb-4" style={{ fontSize: 14, maxWidth: 500 }}>
                {t(
                    "error.subtitle",
                    "Jeśli problem będzie się powtarzał, skontaktuj się z administratorem, podając powyższy kod błędu."
                )}
            </p>

            {/* Collapsible details */}
            <div className="mb-4" style={{ width: "100%", maxWidth: 600 }}>
                <button
                    className="btn btn-sm btn-outline-secondary"
                    onClick={() => setDetailsOpen((o) => !o)}
                    aria-expanded={detailsOpen}
                >
                    <i
                        className={`fa fa-chevron-${detailsOpen ? "up" : "down"} me-1`}
                        aria-hidden="true"
                    />
                    {t("error.details", "Szczegóły błędu")}
                </button>
                {detailsOpen && (
                    <pre
                        className="text-start mt-2 p-3 rounded-3"
                        style={{
                            background: "rgba(0,0,0,0.25)",
                            border: "1px solid rgba(255,255,255,0.1)",
                            fontSize: 12,
                            maxHeight: 300,
                            overflow: "auto",
                            whiteSpace: "pre-wrap",
                            wordBreak: "break-word",
                        }}
                    >
                        {details}
                    </pre>
                )}
            </div>

            {/* Actions */}
            <div className="d-flex gap-2">
                <button
                    className="btn btn-primary"
                    onClick={() => window.location.reload()}
                >
                    <i className="fa fa-rotate-right me-1" aria-hidden="true" />
                    {t("error.reload", "Odśwież stronę")}
                </button>
                <Link to="/" className="btn btn-outline-secondary">
                    <i className="fa fa-home me-1" aria-hidden="true" />
                    {t("error.home", "Strona główna")}
                </Link>
            </div>
        </div>
    );
};

export default ErrorPage;

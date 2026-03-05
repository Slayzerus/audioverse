// NotFoundPage.tsx — 404 catch-all page
import React from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

const NotFoundPage: React.FC = () => {
    const { t } = useTranslation();

    return (
        <div
            className="d-flex flex-column align-items-center justify-content-center text-center"
            style={{ minHeight: "60vh", padding: "2rem" }}
            role="alert"
        >
            <h1 style={{ fontSize: "6rem", fontWeight: 800, opacity: 0.15, lineHeight: 1 }}>404</h1>
            <h2 className="mt-3 mb-2">{t("notFound.title", "Page not found")}</h2>
            <p className="mb-4 opacity-75" style={{ maxWidth: 420 }}>
                {t("notFound.description", "The page you're looking for doesn't exist or has been moved.")}
            </p>
            <Link
                to="/"
                className="btn px-4 py-2 rounded-lg"
                style={{ background: "var(--accent, #3b82f6)", color: "#fff", textDecoration: "none" }}
            >
                {t("notFound.goHome", "Go to homepage")}
            </Link>
        </div>
    );
};

export default NotFoundPage;

/* HelpPanel — Offcanvas sidebar with contextual help per page */
import React, { useState, useMemo } from "react";
import { Offcanvas } from "react-bootstrap";
import { useLocation } from "react-router-dom";
import {
    helpArticles,
    getHelpKeyForRoute,
    type HelpArticle,
} from "../../help/helpContent";

interface HelpPanelProps {
    show: boolean;
    onHide: () => void;
}

const HelpPanel: React.FC<HelpPanelProps> = ({ show, onHide }) => {
    const { pathname } = useLocation();
    const [viewArticleKey, setViewArticleKey] = useState<string | null>(null);

    const contextKey = useMemo(() => getHelpKeyForRoute(pathname), [pathname]);

    // Show either the explicitly selected article or the contextual one
    const activeKey = viewArticleKey ?? contextKey;
    const article: HelpArticle | undefined = helpArticles[activeKey];

    const handleRelatedClick = (key: string) => {
        setViewArticleKey(key);
    };

    const handleBack = () => {
        setViewArticleKey(null);
    };

    return (
        <Offcanvas
            show={show}
            onHide={onHide}
            placement="end"
            className="help-panel-offcanvas"
            style={{ maxWidth: 420 }}
            aria-label="Help panel"
        >
            <Offcanvas.Header closeButton>
                <Offcanvas.Title>
                    <span style={{ marginRight: 8, fontSize: "1.2em" }}>❓</span>
                    Pomoc
                </Offcanvas.Title>
            </Offcanvas.Header>
            <Offcanvas.Body style={{ padding: "0.5rem 1rem 1.5rem" }}>
                {viewArticleKey && viewArticleKey !== contextKey && (
                    <button
                        className="btn btn-sm btn-outline-secondary mb-3"
                        onClick={handleBack}
                    >
                        ← Powrót do pomocy kontekstowej
                    </button>
                )}

                {article ? (
                    <>
                        <h5 className="mb-1">{article.title}</h5>
                        <p className="text-muted mb-3" style={{ fontSize: "0.9em" }}>
                            {article.summary}
                        </p>

                        {article.sections.map((section, idx) => (
                            <div key={idx} className="mb-3">
                                <h6
                                    style={{
                                        borderBottom: "1px solid var(--bs-border-color, #dee2e6)",
                                        paddingBottom: 4,
                                        marginBottom: 8,
                                    }}
                                >
                                    {section.heading}
                                </h6>
                                <p style={{ fontSize: "0.92em", lineHeight: 1.6 }}>
                                    {section.content}
                                </p>
                            </div>
                        ))}

                        {article.related && article.related.length > 0 && (
                            <div className="mt-4">
                                <h6 className="text-muted" style={{ fontSize: "0.85em" }}>
                                    Powiązane tematy:
                                </h6>
                                <div className="d-flex flex-wrap gap-2">
                                    {article.related.map((relKey) => {
                                        const rel = helpArticles[relKey];
                                        if (!rel) return null;
                                        return (
                                            <button
                                                key={relKey}
                                                className="btn btn-sm btn-outline-primary"
                                                onClick={() => handleRelatedClick(relKey)}
                                            >
                                                {rel.title}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </>
                ) : (
                    <p className="text-muted">
                        No help article found for this page. Choose a topic from the list below.
                    </p>
                )}

                {/* All topics index */}
                <hr className="my-4" />
                <h6 className="text-muted mb-2" style={{ fontSize: "0.85em" }}>
                    All topics:
                </h6>
                <div className="list-group list-group-flush">
                    {Object.entries(helpArticles).map(([key, art]) => (
                        <button
                            key={key}
                            className={`list-group-item list-group-item-action py-2 px-2 ${
                                key === activeKey ? "active" : ""
                            }`}
                            style={{ fontSize: "0.88em" }}
                            onClick={() => handleRelatedClick(key)}
                        >
                            {art.title}
                        </button>
                    ))}
                </div>
            </Offcanvas.Body>
        </Offcanvas>
    );
};

export default HelpPanel;

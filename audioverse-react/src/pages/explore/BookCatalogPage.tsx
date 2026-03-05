// BookCatalogPage.tsx — Search and browse book catalog
import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import {
    useBookSearchQuery,
    useBookDetailsQuery,
    CatalogBook,
} from "../../scripts/api/apiBookCatalog";
import ContentSkeleton from "../../components/common/ContentSkeleton";

// ── Styles ─────────────────────────────────────────────────────
const page: React.CSSProperties = {
    width: "100%", height: "100%", padding: 20,
    display: "flex", flexDirection: "column", gap: 20, overflow: "auto",
    backgroundColor: "var(--bg-primary)",
};
const header: React.CSSProperties = {
    display: "flex", flexDirection: "column", gap: 4,
};
const title: React.CSSProperties = { fontSize: 28, fontWeight: 700, margin: 0 };
const subtitle: React.CSSProperties = {
    fontSize: 14, opacity: 0.7, margin: 0,
};
const searchInput: React.CSSProperties = {
    width: "100%", maxWidth: 480, padding: "10px 14px",
    borderRadius: 8, border: "1px solid var(--border-color, #555)",
    backgroundColor: "var(--bg-secondary, #1e1e1e)", color: "inherit",
    fontSize: 15, outline: "none",
};
const grid: React.CSSProperties = {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
    gap: 16,
};
const cardStyle: React.CSSProperties = {
    border: "1px solid var(--border-color, #444)",
    borderRadius: 8, padding: 14,
    backgroundColor: "var(--bg-secondary, #1e1e1e)",
    cursor: "pointer", transition: "transform 0.15s, box-shadow 0.15s",
    display: "flex", gap: 12,
};
const cardHover: React.CSSProperties = {
    transform: "translateY(-2px)",
    boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
};
const coverImg: React.CSSProperties = {
    width: 64, height: 96, objectFit: "cover", borderRadius: 4,
    backgroundColor: "var(--bg-primary, #111)", flexShrink: 0,
};
const badge: React.CSSProperties = {
    display: "inline-block", padding: "2px 8px", borderRadius: 12,
    fontSize: 11, backgroundColor: "var(--accent, #5865F2)", color: "#fff",
    marginRight: 4,
};
const detailPanel: React.CSSProperties = {
    gridColumn: "1 / -1",
    border: "1px solid var(--border-color, #444)",
    borderRadius: 8, padding: 20,
    backgroundColor: "var(--bg-secondary, #1e1e1e)",
    display: "flex", gap: 20, flexWrap: "wrap",
};
const detailCover: React.CSSProperties = {
    width: 160, height: 240, objectFit: "cover", borderRadius: 6,
    backgroundColor: "var(--bg-primary, #111)", flexShrink: 0,
};
const placeholder: React.CSSProperties = {
    textAlign: "center", padding: 40, opacity: 0.5, fontSize: 15,
};

// ── Helpers ────────────────────────────────────────────────────
const renderStars = (rating?: number): string => {
    const r = Math.round(rating ?? 0);
    return "★".repeat(Math.min(r, 5)) + "☆".repeat(Math.max(5 - r, 0));
};

// ── Detail sub-component ──────────────────────────────────────
const BookDetail: React.FC<{ book: CatalogBook; onClose: () => void }> = ({
    book,
    onClose,
}) => {
    const { t } = useTranslation();
    const { data: details, isLoading } = useBookDetailsQuery(
        book.googleBooksId ?? "",
        { enabled: !!book.googleBooksId },
    );
    const d = details ?? book;

    return (
        <div style={detailPanel}>
            {d.coverUrl ? (
                <img src={d.coverUrl} alt={d.title} style={detailCover} />
            ) : (
                <div style={{ ...detailCover, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 48 }}>📖</div>
            )}
            <div style={{ flex: 1, minWidth: 200, display: "flex", flexDirection: "column", gap: 8 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start" }}>
                    <h2 style={{ margin: 0 }}>{d.title}</h2>
                    <button
                        onClick={onClose}
                        style={{ background: "none", border: "none", color: "inherit", cursor: "pointer", fontSize: 20 }}
                        aria-label={t("books.close", "Close")}
                    >✕</button>
                </div>
                {d.author && <p style={{ margin: 0, opacity: 0.8 }}>{d.author}</p>}

                {isLoading && <ContentSkeleton rows={3} showHeader={false} />}

                {d.description && (
                    <p style={{ margin: 0, fontSize: 13, lineHeight: 1.5, maxHeight: 200, overflow: "auto" }}>
                        {d.description}
                    </p>
                )}

                <div style={{ display: "flex", flexWrap: "wrap", gap: 8, fontSize: 13 }}>
                    {d.pageCount != null && <span>{t("books.pages", "Pages")}: {d.pageCount}</span>}
                    {d.language && <span>{t("books.language", "Language")}: {d.language}</span>}
                    {d.genre && <span style={badge}>{d.genre}</span>}
                    {d.rating != null && <span>{renderStars(d.rating)}</span>}
                    {d.isbn && <span style={badge}>ISBN {d.isbn}</span>}
                    {d.publishedYear != null && <span>{t("books.year", "Year")}: {d.publishedYear}</span>}
                    {d.publisher && <span>{t("books.publisher", "Publisher")}: {d.publisher}</span>}
                </div>

                {d.googleBooksId && (
                    <a
                        href={`https://books.google.com/books?id=${encodeURIComponent(d.googleBooksId)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ fontSize: 13, color: "var(--accent, #5865F2)" }}
                    >
                        {t("books.viewOnGoogle", "View on Google Books ↗")}
                    </a>
                )}
            </div>
        </div>
    );
};

// ── Book card ─────────────────────────────────────────────────
const BookCard: React.FC<{ book: CatalogBook; selected: boolean; onClick: () => void }> = ({
    book, selected, onClick,
}) => {
    const [hovered, setHovered] = useState(false);

    return (
        <div
            role="button"
            tabIndex={0}
            style={{
                ...cardStyle,
                ...(hovered ? cardHover : {}),
                ...(selected ? { borderColor: "var(--accent, #5865F2)" } : {}),
            }}
            onClick={onClick}
            onKeyDown={e => { if (e.key === "Enter") onClick(); }}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
        >
            {book.coverUrl ? (
                <img src={book.coverUrl} alt={book.title} style={coverImg} />
            ) : (
                <div style={{ ...coverImg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 32 }}>📖</div>
            )}
            <div style={{ display: "flex", flexDirection: "column", gap: 4, overflow: "hidden" }}>
                <strong style={{ fontSize: 14 }}>{book.title}</strong>
                {book.author && <span style={{ fontSize: 12, opacity: 0.7 }}>{book.author}</span>}
                <div style={{ display: "flex", flexWrap: "wrap", gap: 4, fontSize: 11 }}>
                    {book.publishedYear != null && <span>{book.publishedYear}</span>}
                    {book.publisher && <span>· {book.publisher}</span>}
                </div>
                {book.genre && <span style={badge}>{book.genre}</span>}
                {book.rating != null && (
                    <span style={{ fontSize: 13, color: "#f5c518" }}>{renderStars(book.rating)}</span>
                )}
                {book.isbn && <span style={{ ...badge, backgroundColor: "#444" }}>ISBN {book.isbn}</span>}
            </div>
        </div>
    );
};

// ── Main page ─────────────────────────────────────────────────
const BookCatalogPage: React.FC = () => {
    const { t } = useTranslation();
    const [query, setQuery] = useState("");
    const [debouncedQuery, setDebouncedQuery] = useState("");
    const [selectedId, setSelectedId] = useState<number | null>(null);

    // Debounce 300ms
    useEffect(() => {
        const timer = setTimeout(() => setDebouncedQuery(query), 300);
        return () => clearTimeout(timer);
    }, [query]);

    const { data: books, isLoading } = useBookSearchQuery(debouncedQuery, 20);

    const toggleSelect = (id: number) =>
        setSelectedId(prev => (prev === id ? null : id));

    return (
        <div style={page}>
            {/* Header */}
            <div style={header}>
                <h1 style={title}><i className="fa-solid fa-book" />{" "}{t("books.title", "Book Catalog")}</h1>
                <p style={subtitle}>{t("books.subtitle", "Search and browse books")}</p>
            </div>

            {/* Search */}
            <input
                type="text"
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder={t("books.searchPlaceholder", "Search books by title, author, ISBN...")}
                style={searchInput}
            />

            {/* Results */}
            {debouncedQuery.length < 2 && (
                <p style={placeholder}>{t("books.typeToSearch", "Type at least 2 characters to search...")}</p>
            )}

            {isLoading && <ContentSkeleton rows={4} />}

            {!isLoading && books && books.length === 0 && debouncedQuery.length >= 2 && (
                <p style={placeholder}>{t("books.noResults", "No books found.")}</p>
            )}

            {books && books.length > 0 && (
                <div style={grid}>
                    {books.map(book => (
                        <React.Fragment key={book.id}>
                            <BookCard
                                book={book}
                                selected={selectedId === book.id}
                                onClick={() => toggleSelect(book.id)}
                            />
                            {selectedId === book.id && (
                                <BookDetail
                                    book={book}
                                    onClose={() => setSelectedId(null)}
                                />
                            )}
                        </React.Fragment>
                    ))}
                </div>
            )}
        </div>
    );
};

export default BookCatalogPage;

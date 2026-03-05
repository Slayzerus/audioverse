import React, { useState, useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import {
    useBooksQuery,
    useCreateBookMutation,
    useDeleteBookMutation,
    useImportOpenLibraryMutation,
    useImportGoogleBooksMutation,
    searchOpenLibrary,
    searchGoogleBooks,
    type Book,
    type ExternalBookResult,
} from "../../scripts/api/apiMediaBooks";
import ExternalMediaLookup, { type MediaLookupSource } from "../../components/common/ExternalMediaLookup";

const cardStyle: React.CSSProperties = {
    background: "var(--card-bg, #23272f)",
    border: "1px solid var(--border-color, #333)",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
};

const BooksPage: React.FC = () => {
    const { t } = useTranslation();
    const [searchQuery, setSearchQuery] = useState("");
    const [showCreate, setShowCreate] = useState(false);
    const [newBook, setNewBook] = useState<Partial<Book>>({});

    const booksQuery = useBooksQuery();
    const createMutation = useCreateBookMutation();
    const deleteMutation = useDeleteBookMutation();
    const importOpenLibrary = useImportOpenLibraryMutation();
    const importGoogle = useImportGoogleBooksMutation();

    const filteredBooks = (booksQuery.data ?? []).filter(b =>
        !searchQuery || (b.title ?? "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (b.author ?? "").toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleCreate = async () => {
        if (!newBook.title?.trim()) return;
        await createMutation.mutateAsync(newBook);
        setNewBook({});
        setShowCreate(false);
    };

    // Universal lookup sources
    const lookupSources: MediaLookupSource<ExternalBookResult>[] = useMemo(() => [
        { key: "openlibrary", label: "OpenLibrary", searchFn: searchOpenLibrary },
        { key: "google", label: "Google Books", searchFn: searchGoogleBooks },
    ], []);

    const handleLookupSelect = useCallback((item: ExternalBookResult, sourceKey: string) => {
        // Autofill form fields from the selected suggestion
        setNewBook(prev => ({
            ...prev,
            title: item.title ?? prev.title,
            author: item.author ?? prev.author,
            isbn: item.isbn ?? prev.isbn,
            description: item.description ?? prev.description,
            coverUrl: item.coverUrl ?? prev.coverUrl,
        }));
        // Also trigger import directly
        if (sourceKey === "openlibrary" && item.isbn) {
            importOpenLibrary.mutate(item.isbn);
        } else if (sourceKey === "google" && item.externalId) {
            importGoogle.mutate(item.externalId);
        }
    }, [importOpenLibrary, importGoogle]);

    const renderBookSuggestion = useCallback((item: ExternalBookResult) => (
        <>
            {item.coverUrl && <img src={item.coverUrl} alt={item.title || 'Book cover'} style={{ width: 36, height: 52, objectFit: "cover", borderRadius: 4, flexShrink: 0 }} />}
            <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600 }}>{item.title}</div>
                <div style={{ fontSize: 11, opacity: 0.6 }}>
                    {item.author}{item.publishedDate ? ` (${item.publishedDate})` : ""}
                </div>
            </div>
            <span style={{ fontSize: 11, opacity: 0.4, flexShrink: 0 }}>⬇ import</span>
        </>
    ), []);

    return (
        <div className="container mt-4" style={{ maxWidth: 1100 }}>
            <div className="d-flex justify-content-between align-items-center mb-3">
                <h2 style={{ fontWeight: 700 }}>📚 {t("media.books.title", "Books")}</h2>
                <button className="btn btn-primary btn-sm" onClick={() => setShowCreate(s => !s)}>
                    <i className="fa fa-plus me-1" /> {t("common.add", "Add")}
                </button>
            </div>

            {/* Create form with inline lookup */}
            {showCreate && (
                <div style={cardStyle}>
                    <h5>{t("media.books.createTitle", "Add Book")}</h5>

                    {/* Universal lookup — inline autocomplete */}
                    <div style={{ marginBottom: 10 }}>
                        <ExternalMediaLookup<ExternalBookResult>
                            sources={lookupSources}
                            onSelect={handleLookupSelect}
                            renderSuggestion={renderBookSuggestion}
                            placeholder={t("media.books.lookupPlaceholder", "Search OpenLibrary / Google Books to auto-fill...")}
                        />
                    </div>

                    <div className="row g-2">
                        <div className="col-md-6">
                            <input className="form-control form-control-sm" placeholder={t("media.books.titleField", "Title")}
                                value={newBook.title ?? ""} onChange={e => setNewBook(p => ({ ...p, title: e.target.value }))} />
                        </div>
                        <div className="col-md-4">
                            <input className="form-control form-control-sm" placeholder={t("media.books.author", "Author")}
                                value={newBook.author ?? ""} onChange={e => setNewBook(p => ({ ...p, author: e.target.value }))} />
                        </div>
                        <div className="col-md-2">
                            <input className="form-control form-control-sm" placeholder="ISBN"
                                value={newBook.isbn ?? ""} onChange={e => setNewBook(p => ({ ...p, isbn: e.target.value }))} />
                        </div>
                        <div className="col-12">
                            <textarea className="form-control form-control-sm" rows={2} placeholder={t("media.books.description", "Description")}
                                value={newBook.description ?? ""} onChange={e => setNewBook(p => ({ ...p, description: e.target.value }))} />
                        </div>
                    </div>
                    <button className="btn btn-success btn-sm mt-2" onClick={handleCreate} disabled={createMutation.isPending}>
                        {createMutation.isPending ? t("common.saving", "Saving...") : t("common.save", "Save")}
                    </button>
                </div>
            )}

            {/* Local search */}
            <input className="form-control form-control-sm mb-3" placeholder={t("media.books.search", "Search your books...")}
                value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />

            {/* Books grid */}
            {booksQuery.isLoading && <p className="text-muted">{t("common.loading", "Loading...")}</p>}
            <div className="row g-3 mb-4">
                {filteredBooks.map(book => (
                    <div key={book.id} className="col-md-4 col-lg-3">
                        <div style={{ ...cardStyle, height: "100%", display: "flex", flexDirection: "column" }}>
                            {book.coverUrl && <img src={book.coverUrl} alt={book.title ?? ""} style={{ width: "100%", height: 180, objectFit: "cover", borderRadius: 8, marginBottom: 8 }} />}
                            <strong style={{ fontSize: 14 }}>{book.title}</strong>
                            <small className="text-muted">{book.author}</small>
                            {book.isbn && <small className="text-muted">ISBN: {book.isbn}</small>}
                            <div className="mt-auto pt-2">
                                <button className="btn btn-outline-danger btn-sm" onClick={() => deleteMutation.mutate(book.id)}
                                    disabled={deleteMutation.isPending}>
                                    <i className="fa fa-trash" />
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
                {!booksQuery.isLoading && filteredBooks.length === 0 && (
                    <div className="col-12 text-center text-muted py-4">{t("media.books.empty", "No books yet. Use the lookup above to import from external sources.")}</div>
                )}
            </div>
        </div>
    );
};

export default BooksPage;

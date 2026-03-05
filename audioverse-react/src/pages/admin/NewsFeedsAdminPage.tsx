import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { Focusable } from "../../components/common/Focusable";
import {
    useNewsFeedsQuery,
    useNewsCategoriesQuery,
    useCreateFeedMutation,
    useToggleFeedMutation,
    useDeleteFeedMutation,
    useCreateCategoryMutation,
    useToggleCategoryMutation,
} from "../../scripts/api/apiNews";

const NewsFeedsAdminPage: React.FC = () => {
    const { t } = useTranslation();
    const { data: feeds, isLoading: feedsLoading } = useNewsFeedsQuery();
    const { data: categories, isLoading: catsLoading } = useNewsCategoriesQuery();

    const createFeedMut = useCreateFeedMutation();
    const toggleFeedMut = useToggleFeedMutation();
    const deleteFeedMut = useDeleteFeedMutation();
    const createCatMut = useCreateCategoryMutation();
    const toggleCatMut = useToggleCategoryMutation();

    // ── New Feed form state ───────────────────────────────────────
    const [newFeedName, setNewFeedName] = useState("");
    const [newFeedUrl, setNewFeedUrl] = useState("");
    const [newFeedCatId, setNewFeedCatId] = useState<number | "">("");

    // ── New Category form state ───────────────────────────────────
    const [newCatSlug, setNewCatSlug] = useState("");
    const [newCatName, setNewCatName] = useState("");
    const [newCatDesc, setNewCatDesc] = useState("");

    const handleCreateFeed = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newFeedName || !newFeedUrl || !newFeedCatId) return;
        createFeedMut.mutate(
            { title: newFeedName, feedUrl: newFeedUrl, categoryId: Number(newFeedCatId) },
            {
                onSuccess: () => {
                    setNewFeedName("");
                    setNewFeedUrl("");
                    setNewFeedCatId("");
                },
            },
        );
    };

    const handleCreateCategory = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newCatSlug || !newCatName) return;
        createCatMut.mutate(
            { slug: newCatSlug, name: newCatName, description: newCatDesc || null },
            {
                onSuccess: () => {
                    setNewCatSlug("");
                    setNewCatName("");
                    setNewCatDesc("");
                },
            },
        );
    };

    return (
        <div style={{ maxWidth: 960, margin: "32px auto", padding: "0 16px" }}>
            <h1 style={{ textAlign: "center" }}>
                {t("newsAdmin.title", "News Feeds Management")}
            </h1>

            {/* ═══ Categories section ═══════════════════════════════ */}
            <section className="mt-4">
                <h4>{t("newsAdmin.categories", "Categories")}</h4>

                {catsLoading ? (
                    <p>{t("common.loading", "Loading…")}</p>
                ) : (
                    <div className="table-responsive">
                        <table className="table table-sm table-striped align-middle">
                            <thead>
                                <tr>
                                    <th>{t("newsAdmin.catName", "Name")}</th>
                                    <th>{t("newsAdmin.catSlug", "Slug")}</th>
                                    <th>{t("newsAdmin.catFeeds", "Feeds")}</th>
                                    <th>{t("newsAdmin.catActive", "Active")}</th>
                                    <th></th>
                                </tr>
                            </thead>
                            <tbody>
                                {(categories ?? []).map(cat => (
                                    <tr key={cat.id}>
                                        <td>{cat.name}</td>
                                        <td><code>{cat.slug}</code></td>
                                        <td>{cat.feedCount}</td>
                                        <td>
                                            <span className={`badge ${cat.isActive ? "bg-success" : "bg-secondary"}`}>
                                                {cat.isActive ? t("newsAdmin.yes", "Yes") : t("newsAdmin.no", "No")}
                                            </span>
                                        </td>
                                        <td>
                                            <Focusable id={`toggle-cat-${cat.id}`} highlightMode="glow">
                                                <button
                                                    className="btn btn-outline-warning btn-sm"
                                                    onClick={() => toggleCatMut.mutate(cat.id)}
                                                    disabled={toggleCatMut.isPending}
                                                >
                                                    {t("newsAdmin.toggle", "Toggle")}
                                                </button>
                                            </Focusable>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Add category form */}
                <form onSubmit={handleCreateCategory} className="row g-2 align-items-end mt-2">
                    <div className="col-auto">
                        <label className="form-label form-label-sm">{t("newsAdmin.catSlug", "Slug")}</label>
                        <input className="form-control form-control-sm" value={newCatSlug} onChange={e => setNewCatSlug(e.target.value)} placeholder="e.g. science" required />
                    </div>
                    <div className="col-auto">
                        <label className="form-label form-label-sm">{t("newsAdmin.catName", "Name")}</label>
                        <input className="form-control form-control-sm" value={newCatName} onChange={e => setNewCatName(e.target.value)} placeholder="e.g. Science" required />
                    </div>
                    <div className="col-auto">
                        <label className="form-label form-label-sm">{t("newsAdmin.catDesc", "Description")}</label>
                        <input className="form-control form-control-sm" value={newCatDesc} onChange={e => setNewCatDesc(e.target.value)} placeholder="Optional" />
                    </div>
                    <div className="col-auto">
                        <Focusable id="add-category" highlightMode="glow">
                            <button type="submit" className="btn btn-primary btn-sm" disabled={createCatMut.isPending}>
                                {t("newsAdmin.addCategory", "Add Category")}
                            </button>
                        </Focusable>
                    </div>
                </form>
            </section>

            {/* ═══ Feeds section ════════════════════════════════════ */}
            <section className="mt-5">
                <h4>{t("newsAdmin.feeds", "RSS Feeds")}</h4>

                {feedsLoading ? (
                    <p>{t("common.loading", "Loading…")}</p>
                ) : (
                    <div className="table-responsive">
                        <table className="table table-sm table-striped align-middle">
                            <thead>
                                <tr>
                                    <th>{t("newsAdmin.feedName", "Name")}</th>
                                    <th>{t("newsAdmin.feedUrl", "URL")}</th>
                                    <th>{t("newsAdmin.feedCategory", "Category")}</th>
                                    <th>{t("newsAdmin.feedArticles", "Articles")}</th>
                                    <th>{t("newsAdmin.feedActive", "Active")}</th>
                                    <th>{t("newsAdmin.feedLastFetch", "Last Fetch")}</th>
                                    <th></th>
                                </tr>
                            </thead>
                            <tbody>
                                {(feeds ?? []).map(feed => (
                                    <tr key={feed.id}>
                                        <td>{feed.title}</td>
                                        <td>
                                            <a href={feed.feedUrl} target="_blank" rel="noopener noreferrer" className="text-truncate d-inline-block" style={{ maxWidth: 200 }}>
                                                {feed.feedUrl}
                                            </a>
                                        </td>
                                        <td>{feed.categorySlug}</td>
                                        <td>{feed.articleCount}</td>
                                        <td>
                                            <span className={`badge ${feed.isActive ? "bg-success" : "bg-secondary"}`}>
                                                {feed.isActive ? t("newsAdmin.yes", "Yes") : t("newsAdmin.no", "No")}
                                            </span>
                                        </td>
                                        <td>
                                            {feed.lastFetchedAt
                                                ? new Date(feed.lastFetchedAt).toLocaleString()
                                                : t("newsAdmin.never", "Never")}
                                        </td>
                                        <td className="d-flex gap-1">
                                            <Focusable id={`toggle-feed-${feed.id}`} highlightMode="glow">
                                                <button
                                                    className="btn btn-outline-warning btn-sm"
                                                    onClick={() => toggleFeedMut.mutate(feed.id)}
                                                    disabled={toggleFeedMut.isPending}
                                                >
                                                    {t("newsAdmin.toggle", "Toggle")}
                                                </button>
                                            </Focusable>
                                            <Focusable id={`delete-feed-${feed.id}`} highlightMode="glow">
                                                <button
                                                    className="btn btn-outline-danger btn-sm"
                                                    onClick={() => {
                                                        if (window.confirm(t("newsAdmin.deleteConfirm", "Delete this feed?"))) {
                                                            deleteFeedMut.mutate(feed.id);
                                                        }
                                                    }}
                                                    disabled={deleteFeedMut.isPending}
                                                >
                                                    {t("newsAdmin.delete", "Delete")}
                                                </button>
                                            </Focusable>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Add feed form */}
                <form onSubmit={handleCreateFeed} className="row g-2 align-items-end mt-2">
                    <div className="col-auto">
                        <label className="form-label form-label-sm">{t("newsAdmin.feedName", "Name")}</label>
                        <input className="form-control form-control-sm" value={newFeedName} onChange={e => setNewFeedName(e.target.value)} placeholder="e.g. BBC Sport" required />
                    </div>
                    <div className="col">
                        <label className="form-label form-label-sm">{t("newsAdmin.feedUrl", "URL")}</label>
                        <input className="form-control form-control-sm" value={newFeedUrl} onChange={e => setNewFeedUrl(e.target.value)} placeholder="https://..." type="url" required />
                    </div>
                    <div className="col-auto">
                        <label className="form-label form-label-sm">{t("newsAdmin.feedCategory", "Category")}</label>
                        <select className="form-select form-select-sm" value={newFeedCatId} onChange={e => setNewFeedCatId(e.target.value ? Number(e.target.value) : "")} required>
                            <option value="">{t("newsAdmin.selectCategory", "Select…")}</option>
                            {(categories ?? []).map(cat => (
                                <option key={cat.id} value={cat.id}>{cat.name}</option>
                            ))}
                        </select>
                    </div>
                    <div className="col-auto">
                        <Focusable id="add-feed" highlightMode="glow">
                            <button type="submit" className="btn btn-primary btn-sm" disabled={createFeedMut.isPending}>
                                {t("newsAdmin.addFeed", "Add Feed")}
                            </button>
                        </Focusable>
                    </div>
                </form>
            </section>
        </div>
    );
};

export default NewsFeedsAdminPage;

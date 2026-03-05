import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { Focusable } from "../../components/common/Focusable";
import {
    useMyWishlistsQuery,
    useCreateWishlistMutation,
    useDeleteWishlistMutation,
    useAddWishlistItemMutation,
    useMarkAcquiredMutation,
    useDeleteWishlistItemMutation,
    useSteamSyncMutation,
} from "../../scripts/api/apiWishlists";
import type { WishlistDto } from "../../models/modelsWishlist";

const ITEM_TYPE_LABELS: Record<string, string> = {
    "0": "🎲 Board Game",
    "1": "🎮 Video Game",
    "2": "🎬 Movie",
    "3": "📚 Book",
    "4": "🎵 Music",
    "5": "📺 TV Show",
    "6": "📦 Custom",
};

const PRIORITY_LABELS: Record<string, string> = {
    "0": "Low",
    "1": "Normal",
    "2": "🔥 High",
    "3": "⭐ Must Have",
};

const WishlistsPage: React.FC = () => {
    const { t } = useTranslation();
    const { data: wishlists, isLoading } = useMyWishlistsQuery();
    const createWl = useCreateWishlistMutation();
    const deleteWl = useDeleteWishlistMutation();

    const [newName, setNewName] = useState("");
    const [newPublic, setNewPublic] = useState(false);
    const [expandedId, setExpandedId] = useState<number | null>(null);

    const handleCreate = () => {
        if (!newName.trim()) return;
        createWl.mutate({ name: newName.trim(), isPublic: newPublic });
        setNewName("");
        setNewPublic(false);
    };

    return (
        <div className="container py-4">
            <h2><i className="fa-solid fa-clipboard-list" />{" "}{t("wishlists.title", "My Wishlists")}</h2>
            <p className="text-muted mb-4">
                {t("wishlists.subtitle", "Create and manage your wishlists. Share them publicly or sync with Steam.")}
            </p>

            {/* Create form */}
            <div className="card mb-4">
                <div className="card-body">
                    <h5>{t("wishlists.createNew", "Create New Wishlist")}</h5>
                    <div className="row g-2 align-items-end">
                        <div className="col">
                            <input
                                type="text"
                                className="form-control"
                                placeholder={t("wishlists.namePlaceholder", "Wishlist name")}
                                value={newName}
                                onChange={(e) => setNewName(e.target.value)}
                            />
                        </div>
                        <div className="col-auto">
                            <div className="form-check">
                                <input
                                    className="form-check-input"
                                    type="checkbox"
                                    id="wl-public"
                                    checked={newPublic}
                                    onChange={(e) => setNewPublic(e.target.checked)}
                                />
                                <label className="form-check-label" htmlFor="wl-public">
                                    {t("wishlists.public", "Public")}
                                </label>
                            </div>
                        </div>
                        <div className="col-auto">
                            <Focusable id="wl-create-btn">
                                <button className="btn btn-primary" onClick={handleCreate}>
                                    {t("wishlists.create", "Create")}
                                </button>
                            </Focusable>
                        </div>
                    </div>
                </div>
            </div>

            {isLoading ? (
                <div className="text-center py-5">
                    <div className="spinner-border" />
                </div>
            ) : (wishlists ?? []).length === 0 ? (
                <p className="text-muted">{t("wishlists.empty", "No wishlists yet.")}</p>
            ) : (
                <div className="row g-3">
                    {(wishlists ?? []).map((wl) => (
                        <div key={wl.id} className="col-12">
                            <div className="card">
                                <div className="card-header d-flex justify-content-between align-items-center">
                                    <Focusable id={`wl-expand-${wl.id}`}>
                                        <button
                                            className="btn btn-link text-decoration-none p-0"
                                            onClick={() =>
                                                setExpandedId(expandedId === wl.id ? null : wl.id)
                                            }
                                        >
                                            <strong>{wl.name}</strong>
                                            <span className="ms-2 badge bg-secondary">
                                                {wl.items.length} items
                                            </span>
                                            {wl.isPublic && (
                                                <span className="ms-2 badge bg-success">Public</span>
                                            )}
                                        </button>
                                    </Focusable>
                                    <div className="d-flex gap-2">
                                        {wl.shareToken && (
                                            <Focusable id={`wl-share-${wl.id}`}>
                                                <button
                                                    className="btn btn-sm btn-outline-info"
                                                    onClick={() =>
                                                        navigator.clipboard.writeText(
                                                            `${window.location.origin}/wishlists/shared/${wl.shareToken}`,
                                                        )
                                                    }
                                                    title={t("wishlists.copyLink", "Copy share link")}
                                                >
                                                    🔗
                                                </button>
                                            </Focusable>
                                        )}
                                        <Focusable id={`wl-delete-${wl.id}`}>
                                            <button
                                                className="btn btn-sm btn-outline-danger"
                                                onClick={() => deleteWl.mutate(wl.id)}
                                            >
                                                <i className="fa-solid fa-trash" />
                                            </button>
                                        </Focusable>
                                    </div>
                                </div>
                                {expandedId === wl.id && (
                                    <WishlistDetail wishlist={wl} />
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

/** Expanded wishlist detail — items + add form + Steam sync */
const WishlistDetail: React.FC<{ wishlist: WishlistDto }> = ({ wishlist }) => {
    const { t } = useTranslation();
    const addItem = useAddWishlistItemMutation(wishlist.id);
    const markAcquired = useMarkAcquiredMutation(wishlist.id);
    const deleteItem = useDeleteWishlistItemMutation(wishlist.id);
    const steamSync = useSteamSyncMutation(wishlist.id);

    const [itemName, setItemName] = useState("");
    const [itemType, setItemType] = useState(1); // VideoGame
    const [itemPriority, setItemPriority] = useState(1); // Normal
    const [steamId, setSteamId] = useState("");

    const handleAddItem = () => {
        if (!itemName.trim()) return;
        addItem.mutate({ itemType, name: itemName.trim(), priority: itemPriority });
        setItemName("");
    };

    const handleSteamSync = () => {
        if (!steamId.trim()) return;
        steamSync.mutate(steamId.trim());
        setSteamId("");
    };

    return (
        <div className="card-body">
            {/* Items table */}
            {wishlist.items.length > 0 && (
                <div className="table-responsive mb-3">
                    <table className="table table-sm">
                        <thead>
                            <tr>
                                <th>{t("wishlists.itemName", "Name")}</th>
                                <th>{t("wishlists.type", "Type")}</th>
                                <th>{t("wishlists.priority", "Priority")}</th>
                                <th>{t("wishlists.status", "Status")}</th>
                                <th></th>
                            </tr>
                        </thead>
                        <tbody>
                            {wishlist.items.map((item) => (
                                <tr key={item.id} className={item.isAcquired ? "table-success" : ""}>
                                    <td>
                                        {item.externalUrl ? (
                                            <a href={item.externalUrl} target="_blank" rel="noopener noreferrer">
                                                {item.name}
                                            </a>
                                        ) : (
                                            item.name
                                        )}
                                    </td>
                                    <td>
                                        <small>{ITEM_TYPE_LABELS[String(item.itemType)] ?? "?"}</small>
                                    </td>
                                    <td>
                                        <small>{PRIORITY_LABELS[String(item.priority)] ?? "?"}</small>
                                    </td>
                                    <td>
                                        {item.isAcquired ? (
                                            <span className="badge bg-success"><i className="fa-solid fa-check" />{" "}Acquired</span>
                                        ) : (
                                            <Focusable id={`wl-acquire-${item.id}`}>
                                                <button
                                                    className="btn btn-sm btn-outline-success"
                                                    onClick={() => markAcquired.mutate(item.id)}
                                                >
                                                    {t("wishlists.markAcquired", "Mark Acquired")}
                                                </button>
                                            </Focusable>
                                        )}
                                    </td>
                                    <td>
                                        <Focusable id={`wl-delete-item-${item.id}`}>
                                            <button
                                                className="btn btn-sm btn-outline-danger"
                                                onClick={() => deleteItem.mutate(item.id)}
                                            >
                                                ✕
                                            </button>
                                        </Focusable>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Add item */}
            <div className="row g-2 align-items-end mb-3">
                <div className="col">
                    <input
                        type="text"
                        className="form-control form-control-sm"
                        placeholder={t("wishlists.addItemPlaceholder", "Item name")}
                        value={itemName}
                        onChange={(e) => setItemName(e.target.value)}
                    />
                </div>
                <div className="col-auto">
                    <select
                        className="form-select form-select-sm"
                        value={itemType}
                        onChange={(e) => setItemType(Number(e.target.value))}
                    >
                        {Object.entries(ITEM_TYPE_LABELS).map(([val, label]) => (
                            <option key={val} value={val}>{label}</option>
                        ))}
                    </select>
                </div>
                <div className="col-auto">
                    <select
                        className="form-select form-select-sm"
                        value={itemPriority}
                        onChange={(e) => setItemPriority(Number(e.target.value))}
                    >
                        {Object.entries(PRIORITY_LABELS).map(([val, label]) => (
                            <option key={val} value={val}>{label}</option>
                        ))}
                    </select>
                </div>
                <div className="col-auto">
                    <Focusable id="wl-add-item-btn">
                        <button className="btn btn-primary btn-sm" onClick={handleAddItem}>
                            + {t("wishlists.addItem", "Add")}
                        </button>
                    </Focusable>
                </div>
            </div>

            {/* Steam sync */}
            <div className="border-top pt-3">
                <h6><i className="fa-solid fa-gamepad" />{" "}{t("wishlists.steamSync", "Steam Sync")}</h6>
                <div className="row g-2 align-items-end">
                    <div className="col">
                        <input
                            type="text"
                            className="form-control form-control-sm"
                            placeholder={t("wishlists.steamIdPlaceholder", "Steam ID (e.g. 76561198...)")}
                            value={steamId}
                            onChange={(e) => setSteamId(e.target.value)}
                        />
                    </div>
                    <div className="col-auto">
                        <Focusable id="wl-steam-sync-btn">
                            <button
                                className="btn btn-outline-primary btn-sm"
                                onClick={handleSteamSync}
                                disabled={steamSync.isPending}
                            >
                                {steamSync.isPending ? "Syncing..." : t("wishlists.syncNow", "Sync Now")}
                            </button>
                        </Focusable>
                    </div>
                </div>
                {wishlist.lastSyncUtc && (
                    <small className="text-muted">
                        {t("wishlists.lastSync", "Last sync")}: {new Date(wishlist.lastSyncUtc).toLocaleString()}
                    </small>
                )}
            </div>
        </div>
    );
};

export default WishlistsPage;

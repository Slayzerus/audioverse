import React from "react";
import { useTranslation } from "react-i18next";
import { useParams } from "react-router-dom";
import { useSharedWishlistQuery } from "../../scripts/api/apiWishlists";

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

const SharedWishlistPage: React.FC = () => {
    const { token } = useParams<{ token: string }>();
    const { t } = useTranslation();
    const { data: wishlist, isLoading, isError } = useSharedWishlistQuery(token ?? "");

    if (isLoading) {
        return (
            <div className="container py-5 text-center">
                <div className="spinner-border" />
            </div>
        );
    }

    if (isError || !wishlist) {
        return (
            <div className="container py-4">
                <h2>{t("wishlists.shared", "Shared Wishlist")}</h2>
                <p className="text-muted">
                    {t("wishlists.notFound", "Wishlist not found or link has expired.")}
                </p>
            </div>
        );
    }

    return (
        <div className="container py-4">
            <h2>📋 {wishlist.name}</h2>
            {wishlist.description && <p className="text-muted">{wishlist.description}</p>}

            {wishlist.items.length === 0 ? (
                <p className="text-muted">{t("wishlists.emptyList", "This wishlist is empty.")}</p>
            ) : (
                <div className="table-responsive">
                    <table className="table">
                        <thead>
                            <tr>
                                <th>{t("wishlists.itemName", "Name")}</th>
                                <th>{t("wishlists.type", "Type")}</th>
                                <th>{t("wishlists.priority", "Priority")}</th>
                                <th>{t("wishlists.status", "Status")}</th>
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
                                        {item.description && (
                                            <small className="d-block text-muted">{item.description}</small>
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
                                            <span className="badge bg-success">✅ Acquired</span>
                                        ) : (
                                            <span className="badge bg-secondary">Wanted</span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default SharedWishlistPage;

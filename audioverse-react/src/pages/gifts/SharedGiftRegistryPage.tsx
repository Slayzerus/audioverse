import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { useParams } from "react-router-dom";
import { Focusable } from "../../components/common/Focusable";
import {
    useSharedRegistryQuery,
    useContributeMutation,
} from "../../scripts/api/apiGiftRegistry";
import type { GiftItemDto } from "../../models/modelsGiftRegistry";

const SharedGiftRegistryPage: React.FC = () => {
    const { token } = useParams<{ token: string }>();
    const { t } = useTranslation();
    const { data: registry, isLoading, isError } = useSharedRegistryQuery(token ?? "");

    if (isLoading) {
        return (
            <div className="container py-5 text-center">
                <div className="spinner-border" />
            </div>
        );
    }

    if (isError || !registry) {
        return (
            <div className="container py-4">
                <h2>🎁 {t("gifts.shared", "Shared Gift Registry")}</h2>
                <p className="text-muted">
                    {t("gifts.notFound", "Gift registry not found or link has expired.")}
                </p>
            </div>
        );
    }

    return (
        <div className="container py-4">
            <h2>🎁 {registry.name}</h2>
            {registry.description && <p className="text-muted">{registry.description}</p>}

            {!registry.isActive && (
                <div className="alert alert-warning">
                    {t("gifts.closed", "This gift registry is currently closed for contributions.")}
                </div>
            )}

            {registry.items.length === 0 ? (
                <p className="text-muted">{t("gifts.emptyGifts", "No gifts in this registry yet.")}</p>
            ) : (
                <div className="row g-3">
                    {registry.items.map((item) => (
                        <div key={item.id} className="col-12 col-md-6">
                            <SharedGiftItemCard item={item} isActive={registry.isActive} />
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

/** Public gift item card with contribute form */
const SharedGiftItemCard: React.FC<{ item: GiftItemDto; isActive: boolean }> = ({
    item,
    isActive,
}) => {
    const { t } = useTranslation();
    const contributeMut = useContributeMutation();

    const [showForm, setShowForm] = useState(false);
    const [guestName, setGuestName] = useState("");
    const [amount, setAmount] = useState("");
    const [message, setMessage] = useState("");
    const [isAnonymous, setIsAnonymous] = useState(false);

    const progress =
        item.targetAmount && item.targetAmount > 0
            ? Math.min(100, (item.currentAmount / item.targetAmount) * 100)
            : item.maxContributors && item.maxContributors > 0
              ? Math.min(100, (item.currentContributors / item.maxContributors) * 100)
              : 0;

    const handleContribute = () => {
        if (!guestName.trim() && !isAnonymous) return;
        contributeMut.mutate(
            {
                itemId: item.id,
                body: {
                    guestName: isAnonymous ? "Anonymous" : guestName.trim(),
                    amount: amount ? Number(amount) : undefined,
                    message: message.trim() || undefined,
                    isAnonymous,
                },
            },
            {
                onSuccess: () => {
                    setShowForm(false);
                    setGuestName("");
                    setAmount("");
                    setMessage("");
                },
            },
        );
    };

    return (
        <div className="card h-100">
            <div className="card-body">
                <div className="d-flex justify-content-between align-items-start mb-2">
                    <div>
                        <h5 className="mb-1">{item.name}</h5>
                        {item.description && (
                            <p className="small text-muted">{item.description}</p>
                        )}
                    </div>
                    {item.isFullyReserved && (
                        <span className="badge bg-success">✅ {t("gifts.fullyReserved", "Fully Reserved")}</span>
                    )}
                </div>

                {item.externalUrl && (
                    <a
                        href={item.externalUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-sm btn-outline-secondary mb-2"
                    >
                        🔗 {t("gifts.viewProduct", "View Product")}
                    </a>
                )}

                {/* Progress */}
                {(item.targetAmount || item.maxContributors) && (
                    <div className="mb-3">
                        <div className="progress" style={{ height: 8 }}>
                            <div
                                className="progress-bar bg-success"
                                style={{ width: `${progress}%` }}
                            />
                        </div>
                        <small className="text-muted">
                            {item.targetAmount
                                ? `${item.currentAmount} / ${item.targetAmount} ${item.currency ?? ""}`
                                : `${item.currentContributors} / ${item.maxContributors} ${t("gifts.contributors", "contributors")}`}
                        </small>
                    </div>
                )}

                {/* Contribute button */}
                {isActive && !item.isFullyReserved && !showForm && (
                    <Focusable id={`shared-gift-contribute-${item.id}`}>
                        <button
                            className="btn btn-primary btn-sm"
                            onClick={() => setShowForm(true)}
                        >
                            🎁 {t("gifts.contribute", "Contribute")}
                        </button>
                    </Focusable>
                )}

                {/* Contribute form */}
                {showForm && (
                    <div className="border rounded p-3 mt-2">
                        <div className="mb-2">
                            <input
                                type="text"
                                className="form-control form-control-sm"
                                placeholder={t("gifts.yourName", "Your name")}
                                value={guestName}
                                onChange={(e) => setGuestName(e.target.value)}
                                disabled={isAnonymous}
                            />
                        </div>
                        {item.targetAmount && (
                            <div className="mb-2">
                                <input
                                    type="number"
                                    className="form-control form-control-sm"
                                    placeholder={t("gifts.amountPlaceholder", "Amount (optional)")}
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                />
                            </div>
                        )}
                        <div className="mb-2">
                            <input
                                type="text"
                                className="form-control form-control-sm"
                                placeholder={t("gifts.messagePlaceholder", "Message (optional)")}
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                            />
                        </div>
                        <div className="form-check mb-2">
                            <input
                                className="form-check-input"
                                type="checkbox"
                                id={`anon-${item.id}`}
                                checked={isAnonymous}
                                onChange={(e) => setIsAnonymous(e.target.checked)}
                            />
                            <label className="form-check-label" htmlFor={`anon-${item.id}`}>
                                {t("gifts.anonymous", "Contribute anonymously")}
                            </label>
                        </div>
                        <div className="d-flex gap-2">
                            <Focusable id={`shared-gift-confirm-${item.id}`}>
                                <button
                                    className="btn btn-success btn-sm"
                                    onClick={handleContribute}
                                    disabled={contributeMut.isPending}
                                >
                                    {contributeMut.isPending
                                        ? t("common.loading", "Loading…")
                                        : t("gifts.confirmContribute", "Confirm")}
                                </button>
                            </Focusable>
                            <Focusable id={`shared-gift-cancel-${item.id}`}>
                                <button
                                    className="btn btn-outline-secondary btn-sm"
                                    onClick={() => setShowForm(false)}
                                >
                                    {t("common.cancel", "Cancel")}
                                </button>
                            </Focusable>
                        </div>
                    </div>
                )}

                {/* Existing contributions */}
                {item.contributions.length > 0 && (
                    <div className="mt-2">
                        <small className="text-muted fw-bold">
                            {t("gifts.contributionsList", "Contributions:")}
                        </small>
                        {item.contributions.map((c) => (
                            <small key={c.id} className="d-block text-muted">
                                {c.isAnonymous ? t("gifts.anonymousName", "Anonymous") : c.guestName}
                                {c.amount ? ` — ${c.amount} ${item.currency ?? ""}` : ""}
                                {c.message ? ` "${c.message}"` : ""}
                            </small>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default SharedGiftRegistryPage;

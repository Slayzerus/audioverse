import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { Focusable } from "../../components/common/Focusable";
import {
    useMyRegistriesQuery,
    useCreateRegistryMutation,
    useDeleteRegistryMutation,
    useToggleRegistryMutation,
    useAddGiftItemMutation,
    useDeleteGiftItemMutation,
} from "../../scripts/api/apiGiftRegistry";
import type { GiftRegistryDto, GiftItemDto } from "../../models/modelsGiftRegistry";

const GiftRegistryPage: React.FC = () => {
    const { t } = useTranslation();
    const { data: registries, isLoading } = useMyRegistriesQuery();
    const createReg = useCreateRegistryMutation();
    const deleteReg = useDeleteRegistryMutation();
    const toggleReg = useToggleRegistryMutation();

    const [newName, setNewName] = useState("");
    const [newDesc, setNewDesc] = useState("");
    const [expandedId, setExpandedId] = useState<number | null>(null);

    const handleCreate = () => {
        if (!newName.trim()) return;
        createReg.mutate({
            name: newName.trim(),
            description: newDesc.trim() || undefined,
        });
        setNewName("");
        setNewDesc("");
    };

    return (
        <div className="container py-4">
            <h2>🎁 {t("gifts.title", "Gift Registry")}</h2>
            <p className="text-muted mb-4">
                {t("gifts.subtitle", "Create gift lists for events. Share them so guests can contribute to group gifts.")}
            </p>

            {/* Create form */}
            <div className="card mb-4">
                <div className="card-body">
                    <h5>{t("gifts.createNew", "New Gift Registry")}</h5>
                    <div className="row g-2 align-items-end">
                        <div className="col-12 col-md-5">
                            <input
                                type="text"
                                className="form-control"
                                placeholder={t("gifts.namePlaceholder", "e.g. Wedding Gift List")}
                                value={newName}
                                onChange={(e) => setNewName(e.target.value)}
                            />
                        </div>
                        <div className="col-12 col-md-5">
                            <input
                                type="text"
                                className="form-control"
                                placeholder={t("gifts.descPlaceholder", "Description (optional)")}
                                value={newDesc}
                                onChange={(e) => setNewDesc(e.target.value)}
                            />
                        </div>
                        <div className="col-auto">
                            <Focusable id="gift-create-btn">
                                <button className="btn btn-primary" onClick={handleCreate}>
                                    {t("gifts.create", "Create")}
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
            ) : (registries ?? []).length === 0 ? (
                <p className="text-muted">{t("gifts.empty", "No gift registries yet.")}</p>
            ) : (
                <div className="row g-3">
                    {(registries ?? []).map((reg) => (
                        <div key={reg.id} className="col-12">
                            <div className="card">
                                <div className="card-header d-flex justify-content-between align-items-center">
                                    <Focusable id={`gift-expand-${reg.id}`}>
                                        <button
                                            className="btn btn-link text-decoration-none p-0"
                                            onClick={() =>
                                                setExpandedId(expandedId === reg.id ? null : reg.id)
                                            }
                                        >
                                            <strong>{reg.name}</strong>
                                            <span className="ms-2 badge bg-secondary">
                                                {reg.items.length} gifts
                                            </span>
                                            {!reg.isActive && (
                                                <span className="ms-2 badge bg-warning text-dark">
                                                    Closed
                                                </span>
                                            )}
                                        </button>
                                    </Focusable>
                                    <div className="d-flex gap-2">
                                        {reg.shareToken && (
                                            <Focusable id={`gift-share-${reg.id}`}>
                                                <button
                                                    className="btn btn-sm btn-outline-info"
                                                    onClick={() =>
                                                        navigator.clipboard.writeText(
                                                            `${window.location.origin}/gifts/shared/${reg.shareToken}`,
                                                        )
                                                    }
                                                    title={t("gifts.copyLink", "Copy share link")}
                                                >
                                                    🔗
                                                </button>
                                            </Focusable>
                                        )}
                                        <Focusable id={`gift-toggle-${reg.id}`}>
                                            <button
                                                className={`btn btn-sm ${reg.isActive ? "btn-outline-warning" : "btn-outline-success"}`}
                                                onClick={() => toggleReg.mutate(reg.id)}
                                            >
                                                {reg.isActive ? "🔒 Close" : "🔓 Open"}
                                            </button>
                                        </Focusable>
                                        <Focusable id={`gift-delete-${reg.id}`}>
                                            <button
                                                className="btn btn-sm btn-outline-danger"
                                                onClick={() => deleteReg.mutate(reg.id)}
                                            >
                                                🗑️
                                            </button>
                                        </Focusable>
                                    </div>
                                </div>
                                {expandedId === reg.id && (
                                    <GiftRegistryDetail registry={reg} />
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

/** Expanded registry detail — items + add form */
const GiftRegistryDetail: React.FC<{ registry: GiftRegistryDto }> = ({ registry }) => {
    const { t } = useTranslation();
    const addItem = useAddGiftItemMutation();
    const deleteItem = useDeleteGiftItemMutation();

    const [giftName, setGiftName] = useState("");
    const [targetAmount, setTargetAmount] = useState("");
    const [currency, setCurrency] = useState("PLN");
    const [maxContributors, setMaxContributors] = useState("");

    const handleAdd = () => {
        if (!giftName.trim()) return;
        addItem.mutate({
            registryId: registry.id,
            body: {
                name: giftName.trim(),
                targetAmount: targetAmount ? Number(targetAmount) : undefined,
                currency: currency || undefined,
                maxContributors: maxContributors ? Number(maxContributors) : undefined,
            },
        });
        setGiftName("");
        setTargetAmount("");
        setMaxContributors("");
    };

    return (
        <div className="card-body">
            {registry.description && (
                <p className="text-muted">{registry.description}</p>
            )}

            {/* Gift items */}
            {registry.items.length > 0 && (
                <div className="mb-3">
                    {registry.items.map((item) => (
                        <GiftItemCard
                            key={item.id}
                            item={item}
                            registryId={registry.id}
                            onDelete={() => deleteItem.mutate({ registryId: registry.id, itemId: item.id })}
                        />
                    ))}
                </div>
            )}

            {/* Add gift form */}
            <div className="border-top pt-3">
                <h6>{t("gifts.addGift", "Add Gift")}</h6>
                <div className="row g-2 align-items-end">
                    <div className="col">
                        <input
                            type="text"
                            className="form-control form-control-sm"
                            placeholder={t("gifts.giftNamePlaceholder", "Gift name")}
                            value={giftName}
                            onChange={(e) => setGiftName(e.target.value)}
                        />
                    </div>
                    <div className="col-auto" style={{ width: 120 }}>
                        <input
                            type="number"
                            className="form-control form-control-sm"
                            placeholder={t("gifts.targetAmount", "Amount")}
                            value={targetAmount}
                            onChange={(e) => setTargetAmount(e.target.value)}
                        />
                    </div>
                    <div className="col-auto" style={{ width: 80 }}>
                        <select
                            className="form-select form-select-sm"
                            value={currency}
                            onChange={(e) => setCurrency(e.target.value)}
                        >
                            <option>PLN</option>
                            <option>EUR</option>
                            <option>USD</option>
                            <option>GBP</option>
                        </select>
                    </div>
                    <div className="col-auto" style={{ width: 100 }}>
                        <input
                            type="number"
                            className="form-control form-control-sm"
                            placeholder={t("gifts.maxPeople", "Max people")}
                            value={maxContributors}
                            onChange={(e) => setMaxContributors(e.target.value)}
                        />
                    </div>
                    <div className="col-auto">
                        <Focusable id="gift-add-item-btn">
                            <button className="btn btn-primary btn-sm" onClick={handleAdd}>
                                + {t("gifts.add", "Add")}
                            </button>
                        </Focusable>
                    </div>
                </div>
            </div>
        </div>
    );
};

/** Individual gift item card with progress */
const GiftItemCard: React.FC<{
    item: GiftItemDto;
    registryId: number;
    onDelete: () => void;
}> = ({ item, onDelete }) => {
    const progress =
        item.targetAmount && item.targetAmount > 0
            ? Math.min(100, (item.currentAmount / item.targetAmount) * 100)
            : item.maxContributors && item.maxContributors > 0
              ? Math.min(100, (item.currentContributors / item.maxContributors) * 100)
              : 0;

    return (
        <div className="border rounded p-3 mb-2">
            <div className="d-flex justify-content-between align-items-start">
                <div>
                    <strong>{item.name}</strong>
                    {item.description && (
                        <small className="d-block text-muted">{item.description}</small>
                    )}
                </div>
                <div className="d-flex gap-2 align-items-center">
                    {item.isFullyReserved && (
                        <span className="badge bg-success">✅ Fully Reserved</span>
                    )}
                    <Focusable id={`gift-item-delete-${item.id}`}>
                        <button className="btn btn-sm btn-outline-danger" onClick={onDelete}>
                            ✕
                        </button>
                    </Focusable>
                </div>
            </div>
            {/* Progress bar */}
            {(item.targetAmount || item.maxContributors) && (
                <div className="mt-2">
                    <div className="progress" style={{ height: 8 }}>
                        <div
                            className="progress-bar bg-success"
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                    <small className="text-muted">
                        {item.targetAmount
                            ? `${item.currentAmount} / ${item.targetAmount} ${item.currency ?? ""}`
                            : `${item.currentContributors} / ${item.maxContributors} contributors`}
                    </small>
                </div>
            )}
            {/* Contributions list */}
            {item.contributions.length > 0 && (
                <div className="mt-2">
                    {item.contributions.map((c) => (
                        <small key={c.id} className="d-block text-muted">
                            {c.isAnonymous ? "Anonymous" : c.guestName}
                            {c.amount ? ` — ${c.amount} ${item.currency ?? ""}` : ""}
                            {c.message ? ` "${c.message}"` : ""}
                        </small>
                    ))}
                </div>
            )}
        </div>
    );
};

export default GiftRegistryPage;

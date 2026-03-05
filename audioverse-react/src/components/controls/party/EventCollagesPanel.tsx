// EventCollagesPanel.tsx — Collages gallery + simple editor for the Photos/Media tab
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import {
    useCollagesQuery,
    useCollageQuery,
    useCreateCollageMutation,
    useDeleteCollageMutation,
    useAddCollageItemMutation,
    type EventCollage,
} from "../../../scripts/api/apiEventCollages";

interface Props {
    eventId: number;
}

const cardStyle: React.CSSProperties = {
    background: "var(--card-bg, #23272f)",
    border: "1px solid var(--border-color, #333)",
    borderRadius: 10,
    padding: 14,
    marginBottom: 10,
};

const EventCollagesPanel: React.FC<Props> = ({ eventId }) => {
    const { t } = useTranslation();
    const [showCreate, setShowCreate] = useState(false);
    const [newCollage, setNewCollage] = useState<Partial<EventCollage>>({});
    const [selectedId, setSelectedId] = useState<number | null>(null);

    const collagesQ = useCollagesQuery(eventId);
    const selectedQ = useCollageQuery(eventId, selectedId ?? 0);
    const createCollage = useCreateCollageMutation();
    const deleteCollage = useDeleteCollageMutation();
    const addItem = useAddCollageItemMutation();

    const handleCreate = async () => {
        if (!newCollage.name?.trim()) return;
        await createCollage.mutateAsync({ eventId, collage: newCollage });
        setNewCollage({});
        setShowCreate(false);
    };

    const handleAddItem = async (photoId?: number, videoId?: number) => {
        if (!selectedId) return;
        await addItem.mutateAsync({
            eventId,
            collageId: selectedId,
            item: { photoId, videoId, x: Math.random() * 400, y: Math.random() * 300, z: 0, width: 200, height: 150, rotation: 0 },
        });
    };

    return (
        <div>
            <div className="d-flex justify-content-between align-items-center mb-2">
                <h6 className="mb-0"><i className="fa fa-th-large me-1" />{t("collages.title", "Collages")}</h6>
                <button className="btn btn-outline-primary btn-sm" onClick={() => setShowCreate(s => !s)}>
                    <i className="fa fa-plus me-1" />{t("common.add", "Add")}
                </button>
            </div>

            {showCreate && (
                <div style={cardStyle}>
                    <div className="row g-2">
                        <div className="col-md-5">
                            <input className="form-control form-control-sm" placeholder={t("collages.name", "Collage name")}
                                value={newCollage.name ?? ""} onChange={e => setNewCollage(p => ({ ...p, name: e.target.value }))} />
                        </div>
                        <div className="col-md-5">
                            <input className="form-control form-control-sm" placeholder={t("collages.description", "Description")}
                                value={newCollage.description ?? ""} onChange={e => setNewCollage(p => ({ ...p, description: e.target.value }))} />
                        </div>
                        <div className="col-md-2">
                            <button className="btn btn-success btn-sm w-100" onClick={handleCreate} disabled={createCollage.isPending}>
                                {t("common.save", "Save")}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Collages grid */}
            {collagesQ.isLoading && <p className="text-muted small">{t("common.loading", "Loading...")}</p>}
            <div className="row g-2 mb-3">
                {(collagesQ.data ?? []).map(collage => (
                    <div key={collage.id} className="col-md-4 col-lg-3">
                        <div style={{ ...cardStyle, cursor: "pointer", border: selectedId === collage.id ? "2px solid var(--accent, #5865F2)" : undefined }}
                            onClick={() => setSelectedId(selectedId === collage.id ? null : collage.id)}>
                            <div className="d-flex justify-content-between align-items-start">
                                <div>
                                    <strong style={{ fontSize: 14 }}>{collage.name}</strong>
                                    {collage.description && <div className="text-muted" style={{ fontSize: 12 }}>{collage.description}</div>}
                                    <div className="text-muted" style={{ fontSize: 11 }}>
                                        {collage.items?.length ?? 0} {t("collages.items", "items")}
                                    </div>
                                </div>
                                <button className="btn btn-outline-danger btn-sm" onClick={e => { e.stopPropagation(); deleteCollage.mutate({ eventId, id: collage.id }); }}>
                                    <i className="fa fa-trash" />
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
                {!collagesQ.isLoading && (collagesQ.data ?? []).length === 0 && (
                    <div className="col-12 text-muted text-center py-3">{t("collages.empty", "No collages yet.")}</div>
                )}
            </div>

            {/* Selected collage detail — canvas-like layout */}
            {selectedId != null && selectedQ.data && (
                <div style={{ ...cardStyle, minHeight: 300 }}>
                    <div className="d-flex justify-content-between align-items-center mb-2">
                        <h6 className="mb-0">{selectedQ.data.name}</h6>
                        <div className="d-flex gap-1">
                            <button className="btn btn-outline-success btn-sm" onClick={() => handleAddItem(1)} title={t("collages.addPhoto", "Add photo")}>
                                <i className="fa fa-image me-1" />{t("collages.addPhoto", "Add photo")}
                            </button>
                            <button className="btn btn-outline-info btn-sm" onClick={() => handleAddItem(undefined, 1)} title={t("collages.addVideo", "Add video")}>
                                <i className="fa fa-video me-1" />{t("collages.addVideo", "Add video")}
                            </button>
                        </div>
                    </div>

                    {/* Simple canvas visualization */}
                    <div style={{ position: "relative", width: "100%", height: 400, background: "rgba(0,0,0,0.3)", borderRadius: 8, overflow: "hidden" }}>
                        {(selectedQ.data.items ?? []).map(item => (
                            <div key={item.id} style={{
                                position: "absolute",
                                left: item.x,
                                top: item.y,
                                width: item.width,
                                height: item.height,
                                transform: `rotate(${item.rotation}deg)`,
                                background: "var(--accent, #5865F2)",
                                opacity: 0.7,
                                borderRadius: 6,
                                border: "2px solid rgba(255,255,255,0.3)",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                color: "#fff",
                                fontSize: 12,
                                zIndex: item.z,
                            }}>
                                {item.photoId ? `📷 #${item.photoId}` : `🎥 #${item.videoId}`}
                            </div>
                        ))}
                        {(selectedQ.data.items ?? []).length === 0 && (
                            <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                                <span className="text-muted">{t("collages.canvasEmpty", "Click 'Add photo' or 'Add video' to start composing")}</span>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default React.memo(EventCollagesPanel);

// EventPhotosPanel.tsx — Photo gallery for an event with upload, delete & PhotoEditor
import React, { useState, useRef, useCallback } from "react";
import { useTranslation } from "react-i18next";
import {
    useEventPhotosQuery,
    useUploadEventPhotoMutation,
    useDeleteEventPhotoMutation,
    useTogglePhotoLikeMutation,
} from "../../../scripts/api/apiEventPhotos";
import type { EventPhoto } from "../../../models/modelsKaraoke";
import { API_ROOT } from "../../../config/apiConfig";
import PhotoEditor from "../../forms/PhotoEditor";

interface Props {
    eventId: number;
}

const EventPhotosPanel: React.FC<Props> = ({ eventId }) => {
    const { t } = useTranslation();
    const { data: photosResponse, isLoading } = useEventPhotosQuery(eventId);
    const photos = photosResponse?.items ?? [];
    const uploadMutation = useUploadEventPhotoMutation(eventId);
    const deleteMutation = useDeleteEventPhotoMutation(eventId);
    const likeMutation = useTogglePhotoLikeMutation(eventId);
    const fileRef = useRef<HTMLInputElement>(null);

    const [selectedPhoto, setSelectedPhoto] = useState<EventPhoto | null>(null);
    const [caption, setCaption] = useState("");

    // ── PhotoEditor integration ──
    const [editorOpen, setEditorOpen] = useState(false);
    const [editorSrc, setEditorSrc] = useState<File | string | null>(null);
    const [editorInitialState, setEditorInitialState] = useState<string | null>(null);
    const [editingPhotoId, setEditingPhotoId] = useState<number | null>(null);

    /** Open PhotoEditor for a newly picked file */
    const handleFileSelect = useCallback(() => {
        const file = fileRef.current?.files?.[0];
        if (!file) return;
        setEditorSrc(file);
        setEditorInitialState(null);
        setEditingPhotoId(null);
        setEditorOpen(true);
    }, []);

    /** Open PhotoEditor for an existing photo (re-edit) */
    const handleEditExisting = useCallback((photo: EventPhoto) => {
        const url = `${API_ROOT}/api/events/${eventId}/photos/${photo.id}/file`;
        setEditorSrc(url);
        setEditorInitialState(photo.filtersJson ?? null);
        setEditingPhotoId(photo.id);
        setSelectedPhoto(null);
        setEditorOpen(true);
    }, [eventId]);

    /** Called by PhotoEditor when user saves the edited photo */
    const handleEditorSave = useCallback(
        (file: File, editorStateJson?: string) => {
            const formData = new FormData();
            formData.append("file", file);
            if (caption) formData.append("caption", caption);
            if (editorStateJson) formData.append("filtersJson", editorStateJson);
            if (editingPhotoId != null) formData.append("originalId", String(editingPhotoId));
            uploadMutation.mutate(formData, {
                onSuccess: () => {
                    setCaption("");
                    if (fileRef.current) fileRef.current.value = "";
                    setEditorOpen(false);
                    setEditorSrc(null);
                },
            });
        },
        [caption, editingPhotoId, uploadMutation],
    );

    const handleDelete = useCallback(
        (photoId: number) => {
            if (window.confirm(t("eventPhotos.confirmDelete", "Delete this photo?"))) {
                deleteMutation.mutate(photoId);
                if (selectedPhoto?.id === photoId) setSelectedPhoto(null);
            }
        },
        [deleteMutation, selectedPhoto, t],
    );

    const handleLike = useCallback(
        (photoId: number) => {
            likeMutation.mutate(photoId);
        },
        [likeMutation],
    );

    const photoUrl = (photo: EventPhoto) =>
        photo.objectKey
            ? `${API_ROOT}/api/events/${eventId}/photos/${photo.id}/file`
            : "";

    const containerStyle: React.CSSProperties = {
        padding: "16px",
    };

    const gridStyle: React.CSSProperties = {
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
        gap: "12px",
        marginTop: "16px",
    };

    const cardStyle: React.CSSProperties = {
        borderRadius: "8px",
        overflow: "hidden",
        boxShadow: "0 1px 4px rgba(0,0,0,0.15)",
        cursor: "pointer",
        position: "relative",
        backgroundColor: "var(--bs-body-bg, #fff)",
    };

    const imgStyle: React.CSSProperties = {
        width: "100%",
        height: "160px",
        objectFit: "cover",
    };

    const uploadBarStyle: React.CSSProperties = {
        display: "flex",
        gap: "8px",
        alignItems: "center",
        flexWrap: "wrap",
    };

    // ── PhotoEditor fullscreen overlay ──
    if (editorOpen && editorSrc) {
        return (
            <div style={{
                position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
                zIndex: 10000, background: "#000",
            }}>
                <PhotoEditor
                    src={editorSrc}
                    onSave={handleEditorSave}
                    onCancel={() => { setEditorOpen(false); setEditorSrc(null); }}
                    initialState={editorInitialState}
                />
            </div>
        );
    }

    return (
        <div style={containerStyle}>
            <h5>📷 {t("eventPhotos.title", "Event Photos")}</h5>

            {/* Upload area */}
            <div style={uploadBarStyle}>
                <input ref={fileRef} type="file" accept="image/*" onChange={handleFileSelect} />
                <input
                    type="text"
                    placeholder={t("eventPhotos.captionPlaceholder", "Caption (optional)")}
                    value={caption}
                    onChange={(e) => setCaption(e.target.value)}
                    style={{ padding: "4px 8px", borderRadius: "4px", border: "1px solid #ccc", minWidth: "200px" }}
                />
                {uploadMutation.isPending && (
                    <span style={{ fontSize: "0.85rem", opacity: 0.7 }}>
                        {t("eventPhotos.uploading", "Uploading...")}
                    </span>
                )}
            </div>

            {/* Gallery */}
            {isLoading ? (
                <p style={{ marginTop: "16px" }}>{t("common.loading", "Loading...")}</p>
            ) : photos.length === 0 ? (
                <p style={{ marginTop: "16px", opacity: 0.6 }}>
                    {t("eventPhotos.empty", "No photos yet. Be the first to upload!")}
                </p>
            ) : (
                <div style={gridStyle}>
                    {photos.map((photo) => (
                        <div
                            key={photo.id}
                            style={cardStyle}
                            onClick={() => setSelectedPhoto(photo)}
                        >
                            <img
                                src={photoUrl(photo)}
                                alt={photo.caption || "Event photo"}
                                style={imgStyle}
                                loading="lazy"
                            />
                            <div style={{ padding: "8px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                <span style={{ fontSize: "0.85rem", opacity: 0.8 }}>
                                    {photo.caption || ""}
                                </span>
                                <div style={{ display: "flex", gap: "4px" }}>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); handleEditExisting(photo); }}
                                        title={t("eventPhotos.edit", "Edit")}
                                        style={{ background: "none", border: "none", cursor: "pointer", fontSize: "1.1rem" }}
                                    >
                                        ✏️
                                    </button>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); handleLike(photo.id); }}
                                        title={t("eventPhotos.like", "Like")}
                                        style={{ background: "none", border: "none", cursor: "pointer", fontSize: "1.1rem" }}
                                    >
                                        ❤️
                                    </button>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); handleDelete(photo.id); }}
                                        title={t("eventPhotos.delete", "Delete")}
                                        style={{ background: "none", border: "none", cursor: "pointer", fontSize: "1.1rem" }}
                                    >
                                        🗑️
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Lightbox */}
            {selectedPhoto && (
                <div
                    style={{
                        position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
                        backgroundColor: "rgba(0,0,0,0.85)", display: "flex",
                        alignItems: "center", justifyContent: "center", zIndex: 9999,
                        cursor: "pointer", flexDirection: "column", gap: 12,
                    }}
                    onClick={() => setSelectedPhoto(null)}
                >
                    <img
                        src={photoUrl(selectedPhoto)}
                        alt={selectedPhoto.caption || "Photo"}
                        style={{ maxWidth: "90vw", maxHeight: "80vh", borderRadius: "8px" }}
                    />
                    <div style={{ display: "flex", gap: 8 }} onClick={e => e.stopPropagation()}>
                        <button
                            onClick={() => handleEditExisting(selectedPhoto)}
                            style={{
                                padding: "6px 18px", borderRadius: 6,
                                background: "#0d6efd", color: "#fff", border: "none",
                                cursor: "pointer", fontSize: 14,
                            }}
                        >
                            ✏️ {t("eventPhotos.editPhoto", "Edit photo")}
                        </button>
                        <button
                            onClick={() => setSelectedPhoto(null)}
                            style={{
                                padding: "6px 18px", borderRadius: 6,
                                background: "#6c757d", color: "#fff", border: "none",
                                cursor: "pointer", fontSize: 14,
                            }}
                        >
                            {t("common.close", "Close")}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default React.memo(EventPhotosPanel);

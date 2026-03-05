// EventMediaPanel.tsx — Combined photo & video gallery for an event
// Replaces EventPhotosPanel, adds video tab with VideoEditor integration
import React, { useState, useRef, useCallback } from "react";
import { useTranslation } from "react-i18next";
import {
    useEventPhotosQuery,
    useUploadEventPhotoMutation,
    useDeleteEventPhotoMutation,
    useTogglePhotoLikeMutation,
} from "../../../scripts/api/apiEventPhotos";
import {
    useEventVideosQuery,
    useUploadEventVideoMutation,
    useDeleteEventVideoMutation,
    useToggleVideoLikeMutation,
} from "../../../scripts/api/apiEventVideos";
import type { EventPhoto, EventVideo } from "../../../models/modelsKaraoke";
import { useEventMediaCollectionsQuery, useCreateEventMediaCollectionMutation } from "../../../scripts/api/apiEventMediaCollections";
import {
    usePhotoTagsQuery,
    useAddPhotoTagMutation,
    useDeletePhotoTagMutation,
    useVideoTagsQuery,
    useAddVideoTagMutation,
    useDeleteVideoTagMutation,
} from "../../../scripts/api/apiEventMediaTags";
import { API_ROOT } from "../../../config/apiConfig";
import PhotoEditor from "../../forms/PhotoEditor";
import VideoEditor from "../../forms/VideoEditor";
import css from "./EventMediaPanel.module.css";

interface Props {
    eventId: number;
}

type MediaTab = "photos" | "videos";

const EventMediaPanel: React.FC<Props> = ({ eventId }) => {
    const { t } = useTranslation();

    // ── Active sub-tab ──
    const [mediaTab, setMediaTab] = useState<MediaTab>("photos");

    // ── Photos ──
    const { data: photosResp } = useEventPhotosQuery(eventId);
    const photos = photosResp?.items ?? [];
    const uploadPhotoMut = useUploadEventPhotoMutation(eventId);
    const deletePhotoMut = useDeleteEventPhotoMutation(eventId);
    const likePhotoMut = useTogglePhotoLikeMutation(eventId);
    const photoFileRef = useRef<HTMLInputElement>(null);

    // ── Videos ──
    const { data: videosResp } = useEventVideosQuery(eventId);
    const videos = videosResp?.items ?? [];
    const uploadVideoMut = useUploadEventVideoMutation(eventId);
    const deleteVideoMut = useDeleteEventVideoMutation(eventId);
    const likeVideoMut = useToggleVideoLikeMutation(eventId);
    const videoFileRef = useRef<HTMLInputElement>(null);

    // ── Kolekcje (albumy) ──
    const { data: collections = [], isLoading: collectionsLoading } = useEventMediaCollectionsQuery(eventId);
    const createCollectionMut = useCreateEventMediaCollectionMutation(eventId);
    const [selectedCollectionId, setSelectedCollectionId] = useState<number | null>(null);
    const [newCollectionName, setNewCollectionName] = useState("");

    // ── Common state ──
    const [caption, setCaption] = useState("");
    const [selectedPhoto, setSelectedPhoto] = useState<EventPhoto | null>(null);
    const [selectedVideo, setSelectedVideo] = useState<EventVideo | null>(null);

    // ── PhotoEditor ──
    const [photoEditorOpen, setPhotoEditorOpen] = useState(false);
    const [photoEditorSrc, setPhotoEditorSrc] = useState<File | string | null>(null);
    const [photoEditorState, setPhotoEditorState] = useState<string | null>(null);
    const [editingPhotoId, setEditingPhotoId] = useState<number | null>(null);

    // ── VideoEditor ──
    const [videoEditorOpen, setVideoEditorOpen] = useState(false);
    const [videoEditorSrc, setVideoEditorSrc] = useState<File | string | null>(null);
    const [videoEditorState, setVideoEditorState] = useState<string | null>(null);
    const [editingVideoId, setEditingVideoId] = useState<number | null>(null);

    // ── Tags ──
    const [taggingMode, setTaggingMode] = useState(false);
    const [tagLabel, setTagLabel] = useState("");

    // Tag hooks — conditionally use photo/video id
    const activePhotoId = selectedPhoto?.id ?? 0;
    const activeVideoId = selectedVideo?.id ?? 0;
    const { data: photoTags = [] } = usePhotoTagsQuery(eventId, activePhotoId, { enabled: activePhotoId > 0 });
    const addPhotoTagMut = useAddPhotoTagMutation(eventId, activePhotoId);
    const deletePhotoTagMut = useDeletePhotoTagMutation(eventId, activePhotoId);
    const { data: videoTags = [] } = useVideoTagsQuery(eventId, activeVideoId, { enabled: activeVideoId > 0 });
    const addVideoTagMut = useAddVideoTagMutation(eventId, activeVideoId);
    const deleteVideoTagMut = useDeleteVideoTagMutation(eventId, activeVideoId);

    const handlePhotoTagClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
        if (!taggingMode || !selectedPhoto) return;
        const rect = e.currentTarget.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width;
        const y = (e.clientY - rect.top) / rect.height;
        addPhotoTagMut.mutate({ x, y, label: tagLabel.trim() || undefined });
        setTagLabel("");
        setTaggingMode(false);
    }, [taggingMode, selectedPhoto, tagLabel, addPhotoTagMut]);

    const handleVideoTagClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
        if (!taggingMode || !selectedVideo) return;
        const rect = e.currentTarget.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width;
        const y = (e.clientY - rect.top) / rect.height;
        // Try to get current video timestamp
        const videoEl = e.currentTarget.querySelector("video");
        const timestampSeconds = videoEl ? Math.round(videoEl.currentTime) : undefined;
        addVideoTagMut.mutate({ x, y, label: tagLabel.trim() || undefined, timestampSeconds });
        setTagLabel("");
        setTaggingMode(false);
    }, [taggingMode, selectedVideo, tagLabel, addVideoTagMut]);

    // ══════════════════════════════════════
    // Photo handlers
    // ══════════════════════════════════════

    const handlePhotoFileSelect = useCallback(() => {
        const file = photoFileRef.current?.files?.[0];
        if (!file) return;
        setPhotoEditorSrc(file);
        setPhotoEditorState(null);
        setEditingPhotoId(null);
        setPhotoEditorOpen(true);
    }, []);

    const handleEditPhoto = useCallback((photo: EventPhoto) => {
        setPhotoEditorSrc(`${API_ROOT}/api/events/${eventId}/photos/${photo.id}/file`);
        setPhotoEditorState(photo.filtersJson ?? null);
        setEditingPhotoId(photo.id);
        setSelectedPhoto(null);
        setPhotoEditorOpen(true);
    }, [eventId]);

    const handlePhotoEditorSave = useCallback(
        (file: File, editorStateJson?: string) => {
            const fd = new FormData();
            fd.append("file", file);
            if (caption) fd.append("caption", caption);
            if (editorStateJson) fd.append("filtersJson", editorStateJson);
            if (editingPhotoId != null) fd.append("originalId", String(editingPhotoId));
            if (selectedCollectionId) fd.append("collectionId", String(selectedCollectionId));
            uploadPhotoMut.mutate(fd, {
                onSuccess: () => {
                    setCaption("");
                    if (photoFileRef.current) photoFileRef.current.value = "";
                    setPhotoEditorOpen(false);
                    setPhotoEditorSrc(null);
                },
            });
        },
        [caption, editingPhotoId, uploadPhotoMut, selectedCollectionId],
    );

    const handleDeletePhoto = useCallback(
        (id: number) => {
            if (window.confirm(t("eventPhotos.confirmDelete", "Delete this photo?"))) {
                deletePhotoMut.mutate(id);
                if (selectedPhoto?.id === id) setSelectedPhoto(null);
            }
        },
        [deletePhotoMut, selectedPhoto, t],
    );

    // ══════════════════════════════════════
    // Video handlers
    // ══════════════════════════════════════

    const handleVideoFileSelect = useCallback(() => {
        const file = videoFileRef.current?.files?.[0];
        if (!file) return;
        setVideoEditorSrc(file);
        setVideoEditorState(null);
        setEditingVideoId(null);
        setVideoEditorOpen(true);
    }, []);

    const handleEditVideo = useCallback((video: EventVideo) => {
        setVideoEditorSrc(`${API_ROOT}/api/events/${eventId}/videos/${video.id}/file`);
        setVideoEditorState(video.filtersJson ?? null);
        setEditingVideoId(video.id);
        setSelectedVideo(null);
        setVideoEditorOpen(true);
    }, [eventId]);

    const handleVideoEditorSave = useCallback(
        (file: File, editorStateJson?: string) => {
            const fd = new FormData();
            fd.append("file", file);
            if (caption) fd.append("caption", caption);
            if (editorStateJson) fd.append("filtersJson", editorStateJson);
            if (editingVideoId != null) fd.append("originalId", String(editingVideoId));
            if (selectedCollectionId) fd.append("collectionId", String(selectedCollectionId));
            uploadVideoMut.mutate(fd, {
                onSuccess: () => {
                    setCaption("");
                    if (videoFileRef.current) videoFileRef.current.value = "";
                    setVideoEditorOpen(false);
                    setVideoEditorSrc(null);
                },
            });
        },
        [caption, editingVideoId, uploadVideoMut, selectedCollectionId],
    );

    const handleDeleteVideo = useCallback(
        (id: number) => {
            if (window.confirm(t("eventVideos.confirmDelete", "Delete this video?"))) {
                deleteVideoMut.mutate(id);
                if (selectedVideo?.id === id) setSelectedVideo(null);
            }
        },
        [deleteVideoMut, selectedVideo, t],
    );

    // ══════════════════════════════════════
    // URL helpers
    // ══════════════════════════════════════
    const photoUrl = (p: EventPhoto) =>
        p.objectKey ? `${API_ROOT}/api/events/${eventId}/photos/${p.id}/file` : "";
    const videoUrl = (v: EventVideo) =>
        v.objectKey ? `${API_ROOT}/api/events/${eventId}/videos/${v.id}/file` : "";
    const videoThumbUrl = (v: EventVideo) =>
        v.thumbnailKey ? `${API_ROOT}/api/events/${eventId}/videos/${v.id}/thumbnail` : "";

    // ══════════════════════════════════════
    // Fullscreen editor overlays
    // ══════════════════════════════════════
    if (photoEditorOpen && photoEditorSrc) {
        return (
            <div className={css.editorOverlay}>
                <PhotoEditor
                    src={photoEditorSrc}
                    onSave={handlePhotoEditorSave}
                    onCancel={() => { setPhotoEditorOpen(false); setPhotoEditorSrc(null); }}
                    initialState={photoEditorState}
                />
            </div>
        );
    }

    if (videoEditorOpen && videoEditorSrc) {
        return (
            <div className={css.editorOverlay}>
                <VideoEditor
                    src={videoEditorSrc}
                    onSave={handleVideoEditorSave}
                    onCancel={() => { setVideoEditorOpen(false); setVideoEditorSrc(null); }}
                    initialState={videoEditorState}
                />
            </div>
        );
    }



    // ══════════════════════════════════════
    // Render
    // ══════════════════════════════════════
    return (
        <div className={css.container}>
            {/* ── Sub-tab selector ── */}
            <div className={css.tabBar}>
                <button className={mediaTab === "photos" ? `${css.tabButton} ${css.tabButtonActive}` : css.tabButton} onClick={() => setMediaTab("photos")}>
                    📷 {t("eventMedia.photos", "Photos")}
                </button>
                <button className={mediaTab === "videos" ? `${css.tabButton} ${css.tabButtonActive}` : css.tabButton} onClick={() => setMediaTab("videos")}>
                    🎬 {t("eventMedia.videos", "Videos")}
                </button>
            </div>

            <div className={css.tabContent}>
                {/* ═══════════════════════════════════════════
                    PHOTOS TAB
                   ═══════════════════════════════════════════ */}
                {mediaTab === "photos" && (
                    <>
                        {/* Upload + kolekcje */}
                        <div className={css.uploadBar}>
                            <input
                                ref={photoFileRef}
                                type="file"
                                accept="image/*"
                                onChange={handlePhotoFileSelect}
                                className={css.fileInput}
                                aria-label={t("eventPhotos.selectFile", "Select photo file")}
                            />
                            <input
                                type="text"
                                placeholder={t("eventPhotos.captionPlaceholder", "Caption (optional)")}
                                value={caption}
                                onChange={e => setCaption(e.target.value)}
                                className={css.captionInput}
                                aria-label={t("eventPhotos.caption", "Photo caption")}
                            />
                            {/* Wybór kolekcji */}
                            <select
                                value={selectedCollectionId ?? ""}
                                onChange={e => setSelectedCollectionId(e.target.value ? Number(e.target.value) : null)}
                                className={css.selectInput}
                                aria-label={t("eventMedia.selectCollection", "Select collection")}
                            >
                                <option value="">{t("eventMedia.chooseCollection", "Choose collection...")}</option>
                                {collections.map(col => (
                                    <option key={col.id} value={col.id}>{col.name}</option>
                                ))}
                            </select>
                            {/* Dodaj nową kolekcję */}
                            <form
                                onSubmit={e => {
                                    e.preventDefault();
                                    if (newCollectionName.trim()) {
                                        createCollectionMut.mutate({ name: newCollectionName });
                                        setNewCollectionName("");
                                    }
                                }}
                                className={css.newCollectionForm}
                            >
                                <input
                                    type="text"
                                    placeholder={t("eventMedia.newCollection", "Nowa kolekcja")}
                                    value={newCollectionName}
                                    onChange={e => setNewCollectionName(e.target.value)}
                                    className={css.newCollectionInput}
                                    aria-label={t("eventMedia.newCollectionName", "New collection name")}
                                />
                                <button type="submit" aria-label={t("eventMedia.addCollection", "Add collection")} className={css.addCollectionBtn}>+</button>
                            </form>
                            {uploadPhotoMut.isPending && (
                                <span className={css.uploadingIndicator}>
                                    ⏳ {t("eventPhotos.uploading", "Uploading...")}
                                </span>
                            )}
                        </div>

                        {/* Galerie pogrupowane po kolekcjach */}
                        {collectionsLoading ? (
                            <p className={css.loadingText}>{t("common.loading", "Loading collections...")}</p>
                        ) : collections.length === 0 ? (
                            <p className={css.noCollectionsText}>{t("eventMedia.noCollections", "No collections. Add the first one!")}</p>
                        ) : (
                            collections.map(col => {
                                const colPhotos = photos.filter(p => p.collectionId === col.id);
                                if (colPhotos.length === 0) return null;
                                return (
                                    <div key={col.id} className={css.collectionSection}>
                                        <h6 className={css.collectionHeading}>{col.name}</h6>
                                        <div className={css.mediaGrid}>
                                            {colPhotos.map(photo => (
                                                <div key={photo.id} className={css.mediaCard} onClick={() => setSelectedPhoto(photo)}>
                                                    <img src={photoUrl(photo)} alt={photo.caption || "Photo"} className={css.thumbImg} loading="lazy" />
                                                    <div className={css.cardFooter}>
                                                        <span className={css.captionText}>
                                                            {photo.caption || ""}
                                                        </span>
                                                        <div className={css.actionButtons}>
                                                            <button onClick={e => { e.stopPropagation(); handleEditPhoto(photo); }} title={t("common.edit", "Edit")} aria-label={t("common.edit", "Edit")} className={css.actionBtn}>✏️</button>
                                                            <button onClick={e => { e.stopPropagation(); likePhotoMut.mutate(photo.id); }} title="Like" aria-label="Like photo" className={css.actionBtn}>❤️</button>
                                                            <button onClick={e => { e.stopPropagation(); handleDeletePhoto(photo.id); }} title={t("common.delete", "Delete")} aria-label={t("common.delete", "Delete")} className={css.actionBtn}>🗑️</button>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                );
                            })
                        )}

                        {/* Photo lightbox with tags */}
                        {selectedPhoto && (
                            <div
                                className={taggingMode ? `${css.photoLightbox} ${css.taggingCursor}` : css.photoLightbox}
                                onClick={() => { if (!taggingMode) { setSelectedPhoto(null); setTaggingMode(false); } }}
                            >
                                {/* Image container with tag markers */}
                                <div
                                    className={css.lightboxMediaContainer}
                                    onClick={(e) => { e.stopPropagation(); handlePhotoTagClick(e); }}
                                >
                                    <img
                                        src={photoUrl(selectedPhoto)}
                                        alt={selectedPhoto.caption || "Photo"}
                                        className={css.lightboxImage}
                                    />
                                    {/* Tag markers overlay */}
                                    {photoTags.map(tag => (
                                        <div
                                            key={tag.id}
                                            className={css.tagMarker}
                                            style={{
                                                left: `${(tag.x * 100).toFixed(1)}%`,
                                                top: `${(tag.y * 100).toFixed(1)}%`,
                                            }}
                                            onClick={e => e.stopPropagation()}
                                        >
                                            <div className={css.tagBadge}>
                                                <span>{tag.label || `#${tag.id}`}</span>
                                                <button
                                                    onClick={() => deletePhotoTagMut.mutate(tag.id)}
                                                    className={css.deleteTagBtn}
                                                    title={t("eventMedia.deleteTag", "Delete tag")}
                                                    aria-label={t("eventMedia.deleteTag", "Delete tag")}
                                                >×</button>
                                            </div>
                                            <div className={css.tagArrow} />
                                        </div>
                                    ))}
                                    {/* Tagging mode indicator */}
                                    {taggingMode && (
                                        <div className={css.taggingIndicator}>
                                            🏷️ {t("eventMedia.clickToTag", "Click on the photo to tag")}
                                        </div>
                                    )}
                                </div>

                                {/* Controls bar */}
                                <div className={css.controlsBar} onClick={e => e.stopPropagation()}>
                                    {/* Tag input + toggle */}
                                    <input
                                        type="text"
                                        placeholder={t("eventMedia.tagLabel", "Name / label...")}
                                        value={tagLabel}
                                        onChange={e => setTagLabel(e.target.value)}
                                        className={css.tagInput}
                                        aria-label={t("eventMedia.tagLabel", "Tag label")}
                                    />
                                    <button
                                        onClick={() => setTaggingMode(!taggingMode)}
                                        className={taggingMode ? `${css.tagToggleBtn} ${css.tagToggleBtnActive}` : css.tagToggleBtn}
                                    >
                                        🏷️ {taggingMode ? t("eventMedia.cancelTag", "Cancel") : t("eventMedia.tagPerson", "Tag person")}
                                    </button>
                                    <button
                                        onClick={() => handleEditPhoto(selectedPhoto)}
                                        className={css.editBtn}
                                    >
                                        ✏️ {t("eventMedia.editPhoto", "Edit photo")}
                                    </button>
                                    <button
                                        onClick={() => { setSelectedPhoto(null); setTaggingMode(false); }}
                                        className={css.closeBtn}
                                    >
                                        {t("common.close", "Close")}
                                    </button>
                                </div>

                                {/* Tag list */}
                                {photoTags.length > 0 && (
                                    <div className={css.tagList} onClick={e => e.stopPropagation()}>
                                        {photoTags.map(tag => (
                                            <span key={tag.id} className={css.tagChip}>
                                                🏷️ {tag.label || `User#${tag.userId ?? tag.contactId ?? "?"}`}
                                                <button
                                                    onClick={() => deletePhotoTagMut.mutate(tag.id)}
                                                    className={css.deleteTagChipBtn}
                                                    aria-label={t("eventMedia.deleteTag", "Delete tag")}
                                                >×</button>
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </>
                )}

                {/* ═══════════════════════════════════════════
                    VIDEOS TAB
                   ═══════════════════════════════════════════ */}
                {mediaTab === "videos" && (
                    <>
                        {/* Upload + kolekcje */}
                        <div className={css.uploadBar}>
                            <input
                                ref={videoFileRef}
                                type="file"
                                accept="video/*"
                                onChange={handleVideoFileSelect}
                                className={css.fileInput}
                                aria-label={t("eventVideos.selectFile", "Select video file")}
                            />
                            <input
                                type="text"
                                placeholder={t("eventVideos.captionPlaceholder", "Caption (optional)")}
                                value={caption}
                                onChange={e => setCaption(e.target.value)}
                                className={css.captionInput}
                                aria-label={t("eventVideos.caption", "Video caption")}
                            />
                            {/* Wybór kolekcji */}
                            <select
                                value={selectedCollectionId ?? ""}
                                onChange={e => setSelectedCollectionId(e.target.value ? Number(e.target.value) : null)}
                                className={css.selectInput}
                                aria-label={t("eventMedia.selectCollection", "Select collection")}
                            >
                                <option value="">{t("eventMedia.chooseCollection", "Choose collection...")}</option>
                                {collections.map(col => (
                                    <option key={col.id} value={col.id}>{col.name}</option>
                                ))}
                            </select>
                            {/* Dodaj nową kolekcję */}
                            <form
                                onSubmit={e => {
                                    e.preventDefault();
                                    if (newCollectionName.trim()) {
                                        createCollectionMut.mutate({ name: newCollectionName });
                                        setNewCollectionName("");
                                    }
                                }}
                                className={css.newCollectionForm}
                            >
                                <input
                                    type="text"
                                    placeholder={t("eventMedia.newCollection", "Nowa kolekcja")}
                                    value={newCollectionName}
                                    onChange={e => setNewCollectionName(e.target.value)}
                                    className={css.newCollectionInput}
                                    aria-label={t("eventMedia.newCollectionName", "New collection name")}
                                />
                                <button type="submit" aria-label={t("eventMedia.addCollection", "Add collection")} className={css.addCollectionBtn}>+</button>
                            </form>
                            {uploadVideoMut.isPending && (
                                <span className={css.uploadingIndicator}>
                                    ⏳ {t("eventVideos.uploading", "Uploading...")}
                                </span>
                            )}
                        </div>

                        {/* Galerie pogrupowane po kolekcjach */}
                        {collectionsLoading ? (
                            <p className={css.loadingText}>{t("common.loading", "Loading collections...")}</p>
                        ) : collections.length === 0 ? (
                            <p className={css.noCollectionsText}>{t("eventMedia.noCollections", "No collections. Add the first one!")}</p>
                        ) : (
                            collections.map(col => {
                                const colVideos = videos.filter(v => v.collectionId === col.id);
                                if (colVideos.length === 0) return null;
                                return (
                                    <div key={col.id} className={css.collectionSection}>
                                        <h6 className={css.collectionHeading}>{col.name}</h6>
                                        <div className={css.mediaGrid}>
                                            {colVideos.map(video => (
                                                <div key={video.id} className={css.mediaCard} onClick={() => setSelectedVideo(video)}>
                                                    {/* Thumbnail or video poster */}
                                                    <div className={css.videoThumbContainer}>
                                                        {video.thumbnailKey ? (
                                                            <img src={videoThumbUrl(video)} alt={video.caption || "Film"} className={css.thumbImg} loading="lazy" />
                                                        ) : (
                                                            <video
                                                                src={videoUrl(video)}
                                                                className={css.thumbImg}
                                                                muted
                                                                preload="metadata"
                                                            />
                                                        )}
                                                        {/* Play icon overlay */}
                                                        <div className={css.playOverlay}>
                                                            <div className={css.playIconCircle}>
                                                                <i className={`fa fa-play ${css.playIcon}`} />
                                                            </div>
                                                        </div>
                                                        {/* Duration badge */}
                                                        {video.durationSeconds != null && (
                                                            <div className={css.durationBadge}>
                                                                {formatDuration(video.durationSeconds)}
                                                            </div>
                                                        )}
                                                    </div>

                                                    <div className={css.cardFooter}>
                                                        <span className={css.captionText}>
                                                            {video.caption || ""}
                                                        </span>
                                                        <div className={css.actionButtons}>
                                                            <button onClick={e => { e.stopPropagation(); handleEditVideo(video); }} title={t("common.edit", "Edit")} aria-label={t("common.edit", "Edit")} className={css.actionBtn}>✏️</button>
                                                            <button onClick={e => { e.stopPropagation(); likeVideoMut.mutate(video.id); }} title="Like" aria-label="Like video" className={css.actionBtn}>❤️</button>
                                                            <button onClick={e => { e.stopPropagation(); handleDeleteVideo(video.id); }} title={t("common.delete", "Delete")} aria-label={t("common.delete", "Delete")} className={css.actionBtn}>🗑️</button>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                );
                            })
                        )}

                        {/* Video lightbox / player with tags */}
                        {selectedVideo && (
                            <div
                                className={taggingMode ? `${css.videoLightbox} ${css.taggingCursor}` : css.videoLightbox}
                                onClick={() => { if (!taggingMode) { setSelectedVideo(null); setTaggingMode(false); } }}
                            >
                                {/* Video container with tag markers */}
                                <div
                                    className={css.lightboxMediaContainer}
                                    onClick={(e) => { e.stopPropagation(); handleVideoTagClick(e); }}
                                >
                                    <video
                                        src={videoUrl(selectedVideo)}
                                        controls
                                        autoPlay
                                        className={css.lightboxVideo}
                                        onClick={e => { if (!taggingMode) e.stopPropagation(); }}
                                    />
                                    {/* Video tag markers */}
                                    {videoTags.map(tag => (
                                        <div
                                            key={tag.id}
                                            className={css.tagMarker}
                                            style={{
                                                left: `${(tag.x * 100).toFixed(1)}%`,
                                                top: `${(tag.y * 100).toFixed(1)}%`,
                                            }}
                                            onClick={e => e.stopPropagation()}
                                        >
                                            <div className={css.tagBadge}>
                                                <span>{tag.label || `#${tag.id}`}</span>
                                                {tag.timestampSeconds != null && (
                                                    <span className={css.tagTimestamp}>@{formatDuration(tag.timestampSeconds)}</span>
                                                )}
                                                <button
                                                    onClick={() => deleteVideoTagMut.mutate(tag.id)}
                                                    className={css.deleteTagBtn}
                                                    title={t("eventMedia.deleteTag", "Delete tag")}
                                                    aria-label={t("eventMedia.deleteTag", "Delete tag")}
                                                >×</button>
                                            </div>
                                        </div>
                                    ))}
                                    {taggingMode && (
                                        <div className={css.taggingIndicator}>
                                            🏷️ {t("eventMedia.clickToTagVideo", "Click on the video to tag")}
                                        </div>
                                    )}
                                </div>

                                {/* Controls bar */}
                                <div className={css.controlsBar} onClick={e => e.stopPropagation()}>
                                    <input
                                        type="text"
                                        placeholder={t("eventMedia.tagLabel", "Name / label...")}
                                        value={tagLabel}
                                        onChange={e => setTagLabel(e.target.value)}
                                        className={css.tagInput}
                                        aria-label={t("eventMedia.tagLabel", "Tag label")}
                                    />
                                    <button
                                        onClick={() => setTaggingMode(!taggingMode)}
                                        className={taggingMode ? `${css.tagToggleBtn} ${css.tagToggleBtnActive}` : css.tagToggleBtn}
                                    >
                                        🏷️ {taggingMode ? t("eventMedia.cancelTag", "Cancel") : t("eventMedia.tagPerson", "Tag person")}
                                    </button>
                                    <button
                                        onClick={() => handleEditVideo(selectedVideo)}
                                        className={css.editBtn}
                                    >
                                        ✏️ {t("eventMedia.editVideo", "Edit video")}
                                    </button>
                                    <button
                                        onClick={() => { setSelectedVideo(null); setTaggingMode(false); }}
                                        className={css.closeBtn}
                                    >
                                        {t("common.close", "Close")}
                                    </button>
                                </div>

                                {/* Tag list */}
                                {videoTags.length > 0 && (
                                    <div className={css.tagList} onClick={e => e.stopPropagation()}>
                                        {videoTags.map(tag => (
                                            <span key={tag.id} className={css.tagChip}>
                                                🏷️ {tag.label || `User#${tag.userId ?? tag.contactId ?? "?"}`}
                                                {tag.timestampSeconds != null && (
                                                    <span className={css.tagTimestampDim}>@{formatDuration(tag.timestampSeconds)}</span>
                                                )}
                                                <button
                                                    onClick={() => deleteVideoTagMut.mutate(tag.id)}
                                                    className={css.deleteTagChipBtn}
                                                    aria-label={t("eventMedia.deleteTag", "Delete tag")}
                                                >×</button>
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

/** Formats seconds → "m:ss" or "h:mm:ss" */
function formatDuration(sec: number): string {
    const s = Math.round(sec);
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const ss = s % 60;
    if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(ss).padStart(2, "0")}`;
    return `${m}:${String(ss).padStart(2, "0")}`;
}

export default React.memo(EventMediaPanel);

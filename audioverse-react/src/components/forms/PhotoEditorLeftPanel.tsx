/**
 * PhotoEditorLeftPanel.tsx — Left sidebar of the PhotoEditor.
 *
 * Contains 8 tab buttons and their corresponding panel content:
 *   Filters, Adjust, Crop, Transform, Stickers, Text, Shapes, Draw
 */

import React from "react";
import { Button, Form } from "react-bootstrap";
import {
    DEFAULT_ADJUSTMENTS,
    type AdjustmentValues,
} from "../../scripts/photoFilters";
import {
    type EmojiOverlay,
    type TextOverlay,
    type ShapeOverlay,
    type DrawingOverlay,
    type FrameOverlay,
    EMOJI_CATALOG,
    SHAPE_CATALOG,
    FRAME_CATALOG,
    type Overlay,
} from "../../scripts/photoOverlays";
import {
    TAB_DEFS,
    ASPECT_RATIOS,
    ADJUSTMENT_SLIDERS,
    type FilterCategory,
} from "./photoEditorTypes";
import FilterThumb from "./FilterThumb";
import type { PhotoEditorAPI } from "./usePhotoEditor";
import cs from "./PhotoEditor.module.css";

interface Props {
    api: PhotoEditorAPI;
}

// ── Overlay Toolbar (extracted from the original inline function) ──

const OverlayToolbar: React.FC<{ api: PhotoEditorAPI }> = ({ api }) => {
    const { selectedOverlay, accent, t, updateOverlay, pushHistory, moveOverlayBack, moveOverlayForward, deleteOverlay } = api;
    if (!selectedOverlay) return null;
    return (
        <div className={cs.overlayToolbar}>
            <span className={cs.overlayToolbarLabel}>
                <i className="fa fa-object-group me-1" />Warstwa
            </span>
            {/* Opacity */}
            <Form.Range
                min={0} max={100}
                value={(selectedOverlay.opacity ?? 1) * 100}
                onChange={e => updateOverlay(selectedOverlay.id, { opacity: Number(e.target.value) / 100 })}
                onMouseUp={pushHistory}
                style={{ accentColor: accent, maxWidth: 70 }}
                title={t("photoEditor.opacity", "Opacity")}
            />
            <span className={cs.sliderValueSm} style={{ color: accent }}>
                {Math.round((selectedOverlay.opacity ?? 1) * 100)}%
            </span>
            {/* Scale */}
            {selectedOverlay.type !== "drawing" && selectedOverlay.type !== "frame" && (
                <>
                    <Form.Range
                        min={20} max={500}
                        value={(selectedOverlay.scaleX ?? 1) * 100}
                        onChange={e => {
                            const s = Number(e.target.value) / 100;
                            updateOverlay(selectedOverlay.id, { scaleX: s, scaleY: s });
                        }}
                        onMouseUp={pushHistory}
                        style={{ accentColor: accent, maxWidth: 60 }}
                        title="Skala"
                    />
                    <span className={cs.sliderValueSm} style={{ color: "#aaa" }}>
                        {Math.round((selectedOverlay.scaleX ?? 1) * 100)}%
                    </span>
                </>
            )}
            {/* Rotation (for positioned overlays) */}
            {selectedOverlay.type !== "drawing" && selectedOverlay.type !== "frame" && (
                <Form.Range
                    min={-180} max={180}
                    value={selectedOverlay.rotation ?? 0}
                    onChange={e => updateOverlay(selectedOverlay.id, { rotation: Number(e.target.value) })}
                    onMouseUp={pushHistory}
                    style={{ accentColor: accent, maxWidth: 60 }}
                    title={t("photoEditor.rotation", "Rotation")}
                />
            )}
            <Button variant="dark" size="sm" onClick={() => moveOverlayBack(selectedOverlay.id)} title={t("photoEditor.moveBack", "Move back")} className={cs.overlayToolbarBtn}>
                <i className="fa fa-arrow-down" />
            </Button>
            <Button variant="dark" size="sm" onClick={() => moveOverlayForward(selectedOverlay.id)} title={t("photoEditor.moveForward", "Move forward")} className={cs.overlayToolbarBtn}>
                <i className="fa fa-arrow-up" />
            </Button>
            <Button variant="outline-danger" size="sm" onClick={() => deleteOverlay(selectedOverlay.id)} className={cs.overlayToolbarBtn}>
                <i className="fa fa-trash" />
            </Button>
        </div>
    );
};

// ── Left Panel ──

const PhotoEditorLeftPanel: React.FC<Props> = React.memo(({ api }) => {
    const {
        t, accent, accentDim,
        activeTab, setActiveTab, setCropMode,
        // Filters
        selectedFilter, setSelectedFilter, filterIntensity, setFilterIntensity,
        filterCategory, setFilterCategory, filteredList, generateThumbnail,
        pushHistory,
        // Adjustments
        adjustments, handleAdjChange, handleAdjChangeEnd,
        // Crop
        image, cropRect, setCropRect, cropAspect, setCropAspect,
        // Transform
        rotation, setRotation, flipH, setFlipH, flipV, setFlipV, zoom, setZoom,
        // Overlays
        overlays, setOverlays, selectedOverlayId, setSelectedOverlayId, addOverlay, deleteOverlay,
        mainCanvasRef,
        // Stickers / Emoji
        emojiCat, setEmojiCat,
        // Text
        textDraft, setTextDraft, textColor, setTextColor, textBold, setTextBold,
        textItalic, setTextItalic, textOutline, setTextOutline, textFontSize, setTextFontSize,
        textBg, setTextBg, selectedOverlay, updateOverlay,
        // Shapes
        shapeStroke, setShapeStroke, shapeFill, setShapeFill, shapeStrokeW, setShapeStrokeW,
        // Frame
        frameColor, setFrameColor, frameThick, setFrameThick,
        // Drawing
        drawColor, setDrawColor, drawWidth, setDrawWidth, drawingOverlayRef,
        // Creators
        createEmojiOverlay, createTextOverlay, createShapeOverlay, createFrameOverlay,
    } = api;

    return (
        <div className={cs.leftPanel}>
            {/* Tab bar */}
            <div className={cs.tabBar}>
                {TAB_DEFS.map(tab => (
                    <button
                        key={tab.key}
                        onClick={() => {
                            setActiveTab(tab.key);
                            if (tab.key === "crop") setCropMode(true);
                            else setCropMode(false);
                        }}
                        title={tab.label}
                        className={activeTab === tab.key ? cs.tabButtonActive : cs.tabButton}
                        style={{
                            color: activeTab === tab.key ? accent : undefined,
                            borderBottomColor: activeTab === tab.key ? accent : undefined,
                        }}
                    >
                        <i className={`fa ${tab.icon}`} style={{ fontSize: 14 }} />
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Panel content */}
            <div className={cs.panelContent}>
                {/* ── FILTERS TAB ── */}
                {activeTab === "filters" && (
                    <>
                        {/* Category pills */}
                        <div className={cs.pillRow}>
                            {([
                                { key: "all",      label: "All" },
                                { key: "color",    label: "Color" },
                                { key: "light",    label: "Light" },
                                { key: "vintage",  label: "Vintage" },
                                { key: "artistic", label: "Artistic" },
                                { key: "fun",      label: "Fun" },
                            ] as { key: FilterCategory; label: string }[]).map(cat => (
                                <button
                                    key={cat.key}
                                    onClick={() => setFilterCategory(cat.key)}
                                    className={filterCategory === cat.key ? cs.pillActive : cs.pill}
                                    style={{
                                        borderColor: filterCategory === cat.key ? accent : undefined,
                                        background: filterCategory === cat.key ? accentDim : undefined,
                                    }}
                                >
                                    {cat.label}
                                </button>
                            ))}
                        </div>

                        {/* Filter grid */}
                        <div className={cs.filterGrid}>
                            {filteredList.map(filter => (
                                <FilterThumb
                                    key={filter.id}
                                    filter={filter}
                                    selected={selectedFilter === filter.id}
                                    accent={accent}
                                    onSelect={() => {
                                        setSelectedFilter(filter.id);
                                        pushHistory();
                                    }}
                                    generateThumbnail={generateThumbnail}
                                />
                            ))}
                        </div>

                        {/* Intensity slider */}
                        {selectedFilter !== "none" && (
                            <div className={cs.intensitySection}>
                                <div className={cs.intensityHeader}>
                                    <span className={cs.sliderLabel}>
                                        <i className="fa fa-tachometer me-1" />
                                        Intensity
                                    </span>
                                    <span className={cs.sliderValue} style={{ color: accent }}>
                                        {Math.round(filterIntensity * 100)}%
                                    </span>
                                </div>
                                <Form.Range
                                    min={0} max={100} value={filterIntensity * 100}
                                    onChange={e => setFilterIntensity(Number(e.target.value) / 100)}
                                    onMouseUp={() => pushHistory()}
                                    style={{ accentColor: accent }}
                                />
                            </div>
                        )}
                    </>
                )}

                {/* ── ADJUST TAB ── */}
                {activeTab === "adjust" && (
                    <div className={cs.adjustColumn}>
                        {ADJUSTMENT_SLIDERS.map(sl => (
                            <div key={sl.key}>
                                <div className={cs.adjustHeader}>
                                    <span className={cs.sliderLabel}>
                                        <i className={`fa ${sl.icon} me-1`} style={{ width: 14, textAlign: "center" }} />
                                        {sl.label}
                                    </span>
                                    <span
                                        className={cs.adjustValue}
                                        style={{ color: adjustments[sl.key] !== 0 ? accent : "#666" }}
                                        onClick={() => handleAdjChange(sl.key, sl.key === "blur" ? 0 : 0)}
                                        title="Reset"
                                    >
                                        {adjustments[sl.key]}
                                    </span>
                                </div>
                                <Form.Range
                                    min={sl.min} max={sl.max}
                                    value={adjustments[sl.key]}
                                    onChange={e => handleAdjChange(sl.key, Number(e.target.value))}
                                    onMouseUp={handleAdjChangeEnd}
                                    style={{ accentColor: accent }}
                                />
                            </div>
                        ))}
                        <Button
                            variant="outline-secondary"
                            size="sm"
                            className="mt-2"
                            onClick={() => {
                                handleAdjChange("brightness" as keyof AdjustmentValues, 0);
                                const defaults = { ...DEFAULT_ADJUSTMENTS };
                                for (const key of Object.keys(defaults) as (keyof AdjustmentValues)[]) {
                                    handleAdjChange(key, defaults[key]);
                                }
                                pushHistory();
                            }}
                        >
                            <i className="fa fa-refresh me-1" />
                            Resetuj korekty
                        </Button>
                    </div>
                )}

                {/* ── CROP TAB ── */}
                {activeTab === "crop" && (
                    <div>
                        <div className={cs.cropInfo}>
                            <i className="fa fa-info-circle me-1" />
                            Drag corners or edges to crop the photo.
                        </div>
                        <div className={cs.cropAspectLabel}>
                            Aspect ratio
                        </div>
                        <div className={cs.cropAspectRow}>
                            {ASPECT_RATIOS.map(ar => (
                                <button
                                    key={ar.label}
                                    onClick={() => {
                                        setCropAspect(ar.value);
                                        if (ar.value && cropRect && image) {
                                            let newW = cropRect.w;
                                            let newH = cropRect.w / ar.value;
                                            if (newH > image.naturalHeight) {
                                                newH = image.naturalHeight;
                                                newW = newH * ar.value;
                                            }
                                            setCropRect({
                                                x: Math.max(0, cropRect.x),
                                                y: Math.max(0, cropRect.y),
                                                w: Math.min(newW, image.naturalWidth),
                                                h: Math.min(newH, image.naturalHeight),
                                            });
                                        }
                                    }}
                                    className={cropAspect === ar.value ? cs.pillCropActive : cs.pillCrop}
                                    style={{
                                        borderColor: cropAspect === ar.value ? accent : undefined,
                                        background: cropAspect === ar.value ? accentDim : undefined,
                                    }}
                                >
                                    {ar.label}
                                </button>
                            ))}
                        </div>
                        <Button
                            variant="outline-secondary"
                            size="sm"
                            className="mt-3"
                            onClick={() => {
                                if (image) {
                                    setCropRect({ x: 0, y: 0, w: image.naturalWidth, h: image.naturalHeight });
                                    setCropAspect(null);
                                    pushHistory();
                                }
                            }}
                        >
                            <i className="fa fa-expand me-1" />
                            Resetuj kadrowanie
                        </Button>
                    </div>
                )}

                {/* ── TRANSFORM TAB ── */}
                {activeTab === "transform" && (
                    <div>
                        <div className={cs.sectionTitleMb8}>
                            Rotation
                        </div>
                        <div className={cs.transformRow}>
                            <Button variant="dark" size="sm" onClick={() => { setRotation((rotation - 90 + 360) % 360); pushHistory(); }}>
                                <i className="fa fa-rotate-left me-1" /> -90°
                            </Button>
                            <Button variant="dark" size="sm" onClick={() => { setRotation((rotation + 90) % 360); pushHistory(); }}>
                                <i className="fa fa-rotate-right me-1" /> +90°
                            </Button>
                            <Button variant="dark" size="sm" onClick={() => { setRotation(0); pushHistory(); }}>
                                0°
                            </Button>
                        </div>

                        <div className={cs.sectionTitleMb8}>
                            Flip
                        </div>
                        <div className={cs.transformRow}>
                            <Button
                                variant={flipH ? "outline-info" : "dark"}
                                size="sm"
                                onClick={() => { setFlipH(!flipH); pushHistory(); }}
                            >
                                <i className="fa fa-arrows-h me-1" /> Horizontal
                            </Button>
                            <Button
                                variant={flipV ? "outline-info" : "dark"}
                                size="sm"
                                onClick={() => { setFlipV(!flipV); pushHistory(); }}
                            >
                                <i className="fa fa-arrows-v me-1" /> Vertical
                            </Button>
                        </div>

                        <div className={cs.sectionTitleMb8}>
                            Preview zoom
                        </div>
                        <div className={cs.transformZoomRow}>
                            <Form.Range
                                min={50} max={300} value={zoom * 100}
                                onChange={e => setZoom(Number(e.target.value) / 100)}
                                style={{ accentColor: accent }}
                            />
                            <span className={cs.transformZoomValue} style={{ color: accent }}>
                                {Math.round(zoom * 100)}%
                            </span>
                        </div>

                        <div className={cs.transformInfo}>
                            <div><strong>Rotation:</strong> {rotation}°</div>
                            <div><strong>Flip H:</strong> {flipH ? "Yes" : "No"}</div>
                            <div><strong>Flip V:</strong> {flipV ? "Yes" : "No"}</div>
                            {cropRect && (
                                <div>
                                    <strong>Crop:</strong>{" "}
                                    {Math.round(cropRect.w)} × {Math.round(cropRect.h)}
                                    {" ("}x:{Math.round(cropRect.x)}, y:{Math.round(cropRect.y)})
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* ── STICKERS TAB ── */}
                {activeTab === "stickers" && (
                    <div>
                        <OverlayToolbar api={api} />
                        <div className={cs.sectionTitle}>
                            <i className="fa fa-smile-o me-1" /> Stickers / Emoji
                        </div>
                        {/* Category pills */}
                        <div className={cs.pillRowGap3}>
                            {EMOJI_CATALOG.map(cat => (
                                <button
                                    key={cat.id}
                                    onClick={() => setEmojiCat(cat.id)}
                                    className={emojiCat === cat.id ? cs.pillEmojiActive : cs.pillEmoji}
                                    style={{
                                        borderColor: emojiCat === cat.id ? accent : undefined,
                                        background: emojiCat === cat.id ? accentDim : undefined,
                                    }}
                                >
                                    {cat.icon} {cat.label}
                                </button>
                            ))}
                        </div>
                        {/* Emoji grid */}
                        <div className={cs.emojiGrid}>
                            {EMOJI_CATALOG.find(c => c.id === emojiCat)?.emojis.map((em, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => {
                                        const cw = mainCanvasRef.current?.width ?? 400;
                                        const ch = mainCanvasRef.current?.height ?? 400;
                                        addOverlay(createEmojiOverlay(em, cw, ch));
                                    }}
                                    className={cs.emojiBtn}
                                    title={em}
                                >
                                    {em}
                                </button>
                            ))}
                        </div>
                        {/* Overlay list */}
                        {overlays.length > 0 && (
                            <div className={cs.overlaySection}>
                                <div className={cs.overlaySectionTitle}>
                                    Warstwy ({overlays.length})
                                </div>
                                {overlays.map(ov => (
                                    <div
                                        key={ov.id}
                                        onClick={() => setSelectedOverlayId(ov.id)}
                                        className={cs.overlayItem}
                                        style={{ background: selectedOverlayId === ov.id ? accentDim : undefined }}
                                    >
                                        <span className={cs.overlayIcon}>
                                            {ov.type === "emoji" ? (ov as EmojiOverlay).emoji
                                                : ov.type === "text" ? "T"
                                                : ov.type === "shape" ? "◆"
                                                : ov.type === "drawing" ? "✏"
                                                : "▢"}
                                        </span>
                                        <span className={cs.overlayName}>
                                            {ov.type === "text" ? (ov as TextOverlay).text.slice(0, 20)
                                                : ov.type === "emoji" ? "Emoji"
                                                : ov.type === "shape" ? (ov as ShapeOverlay).shapeKind
                                                : ov.type === "drawing" ? `Rysunek (${(ov as DrawingOverlay).strokes.length})`
                                                : ov.type === "frame" ? (ov as FrameOverlay).frameStyle
                                                : ""}
                                        </span>
                                        <button
                                            onClick={e => { e.stopPropagation(); deleteOverlay(ov.id); }}
                                            className={cs.overlayDeleteBtn}
                                        >
                                            ✕
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* ── TEXT TAB ── */}
                {activeTab === "text" && (
                    <div>
                        <OverlayToolbar api={api} />
                        <div className={cs.sectionTitleMb8}>
                            <i className="fa fa-font me-1" /> {t("photoEditor.addCaption", "Add caption")}
                        </div>
                        <Form.Control
                            as="textarea"
                            rows={2}
                            value={textDraft}
                            onChange={e => setTextDraft(e.target.value)}
                            placeholder="Wpisz tekst..."
                            className={cs.textArea}
                        />
                        <div className={cs.textBtnRow}>
                            <Button
                                variant={textBold ? "light" : "dark"} size="sm"
                                onClick={() => setTextBold(!textBold)} title="Bold"
                                className={cs.textFormatBtn} style={{ fontWeight: 700 }}
                            >B</Button>
                            <Button
                                variant={textItalic ? "light" : "dark"} size="sm"
                                onClick={() => setTextItalic(!textItalic)} title="Italic"
                                className={cs.textFormatBtn} style={{ fontStyle: "italic" }}
                            >I</Button>
                            <Button
                                variant={textOutline ? "light" : "dark"} size="sm"
                                onClick={() => setTextOutline(!textOutline)} title="Kontur"
                                className={cs.textFormatBtn}
                            >O</Button>
                            <Button
                                variant={textBg ? "light" : "dark"} size="sm"
                                onClick={() => setTextBg(!textBg)} title={t("photoEditor.background", "Background")}
                                className={cs.textFormatBtn}
                            ><i className="fa fa-square" /></Button>
                            <input
                                type="color" value={textColor}
                                onChange={e => setTextColor(e.target.value)}
                                className={cs.colorInputLg}
                                title="Kolor tekstu"
                            />
                        </div>
                        <div className={cs.sliderRow}>
                            <span className={cs.sliderLabel}>Rozmiar:</span>
                            <Form.Range
                                min={12} max={120} value={textFontSize}
                                onChange={e => setTextFontSize(Number(e.target.value))}
                                style={{ accentColor: accent, flex: 1 }}
                            />
                            <span className={cs.sliderValue} style={{ color: accent }}>{textFontSize}px</span>
                        </div>
                        <Button
                            size="sm"
                            className={cs.accentBtn}
                            style={{ background: accent, borderColor: accent }}
                            disabled={!textDraft.trim()}
                            onClick={() => {
                                const ov = createTextOverlay(textDraft);
                                ov.color = textColor;
                                ov.bold = textBold;
                                ov.italic = textItalic;
                                ov.fontSize = textFontSize;
                                ov.outlineColor = textOutline ? "#000000" : null;
                                ov.outlineWidth = textOutline ? 2 : 0;
                                ov.background = textBg ? "rgba(0,0,0,0.5)" : null;
                                addOverlay(ov);
                            }}
                        >
                            <i className="fa fa-plus me-1" /> {t("photoEditor.addText", "Add text")}
                        </Button>
                        {/* Edit selected text inline */}
                        {selectedOverlay?.type === "text" && (
                            <div className={cs.editSelectedSection}>
                                <div className={cs.editSelectedLabel}>{t("photoEditor.editSelectedText", "Edit selected text:")}</div>
                                <Form.Control
                                    as="textarea" rows={2}
                                    value={(selectedOverlay as TextOverlay).text}
                                    onChange={e => updateOverlay(selectedOverlay.id, { text: e.target.value })}
                                    onBlur={pushHistory}
                                    className={cs.textAreaSm}
                                />
                                <div className={cs.textGapRow}>
                                    <input
                                        type="color"
                                        value={(selectedOverlay as TextOverlay).color}
                                        onChange={e => { updateOverlay(selectedOverlay.id, { color: e.target.value }); }}
                                        onBlur={pushHistory}
                                        className={cs.colorInput}
                                        aria-label={t("photoEditor.textColor", "Text overlay color")}
                                    />
                                    <Button
                                        variant={(selectedOverlay as TextOverlay).bold ? "light" : "dark"} size="sm"
                                        onClick={() => { updateOverlay(selectedOverlay.id, { bold: !(selectedOverlay as TextOverlay).bold }); pushHistory(); }}
                                        className={cs.textFormatBtnSm} style={{ fontWeight: 700 }}
                                    >B</Button>
                                    <Button
                                        variant={(selectedOverlay as TextOverlay).italic ? "light" : "dark"} size="sm"
                                        onClick={() => { updateOverlay(selectedOverlay.id, { italic: !(selectedOverlay as TextOverlay).italic }); pushHistory(); }}
                                        className={cs.textFormatBtnSm} style={{ fontStyle: "italic" }}
                                    >I</Button>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* ── SHAPES TAB ── */}
                {activeTab === "shapes" && (
                    <div>
                        <OverlayToolbar api={api} />
                        {/* Shapes */}
                        <div className={cs.sectionTitle}>
                            <i className="fa fa-star me-1" /> Shapes
                        </div>
                        <div className={cs.shapeColorRow}>
                            <span className={cs.shapeColorLabel}>Stroke:</span>
                            <input type="color" value={shapeStroke} onChange={e => setShapeStroke(e.target.value)}
                                className={cs.colorInput} title="Stroke color" />
                            <span className={cs.shapeColorLabelMl}>Fill:</span>
                            <input type="color" value={shapeFill || "#ffffff"} onChange={e => setShapeFill(e.target.value)}
                                className={cs.colorInput} title={t("photoEditor.fillColor", "Fill color")} />
                            <Button variant={shapeFill ? "light" : "dark"} size="sm" onClick={() => setShapeFill(shapeFill ? "" : "#ffffff")}
                                className={cs.shapeFillToggle}>
                                {shapeFill ? "Off" : "On"}
                            </Button>
                        </div>
                        <div className={cs.sliderRow}>
                            <span className={cs.sliderLabel}>Width:</span>
                            <Form.Range min={1} max={20} value={shapeStrokeW} onChange={e => setShapeStrokeW(Number(e.target.value))}
                                style={{ accentColor: accent, flex: 1 }} />
                            <span className={cs.sliderValue} style={{ color: accent }}>{shapeStrokeW}px</span>
                        </div>
                        <div className={cs.shapeGrid}>
                            {SHAPE_CATALOG.map(sh => (
                                <button
                                    key={sh.id}
                                    title={sh.label}
                                    onClick={() => {
                                        const ov = createShapeOverlay(sh.id);
                                        ov.strokeColor = shapeStroke;
                                        ov.fillColor = shapeFill || null;
                                        ov.strokeWidth = shapeStrokeW;
                                        addOverlay(ov);
                                    }}
                                    className={cs.shapeBtn}
                                >
                                    {sh.icon}
                                </button>
                            ))}
                        </div>

                        {/* Frames */}
                        <div className={cs.sectionTitle}>
                            <i className="fa fa-picture-o me-1" /> Ramki
                        </div>
                        <div className={cs.frameColorRow}>
                            <input type="color" value={frameColor} onChange={e => setFrameColor(e.target.value)}
                                className={cs.colorInput}
                                aria-label={t("photoEditor.frameColor", "Frame color")} />
                            <div className={cs.frameThicknessWrap}>
                                <span className={cs.sliderLabel}>Grub.:</span>
                                <Form.Range min={1} max={10} value={frameThick} onChange={e => setFrameThick(Number(e.target.value))}
                                    style={{ accentColor: accent, flex: 1 }} />
                                <span className={cs.frameThicknessValue} style={{ color: accent }}>{frameThick}</span>
                            </div>
                        </div>
                        <div className={cs.frameGrid}>
                            {FRAME_CATALOG.map(fr => (
                                <button
                                    key={fr.id}
                                    title={fr.label}
                                    onClick={() => {
                                        setOverlays((prev: Overlay[]) => prev.filter(o => o.type !== "frame"));
                                        const ov = createFrameOverlay(fr.id, frameColor);
                                        ov.thickness = frameThick / 100;
                                        addOverlay(ov);
                                    }}
                                    className={cs.frameBtn}
                                >
                                    {fr.icon}
                                </button>
                            ))}
                            <button
                                title={t("photoEditor.removeFrame", "Remove frame")}
                                onClick={() => { setOverlays((prev: Overlay[]) => prev.filter(o => o.type !== "frame")); pushHistory(); }}
                                className={cs.removeFrameBtn}
                            >✕</button>
                        </div>
                    </div>
                )}

                {/* ── DRAW TAB ── */}
                {activeTab === "draw" && (
                    <div>
                        <OverlayToolbar api={api} />
                        <div className={cs.sectionTitleMb8}>
                            <i className="fa fa-paint-brush me-1" /> Freehand drawing
                        </div>
                        <div className={cs.sectionInfoMb}>
                            <i className="fa fa-info-circle me-1" />
                            Draw directly on the photo by holding the left mouse button.
                        </div>
                        <div className={cs.quickColorRow}>
                            <span className={cs.sliderLabel}>Color:</span>
                            <input
                                type="color" value={drawColor}
                                onChange={e => setDrawColor(e.target.value)}
                                className={cs.colorInputDraw}
                                aria-label={t("photoEditor.drawColor", "Drawing color")}
                            />
                            {/* Quick color presets */}
                            {["#ff0000","#ff8800","#ffff00","#00cc00","#0088ff","#8800ff","#ff00ff","#ffffff","#000000"].map(c => (
                                <div
                                    key={c}
                                    onClick={() => setDrawColor(c)}
                                    className={cs.quickColorSwatch}
                                    style={{
                                        background: c,
                                        border: drawColor === c ? `2px solid ${accent}` : undefined,
                                    }}
                                />
                            ))}
                        </div>
                        <div className={cs.sliderRow} style={{ marginBottom: 12 }}>
                            <span className={cs.sliderLabel}>Width:</span>
                            <Form.Range
                                min={1} max={30} value={drawWidth}
                                onChange={e => setDrawWidth(Number(e.target.value))}
                                style={{ accentColor: accent, flex: 1 }}
                            />
                            <span className={cs.sliderValue} style={{ color: accent }}>{drawWidth}px</span>
                        </div>
                        {/* Drawing preview circle */}
                        <div className={cs.drawPreview}>
                            <div style={{
                                width: Math.max(drawWidth, 4), height: Math.max(drawWidth, 4),
                                borderRadius: "50%", background: drawColor,
                                border: "1px solid #555",
                            }} />
                        </div>
                        <div className={cs.drawActionRow}>
                            <Button
                                variant="outline-warning"
                                size="sm"
                                onClick={() => {
                                    if (drawingOverlayRef.current) {
                                        const id = drawingOverlayRef.current.id;
                                        setOverlays((prev: Overlay[]) => prev.map(o => {
                                            if (o.id === id && o.type === "drawing") {
                                                const d = o as DrawingOverlay;
                                                if (d.strokes.length <= 1) return o;
                                                return { ...d, strokes: d.strokes.slice(0, -1) };
                                            }
                                            return o;
                                        }));
                                        pushHistory();
                                    }
                                }}
                                className={cs.drawActionBtn}
                            >
                                <i className="fa fa-undo me-1" /> Undo stroke
                            </Button>
                            <Button
                                variant="outline-danger"
                                size="sm"
                                onClick={() => {
                                    if (drawingOverlayRef.current) {
                                        deleteOverlay(drawingOverlayRef.current.id);
                                        drawingOverlayRef.current = null;
                                    }
                                }}
                                className={cs.drawActionBtn}
                            >
                                <i className="fa fa-trash me-1" /> Clear
                            </Button>
                        </div>
                        <Button
                            variant="dark" size="sm" className="mt-2 w-100"
                            onClick={() => {
                                drawingOverlayRef.current = null;
                            }}
                        >
                            <i className="fa fa-plus me-1" /> New drawing layer
                        </Button>
                    </div>
                )}

            </div>
        </div>
    );
});

PhotoEditorLeftPanel.displayName = "PhotoEditorLeftPanel";
export default PhotoEditorLeftPanel;
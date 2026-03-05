/**
 * VideoEditorLeftPanel — left sidebar with all 8 tabs for the video editor.
 * Filters, Adjust, Trim, Speed, Text, Transitions, Transform, Share.
 */

import React from "react";
import { Button, Form } from "react-bootstrap";
import { useTranslation } from "react-i18next";
import {
    VIDEO_ADJUSTMENT_SLIDERS,
    SPEED_PRESETS,
    TEXT_ANIMATIONS,
    VIDEO_TRANSITIONS,
    type VideoFilterCategory,
    formatTime,
} from "../../scripts/videoEffects";
import type { VideoEditorAPI, EditorTab } from "./useVideoEditor";
import s from "./VideoEditor.module.css";

const TAB_DEFS: { key: EditorTab; icon: string; label: string }[] = [
    { key: "filters",     icon: "fa-sliders",    label: "Filters" },
    { key: "adjust",      icon: "fa-sun-o",      label: "Adjust" },
    { key: "trim",        icon: "fa-scissors",   label: "Trim" },
    { key: "speed",       icon: "fa-tachometer", label: "Speed" },
    { key: "text",        icon: "fa-font",       label: "Text" },
    { key: "transitions", icon: "fa-random",     label: "Transitions" },
    { key: "transform",   icon: "fa-arrows-alt", label: "Transform" },
    { key: "share",       icon: "fa-share-alt",  label: "Share" },
];

interface Props {
    api: VideoEditorAPI;
}

const VideoEditorLeftPanel: React.FC<Props> = ({ api }) => {
    const { t } = useTranslation();
    const {
        accent, activeTab, setActiveTab,
        /* filters */
        filterId, setFilterId, filterIntensity, setFilterIntensity,
        filterCategory, setFilterCategory, filteredFilters,
        /* adjust */
        adjustments, handleAdjChange, resetAdjustments,
        /* trim */
        duration, currentTime, trimStart, setTrimStart, trimEnd, setTrimEnd, effectiveTrimEnd,
        /* speed */
        speed, setSpeed, volume, setVolume,
        /* text */
        textDraft, setTextDraft, textColor, setTextColor,
        textBold, setTextBold, textItalic, setTextItalic,
        textOutline, setTextOutline, textBg, setTextBg,
        textFontSize, setTextFontSize, textAnimation, setTextAnimation,
        addTextOverlay, selectedText, selectedTextId, setSelectedTextId,
        updateTextOverlay, deleteTextOverlay, textOverlays, seek,
        /* transitions */
        transitionIn, setTransitionIn, transitionOut, setTransitionOut, transitionDuration, setTransitionDuration,
        /* transform */
        rotation, setRotation, flipH, setFlipH, flipV, setFlipV,
        /* share */
        handleDownload, handleShareNative, handleSave,
    } = api;

    return (
        <div className={s.panel}>
            {/* Tab bar */}
            <div className={s.tabBar}>
                {TAB_DEFS.map((tab) => (
                    <button
                        key={tab.key}
                        onClick={() => setActiveTab(tab.key)}
                        className={s.tabBtn}
                        style={{
                            background: activeTab === tab.key ? `${accent}33` : "transparent",
                            borderBottom: activeTab === tab.key ? `2px solid ${accent}` : "2px solid transparent",
                            color: activeTab === tab.key ? accent : "#999",
                        }}
                    >
                        <i className={`fa ${tab.icon} ${s.tabIcon}`} />
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Panel content */}
            <div className={s.panelContent}>

                {/* ── FILTERS TAB ── */}
                {activeTab === "filters" && (
                    <div>
                        <div className={s.pillGroup}>
                            {(["all", "color", "cinematic", "vintage", "creative", "fun"] as VideoFilterCategory[]).map((cat) => (
                                <button key={cat} onClick={() => setFilterCategory(cat)} className={s.pill} style={{
                                    background: filterCategory === cat ? accent : "#333",
                                    color: filterCategory === cat ? "#fff" : "#aaa",
                                }}>
                                    {cat === "all" ? t("videoEditor.catAll", "All")
                                        : cat === "color" ? t("videoEditor.catColor", "Color")
                                        : cat === "cinematic" ? t("videoEditor.catCinematic", "Cinematic")
                                        : cat === "vintage" ? t("videoEditor.catVintage", "Vintage")
                                        : cat === "creative" ? t("videoEditor.catCreative", "Creative")
                                        : t("videoEditor.catFun", "Fun")}
                                </button>
                            ))}
                        </div>

                        <div className={s.cardGrid3}>
                            {filteredFilters.map((f) => (
                                <div
                                    key={f.id}
                                    onClick={() => setFilterId(f.id)}
                                    className={s.selcard}
                                    style={{
                                        border: filterId === f.id ? `2px solid ${accent}` : "2px solid transparent",
                                        background: filterId === f.id ? `${accent}22` : "#2a2a30",
                                    }}
                                >
                                    <div className={s.cardIconLg}>{f.icon}</div>
                                    {f.name}
                                </div>
                            ))}
                        </div>

                        {filterId !== "none" && (
                            <div className={s.marginTop12}>
                                <label className={s.sliderLabel}>
                                    <span>{t("videoEditor.intensity", "Intensity")}</span>
                                    <span>{Math.round(filterIntensity * 100)}%</span>
                                </label>
                                <Form.Range min={0} max={100} value={filterIntensity * 100}
                                    onChange={(e) => setFilterIntensity(Number(e.target.value) / 100)}
                                    style={{ accentColor: accent }}
                                />
                            </div>
                        )}
                    </div>
                )}

                {/* ── ADJUST TAB ── */}
                {activeTab === "adjust" && (
                    <div>
                        {VIDEO_ADJUSTMENT_SLIDERS.map((sl) => (
                            <div key={sl.key} className={s.sliderGroup}>
                                <div className={s.sliderLabel}>
                                    <span><i className={`fa ${sl.icon} me-1`} />{sl.label}</span>
                                    <span style={{ color: adjustments[sl.key] !== 0 ? accent : "#666" }}>
                                        {adjustments[sl.key]}
                                    </span>
                                </div>
                                <Form.Range
                                    min={sl.min} max={sl.max} value={adjustments[sl.key]}
                                    onChange={(e) => handleAdjChange(sl.key, Number(e.target.value))}
                                    style={{ accentColor: accent }}
                                />
                            </div>
                        ))}
                        <Button variant="dark" size="sm" className="w-100 mt-2" onClick={resetAdjustments}>
                            <i className="fa fa-refresh me-1" /> {t("videoEditor.resetAdjustments", "Reset adjustments")}
                        </Button>
                    </div>
                )}

                {/* ── TRIM TAB ── */}
                {activeTab === "trim" && (
                    <div>
                        <p className={s.hint}>
                            {t("videoEditor.trimHint", "Drag handles on the timeline or set values manually.")}
                        </p>

                        <div className={s.sliderGroup12}>
                            <label className={s.labelSmall}>{t("videoEditor.start", "Start")}</label>
                            <div className={s.inputRow}>
                                <Form.Range min={0} max={duration * 1000} value={trimStart * 1000}
                                    onChange={(e) => setTrimStart(Number(e.target.value) / 1000)}
                                    className={s.sliderFlex}
                                    style={{ accentColor: accent }}
                                />
                                <span className={s.timeValue} style={{ color: accent }}>{formatTime(trimStart)}</span>
                            </div>
                        </div>

                        <div className={s.sliderGroup12}>
                            <label className={s.labelSmall}>{t("videoEditor.end", "End")}</label>
                            <div className={s.inputRow}>
                                <Form.Range min={0} max={duration * 1000} value={(trimEnd || duration) * 1000}
                                    onChange={(e) => setTrimEnd(Number(e.target.value) / 1000)}
                                    className={s.sliderFlex}
                                    style={{ accentColor: accent }}
                                />
                                <span className={s.timeValue} style={{ color: accent }}>{formatTime(effectiveTrimEnd)}</span>
                            </div>
                        </div>

                        <div className={s.infoCard}>
                            <span className={s.infoLabel}>{t("videoEditor.duration", "Duration")}:</span>
                            <span className={s.accentBold} style={{ color: accent }}>
                                {formatTime(effectiveTrimEnd - trimStart)}
                            </span>
                        </div>

                        <div className="d-flex gap-2 mt-3">
                            <Button variant="dark" size="sm" className="flex-fill"
                                onClick={() => setTrimStart(currentTime)} title={t("videoEditor.setStartTooltip", "Set start to current position")}>
                                <i className="fa fa-step-backward me-1" /> {t("videoEditor.setStart", "Set start")}
                            </Button>
                            <Button variant="dark" size="sm" className="flex-fill"
                                onClick={() => setTrimEnd(currentTime)} title={t("videoEditor.setEndTooltip", "Set end to current position")}>
                                {t("videoEditor.setEnd", "Set end")} <i className="fa fa-step-forward ms-1" />
                            </Button>
                        </div>

                        <Button variant="dark" size="sm" className="w-100 mt-2"
                            onClick={() => { setTrimStart(0); setTrimEnd(0); }}>
                            <i className="fa fa-refresh me-1" /> {t("videoEditor.resetTrim", "Reset trim")}
                        </Button>
                    </div>
                )}

                {/* ── SPEED TAB ── */}
                {activeTab === "speed" && (
                    <div>
                        <p className={s.hint}>
                            {t("videoEditor.speedHint", "Change video playback speed.")}
                        </p>

                        <div className={s.cardGrid4}>
                            {SPEED_PRESETS.map((sp) => (
                                <div
                                    key={sp.id}
                                    onClick={() => setSpeed(sp.rate)}
                                    className={s.selcardSpeed}
                                    style={{
                                        border: speed === sp.rate ? `2px solid ${accent}` : "2px solid transparent",
                                        background: speed === sp.rate ? `${accent}22` : "#2a2a30",
                                    }}
                                >
                                    <div className={s.cardIcon}>{sp.icon}</div>
                                    {sp.label}
                                </div>
                            ))}
                        </div>

                        <div className={s.sliderGroup12}>
                            <label className={s.sliderLabel}>
                                <span>{t("videoEditor.speed", "Speed")}</span>
                                <span style={{ color: accent }}>{speed.toFixed(2)}×</span>
                            </label>
                            <Form.Range min={25} max={300} value={speed * 100}
                                onChange={(e) => setSpeed(Number(e.target.value) / 100)}
                                style={{ accentColor: accent }}
                            />
                        </div>

                        <div className={s.sliderGroup12}>
                            <label className={s.sliderLabel}>
                                <span><i className="fa fa-volume-up me-1" />{t("videoEditor.volume", "Volume")}</span>
                                <span style={{ color: accent }}>{Math.round(volume * 100)}%</span>
                            </label>
                            <Form.Range min={0} max={100} value={volume * 100}
                                onChange={(e) => setVolume(Number(e.target.value) / 100)}
                                style={{ accentColor: accent }}
                            />
                        </div>

                        {speed !== 1 && (
                            <div className={s.infoCardSm}>
                                {t("videoEditor.newDuration", "New duration")}: <span className={s.accentBold} style={{ color: accent }}>
                                    {formatTime((effectiveTrimEnd - trimStart) / speed)}
                                </span>
                            </div>
                        )}
                    </div>
                )}

                {/* ── TEXT TAB ── */}
                {activeTab === "text" && (
                    <div>
                        <textarea
                            value={textDraft}
                            onChange={(e) => setTextDraft(e.target.value)}
                            rows={2}
                            className={s.textarea}
                            aria-label={t("videoEditor.textOverlayDraft", "Text overlay content")}
                        />

                        <div className="d-flex gap-2 my-2 flex-wrap">
                            <Button variant={textBold ? "light" : "dark"} size="sm" onClick={() => setTextBold(!textBold)} className={s.boldBtn} aria-label="Bold">B</Button>
                            <Button variant={textItalic ? "light" : "dark"} size="sm" onClick={() => setTextItalic(!textItalic)} className={s.italicBtn} aria-label="Italic">I</Button>
                            <Button variant={textOutline ? "light" : "dark"} size="sm" onClick={() => setTextOutline(!textOutline)} className={s.textFormatBtn} aria-label="Outline">O</Button>
                            <Button variant={textBg ? "light" : "dark"} size="sm" onClick={() => setTextBg(!textBg)} className={s.textFormatBtn} aria-label="Background">BG</Button>
                            <input type="color" value={textColor} onChange={(e) => setTextColor(e.target.value)}
                                className={s.colorInput}
                                aria-label={t("videoEditor.textColor", "Text color")}
                            />
                        </div>

                        <div className={s.sliderGroup}>
                            <label className={s.sliderLabel}>
                                <span>{t("videoEditor.fontSize", "Font size")}</span><span>{textFontSize}px</span>
                            </label>
                            <Form.Range min={12} max={120} value={textFontSize}
                                onChange={(e) => setTextFontSize(Number(e.target.value))}
                                style={{ accentColor: accent }}
                            />
                        </div>

                        <div className={s.sliderGroup}>
                            <label className={s.sectionLabel}>{t("videoEditor.animation", "Animation")}</label>
                            <div className={s.pillGroup}>
                                {TEXT_ANIMATIONS.map((ta) => (
                                    <button key={ta.id} onClick={() => setTextAnimation(ta.id)} className={s.pillAnim} style={{
                                        background: textAnimation === ta.id ? accent : "#333",
                                        color: textAnimation === ta.id ? "#fff" : "#aaa",
                                    }}>
                                        {ta.icon} {ta.name}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <Button variant="outline-light" size="sm" className="w-100 mb-3" onClick={addTextOverlay}>
                            <i className="fa fa-plus me-1" /> {t("videoEditor.addTextAtCurrent", "Add text at current moment")}
                        </Button>

                        {selectedText && (
                            <div className={s.selectedTextCard} style={{ border: `1px solid ${accent}44` }}>
                                <div className={s.editingTitle} style={{ color: accent }}>
                                    {t("videoEditor.editing", "Editing")}: &ldquo;{selectedText.text.slice(0, 20)}&rdquo;
                                </div>
                                <textarea rows={2} value={selectedText.text}
                                    onChange={(e) => updateTextOverlay(selectedText.id, { text: e.target.value })}
                                    className={s.editTextarea}
                                    aria-label={t("videoEditor.editTextOverlay", "Edit text overlay")}
                                />
                                <div className="d-flex gap-2 mt-1">
                                    <div className={s.rangeGroup}>
                                        <label className={s.labelXs}>{t("videoEditor.from", "From")}</label>
                                        <Form.Range min={0} max={duration * 1000} value={selectedText.startTime * 1000}
                                            onChange={(e) => updateTextOverlay(selectedText.id, { startTime: Number(e.target.value) / 1000 })}
                                            style={{ accentColor: accent }}
                                        />
                                        <span className={s.timeXs}>{formatTime(selectedText.startTime)}</span>
                                    </div>
                                    <div className={s.rangeGroup}>
                                        <label className={s.labelXs}>{t("videoEditor.to", "To")}</label>
                                        <Form.Range min={0} max={duration * 1000} value={selectedText.endTime * 1000}
                                            onChange={(e) => updateTextOverlay(selectedText.id, { endTime: Number(e.target.value) / 1000 })}
                                            style={{ accentColor: accent }}
                                        />
                                        <span className={s.timeXs}>{formatTime(selectedText.endTime)}</span>
                                    </div>
                                </div>
                                <Button variant="outline-danger" size="sm" className="mt-2 w-100" onClick={() => deleteTextOverlay(selectedText.id)}>
                                    <i className="fa fa-trash me-1" /> {t("common.delete", "Delete")}
                                </Button>
                            </div>
                        )}

                        {textOverlays.length > 0 && (
                            <div>
                                <label className={s.sectionLabel}>
                                    {t("videoEditor.overlays", "Overlays")} ({textOverlays.length})
                                </label>
                                {textOverlays.map((ov) => (
                                    <div
                                        key={ov.id}
                                        onClick={() => { setSelectedTextId(ov.id); seek(ov.startTime); }}
                                        className={s.overlayItem}
                                        style={{
                                            background: selectedTextId === ov.id ? `${accent}22` : "#2a2a30",
                                            border: selectedTextId === ov.id ? `1px solid ${accent}` : "1px solid transparent",
                                        }}
                                    >
                                        <span className={s.overlayText}>{ov.text}</span>
                                        <span className={s.overlayTime}>
                                            {formatTime(ov.startTime)}–{formatTime(ov.endTime)}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* ── TRANSITIONS TAB ── */}
                {activeTab === "transitions" && (
                    <div>
                        <p className={s.hint}>
                            {t("videoEditor.transitionsHint", "Transitions applied at the start/end of the clip. The backend will process them during export.")}
                        </p>

                        <label className={s.sectionLabel}>{t("videoEditor.transitionIn", "Transition In")}</label>
                        <div className={`${s.cardGrid3} ${s.mb14}`}>
                            {VIDEO_TRANSITIONS.map((tr) => (
                                <div
                                    key={tr.id}
                                    onClick={() => setTransitionIn(tr.id)}
                                    className={s.selcard}
                                    style={{
                                        border: transitionIn === tr.id ? `2px solid ${accent}` : "2px solid transparent",
                                        background: transitionIn === tr.id ? `${accent}22` : "#2a2a30",
                                    }}
                                >
                                    <div className={s.cardIconSm}>{tr.icon}</div>
                                    {tr.name}
                                </div>
                            ))}
                        </div>

                        <label className={s.sectionLabel}>{t("videoEditor.transitionOut", "Transition Out")}</label>
                        <div className={`${s.cardGrid3} ${s.mb14}`}>
                            {VIDEO_TRANSITIONS.map((tr) => (
                                <div
                                    key={tr.id}
                                    onClick={() => setTransitionOut(tr.id)}
                                    className={s.selcard}
                                    style={{
                                        border: transitionOut === tr.id ? `2px solid ${accent}` : "2px solid transparent",
                                        background: transitionOut === tr.id ? `${accent}22` : "#2a2a30",
                                    }}
                                >
                                    <div className={s.cardIconSm}>{tr.icon}</div>
                                    {tr.name}
                                </div>
                            ))}
                        </div>

                        <div className={s.sliderGroup12}>
                            <label className={s.sliderLabel}>
                                <span>{t("videoEditor.transitionDuration", "Transition duration")}</span>
                                <span style={{ color: accent }}>{transitionDuration.toFixed(1)}s</span>
                            </label>
                            <Form.Range min={1} max={30} value={transitionDuration * 10}
                                onChange={(e) => setTransitionDuration(Number(e.target.value) / 10)}
                                style={{ accentColor: accent }}
                            />
                        </div>
                    </div>
                )}

                {/* ── TRANSFORM TAB ── */}
                {activeTab === "transform" && (
                    <div>
                        <label className={s.sectionLabel8}>{t("videoEditor.rotation", "Rotation")}</label>
                        <div className="d-flex gap-2 mb-3">
                            {[0, 90, 180, 270].map((deg) => (
                                <Button key={deg} variant={rotation === deg ? "light" : "dark"} size="sm"
                                    onClick={() => setRotation(deg)} className={s.rotationBtn}
                                >
                                    {deg}°
                                </Button>
                            ))}
                        </div>

                        <label className={s.sectionLabel8}>{t("videoEditor.flip", "Flip")}</label>
                        <div className="d-flex gap-2 mb-3">
                            <Button variant={flipH ? "light" : "dark"} size="sm" className="flex-fill" onClick={() => setFlipH(!flipH)}>
                                <i className="fa fa-arrows-h me-1" /> {t("videoEditor.horizontal", "Horizontal")}
                            </Button>
                            <Button variant={flipV ? "light" : "dark"} size="sm" className="flex-fill" onClick={() => setFlipV(!flipV)}>
                                <i className="fa fa-arrows-v me-1" /> {t("videoEditor.vertical", "Vertical")}
                            </Button>
                        </div>
                    </div>
                )}

                {/* ── SHARE TAB ── */}
                {activeTab === "share" && (
                    <div>
                        <p className={s.hint}>
                            {t("videoEditor.shareHint", "Download or share your video.")}
                        </p>

                        <Button variant="dark" size="sm" className="w-100 mb-2" onClick={handleDownload}>
                            <i className="fa fa-download me-2" /> {t("videoEditor.downloadVideo", "Download video")}
                        </Button>
                        <Button variant="dark" size="sm" className="w-100 mb-2" onClick={handleShareNative}>
                            <i className="fa fa-share-alt me-2" /> {t("videoEditor.shareNative", "Share (native)")}
                        </Button>
                        <Button variant="dark" size="sm" className="w-100 mb-2" onClick={handleSave}>
                            <i className="fa fa-cloud-upload me-2" /> {t("videoEditor.saveAndSend", "Save & send")}
                        </Button>

                        <hr className={s.hr} />

                        <p className={s.note}>
                            {t("videoEditor.shareNote", "Effects (filters, trim, text, transitions) will be applied server-side during export.")}
                        </p>
                    </div>
                )}

            </div>
        </div>
    );
};

export default React.memo(VideoEditorLeftPanel);

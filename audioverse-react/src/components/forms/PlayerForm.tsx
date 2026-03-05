import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useTranslation } from "react-i18next";
import { useAvailablePlayers } from "../../hooks/useAvailablePlayers";
import { Form, Button, Container, Modal } from "react-bootstrap";
import FontAwesomeIconPicker from "./FontAwesomeIconPicker";
import { PLAYER_COLORS, getNextPlayerColor } from "../../constants/playerColors";
import { PlayerService } from "../../services/PlayerService";
import { useGameContext, type PitchAlgorithm } from "../../contexts/GameContext";
import { useUser } from "../../contexts/UserContext";
import { Focusable } from "../common/Focusable";
import { useGamepadNavigation } from "../../contexts/GamepadNavigationContext";
import { API_ROOT } from "../../config/apiConfig";
import {
    ALL_CAP_STYLES,
    OVERLAY_PATTERNS,
    renderGlossyBarSvg,
    loadKaraokeSettings,
    saveKaraokeSettings,
    DEFAULT_KARAOKE_SETTINGS,
} from "../../scripts/karaoke/glossyBarRenderer";
import type { PlayerKaraokeSettings, KaraokeBarFill, KaraokeFontSettings } from "../../scripts/karaoke/glossyBarRenderer";
import { syncPlayerKaraokeSettingsToBackend } from "../../scripts/karaoke/karaokeSettings";
import { FONT_CATALOG, ensureFontLoaded } from "../../scripts/karaoke/fontCatalog";
import BarFillEditor from "./BarFillEditor";
import PhotoEditor from "./PhotoEditor";
import { logger } from "../../utils/logger";
import pfStyles from "./PlayerForm.module.css";

const log = logger.scoped('PlayerForm');


interface PlayerSaveResult {
    name?: string;
    color?: string;
    player?: { name?: string; color?: string };
    [key: string]: unknown;
}

interface PlayerPayload {
    id?: number;
    name: string;
    color: string;
    preferredColors?: string[];
    email?: string;
    icon?: string;
    photo?: File;
}

interface PlayerFormProps {
    onSuccess?: () => void;
    onSaved?: (player: PlayerSaveResult) => void;
    initialName?: string;
    initialColor?: string;
    playerId?: number;
}


const PlayerForm = ({ onSuccess, onSaved, initialName = "Player", initialColor, playerId }: PlayerFormProps) => {
    const { t } = useTranslation();
    const { state, micAlgorithms, setMicAlgorithm, defaultPitchAlgorithm } = useGameContext();
    const { setActive } = useGamepadNavigation();

    // Auto-focus first focusable element when form mounts (modal opens)
    useEffect(() => {
        const timer = setTimeout(() => setActive("player-form-select"), 200);
        return () => clearTimeout(timer);
    }, [setActive]);
    const usedColors = state.players.map(p => (p.color || "")).filter(Boolean);
    const defaultColor = initialColor || getNextPlayerColor(usedColors);
    const [playerName, setPlayerName] = useState(initialName);
    const [color, setColor] = useState(defaultColor);
    const [preferredColors, setPreferredColors] = useState<string[]>(initialColor ? [initialColor] : []);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [selectedPlayerId] = useState<number | undefined>(playerId);
    const { players: availablePlayers } = useAvailablePlayers(playerId);
    const [karaokeSettings, setKaraokeSettings] = useState<PlayerKaraokeSettings>(() => loadKaraokeSettings(playerId));
    const [email, setEmail] = useState('');
    const [icon, setIcon] = useState('fa-user');
    const [photoFile, setPhotoFile] = useState<File | null>(null);
    const [photoPreview, setPhotoPreview] = useState<string | null>(null);
    const photoInputRef = useRef<HTMLInputElement>(null);
    const [photoEditorOpen, setPhotoEditorOpen] = useState(false);
    const [photoEditorSrc, setPhotoEditorSrc] = useState<File | string | null>(null);
    const [barStyleOpen, setBarStyleOpen] = useState(false);
    const [filledBarOpen, setFilledBarOpen] = useState(true);
    const [emptyBarOpen, setEmptyBarOpen] = useState(false);
    const [goldFilledBarOpen, setGoldFilledBarOpen] = useState(false);
    const [goldEmptyBarOpen, setGoldEmptyBarOpen] = useState(false);

    /** Persist karaoke settings to localStorage whenever they change */
    useEffect(() => { saveKaraokeSettings(karaokeSettings, selectedPlayerId); }, [karaokeSettings, selectedPlayerId]);

    /** Eagerly load selected custom font so canvas and previews work */
    useEffect(() => { if (karaokeSettings.font.fontFamily) ensureFontLoaded(karaokeSettings.font.fontFamily); }, [karaokeSettings.font.fontFamily]);

    /** Update a single bar fill */
    const patchFill = useCallback((barKey: 'filledBar' | 'emptyBar' | 'goldFilledBar' | 'goldEmptyBar', fill: KaraokeBarFill) => {
        setKaraokeSettings(prev => ({ ...prev, [barKey]: fill }));
    }, []);

    /** Update a single font field */
    const patchFont = useCallback(<K extends keyof KaraokeFontSettings>(key: K, val: KaraokeFontSettings[K]) => {
        setKaraokeSettings(prev => ({ ...prev, font: { ...prev.font, [key]: val } }));
    }, []);

    /** Small inline SVG preview of a bar with given style overrides */
    const barPreview = useMemo(() => {
        const fb = karaokeSettings.filledBar;
        const previewColor = fb.color || color || '#2196f3';
        return (capName: string, patName: string | null, textureUrl?: string | null) => {
            const cap = ALL_CAP_STYLES.find(c => c.name === capName) || ALL_CAP_STYLES[0];
            const pat = patName ? OVERLAY_PATTERNS.find(p => p.name === patName) ?? null : null;
            return renderGlossyBarSvg({
                width: 80, height: 22,
                capStyle: cap,
                color: previewColor,
                highlight: fb.highlight,
                glow: fb.glow,
                glass: 0,
                pattern: pat,
                patternColor: fb.patternColor,
                patternOnly: fb.patternOnly,
                textureUrl: textureUrl ?? null,
                textureScale: fb.textureScale,
            });
        };
    }, [color, karaokeSettings.filledBar]);

    // When editing an existing player (selectedPlayerId present) and availablePlayers are loaded,
    // prefer the backend player's name/color over the local initialName (which may be auto-generated "Gracz X").
    useEffect(() => {
        if (selectedPlayerId && Array.isArray(availablePlayers)) {
            const found = availablePlayers.find(p => p.id === selectedPlayerId);
            if (found) {
                setPlayerName(found.name || '');
                // read preferredColors (may be comma-separated string or array) or fallback to color
                const foundRecord = found as unknown as Record<string, unknown>;
                const pc = foundRecord.preferredColors ?? foundRecord.preferredColorsString ?? foundRecord.preferred_colors ?? foundRecord.preferredColorsCsv;
                let parsed: string[] = [];
                if (typeof pc === 'string' && pc.trim().length > 0) {
                    parsed = pc.split(',').map((s: string) => s.trim()).filter(Boolean);
                } else if (Array.isArray(foundRecord.preferredColors)) {
                    parsed = foundRecord.preferredColors as string[];
                } else if (found.color) {
                    parsed = [found.color];
                }
                setPreferredColors(parsed.length ? parsed : (found.color ? [found.color] : []));
                setColor(parsed[0] || found.color || defaultColor);
                // Load new backend fields
                setEmail((foundRecord.email as string) || '');
                setIcon((foundRecord.icon as string) || '');
                // Photo preview from backend
                const pUrl = foundRecord.photoUrl as string | null;
                setPhotoPreview(pUrl ? `${API_ROOT}${pUrl}` : null);
                setPhotoFile(null);
            }
        }
        // Runs only on player selection change; defaultColor and API_ROOT are stable
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedPlayerId, availablePlayers]);

    const { currentUser: _currentUser, userId } = useUser();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!userId) {
            setError(t("playerForm.waitingProfile"));
            return;
        }
        setLoading(true);
        setError(null);
        try {
            const profileId = userId;
                log.debug('profileId:', profileId, 'selectedPlayerId:', selectedPlayerId);
                    if (selectedPlayerId) {
                        const payload: PlayerPayload = { id: selectedPlayerId, name: playerName, color, email: email || undefined, icon: icon || undefined };
                        if (preferredColors && preferredColors.length) payload.preferredColors = preferredColors;
                        const updated = await PlayerService.update(profileId, selectedPlayerId, payload);
                        log.debug('update response:', updated);
                        // Upload photo separately on update
                        if (photoFile) {
                            await PlayerService.uploadPhoto(profileId, selectedPlayerId, photoFile);
                        }
                        if (onSaved) onSaved({ ...updated, name: (updated?.player ?? updated)?.name ?? playerName, color: (updated?.player ?? updated)?.color ?? color });
                        // Sync karaoke settings to backend after successful player update
                        syncPlayerKaraokeSettingsToBackend(profileId, selectedPlayerId, karaokeSettings);
                    } else {
                        const payload: PlayerPayload = { name: playerName, color, email: email || undefined, icon: icon || undefined };
                        if (preferredColors && preferredColors.length) payload.preferredColors = preferredColors;
                        if (photoFile) payload.photo = photoFile;
                        const created = await PlayerService.create(profileId, payload);
                        log.debug('create response:', created);
                        if (onSaved) onSaved({ ...created, name: (created?.player ?? created)?.name ?? playerName, color: (created?.player ?? created)?.color ?? color });
                        // Sync karaoke settings to backend for newly created player
                        const newId = (created?.player ?? created)?.id as number | undefined;
                        if (newId) {
                            syncPlayerKaraokeSettingsToBackend(profileId, newId, karaokeSettings);
                        }
                    }
            if (onSuccess) onSuccess();
            } catch (err: unknown) {
                log.error('save error:', err);
                const msg = err instanceof Error ? err.message : (selectedPlayerId ? t("playerForm.editError") : t("playerForm.addError"));
                setError(msg);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!selectedPlayerId) {
            // If new/unsaved, just call onSuccess to close modal
            if (onSuccess) onSuccess();
            return;
        }
        setLoading(true);
        setError(null);
        try {
            if (!userId) {
                setError(t("playerForm.noProfile"));
                setLoading(false);
                return;
            }
            await PlayerService.delete(userId, selectedPlayerId);
            if (onSuccess) onSuccess();
        } catch (err: unknown) {
            log.error('delete error:', err);
            setError(err instanceof Error ? err.message : t("playerForm.deleteError"));
        } finally {
            setLoading(false);
        }
    };

    return (
        <Container className={pfStyles.container}>
            <Form onSubmit={handleSubmit}>
                {/* ── Name + Email row ── */}
                <div className="row mb-3">
                    <div className="col-12 col-md-6">
                        <Form.Group>
                            <Form.Label className={pfStyles.formLabel}>{t("playerForm.playerName")}</Form.Label>
                            <Focusable id="player-form-name">
                                <Form.Control
                                    type="text"
                                    placeholder={t("playerForm.playerName")}
                                    value={playerName}
                                    onChange={(e) => setPlayerName(e.target.value)}
                                />
                            </Focusable>
                        </Form.Group>
                    </div>
                    <div className="col-12 col-md-6">
                        <Form.Group>
                            <Form.Label className={pfStyles.formLabel}>{t("playerForm.email", "Email")}</Form.Label>
                            <Focusable id="player-form-email">
                                <Form.Control
                                    type="email"
                                    placeholder="gracz@example.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                            </Focusable>
                        </Form.Group>
                    </div>
                </div>
                {/* ── Photo + Icon row ── */}
                <div className="row mb-3">
                    {/* Photo */}
                    <div className="col-12 col-md-6">
                        <Form.Label className={pfStyles.formLabel}>{t("playerForm.photo", "Photo")}</Form.Label>
                        <div className="d-flex align-items-center gap-3">
                            <div
                                className={pfStyles.photoBox}
                                style={{
                                    background: photoPreview
                                        ? `url(${photoPreview}) center / cover no-repeat`
                                        : (color || 'rgba(255,255,255,0.1)'),
                                }}
                                onClick={() => {
                                    if (photoPreview) {
                                        setPhotoEditorSrc(photoFile || photoPreview);
                                        setPhotoEditorOpen(true);
                                    } else {
                                        photoInputRef.current?.click();
                                    }
                                }}
                                title={photoPreview ? t("playerForm.clickToEdit", "Click to edit") : t("playerForm.clickToUpload", "Click to choose a photo")}
                            >
                                {photoPreview ? (
                                    <div className={pfStyles.photoOverlay}>
                                        <div className={pfStyles.photoLabel}>
                                            {playerName || 'Gracz'}
                                        </div>
                                    </div>
                                ) : (
                                    <span className={pfStyles.photoPlaceholder}>
                                        <i className="fa fa-camera" aria-hidden="true" />
                                    </span>
                                )}
                            </div>
                            <div className="d-flex flex-column gap-1">
                                <input
                                    ref={photoInputRef}
                                    type="file"
                                    accept="image/*"
                                style={{ display: 'none' }}
                                    onChange={(e) => {
                                        const f = e.target.files?.[0];
                                        if (f) {
                                            setPhotoEditorSrc(f);
                                            setPhotoEditorOpen(true);
                                        }
                                        e.target.value = '';
                                    }}
                                />
                                <Button
                                    variant="outline-secondary"
                                    size="sm"
                                    onClick={() => photoInputRef.current?.click()}
                                >
                                    <i className="fa fa-upload me-1" aria-hidden="true" />
                                    {t("playerForm.choosePhoto", "Choose")}
                                </Button>
                                {photoPreview && (
                                    <div className="d-flex gap-1">
                                        <Button
                                            variant="outline-info"
                                            size="sm"
                                            onClick={() => {
                                                setPhotoEditorSrc(photoFile || photoPreview);
                                                setPhotoEditorOpen(true);
                                            }}
                                        >
                                            <i className="fa fa-magic" aria-hidden="true" />
                                        </Button>
                                        <Button
                                            variant="outline-danger"
                                            size="sm"
                                            onClick={() => { setPhotoFile(null); setPhotoPreview(null); }}
                                        >
                                            <i className="fa fa-times" aria-hidden="true" />
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                    {/* Icon */}
                    <div className="col-12 col-md-6 mt-2 mt-md-0">
                        <Form.Label className={pfStyles.formLabel}>{t("playerForm.icon", "Ikona")}</Form.Label>
                        <div className="d-flex align-items-center gap-3">
                            {/* Icon preview box */}
                            <div className={pfStyles.iconBox} style={{
                                background: color || 'rgba(255,255,255,0.1)',
                            }}>
                                <i className={`fa ${icon || 'fa-user'}`} style={{ fontSize: 32, color: '#fff' }} aria-hidden="true" />
                            </div>
                            <FontAwesomeIconPicker
                                value={icon || 'fa-user'}
                                onChange={setIcon}
                                playerColor={color}
                            />
                        </div>
                    </div>
                </div>

                {/* ── PhotoEditor modal ── */}
                {photoEditorOpen && photoEditorSrc && (
                    <Modal
                        show
                        onHide={() => setPhotoEditorOpen(false)}
                        size="xl"
                        centered
                        contentClassName="bg-transparent border-0"
                        backdropClassName=""
                        style={{ zIndex: 1090 }}
                    >
                        <PhotoEditor
                            src={photoEditorSrc}
                            playerColor={color}
                            onSave={(editedFile) => {
                                setPhotoFile(editedFile);
                                setPhotoPreview(URL.createObjectURL(editedFile));
                                setPhotoEditorOpen(false);
                            }}
                            onCancel={() => setPhotoEditorOpen(false)}
                        />
                    </Modal>
                )}

                <Form.Group className="mb-3">
                    <Form.Label className={pfStyles.formLabel}>{t("playerForm.playerColor")}</Form.Label>
                    <div className={pfStyles.colorPalette}>
                        {PLAYER_COLORS.map((c) => {
                            const idx = preferredColors.findIndex(pc => pc === c);
                            const selected = idx !== -1;
                            const isDisabled = usedColors.includes(c) && c !== color;
                            return (
                                <Focusable id={`player-form-color-${c.replace('#', '')}`} key={c}>
                                    <div
                                        onClick={() => {
                                            if (isDisabled) return;
                                            if (selected) {
                                                setPreferredColors(prev => prev.filter(x => x !== c));
                                            } else {
                                                setPreferredColors(prev => [...prev, c]);
                                            }
                                            setColor(prev => {
                                                const newPref = selected ? preferredColors.filter(x => x !== c) : [...preferredColors, c];
                                                return newPref[0] || prev;
                                            });
                                        }}
                                        className={pfStyles.colorSwatch}
                                        style={{
                                            background: c,
                                            border: selected ? "3px solid #fff" : "2px solid rgba(255,255,255,0.25)",
                                            cursor: isDisabled ? "not-allowed" : "pointer",
                                            opacity: isDisabled ? 0.3 : 1,
                                            boxShadow: selected ? `0 0 8px 2px ${c}88` : undefined,
                                        }}
                                        title={c}
                                        tabIndex={isDisabled ? -1 : 0}
                                        aria-disabled={isDisabled}
                                    >
                                        {selected && (
                                            <div className={pfStyles.swatchBadge}>
                                                {idx + 1}
                                            </div>
                                        )}
                                    </div>
                                </Focusable>
                            );
                        })}
                    </div>
                </Form.Group>

                {/* Preferred colors as horizontal draggable strip */}
                {preferredColors.length > 0 && (
                    <div className={pfStyles.preferredStrip}>
                        <div className={pfStyles.preferredStripInner}>
                            {preferredColors.map((pc, i) => (
                                <div
                                    key={pc}
                                    draggable
                                    onDragStart={e => {
                                        e.dataTransfer.setData('text/plain', String(i));
                                        e.dataTransfer.effectAllowed = 'move';
                                    }}
                                    onDragOver={e => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; }}
                                    onDrop={e => {
                                        e.preventDefault();
                                        const fromIdx = parseInt(e.dataTransfer.getData('text/plain'));
                                        if (isNaN(fromIdx) || fromIdx === i) return;
                                        setPreferredColors(prev => {
                                            const copy = [...prev];
                                            const [item] = copy.splice(fromIdx, 1);
                                            copy.splice(i, 0, item);
                                            return copy;
                                        });
                                    }}
                                    onClick={() => {
                                        // Remove on click
                                        setPreferredColors(prev => prev.filter(x => x !== pc));
                                    }}
                                    className={pfStyles.preferredSwatch}
                                    style={{
                                        background: pc,
                                        borderRight: i < preferredColors.length - 1 ? '1px solid rgba(0,0,0,0.2)' : 'none',
                                    }}
                                    title={`#${i + 1} – ${pc} (click to remove, drag to reorder)`}
                                >
                                    <span className={pfStyles.preferredSwatchLabel}>
                                        {i + 1}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
                {/* ── Pitch algorithm per player ── */}
                {playerId != null && (
                    <div style={{ marginBottom: 12 }}>
                        <Form.Label className={pfStyles.pitchLabel}>
                            {t("playerForm.pitchAlgorithm", "Pitch algorithm")}
                        </Form.Label>
                        <Form.Select
                            size="sm"
                            value={micAlgorithms[playerId] || defaultPitchAlgorithm}
                            onChange={e => setMicAlgorithm(playerId, e.target.value as PitchAlgorithm)}
                        >
                            <option value="autocorr">{t("playerForm.algAutocorr", "Autocorrelation")}</option>
                            <option value="pitchy">{t("playerForm.algPitchy", "Pitchy (local)")}</option>
                            <option value="crepe">{t("playerForm.algCrepe", "CREPE (server)")}</option>
                            <option value="librosa">{t("playerForm.algLibrosa", "Librosa pYIN (server)")}</option>
                        </Form.Select>
                    </div>
                )}
                {/* ── Disable gold notes (hidden for now) ── */}
                {/* ── Bar style chooser ── */}
                <div className={pfStyles.sectionWrap}>
                    <div
                        className={pfStyles.sectionHeader}
                        onClick={() => setBarStyleOpen(o => !o)}
                    >
                        <span className={pfStyles.sectionArrowLg} style={{ transform: barStyleOpen ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform .15s' }}>▶</span>
                        <Form.Label className={`mb-0 ${pfStyles.formLabelBold}`} style={{ cursor: 'pointer' }}>
                            {t("playerForm.barStyle", "Bar style")}
                        </Form.Label>
                        {/* live preview of current bar style */}
                        <span dangerouslySetInnerHTML={{ __html: barPreview(karaokeSettings.filledBar.capStyleName, karaokeSettings.filledBar.patternName, karaokeSettings.filledBar.textureUrl) }} />
                    </div>

                    {barStyleOpen && (
                        <div className={pfStyles.barContent}>

                            {/* ── Filled bar ── */}
                            <div className={pfStyles.barSection}>
                                <div
                                    className={pfStyles.sectionHeader}
                                    onClick={() => setFilledBarOpen(o => !o)}
                                >
                                    <span className={pfStyles.sectionArrowSm} style={{ transform: filledBarOpen ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform .15s' }}>▶</span>
                                    <Form.Label className={`mb-0 ${pfStyles.formLabelSmBold}`} style={{ cursor: 'pointer' }}>
                                        {t("playerForm.filledBar", "🎵 Filled bar (hit)")}
                                    </Form.Label>
                                </div>
                                {filledBarOpen && (
                                    <BarFillEditor
                                        fill={karaokeSettings.filledBar}
                                        onChange={fill => patchFill('filledBar', fill)}
                                        previewColor={color || '#2196f3'}
                                    />
                                )}
                            </div>

                            {/* ── Empty bar ── */}
                            <div className={pfStyles.barSection}>
                                <div
                                    className={pfStyles.sectionHeader}
                                    onClick={() => setEmptyBarOpen(o => !o)}
                                >
                                    <span className={pfStyles.sectionArrowSm} style={{ transform: emptyBarOpen ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform .15s' }}>▶</span>
                                    <Form.Label className={`mb-0 ${pfStyles.formLabelSmBold}`} style={{ cursor: 'pointer' }}>
                                        {t("playerForm.emptyBar", "⬜ Empty bar (unsung)")}
                                    </Form.Label>
                                </div>
                                {emptyBarOpen && (
                                    <BarFillEditor
                                        fill={karaokeSettings.emptyBar}
                                        onChange={fill => patchFill('emptyBar', fill)}
                                        previewColor={'#d1d5db'}
                                    />
                                )}
                            </div>

                            {/* ── Gold filled bar ── */}
                            <div className={pfStyles.barSection}>
                                <div
                                    className={pfStyles.sectionHeader}
                                    onClick={() => setGoldFilledBarOpen(o => !o)}
                                >
                                    <span className={pfStyles.sectionArrowSm} style={{ transform: goldFilledBarOpen ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform .15s' }}>▶</span>
                                    <Form.Label className={`mb-0 ${pfStyles.formLabelSmBold}`} style={{ cursor: 'pointer' }}>
                                        {t("playerForm.goldFilledBar", "⭐ Gold filled bar (hit)")}
                                    </Form.Label>
                                </div>
                                {goldFilledBarOpen && (
                                    <BarFillEditor
                                        fill={karaokeSettings.goldFilledBar}
                                        onChange={fill => patchFill('goldFilledBar', fill)}
                                        previewColor={'#ffd700'}
                                        accentColor="#d4a017"
                                    />
                                )}
                            </div>

                            {/* ── Gold empty bar ── */}
                            <div className={pfStyles.barSection}>
                                <div
                                    className={pfStyles.sectionHeader}
                                    onClick={() => setGoldEmptyBarOpen(o => !o)}
                                >
                                    <span className={pfStyles.sectionArrowSm} style={{ transform: goldEmptyBarOpen ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform .15s' }}>▶</span>
                                    <Form.Label className={`mb-0 ${pfStyles.formLabelSmBold}`} style={{ cursor: 'pointer' }}>
                                        {t("playerForm.goldEmptyBar", "⭐ Gold empty bar (unsung)")}
                                    </Form.Label>
                                </div>
                                {goldEmptyBarOpen && (
                                    <BarFillEditor
                                        fill={karaokeSettings.goldEmptyBar}
                                        onChange={fill => patchFill('goldEmptyBar', fill)}
                                        previewColor={'#b4af9f'}
                                        accentColor="#d4a017"
                                    />
                                )}
                            </div>

                            {/* ── Font picker ── */}
                            <Form.Label className={pfStyles.formLabelSmBold} style={{ marginTop: 10 }}>
                                {t("playerForm.fontFamily", "🔤 Font")}
                            </Form.Label>
                            <div className={pfStyles.fontButtonsRow}>
                                <button
                                    type="button"
                                    className={`btn btn-sm ${!karaokeSettings.font.fontFamily ? 'btn-primary' : 'btn-outline-secondary'}`}
                                    onClick={() => patchFont('fontFamily', null)}
                                >
                                    Arial (default)
                                </button>
                                {FONT_CATALOG.map(fe => {
                                    const active = karaokeSettings.font.fontFamily === fe.family;
                                    return (
                                        <button
                                            key={fe.family}
                                            type="button"
                                            className={`btn btn-sm ${active ? 'btn-primary' : 'btn-outline-secondary'}`}
                                            style={{ fontFamily: `'${fe.family}', sans-serif`, fontSize: 13 }}
                                            onClick={() => {
                                                ensureFontLoaded(fe.family);
                                                patchFont('fontFamily', fe.family);
                                            }}
                                            onMouseEnter={() => ensureFontLoaded(fe.family)}
                                        >
                                            {fe.family}
                                        </button>
                                    );
                                })}
                            </div>
                            {/* ── Font preview ── */}
                            <div className={pfStyles.fontPreview} style={{
                                fontFamily: karaokeSettings.font.fontFamily ? `'${karaokeSettings.font.fontFamily}', sans-serif` : 'Arial, sans-serif',
                                fontSize: karaokeSettings.font.fontSize || 18,
                                color: karaokeSettings.font.fontColor || '#333',
                                WebkitTextStroke: karaokeSettings.font.outlineColor && karaokeSettings.font.outlineWidth ? `${karaokeSettings.font.outlineWidth}px ${karaokeSettings.font.outlineColor}` : undefined,
                                textShadow: karaokeSettings.font.shadow || undefined,
                            }}>
                                {t("playerForm.fontPreview", "The quick brown fox jumps over the lazy dog")}
                            </div>

                            {/* ── Font size ── */}
                            <Form.Label className={pfStyles.formLabelSm}>
                                {t("playerForm.fontSize", "Font size")}: {karaokeSettings.font.fontSize ?? 18}px
                            </Form.Label>
                            <Form.Range
                                min={10}
                                max={36}
                                step={1}
                                value={karaokeSettings.font.fontSize ?? 18}
                                onChange={e => patchFont('fontSize', Number(e.target.value))}
                            />

                            {/* ── Font color ── */}
                            <div className={pfStyles.controlRow}>
                                <Form.Label className={`mb-0 ${pfStyles.formLabelSm}`}>
                                    {t("playerForm.fontColor", "Font color")}
                                </Form.Label>
                                <Form.Control
                                    type="color"
                                    value={karaokeSettings.font.fontColor || '#ffffff'}
                                    onChange={e => patchFont('fontColor', e.target.value)}
                                    className={pfStyles.colorPickerInput}
                                />
                                {karaokeSettings.font.fontColor && (
                                    <button type="button" className="btn btn-sm btn-outline-secondary" onClick={() => patchFont('fontColor', null)}>
                                        {t("common.reset", "Reset")}
                                    </button>
                                )}
                            </div>

                            {/* ── Outline ── */}
                            <div className={pfStyles.controlRow}>
                                <Form.Label className={`mb-0 ${pfStyles.formLabelSm}`}>
                                    {t("playerForm.fontOutline", "Outline")}
                                </Form.Label>
                                <Form.Control
                                    type="color"
                                    value={karaokeSettings.font.outlineColor || '#000000'}
                                    onChange={e => patchFont('outlineColor', e.target.value)}
                                    className={pfStyles.colorPickerInput}
                                />
                                <Form.Range
                                    min={0}
                                    max={6}
                                    step={0.5}
                                    value={karaokeSettings.font.outlineWidth ?? 0}
                                    onChange={e => patchFont('outlineWidth', Number(e.target.value))}
                                    className={pfStyles.outlineWidth}
                                />
                                <span className={pfStyles.outlineLabel}>{karaokeSettings.font.outlineWidth ?? 0}px</span>
                                {(karaokeSettings.font.outlineColor || karaokeSettings.font.outlineWidth) ? (
                                    <button type="button" className="btn btn-sm btn-outline-secondary" onClick={() => { patchFont('outlineColor', null); patchFont('outlineWidth', 0); }}>
                                        {t("common.reset", "Reset")}
                                    </button>
                                ) : null}
                            </div>

                            {/* ── Shadow presets ── */}
                            <Form.Label className={pfStyles.formLabelSm}>
                                {t("playerForm.fontShadow", "Text shadow")}
                            </Form.Label>
                            <div className={pfStyles.shadowButtonsRow}>
                                {[
                                    { label: 'None', value: null },
                                    { label: 'Subtle', value: '1px 1px 2px rgba(0,0,0,0.5)' },
                                    { label: 'Strong', value: '2px 2px 4px #000' },
                                    { label: 'Glow white', value: '0px 0px 8px rgba(255,255,255,0.9)' },
                                    { label: 'Glow gold', value: '0px 0px 10px rgba(255,215,0,0.8)' },
                                    { label: 'Neon blue', value: '0px 0px 12px rgba(0,150,255,0.9)' },
                                    { label: 'Neon pink', value: '0px 0px 12px rgba(255,0,150,0.9)' },
                                    { label: 'Fire', value: '0px 0px 6px rgba(255,100,0,0.8)' },
                                ].map(preset => (
                                    <button
                                        key={preset.label}
                                        type="button"
                                        className={`btn btn-sm ${karaokeSettings.font.shadow === preset.value ? 'btn-primary' : 'btn-outline-secondary'}`}
                                        style={{ fontSize: 12, textShadow: preset.value || undefined }}
                                        onClick={() => patchFont('shadow', preset.value)}
                                    >
                                        {preset.label}
                                    </button>
                                ))}
                            </div>

                            {/* Reset to defaults */}
                            <Button
                                variant="outline-secondary"
                                size="sm"
                                onClick={() => setKaraokeSettings({ ...DEFAULT_KARAOKE_SETTINGS })}
                            >
                                {t("playerForm.resetBarStyle", "Reset to defaults")}
                            </Button>
                        </div>
                    )}
                </div>
                {!userId && <div className={pfStyles.loadingProfileMsg}>{t("playerForm.loadingProfile")}</div>}
                {error && <div className={pfStyles.errorMsg}>{error}</div>}
                <div className={pfStyles.actionButtons}>
                    <Focusable id="player-form-delete" style={{ flex: '0 0 50%' }}>
                        <Button variant="outline-secondary" type="button" onClick={handleDelete} disabled={loading || !userId}
                            className={pfStyles.actionBtnLeft}>
                            {t("common.cancel", "Cancel")}
                        </Button>
                    </Focusable>
                    <Focusable id="player-form-submit" style={{ flex: '0 0 50%' }}>
                        <Button variant="success" type="submit" disabled={loading || !userId}
                            className={pfStyles.actionBtnRight}>
                            {loading
                                ? (selectedPlayerId ? t("common.saving") : t("common.adding"))
                                : (selectedPlayerId ? t("common.save") : t("playerForm.addPlayer"))}
                        </Button>
                    </Focusable>
                </div>
            </Form>
        </Container>
    );
};

export default PlayerForm;

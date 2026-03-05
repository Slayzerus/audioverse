import { useState, useMemo, useRef, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { Form } from "react-bootstrap";
import {
    ALL_CAP_STYLES,
    OVERLAY_PATTERNS,
    renderGlossyBarSvg,
} from "../../scripts/karaoke/glossyBarRenderer";
import type { KaraokeBarFill } from "../../scripts/karaoke/glossyBarRenderer";
import { TEXTURE_CATEGORIES } from "../../scripts/karaoke/textureCatalog";
import type { TextureCategory } from "../../scripts/karaoke/textureCatalog";

interface BarFillEditorProps {
    /** Current bar fill settings */
    fill: KaraokeBarFill;
    /** Called when any field changes */
    onChange: (fill: KaraokeBarFill) => void;
    /** Player / preview color for SVG preview */
    previewColor: string;
    /** Accent color for active border (e.g. '#d4a017' for gold bars) */
    accentColor?: string;
}

const BarFillEditor: React.FC<BarFillEditorProps> = ({
    fill,
    onChange,
    previewColor,
    accentColor = '#0d6efd',
}) => {
    const { t } = useTranslation();
    const [texCat, setTexCat] = useState<TextureCategory | null>(null);

    const patch = <K extends keyof KaraokeBarFill>(key: K, val: KaraokeBarFill[K]) => {
        onChange({ ...fill, [key]: val });
    };

    /** Small inline SVG preview with given overrides */
    const barPreview = useMemo(() => {
        const baseColor = fill.color || previewColor || '#2196f3';
        return (capName: string, patName: string | null, textureUrl?: string | null) => {
            const cap = ALL_CAP_STYLES.find(c => c.name === capName) || ALL_CAP_STYLES[0];
            const pat = patName ? OVERLAY_PATTERNS.find(p => p.name === patName) ?? null : null;
            return renderGlossyBarSvg({
                width: 80, height: 22,
                capStyle: cap,
                color: baseColor,
                highlight: fill.highlight,
                glow: fill.glow,
                glass: fill.glass,
                pattern: pat,
                patternColor: fill.patternColor,
                patternOnly: fill.patternOnly,
                textureUrl: textureUrl ?? null,
                textureScale: fill.textureScale,
            });
        };
    }, [fill, previewColor]);

    const activeBorder = `2px solid ${accentColor}`;
    const activeBg = accentColor === '#d4a017' ? '#fff8e1' : '#e7f1ff';

    const capScrollRef = useRef<HTMLDivElement>(null);
    const patScrollRef = useRef<HTMLDivElement>(null);

    const scroll = useCallback((ref: React.RefObject<HTMLDivElement | null>, dir: -1 | 1) => {
        if (!ref.current) return;
        ref.current.scrollBy({ left: dir * 180, behavior: 'smooth' });
    }, []);

    const arrowBtnStyle: React.CSSProperties = {
        position: 'absolute', top: 0, width: 28, height: '100%',
        border: 'none', cursor: 'pointer', zIndex: 2,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 18, fontWeight: 700, color: '#ccc',
        background: 'linear-gradient(90deg, rgba(30,30,30,0.9) 60%, transparent)',
    };

    return (
        <div style={{ padding: '4px 0' }}>
            {/* Base color override */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <Form.Label className="mb-0" style={{ fontSize: 13, color: '#ccc' }}>
                    {t("playerForm.barColor", "Color")}
                </Form.Label>
                <Form.Check
                    type="checkbox"
                    id={`bar-color-auto-${accentColor}`}
                    label={t("playerForm.auto", "Auto")}
                    checked={!fill.color}
                    onChange={e => patch('color', e.target.checked ? null : (previewColor || '#2196f3'))}
                    className="mb-0"
                />
                {fill.color && (
                    <input
                        type="color"
                        value={fill.color}
                        onChange={e => patch('color', e.target.value)}
                        style={{ width: 32, height: 28, border: 'none', padding: 0, cursor: 'pointer' }}
                    />
                )}
            </div>

            {/* Cap shape – carousel */}
            <Form.Label style={{ fontSize: 13, color: '#ccc' }}>{t("playerForm.capShape", "Cap shape")}</Form.Label>
            <div style={{ position: 'relative', marginBottom: 10 }}>
                <button type="button" style={{ ...arrowBtnStyle, left: 0, borderRadius: '6px 0 0 6px' }}
                    onClick={() => scroll(capScrollRef, -1)}>‹</button>
                <button type="button" style={{ ...arrowBtnStyle, left: 'auto', right: 0, borderRadius: '0 6px 6px 0', background: 'linear-gradient(270deg, rgba(30,30,30,0.9) 60%, transparent)' }}
                    onClick={() => scroll(capScrollRef, 1)}>›</button>
                <div ref={capScrollRef} style={{
                    display: 'flex', gap: 6, overflowX: 'auto', scrollBehavior: 'smooth',
                    padding: '4px 32px', scrollbarWidth: 'none',
                }}>
                    {ALL_CAP_STYLES.map(cap => {
                        const active = fill.capStyleName === cap.name;
                        return (
                            <div
                                key={cap.name}
                                title={cap.name}
                                onClick={() => patch('capStyleName', cap.name)}
                                style={{
                                    cursor: 'pointer', flexShrink: 0,
                                    border: active ? activeBorder : '1px solid #555',
                                    borderRadius: 6, padding: 3,
                                    background: active ? activeBg : '#222',
                                }}
                                dangerouslySetInnerHTML={{ __html: barPreview(cap.name, null) }}
                            />
                        );
                    })}
                </div>
            </div>

            {/* Overlay pattern – carousel */}
            <Form.Label style={{ fontSize: 13, color: '#ccc' }}>{t("playerForm.pattern", "Pattern")}</Form.Label>
            <div style={{ position: 'relative', marginBottom: 10 }}>
                <button type="button" style={{ ...arrowBtnStyle, left: 0, borderRadius: '6px 0 0 6px' }}
                    onClick={() => scroll(patScrollRef, -1)}>‹</button>
                <button type="button" style={{ ...arrowBtnStyle, left: 'auto', right: 0, borderRadius: '0 6px 6px 0', background: 'linear-gradient(270deg, rgba(30,30,30,0.9) 60%, transparent)' }}
                    onClick={() => scroll(patScrollRef, 1)}>›</button>
                <div ref={patScrollRef} style={{
                    display: 'flex', gap: 6, overflowX: 'auto', scrollBehavior: 'smooth',
                    padding: '4px 32px', scrollbarWidth: 'none',
                }}>
                    <div
                        title="None"
                        onClick={() => patch('patternName', null)}
                        style={{
                            cursor: 'pointer', flexShrink: 0,
                            border: !fill.patternName ? activeBorder : '1px solid #555',
                            borderRadius: 6, padding: '3px 8px',
                            background: !fill.patternName ? activeBg : '#222',
                            fontSize: 12, lineHeight: '22px', color: '#ccc',
                        }}
                    >—</div>
                    {OVERLAY_PATTERNS.map(pat => {
                        const active = fill.patternName === pat.name;
                        return (
                            <div
                                key={pat.name}
                                title={pat.name}
                                onClick={() => patch('patternName', pat.name)}
                                style={{
                                    cursor: 'pointer', flexShrink: 0,
                                    border: active ? activeBorder : '1px solid #555',
                                    borderRadius: 6, padding: 3,
                                    background: active ? activeBg : '#222',
                                }}
                                dangerouslySetInnerHTML={{ __html: barPreview(fill.capStyleName, pat.name) }}
                            />
                        );
                    })}
                </div>
            </div>

            {/* Pattern-only toggle */}
            <Form.Check
                type="switch"
                id={`bar-pattern-only-${accentColor}`}
                label={t("playerForm.patternOnly", "Pattern only (flat, no 3D)")}
                checked={fill.patternOnly}
                onChange={e => patch('patternOnly', e.target.checked)}
                className="mb-2"
            />

            {/* Pattern color */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <Form.Label className="mb-0" style={{ fontSize: 13, color: '#ccc' }}>
                    {t("playerForm.patternColor", "Pattern color")}
                </Form.Label>
                <Form.Check
                    type="checkbox"
                    id={`bar-pattern-color-auto-${accentColor}`}
                    label={t("playerForm.auto", "Auto")}
                    checked={!fill.patternColor}
                    onChange={e => patch('patternColor', e.target.checked ? null : (previewColor || '#ffffff'))}
                    className="mb-0"
                />
                {fill.patternColor && (
                    <input
                        type="color"
                        value={fill.patternColor}
                        onChange={e => patch('patternColor', e.target.value)}
                        style={{ width: 32, height: 28, border: 'none', padding: 0, cursor: 'pointer' }}
                    />
                )}
            </div>

            {/* Highlight & Glow sliders */}
            {!fill.patternOnly && (
                <>
                    <Form.Label style={{ fontSize: 13, color: '#ccc' }}>
                        {t("playerForm.highlight", "Highlight")}: {fill.highlight}%
                    </Form.Label>
                    <Form.Range
                        min={0} max={100}
                        value={fill.highlight}
                        onChange={e => patch('highlight', parseInt(e.target.value))}
                        className="mb-2"
                    />
                    <Form.Label style={{ fontSize: 13, color: '#ccc' }}>
                        {t("playerForm.glow", "Glow")}: {fill.glow}%
                    </Form.Label>
                    <Form.Range
                        min={0} max={100}
                        value={fill.glow}
                        onChange={e => patch('glow', parseInt(e.target.value))}
                        className="mb-2"
                    />
                </>
            )}

            {/* Glass slider */}
            <Form.Label style={{ fontSize: 13, color: '#ccc' }}>
                {t("playerForm.glass", "Transparency (glass)")}: {fill.glass}%
            </Form.Label>
            <Form.Range
                min={0} max={100}
                value={fill.glass}
                onChange={e => patch('glass', parseInt(e.target.value))}
                className="mb-2"
            />

            {/* Texture picker */}
            <Form.Label style={{ fontSize: 13, fontWeight: 600, marginTop: 4, color: '#ccc' }}>
                {t("playerForm.texture", "Texture")}
            </Form.Label>
            <div style={{ marginBottom: 6 }}>
                <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 6 }}>
                    <button
                        type="button"
                        className={`btn btn-sm ${!fill.textureUrl ? 'btn-primary' : 'btn-outline-secondary'}`}
                        onClick={() => { patch('textureUrl', null); setTexCat(null); }}
                    >
                        {t("playerForm.texNone", "None")}
                    </button>
                    {TEXTURE_CATEGORIES.map(cat => (
                        <button
                            key={cat.name}
                            type="button"
                            className={`btn btn-sm ${texCat?.name === cat.name ? 'btn-primary' : 'btn-outline-secondary'}`}
                            onClick={() => setTexCat(prev => prev?.name === cat.name ? null : cat)}
                            title={cat.name}
                        >
                            {cat.icon}
                        </button>
                    ))}
                </div>
                {texCat && (
                    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', maxHeight: 130, overflowY: 'auto', padding: 4, border: '1px solid #dee2e6', borderRadius: 6, background: '#f8f9fa' }}>
                        {texCat.entries.map(tex => {
                            const active = fill.textureUrl === tex.url;
                            return (
                                <div
                                    key={tex.url}
                                    title={tex.label}
                                    onClick={() => patch('textureUrl', active ? null : tex.url)}
                                    style={{
                                        width: 48, height: 48, borderRadius: 6, cursor: 'pointer',
                                        border: active ? `3px solid ${accentColor}` : '1px solid #bbb',
                                        backgroundImage: `url(${tex.url})`,
                                        backgroundSize: 'cover',
                                        boxShadow: active ? `0 0 6px ${accentColor}` : undefined,
                                    }}
                                />
                            );
                        })}
                    </div>
                )}
                {fill.textureUrl && (
                    <div style={{ marginTop: 4, display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div
                            style={{
                                width: 80, height: 22, borderRadius: 6,
                                backgroundImage: `url(${fill.textureUrl})`,
                                backgroundSize: `${Math.round(256 * fill.textureScale)}px`,
                                border: '1px solid #aaa',
                            }}
                        />
                        <span style={{ fontSize: 11, color: '#666' }}>
                            {fill.textureUrl.split('/').pop()}
                        </span>
                    </div>
                )}
            </div>

            {/* Texture scale slider */}
            {fill.textureUrl && (
                <>
                    <Form.Label style={{ fontSize: 13, color: '#ccc' }}>
                        {t("playerForm.textureScale", "Texture scale")}: {fill.textureScale.toFixed(1)}×
                    </Form.Label>
                    <Form.Range
                        min={10} max={200} step={10}
                        value={Math.round(fill.textureScale * 100)}
                        onChange={e => patch('textureScale', parseInt(e.target.value) / 100)}
                        className="mb-2"
                    />
                </>
            )}
        </div>
    );
};

export default BarFillEditor;

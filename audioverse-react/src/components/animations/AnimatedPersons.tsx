import React, { useEffect, useMemo, useState } from "react";
import { useTranslation } from 'react-i18next';
import { useToast } from "../ui/ToastProvider";
import AnimatedPersonList from "./AnimatedPersonList";
import AnimatedPerson from "./AnimatedPerson";
import type { CharacterConfig, FeatureConfig } from "./characterTypes";
import { VARIANTS, DEFAULT_CHARACTER } from "./characterTypes";

const KEY = "audioverse.judges.list.v1";

// --- Domyślny JSON 8 postaci ---
export const DEFAULT_JUDGES_8: CharacterConfig[] = [
    { ...DEFAULT_CHARACTER, name: "Ava", outfit: { variant: "hoodie", colors: ["var(--anim-outfit-ava-1, #0ea5e9)", "var(--anim-outfit-ava-2, #0284c7)", "var(--anim-stroke, #111)"] }, hair: { variant: "curly", colors: ["var(--anim-hair-ava-1, #2d3142)", "var(--anim-hair-ava-2, #4f5d75)"] }, headwear: { variant: "headphones", colors: ["var(--anim-stroke, #111)", "var(--anim-headwear-1, #6b7280)"] }, prop: { variant: "mic", colors: ["var(--anim-stroke, #111)", "var(--anim-prop-2, #777)", "var(--anim-prop-3, #ccc)"] } },
    { ...DEFAULT_CHARACTER, name: "Ben", outfit: { variant: "suit", colors: ["var(--anim-outfit-ben-1, #10b981)", "var(--anim-outfit-ben-2, #059669)", "var(--anim-stroke, #111)"] }, hair: { variant: "short", colors: ["var(--anim-hair-ben-1, #111827)", "var(--anim-hair-ben-2, #374151)"] } },
    { ...DEFAULT_CHARACTER, name: "Cleo", outfit: { variant: "tee", colors: ["var(--anim-outfit-cleo-1, #f59e0b)", "var(--anim-outfit-cleo-2, #d97706)", "var(--anim-stroke, #111)"] }, hair: { variant: "long", colors: ["var(--anim-hair-cleo-1, #78350f)", "var(--anim-hair-cleo-2, #a16207)"] }, headwear: { variant: "cap", colors: ["var(--anim-stroke, #111)", "var(--anim-headwear-1, #6b7280)"] }, prop: { variant: "clipboard", colors: ["var(--anim-stroke, #111)", "var(--anim-prop-2, #888)", "var(--anim-prop-3, #ddd)"] } },
    { ...DEFAULT_CHARACTER, name: "Dex", outfit: { variant: "dress", colors: ["var(--anim-outfit-dex-1, #6366f1)", "var(--anim-outfit-dex-2, #4338ca)", "var(--anim-stroke, #111)"] }, hair: { variant: "mohawk", colors: ["var(--anim-hair-dex-1, #4c1d95)", "var(--anim-hair-dex-2, #7c3aed)"] }, headwear: { variant: "crown", colors: ["var(--anim-crown-1, #fbbf24)", "var(--anim-crown-2, #f59e0b)"] }, prop: { variant: "star", colors: ["var(--anim-star-1, #f59e0b)", "var(--anim-star-2, #fde68a)", "var(--anim-stroke, #111)"] } },
    { ...DEFAULT_CHARACTER, name: "Eli", hair: { variant: "short", colors: ["var(--anim-hair-eli-1, #374151)", "var(--anim-hair-eli-2, #111827)"] }, eyes: { variant: "oval", colors: ["var(--anim-stroke, #111)"] }, mouth: { variant: "flat", colors: ["var(--anim-stroke, #111)"] }, prop: { variant: "none", colors: ["var(--anim-stroke, #111)"] } },
    { ...DEFAULT_CHARACTER, name: "Fia", face: { variant: "oval", colors: ["var(--anim-skin, #FFD2B3)", "var(--anim-skin-2, #f1bfa4)", "var(--anim-stroke, #111)"] }, mouth: { variant: "teeth", colors: ["var(--anim-stroke, #111)", "var(--white, #fff)"] }, outfit: { variant: "tee", colors: ["var(--anim-outfit-fia-1, #06b6d4)", "var(--anim-outfit-fia-2, #0891b2)", "var(--anim-stroke, #111)"] } },
    { ...DEFAULT_CHARACTER, name: "Gus", face: { variant: "square", colors: ["var(--anim-skin-gus-1, #ffd7b8)", "var(--anim-skin-gus-2, #f3c3a6)", "var(--anim-stroke, #111)"] }, hair: { variant: "none", colors: ["var(--anim-stroke, #111)"] }, headwear: { variant: "hat", colors: ["var(--anim-stroke, #111)", "var(--anim-headwear-1, #6b7280)"] } },
    { ...DEFAULT_CHARACTER, name: "Hana", face: { variant: "heart", colors: ["var(--anim-skin-hana-1, #ffd1b3)", "var(--anim-skin-hana-2, #f8c6ad)", "var(--anim-stroke, #111)"] }, hair: { variant: "long", colors: ["var(--anim-hair-hana-1, #4b5563)", "var(--anim-hair-hana-2, #6b7280)"] }, eyes: { variant: "laugh", colors: ["var(--anim-stroke, #111)"] }, outfit: { variant: "hoodie", colors: ["var(--anim-outfit-hana-1, #ef4444)", "var(--anim-outfit-hana-2, #dc2626)", "var(--anim-stroke, #111)"] } },
];

function clampPalette(colors: string[]): string[] {
    const c = (colors || []).slice(0, 3);
    if (c.length === 0) c.push("var(--anim-default-black, #000000)");
    while (c.length < 3) c.push(c[c.length - 1]);
    return c;
}

function ColorInputs({ value, onChange }: { value: string[]; onChange: (c: string[]) => void }) {
    const c = clampPalette(value);
    const count = Math.min(3, Math.max(1, value?.length ?? 1));
    const view = c.slice(0, count);
    return (
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ display: "flex", gap: 8 }}>
                {view.map((col, i) => (
                    <label key={i} style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12 }}>
                        C{i + 1}
                        <input
                            type="color"
                            value={col}
                            onChange={(e) => {
                                const next = [...view];
                                next[i] = e.target.value;
                                onChange(next);
                            }}
                        />
                    </label>
                ))}
            </div>
            <div style={{ display: "flex", gap: 6 }}>
                <button type="button" disabled={count <= 1} onClick={() => onChange(view.slice(0, Math.max(1, count - 1)))} style={smallBtn} aria-label="Decrease count">-</button>
                <button type="button" disabled={count >= 3} onClick={() => onChange([...view, view[view.length - 1] || "var(--anim-default-black, #000000)"])} style={smallBtn} aria-label="Increase count">+</button>
            </div>
        </div>
    );
}

function FeatureEditor({ title, feature, variants, onChange }: { title: string; feature: FeatureConfig; variants: readonly string[]; onChange: (f: FeatureConfig) => void; }) {
    return (
        <div style={{ display: "flex", gap: 12, padding: "6px 0", borderBottom: "1px solid var(--border-color, #e5e7eb)" }}>
            <div style={{ width: 140, fontWeight: 600, fontSize: 12, color: "var(--text-primary, #374151)" }}>{title}</div>
            <select value={feature.variant} onChange={(e) => onChange({ ...feature, variant: e.target.value })} style={{ padding: "4px 6px", border: "1px solid var(--border-color, #e5e7eb)", borderRadius: 8 }}>
                {variants.map((v) => (<option key={v} value={v}>{v}</option>))}
            </select>
            <ColorInputs value={feature.colors} onChange={(colors) => onChange({ ...feature, colors })} />
        </div>
    );
}

export default function AnimatedPersons() {
    const { t } = useTranslation();
    const [list, setList] = useState<CharacterConfig[]>(() => {
        try {
            const saved = localStorage.getItem(KEY);
            return saved ? (JSON.parse(saved) as CharacterConfig[]) : DEFAULT_JUDGES_8;
        } catch {
            return DEFAULT_JUDGES_8;
        }
    });
    const [selected, setSelected] = useState(0);

    useEffect(() => { localStorage.setItem(KEY, JSON.stringify(list)); }, [list]);

    const current = useMemo(() => list[selected] || list[0], [list, selected]);

    const updateCurrent = (next: CharacterConfig) => {
        setList((arr) => arr.map((c, i) => (i === selected ? next : c)));
    };

    const addNew = () => setList((arr) => [...arr, { ...DEFAULT_CHARACTER, name: `New ${arr.length + 1}` }]);
    const reset = () => setList(DEFAULT_JUDGES_8);

    const downloadJson = () => {
        const blob = new Blob([JSON.stringify(list, null, 2)], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url; a.download = "judges.json"; a.click(); URL.revokeObjectURL(url);
    };
    const copyJson = () => navigator.clipboard.writeText(JSON.stringify(list, null, 2));
    const { showToast } = useToast();

    const loadFromFile = (f: File) => {
        const reader = new FileReader();
        reader.onload = () => {
            try { setList(JSON.parse(String(reader.result)) as CharacterConfig[]); } catch { showToast(t('characters.invalidJson'), 'error'); }
        };
        reader.readAsText(f);
    };

    return (
        <div style={{ display: "grid", gridTemplateColumns: "minmax(min(280px, 100%), 360px) 1fr", gap: 16 }}>
            {/* Panel: lista */}
            <div>
                <div style={{ display: "flex", gap: 8, marginBottom: 8, alignItems: "center" }}>
                    <button onClick={addNew} style={btn}>{t('characters.addBtn')}</button>
                    <button onClick={reset} style={btn}>{t('characters.resetDefault')}</button>
                    <button onClick={downloadJson} style={btn}>{t('characters.downloadJson')}</button>
                    <button onClick={copyJson} style={btn}>{t('characters.copyBtn')}</button>
                    <label style={{ ...btn, cursor: "pointer" }}>{t('characters.loadBtn')}
                        <input type="file" accept="application/json" onChange={(e) => e.target.files && e.target.files[0] && loadFromFile(e.target.files[0])} style={{ display: "none" }} />
                    </label>
                </div>
                <AnimatedPersonList items={list} selectedIndex={selected} onSelect={setSelected} onChange={setList} />
            </div>

            {/* Panel: editor + preview */}
            <div>
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
                    <div style={{ fontWeight: 700 }}>{t('characters.editing')} {current?.name || `Person ${selected + 1}`}</div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "minmax(min(240px, 100%), 320px) 1fr", gap: 16 }}>
                    <div style={{ border: "1px solid var(--border-color, #e5e7eb)", borderRadius: 12, padding: 12, background: "var(--card-bg, #fff)" }}>
                        <FeatureEditor title={t('characters.faceShape')} feature={current.face} variants={VARIANTS.face} onChange={(face) => updateCurrent({ ...current, face })} />
                        <FeatureEditor title={t('characters.hairstyle')} feature={current.hair} variants={VARIANTS.hair} onChange={(hair) => updateCurrent({ ...current, hair })} />
                        <FeatureEditor title={t('characters.eyes')} feature={current.eyes} variants={VARIANTS.eyes} onChange={(eyes) => updateCurrent({ ...current, eyes })} />
                        <FeatureEditor title={t('characters.nose')} feature={current.nose} variants={VARIANTS.nose} onChange={(nose) => updateCurrent({ ...current, nose })} />
                        <FeatureEditor title={t('characters.mouth')} feature={current.mouth} variants={VARIANTS.mouth} onChange={(mouth) => updateCurrent({ ...current, mouth })} />
                        <FeatureEditor title={t('characters.clothing')} feature={current.outfit} variants={VARIANTS.outfit} onChange={(outfit) => updateCurrent({ ...current, outfit })} />
                        <FeatureEditor title={t('characters.headwear')} feature={current.headwear} variants={VARIANTS.headwear} onChange={(headwear) => updateCurrent({ ...current, headwear })} />
                        <FeatureEditor title={t('characters.prop')} feature={current.prop} variants={VARIANTS.prop} onChange={(prop) => updateCurrent({ ...current, prop })} />
                        <div style={{ display: "flex", gap: 12, padding: "6px 0" }}>
                            <div style={{ width: 140, fontWeight: 600, fontSize: 12, color: "var(--text-primary, #374151)" }}>{t('characters.size')}</div>
                            <input type="range" min={140} max={300} value={current.size ?? 180} onChange={(e) => updateCurrent({ ...current, size: Number(e.target.value) })} />
                            <div style={{ fontSize: 12 }}>{current.size ?? 180}px</div>
                        </div>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
                        <AnimatedPerson character={current} startPose="idle" />
                    </div>
                </div>
            </div>
        </div>
    );
}

const btn: React.CSSProperties = { border: "1px solid var(--border-color, #e5e7eb)", borderRadius: 8, padding: "6px 8px", background: "var(--input-bg, #f9fafb)", cursor: "pointer" };
const smallBtn: React.CSSProperties = { border: "1px solid var(--border-color, #e5e7eb)", borderRadius: 6, padding: "2px 6px", background: "var(--input-bg, #f9fafb)", cursor: "pointer", fontSize: 12 };

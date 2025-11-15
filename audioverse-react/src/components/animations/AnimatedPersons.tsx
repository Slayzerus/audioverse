import React, { useEffect, useMemo, useState } from "react";
import AnimatedPersonList from "./AnimatedPersonList";
import AnimatedPerson from "./AnimatedPerson";
import type { CharacterConfig, FeatureConfig } from "./characterTypes";
import { VARIANTS, DEFAULT_CHARACTER } from "./characterTypes";

const KEY = "audioverse.judges.list.v1";

// --- Domyślny JSON 8 postaci ---
export const DEFAULT_JUDGES_8: CharacterConfig[] = [
    { ...DEFAULT_CHARACTER, name: "Ava", outfit: { variant: "hoodie", colors: ["#0ea5e9", "#0284c7", "#111"] }, hair: { variant: "curly", colors: ["#2d3142", "#4f5d75"] }, headwear: { variant: "headphones", colors: ["#111", "#6b7280"] }, prop: { variant: "mic", colors: ["#111", "#777", "#ccc"] } },
    { ...DEFAULT_CHARACTER, name: "Ben", outfit: { variant: "suit", colors: ["#10b981", "#059669", "#111"] }, hair: { variant: "short", colors: ["#111827", "#374151"] } },
    { ...DEFAULT_CHARACTER, name: "Cleo", outfit: { variant: "tee", colors: ["#f59e0b", "#d97706", "#111"] }, hair: { variant: "long", colors: ["#78350f", "#a16207"] }, headwear: { variant: "cap", colors: ["#111", "#6b7280"] }, prop: { variant: "clipboard", colors: ["#111", "#888", "#ddd"] } },
    { ...DEFAULT_CHARACTER, name: "Dex", outfit: { variant: "dress", colors: ["#6366f1", "#4338ca", "#111"] }, hair: { variant: "mohawk", colors: ["#4c1d95", "#7c3aed"] }, headwear: { variant: "crown", colors: ["#fbbf24", "#f59e0b"] }, prop: { variant: "star", colors: ["#f59e0b", "#fde68a", "#111"] } },
    { ...DEFAULT_CHARACTER, name: "Eli", hair: { variant: "short", colors: ["#374151", "#111827"] }, eyes: { variant: "oval", colors: ["#111"] }, mouth: { variant: "flat", colors: ["#111"] }, prop: { variant: "none", colors: ["#111"] } },
    { ...DEFAULT_CHARACTER, name: "Fia", face: { variant: "oval", colors: ["#FFD2B3", "#f1bfa4", "#111"] }, mouth: { variant: "teeth", colors: ["#111", "#fff"] }, outfit: { variant: "tee", colors: ["#06b6d4", "#0891b2", "#111"] } },
    { ...DEFAULT_CHARACTER, name: "Gus", face: { variant: "square", colors: ["#ffd7b8", "#f3c3a6", "#111"] }, hair: { variant: "none", colors: ["#111"] }, headwear: { variant: "hat", colors: ["#111", "#6b7280"] } },
    { ...DEFAULT_CHARACTER, name: "Hana", face: { variant: "heart", colors: ["#ffd1b3", "#f8c6ad", "#111"] }, hair: { variant: "long", colors: ["#4b5563", "#6b7280"] }, eyes: { variant: "laugh", colors: ["#111"] }, outfit: { variant: "hoodie", colors: ["#ef4444", "#dc2626", "#111"] } },
];

function clampPalette(colors: string[]): string[] {
    const c = (colors || []).slice(0, 3);
    if (c.length === 0) c.push("#000000");
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
                <button type="button" disabled={count <= 1} onClick={() => onChange(view.slice(0, Math.max(1, count - 1)))} style={smallBtn}>-</button>
                <button type="button" disabled={count >= 3} onClick={() => onChange([...view, view[view.length - 1] || "#000000"])} style={smallBtn}>+</button>
            </div>
        </div>
    );
}

function FeatureEditor({ title, feature, variants, onChange }: { title: string; feature: FeatureConfig; variants: readonly string[]; onChange: (f: FeatureConfig) => void; }) {
    return (
        <div style={{ display: "flex", gap: 12, padding: "6px 0", borderBottom: "1px solid #eee" }}>
            <div style={{ width: 140, fontWeight: 600, fontSize: 12, color: "#374151" }}>{title}</div>
            <select value={feature.variant} onChange={(e) => onChange({ ...feature, variant: e.target.value })} style={{ padding: "4px 6px", border: "1px solid #e5e7eb", borderRadius: 8 }}>
                {variants.map((v) => (<option key={v} value={v}>{v}</option>))}
            </select>
            <ColorInputs value={feature.colors} onChange={(colors) => onChange({ ...feature, colors })} />
        </div>
    );
}

export default function AnimatedPersons() {
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
    const loadFromFile = (f: File) => {
        const reader = new FileReader();
        reader.onload = () => {
            try { setList(JSON.parse(String(reader.result)) as CharacterConfig[]); } catch { alert("Nieprawidłowy plik JSON"); }
        };
        reader.readAsText(f);
    };

    return (
        <div style={{ display: "grid", gridTemplateColumns: "360px 1fr", gap: 16 }}>
            {/* Panel: lista */}
            <div>
                <div style={{ display: "flex", gap: 8, marginBottom: 8, alignItems: "center" }}>
                    <button onClick={addNew} style={btn}>Dodaj</button>
                    <button onClick={reset} style={btn}>Reset (8 domyślnych)</button>
                    <button onClick={downloadJson} style={btn}>Pobierz JSON</button>
                    <button onClick={copyJson} style={btn}>Kopiuj</button>
                    <label style={{ ...btn, cursor: "pointer" }}>Wczytaj
                        <input type="file" accept="application/json" onChange={(e) => e.target.files && e.target.files[0] && loadFromFile(e.target.files[0])} style={{ display: "none" }} />
                    </label>
                </div>
                <AnimatedPersonList items={list} selectedIndex={selected} onSelect={setSelected} onChange={setList} />
            </div>

            {/* Panel: edytor + podgląd */}
            <div>
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
                    <div style={{ fontWeight: 700 }}>Edytujesz: {current?.name || `Person ${selected + 1}`}</div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "320px 1fr", gap: 16 }}>
                    <div style={{ border: "1px solid #e5e7eb", borderRadius: 12, padding: 12, background: "#fff" }}>
                        <FeatureEditor title="Kształt twarzy" feature={current.face} variants={VARIANTS.face} onChange={(face) => updateCurrent({ ...current, face })} />
                        <FeatureEditor title="Fryzura" feature={current.hair} variants={VARIANTS.hair} onChange={(hair) => updateCurrent({ ...current, hair })} />
                        <FeatureEditor title="Oczy" feature={current.eyes} variants={VARIANTS.eyes} onChange={(eyes) => updateCurrent({ ...current, eyes })} />
                        <FeatureEditor title="Nos" feature={current.nose} variants={VARIANTS.nose} onChange={(nose) => updateCurrent({ ...current, nose })} />
                        <FeatureEditor title="Usta" feature={current.mouth} variants={VARIANTS.mouth} onChange={(mouth) => updateCurrent({ ...current, mouth })} />
                        <FeatureEditor title="Ubranie" feature={current.outfit} variants={VARIANTS.outfit} onChange={(outfit) => updateCurrent({ ...current, outfit })} />
                        <FeatureEditor title="Nakrycie głowy" feature={current.headwear} variants={VARIANTS.headwear} onChange={(headwear) => updateCurrent({ ...current, headwear })} />
                        <FeatureEditor title="Rekwizyt" feature={current.prop} variants={VARIANTS.prop} onChange={(prop) => updateCurrent({ ...current, prop })} />
                        <div style={{ display: "flex", gap: 12, padding: "6px 0" }}>
                            <div style={{ width: 140, fontWeight: 600, fontSize: 12, color: "#374151" }}>Rozmiar</div>
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

const btn: React.CSSProperties = { border: "1px solid #e5e7eb", borderRadius: 8, padding: "6px 8px", background: "#f9fafb", cursor: "pointer" };
const smallBtn: React.CSSProperties = { border: "1px solid #e5e7eb", borderRadius: 6, padding: "2px 6px", background: "#f9fafb", cursor: "pointer", fontSize: 12 };

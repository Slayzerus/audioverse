import React from "react";
import AnimatedPerson from "./AnimatedPerson";
import type { CharacterConfig } from "./characterTypes";

export type AnimatedPersonListProps = {
    items: CharacterConfig[];
    selectedIndex?: number;
    onSelect?: (index: number) => void;
    onChange?: (items: CharacterConfig[]) => void;
    size?: number; // preview size
};

export default function AnimatedPersonList({ items, selectedIndex = 0, onSelect, onChange, size = 130 }: AnimatedPersonListProps) {
    const remove = (i: number) => {
        const next = items.slice();
        next.splice(i, 1);
        onChange?.(next);
    };
    const duplicate = (i: number) => {
        const next = items.slice();
        const src = next[i];
        next.splice(i + 1, 0, { ...src, name: (src.name || "Person") + " copy" });
        onChange?.(next);
    };
    const move = (i: number, dir: -1 | 1) => {
        const j = i + dir;
        if (j < 0 || j >= items.length) return;
        const next = items.slice();
        const [it] = next.splice(i, 1);
        next.splice(j, 0, it);
        onChange?.(next);
        onSelect?.(j);
    };

    return (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 12 }}>
            {items.map((c, i) => (
                <div key={i} style={{ border: i === selectedIndex ? "2px solid #2563EB" : "1px solid #e5e7eb", borderRadius: 12, padding: 8, background: "#fff" }}>
                    <button onClick={() => onSelect?.(i)} style={{ display: "block", width: "100%", background: "transparent", border: "none", padding: 0, cursor: "pointer" }}>
                        <AnimatedPerson character={{ ...c, size }} />
                    </button>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 6 }}>
                        <input
                            value={c.name || ""}
                            onChange={(e) => {
                                const next = items.slice();
                                next[i] = { ...c, name: e.target.value };
                                onChange?.(next);
                            }}
                            placeholder={`Person ${i + 1}`}
                            style={{ flex: 1, border: "1px solid #e5e7eb", borderRadius: 8, padding: "4px 6px" }}
                        />
                        <div style={{ display: "flex", gap: 4 }}>
                            <button title="Move left" onClick={() => move(i, -1)} style={iconBtn}>&larr;</button>
                            <button title="Duplicate" onClick={() => duplicate(i)} style={iconBtn}>⧉</button>
                            <button title="Move right" onClick={() => move(i, 1)} style={iconBtn}>&rarr;</button>
                            <button title="Remove" onClick={() => remove(i)} style={{ ...iconBtn, color: "#dc2626" }}>✕</button>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}

const iconBtn: React.CSSProperties = { border: "1px solid #e5e7eb", borderRadius: 6, padding: "2px 6px", background: "#f9fafb", cursor: "pointer" };

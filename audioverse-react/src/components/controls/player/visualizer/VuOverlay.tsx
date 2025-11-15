import React from "react";

export const VuOverlay: React.FC<{ vu: number; hide?: boolean }> = ({ vu, hide }) => {
    if (hide) return null;
    const segments = 12;
    const active = Math.round(vu * segments);
    return (
        <div
            style={{
                position: "absolute",
                right: 10,
                bottom: 10,
                display: "flex",
                gap: 2,
                background: "rgba(2,6,23,.5)",
                padding: "6px 8px",
                borderRadius: 8,
                border: "1px solid #334155",
                backdropFilter: "blur(2px)",
                pointerEvents: "none",
                zIndex: 9998,
            }}
        >
            {Array.from({ length: segments }).map((_, i) => {
                const hue = 120 * (i / segments); // zielony->żółty->czerwony
                return (
                    <div
                        key={i}
                        style={{
                            width: 6,
                            height: 18,
                            borderRadius: 2,
                            background: i < active ? `hsl(${hue}, 80%, 50%)` : "#1f2937",
                        }}
                    />
                );
            })}
        </div>
    );
};

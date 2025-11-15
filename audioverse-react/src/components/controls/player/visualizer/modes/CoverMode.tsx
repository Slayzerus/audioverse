import React from "react";

const textDim = "#94a3b8";

export const CoverMode: React.FC<{
    height: number;
    coverUrl?: string;
    title?: string;
    subtitle?: string;
    label?: string;
}> = ({ height, coverUrl, title, subtitle, label }) => {
    return (
        <div style={{ textAlign: "center", color: "#e2e8f0" }}>
            {coverUrl ? (
                <img alt="cover" src={coverUrl} style={{ height: height - 24, objectFit: "contain" }} />
            ) : (
                <div style={{ opacity: 0.8 }}>
                    <div style={{ fontSize: 18, fontWeight: 600 }}>{title ?? "—"}</div>
                    <div style={{ marginTop: 8, fontSize: 12, color: textDim }}>{label ?? subtitle ?? "—"}</div>
                </div>
            )}
        </div>
    );
};

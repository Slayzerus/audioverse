import React from "react";

interface ContentSkeletonProps {
    /** Number of skeleton rows to render */
    rows?: number;
    /** Show a header-sized bar at the top */
    showHeader?: boolean;
    /** Show a circular avatar placeholder */
    showAvatar?: boolean;
    /** Custom height for each row in px */
    rowHeight?: number;
    /** Custom gap between rows in px */
    gap?: number;
}

const ContentSkeleton: React.FC<ContentSkeletonProps> = React.memo(function ContentSkeleton({
    rows = 3,
    showHeader = true,
    showAvatar = false,
    rowHeight = 16,
    gap = 12,
}) {
    const shimmer: React.CSSProperties = {
        background: "linear-gradient(90deg, var(--skeleton-bg, #2a2a2a) 25%, var(--skeleton-shine, #3a3a3a) 50%, var(--skeleton-bg, #2a2a2a) 75%)",
        backgroundSize: "200% 100%",
        animation: "skeleton-shimmer 1.5s ease-in-out infinite",
        borderRadius: 4,
    };

    return (
        <div style={{ display: "flex", flexDirection: "column", gap, padding: "8px 0" }} role="status" aria-label="Loading content">
            {showAvatar && (
                <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                    <div style={{ ...shimmer, width: 40, height: 40, borderRadius: "50%", flexShrink: 0 }} />
                    <div style={{ ...shimmer, height: rowHeight, width: "40%", flex: "none" }} />
                </div>
            )}
            {showHeader && (
                <div style={{ ...shimmer, height: rowHeight * 1.5, width: "60%" }} />
            )}
            {Array.from({ length: rows }).map((_, i) => (
                <div key={i} style={{ ...shimmer, height: rowHeight, width: `${85 - i * 8}%` }} />
            ))}
            <style>{`
                @keyframes skeleton-shimmer {
                    0% { background-position: 200% 0; }
                    100% { background-position: -200% 0; }
                }
            `}</style>
        </div>
    );
});
ContentSkeleton.displayName = "ContentSkeleton";

export default ContentSkeleton;

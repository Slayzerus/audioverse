// src/utils/libraryStyles.ts

/// Shared container style for boxed lists.
export const box: React.CSSProperties = {
    border: "1px solid var(--border-secondary, #e5e7eb)",
    borderRadius: 8,
    background: "var(--card-bg, #fff)",
};

/// Shared small button style for rows and toolbars.
export const rowBtn: React.CSSProperties = {
    border: "1px solid var(--border-secondary, #d1d5db)",
    borderRadius: 6,
    padding: "2px 8px",
    background: "var(--btn-bg, #fff)",
    cursor: "pointer",
    fontSize: 12,
};

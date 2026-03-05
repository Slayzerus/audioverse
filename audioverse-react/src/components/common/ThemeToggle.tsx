import React from "react";
import { useTheme } from "../../contexts/ThemeContext";

const ThemeToggle: React.FC = React.memo(function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      style={{
        background: "var(--bg-elevated)",
        border: "1px solid var(--border-primary)",
        borderRadius: "50%",
        padding: 8,
        color: "var(--text-primary)",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 20,
        width: 36,
        height: 36,
        transition: "all 0.2s ease",
      }}
      onMouseEnter={e => {
        e.currentTarget.style.background = "var(--bg-tertiary)";
        e.currentTarget.style.borderColor = "var(--accent-primary)";
      }}
      onMouseLeave={e => {
        e.currentTarget.style.background = "var(--bg-elevated)";
        e.currentTarget.style.borderColor = "var(--border-primary)";
      }}
      title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
      aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
    >
      {theme === "dark" ? (
        <span style={{ fontSize: 22 }}>🌙</span>
      ) : (
        <span style={{ fontSize: 22 }}>☀️</span>
      )}
    </button>
  );
});
ThemeToggle.displayName = "ThemeToggle";

export default ThemeToggle;

import React from "react";

const CircularLoader: React.FC<{ size?: number; color?: string }> = React.memo(function CircularLoader({ size = 32, color = "var(--text-primary, #fff)" }) {
  return (
  <svg
    width={size}
    height={size}
    viewBox="0 0 40 40"
    style={{ display: "block" }}
  >
    <circle
      cx="20"
      cy="20"
      r="16"
      stroke={color}
      strokeWidth="4"
      fill="none"
      opacity="0.2"
    />
    <circle
      cx="20"
      cy="20"
      r="16"
      stroke={color}
      strokeWidth="4"
      fill="none"
      strokeDasharray="100"
      strokeDashoffset="60"
      strokeLinecap="round"
      style={{
        transformOrigin: "center",
        animation: "circular-loader-spin 0.8s linear infinite"
      }}
    />
    <style>{`
      @keyframes circular-loader-spin {
        100% { transform: rotate(360deg); }
      }
    `}</style>
  </svg>
  );
});
CircularLoader.displayName = "CircularLoader";

export default CircularLoader;

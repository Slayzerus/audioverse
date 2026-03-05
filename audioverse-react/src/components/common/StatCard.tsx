import React from "react";

interface StatCardProps {
  label: string;
  value: number | string;
  color?: string;
}

const StatCard: React.FC<StatCardProps> = React.memo(function StatCard({ label, value, color = "var(--accent-primary, #2196f3)" }) {
  return (
    <div style={{
      background: "var(--card-elevated, #222)",
      borderRadius: 10,
      padding: 24,
      minWidth: 'min(180px, 100%)',
      margin: 8,
      boxShadow: "0 2px 8px #0002",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
    }}>
      <div style={{ fontSize: 32, fontWeight: 700, color }}>{value}</div>
      <div style={{ fontSize: 16, color: "var(--text-secondary, #aaa)", marginTop: 8 }}>{label}</div>
    </div>
  );
});
StatCard.displayName = "StatCard";

export default StatCard;

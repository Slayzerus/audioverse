import React from "react";
import { useTranslation } from "react-i18next";

// Tymczasowy typ, docelowo z backendu
export interface MicrophoneAssignment {
  id: number;
  userId: number;
  microphoneId: string;
  color: string;
  slot: number;
}

const DEFAULT_COLORS = ["#FF5252", "#448AFF", "#43A047", "#FFD600"];

export const MicrophoneAssignmentsPanel: React.FC<{
  maxSlots: number;
  assignments: MicrophoneAssignment[];
  microphones: { deviceId: string; label: string }[];
  onAssign: (slot: number, microphoneId: string, color: string) => void;
  onColorChange: (assignmentId: number, color: string) => void;
  onRemove: (assignmentId: number) => void;
}> = ({ maxSlots, assignments, microphones, onAssign, onColorChange, onRemove }) => {
  const { t } = useTranslation();

  return (
    <div style={{ marginTop: 32 }}>
      <h3>{t("microphoneAssignments.title")}</h3>
      {[...Array(maxSlots)].map((_, slot) => {
        const assignment = assignments.find(a => a.slot === slot);
        return (
          <div key={slot} style={{ border: "1px solid var(--border-subtle, #888)", margin: "8px 0", padding: 8, borderRadius: 8, display: "flex", alignItems: "center", gap: 16 }}>
            <div><b>{t("microphoneAssignments.player", { number: slot + 1 })}</b></div>
            {assignment ? (
              <>
                <span style={{ minWidth: 120 }}>{assignment.microphoneId}</span>
                <input type="color" value={assignment.color} onChange={e => onColorChange(assignment.id, e.target.value)} style={{ width: 32, height: 32, border: "none", background: "none" }} />
                <button onClick={() => onRemove(assignment.id)}>{t("common.delete")}</button>
              </>
            ) : (
              <>
                <select onChange={e => onAssign(slot, e.target.value, DEFAULT_COLORS[slot % DEFAULT_COLORS.length])} defaultValue="">
                  <option value="">{t("microphoneAssignments.chooseMic")}</option>
                  {microphones.map(mic => (
                    <option key={mic.deviceId} value={mic.deviceId}>{mic.label || mic.deviceId}</option>
                  ))}
                </select>
                <span style={{ color: "var(--text-muted, #aaa)" }}>({t("microphoneAssignments.unassigned")})</span>
              </>
            )}
          </div>
        );
      })}
    </div>
  );
};

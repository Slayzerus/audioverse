import React from "react";

export interface CCLaneEvent {
  id: number;
  cc: number; // Controller number
  value: number; // 0-127
  time: number; // seconds
}

interface CCLaneSelectorProps {
  ccType: number;
  onChange: (cc: number) => void;
}

const CC_TYPES = [
  { cc: 1, label: "Mod Wheel (CC1)" },
  { cc: 11, label: "Expression (CC11)" },
  { cc: 7, label: "Volume (CC7)" },
  { cc: 74, label: "Brightness (CC74)" },
];

const CCLaneSelector: React.FC<CCLaneSelectorProps> = ({ ccType, onChange }) => (
  <select value={ccType} onChange={e => onChange(Number(e.target.value))} style={{ fontSize: 13, marginLeft: 8 }}>
    {CC_TYPES.map(opt => (
      <option key={opt.cc} value={opt.cc}>{opt.label}</option>
    ))}
  </select>
);

export default React.memo(CCLaneSelector);

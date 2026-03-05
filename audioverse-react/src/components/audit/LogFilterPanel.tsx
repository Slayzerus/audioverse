import React from "react";
import { useTranslation } from 'react-i18next';

interface LogFilterPanelProps {
  actionTypes: string[];
  selectedAction: string;
  onActionChange: (action: string) => void;
  dateFrom: string;
  dateTo: string;
  onDateFromChange: (date: string) => void;
  onDateToChange: (date: string) => void;
}

const LogFilterPanel: React.FC<LogFilterPanelProps> = ({ actionTypes, selectedAction, onActionChange, dateFrom, dateTo, onDateFromChange, onDateToChange }) => {
  const { t } = useTranslation();
  return (
    <div style={{ display: "flex", gap: 16, marginBottom: 16 }}>
      <select value={selectedAction} onChange={e => onActionChange(e.target.value)}>
        <option value="">{t('logFilter.allActions', 'All Actions')}</option>
        {actionTypes.map(type => (
          <option key={type} value={type}>{type}</option>
        ))}
      </select>
      <input type="date" value={dateFrom} onChange={e => onDateFromChange(e.target.value)} />
      <input type="date" value={dateTo} onChange={e => onDateToChange(e.target.value)} />
    </div>
  );
};

export default LogFilterPanel;

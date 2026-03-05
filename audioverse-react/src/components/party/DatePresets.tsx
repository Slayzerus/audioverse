import React from 'react';
import { useTranslation } from 'react-i18next';

const DatePresets: React.FC<{ onSetRange: (from: string, to: string) => void }> = ({ onSetRange }) => {
  const { t } = useTranslation();
  const fmt = (d: Date) => d.toISOString().slice(0,19);
  return (
    <div className="d-flex align-items-center gap-2">
      <span className="text-muted" style={{ fontSize: 10, whiteSpace: 'nowrap' }}>{t('datePresets.label')}</span>
      <div className="d-flex gap-2">
        <button type="button" className="btn btn-outline-secondary" style={{ fontSize: 10, padding: '1px 8px', lineHeight: 1.4 }} onClick={() => {
          const now = new Date();
          const day = now.getDay();
          const daysUntilFri = (5 - day + 7) % 7 || 7;
          const fri = new Date(now); fri.setDate(now.getDate() + daysUntilFri); fri.setHours(0,0,0,0);
          const sun = new Date(fri); sun.setDate(fri.getDate() + 2); sun.setHours(23,59,59,999);
          onSetRange(fmt(fri), fmt(sun));
        }}>{ t('datePresets.thisWeekend')}</button>
        <button type="button" className="btn btn-outline-secondary" style={{ fontSize: 10, padding: '1px 8px', lineHeight: 1.4 }} onClick={() => {
          const now = new Date();
          const day = now.getDay();
          const daysUntilNextMon = ((1 - day + 7) % 7) || 7;
          const mon = new Date(now); mon.setDate(now.getDate() + daysUntilNextMon); mon.setHours(0,0,0,0);
          const sun = new Date(mon); sun.setDate(mon.getDate() + 6); sun.setHours(23,59,59,999);
          onSetRange(fmt(mon), fmt(sun));
        }}>{ t('datePresets.nextWeek')}</button>
        <button type="button" className="btn btn-outline-secondary" style={{ fontSize: 10, padding: '1px 8px', lineHeight: 1.4 }} onClick={() => {
          const now = new Date();
          const then = new Date(now); then.setDate(now.getDate() + 7);
          onSetRange(fmt(now), fmt(then));
        }}>{ t('datePresets.next7Days')}</button>
      </div>
    </div>
  );
};

export default DatePresets;

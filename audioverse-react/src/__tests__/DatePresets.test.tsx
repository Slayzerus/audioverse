import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';
import DatePresets from '../components/party/DatePresets';

vi.mock('react-i18next', () => ({
    useTranslation: () => ({
        t: (key: string) => {
            const map: Record<string, string> = {
                'datePresets.label': 'Date presets',
                'datePresets.thisWeekend': 'This weekend',
                'datePresets.nextWeek': 'Next week',
                'datePresets.next7Days': 'Next 7 days',
            };
            return map[key] ?? key;
        },
    }),
}));

function fmt(d: Date) { return d.toISOString().slice(0,19); }

describe('DatePresets', () => {
  const fixed = Date.UTC(2026, 1, 11, 10, 0, 0); // 2026-02-11 10:00:00 UTC (Wednesday)

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(fixed);
  });
  afterEach(() => {
    vi.useRealTimers();
    vi.resetAllMocks();
  });

  it('This weekend sets Fri 00:00 -> Sun 23:59:59.999', () => {
    const onSetRange = vi.fn();
    render(<DatePresets onSetRange={onSetRange} />);
    fireEvent.click(screen.getByText('This weekend'));
    expect(onSetRange).toHaveBeenCalledTimes(1);
    const [fromStr, toStr] = onSetRange.mock.calls[0][0] ? onSetRange.mock.calls[0] : onSetRange.mock.calls[0];
    // compute expected
    const now = new Date(fixed);
    const day = now.getDay();
    const daysUntilFri = (5 - day + 7) % 7 || 7;
    const fri = new Date(now); fri.setDate(now.getDate() + daysUntilFri); fri.setHours(0,0,0,0);
    const sun = new Date(fri); sun.setDate(fri.getDate() + 2); sun.setHours(23,59,59,999);
    expect(fromStr).toBe(fmt(fri));
    expect(toStr).toBe(fmt(sun));
  });

  it('Next week sets Monday 00:00 -> Sunday 23:59:59.999', () => {
    const onSetRange = vi.fn();
    render(<DatePresets onSetRange={onSetRange} />);
    fireEvent.click(screen.getByText('Next week'));
    expect(onSetRange).toHaveBeenCalledTimes(1);
    const [fromStr, toStr] = onSetRange.mock.calls[0];
    const now = new Date(fixed);
    const day = now.getDay();
    const daysUntilNextMon = ((1 - day + 7) % 7) || 7;
    const mon = new Date(now); mon.setDate(now.getDate() + daysUntilNextMon); mon.setHours(0,0,0,0);
    const sun = new Date(mon); sun.setDate(mon.getDate() + 6); sun.setHours(23,59,59,999);
    expect(fromStr).toBe(fmt(mon));
    expect(toStr).toBe(fmt(sun));
  });

  it('Next 7 days sets now -> now+7d', () => {
    const onSetRange = vi.fn();
    render(<DatePresets onSetRange={onSetRange} />);
    fireEvent.click(screen.getByText('Next 7 days'));
    expect(onSetRange).toHaveBeenCalledTimes(1);
    const [fromStr, toStr] = onSetRange.mock.calls[0];
    const now = new Date(fixed);
    const then = new Date(now); then.setDate(now.getDate() + 7);
    expect(fromStr).toBe(fmt(now));
    expect(toStr).toBe(fmt(then));
  });
});

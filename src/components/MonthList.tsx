import { useMemo, useRef } from 'react';
import { useData } from '../context/DataContext';
import type { DayStatus } from '../types';
import { appToday, dateKey, listDaysInPeriod, weekdayJa } from '../utils/period';
import { effectiveStatus, nextOnDoubleTap, nextOnSingleTap } from '../utils/tap';
import './MonthList.css';

const STATUS_LABEL: Record<DayStatus, string> = {
  work: '出勤',
  off: '休日',
  paid: '有給',
};

const DOUBLE_TAP_WINDOW = 280;

const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());

interface Props {
  periodKey: string;
}

const MonthList = ({ periodKey }: Props) => {
  const { records, setStatus, setRevenue } = useData();
  const clickTimers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const days = useMemo(() => listDaysInPeriod(periodKey), [periodKey]);
  const today = appToday();

  const handleStatusTap = (key: string) => {
    const existing = clickTimers.current.get(key);
    if (existing) {
      clearTimeout(existing);
      clickTimers.current.delete(key);
      setStatus(key, nextOnDoubleTap());
      return;
    }
    const timer = setTimeout(() => {
      clickTimers.current.delete(key);
      setStatus(key, nextOnSingleTap(records[key]?.status));
    }, DOUBLE_TAP_WINDOW);
    clickTimers.current.set(key, timer);
  };

  const handleRevenueChange = (key: string, value: string) => {
    if (value === '') {
      setRevenue(key, undefined);
      return;
    }
    const num = Number(value);
    if (!Number.isNaN(num)) setRevenue(key, num);
  };

  return (
    <div className="month-list">
      {days.map((d) => {
        const key = dateKey(d);
        const status = effectiveStatus(records[key]?.status);
        const isFuture = startOfDay(d) > today;

        return (
          <div key={key} className={`list-row list-row--${status}`}>
            <div className="list-row__date">
              <span className="list-row__day">{d.getDate()}</span>
              <span className="list-row__weekday">({weekdayJa(d)})</span>
            </div>
            <button type="button" className="list-row__status" onClick={() => handleStatusTap(key)}>
              {STATUS_LABEL[status]}
            </button>
            <div className="list-row__revenue">
              <span>¥</span>
              <input
                type="number"
                inputMode="numeric"
                placeholder="0"
                disabled={isFuture}
                value={records[key]?.revenue ?? ''}
                onChange={(e) => handleRevenueChange(key, e.target.value)}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default MonthList;

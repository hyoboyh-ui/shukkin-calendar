import { useData } from '../context/DataContext';
import type { DayStatus } from '../types';
import { dateKey, weekdayJa } from '../utils/period';
import { effectiveStatus, nextOnDoubleTap, nextOnSingleTap } from '../utils/tap';
import { useRef } from 'react';

const STATUS_LABEL: Record<DayStatus, string> = {
  work: '出勤',
  off: '休日',
  paid: '有給休暇',
};

const DOUBLE_TAP_WINDOW = 280;

const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());

interface Props {
  date: Date;
}

const DayCardBody = ({ date }: Props) => {
  const { records, setStatus, setRevenue } = useData();
  const clickTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const key = dateKey(date);
  const status = effectiveStatus(records[key]?.status);
  const isFuture = startOfDay(date) > startOfDay(new Date());

  const handleStatusTap = () => {
    if (clickTimer.current) {
      clearTimeout(clickTimer.current);
      clickTimer.current = null;
      setStatus(key, nextOnDoubleTap());
      return;
    }
    clickTimer.current = setTimeout(() => {
      clickTimer.current = null;
      setStatus(key, nextOnSingleTap(records[key]?.status));
    }, DOUBLE_TAP_WINDOW);
  };

  const handleRevenueChange = (value: string) => {
    if (value === '') {
      setRevenue(key, undefined);
      return;
    }
    const num = Number(value);
    if (!Number.isNaN(num)) setRevenue(key, num);
  };

  return (
    <div className={`day-card__body day-card__body--${status}`}>
      <div className="day-card__header">
        <span className="day-card__date">
          {date.getFullYear()}年{date.getMonth() + 1}月{date.getDate()}日
        </span>
        <span className="day-card__weekday">({weekdayJa(date)})</span>
      </div>

      <button type="button" className="day-card__frame" onClick={handleStatusTap}>
        {STATUS_LABEL[status]}
      </button>

      <div className="day-card__revenue">
        <label htmlFor={`revenue-input-${key}`}>運収</label>
        <div className="day-card__revenue-input">
          <span>¥</span>
          <input
            id={`revenue-input-${key}`}
            type="number"
            inputMode="numeric"
            placeholder="0"
            disabled={isFuture}
            value={records[key]?.revenue ?? ''}
            onChange={(e) => handleRevenueChange(e.target.value)}
          />
        </div>
        {isFuture && <p className="day-card__future-note">未来の日付は入力できません</p>}
      </div>
    </div>
  );
};

export default DayCardBody;

import { addDays } from 'date-fns';
import { useRef, useState } from 'react';
import { useData } from '../context/DataContext';
import type { DayStatus } from '../types';
import { dateKey, weekdayJa } from '../utils/period';
import { effectiveStatus, nextOnDoubleTap, nextOnSingleTap } from '../utils/tap';
import './HomeTab.css';

const STATUS_LABEL: Record<DayStatus, string> = {
  work: '出勤',
  off: '休日',
  paid: '有給休暇',
};

const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());

const SWIPE_THRESHOLD = 60;
const DOUBLE_TAP_WINDOW = 280;

const HomeTab = () => {
  const { records, setStatus, setRevenue } = useData();
  const [date, setDate] = useState(() => new Date());
  const dragStartX = useRef<number | null>(null);
  const clickTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const key = dateKey(date);
  const status = effectiveStatus(records[key]?.status);
  const today = startOfDay(new Date());
  const isFuture = startOfDay(date) > today;

  const goDay = (delta: number) => setDate((d) => addDays(d, delta));

  const onPointerDown = (e: React.PointerEvent) => {
    dragStartX.current = e.clientX;
  };
  const onPointerUp = (e: React.PointerEvent) => {
    if (dragStartX.current === null) return;
    const dx = e.clientX - dragStartX.current;
    dragStartX.current = null;
    if (dx > SWIPE_THRESHOLD) goDay(-1);
    else if (dx < -SWIPE_THRESHOLD) goDay(1);
  };

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
    <div className="screen home-tab">
      <div
        className="day-card"
        onPointerDown={onPointerDown}
        onPointerUp={onPointerUp}
      >
        <button className="day-card__nav" onClick={() => goDay(-1)} aria-label="前の日">
          ‹
        </button>

        <div className="day-card__body">
          <div className="day-card__header">
            <span className="day-card__date">
              {date.getFullYear()}年{date.getMonth() + 1}月{date.getDate()}日
            </span>
            <span className="day-card__weekday">({weekdayJa(date)})</span>
          </div>

          <button
            type="button"
            className={`day-card__frame day-card__frame--${status}`}
            onClick={handleStatusTap}
          >
            {STATUS_LABEL[status]}
          </button>

          <div className="day-card__revenue">
            <label htmlFor="revenue-input">運収</label>
            <div className="day-card__revenue-input">
              <span>¥</span>
              <input
                id="revenue-input"
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

        <button className="day-card__nav" onClick={() => goDay(1)} aria-label="次の日">
          ›
        </button>
      </div>
    </div>
  );
};

export default HomeTab;

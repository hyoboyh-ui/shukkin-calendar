import { addDays } from 'date-fns';
import { useMemo, useRef } from 'react';
import { useData } from '../context/DataContext';
import type { Bubble, DayStatus } from '../types';
import { dateKey, periodFromKey, listDaysInPeriod, weekdayJa } from '../utils/period';
import { computeBubbles } from '../utils/streaks';
import { effectiveStatus, nextOnDoubleTap, nextOnSingleTap } from '../utils/tap';
import './MonthGrid.css';

const STATUS_LABEL: Record<DayStatus, string> = {
  work: '出勤',
  off: '休日',
  paid: '有給休暇',
};

const WEEKDAYS = ['日', '月', '火', '水', '木', '金', '土'];
const DOUBLE_TAP_WINDOW = 280;

interface Props {
  periodKey: string;
}

interface RowSegment {
  startCol: number;
  endCol: number;
  bubble: Bubble;
}

const chunk = <T,>(arr: T[], size: number): T[][] => {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
};

const rowSegments = (row: Date[], bubbleByKey: Map<string, Bubble>): RowSegment[] => {
  const segments: RowSegment[] = [];
  let current: RowSegment | null = null;

  row.forEach((d, col) => {
    const bubble = bubbleByKey.get(dateKey(d));
    if (bubble && current && current.bubble === bubble) {
      current.endCol = col;
    } else {
      if (current) segments.push(current);
      current = bubble ? { startCol: col, endCol: col, bubble } : null;
    }
  });
  if (current) segments.push(current);

  return segments;
};

const MonthGrid = ({ periodKey }: Props) => {
  const { records, setStatus } = useData();
  const clickTimers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const { allDays, bubbleByKey, inPeriodSet } = useMemo(() => {
    const { start, end } = periodFromKey(periodKey);
    const periodDays = listDaysInPeriod(periodKey);
    const inPeriodSet = new Set(periodDays.map(dateKey));

    const leadCount = start.getDay();
    const leadDays = Array.from({ length: leadCount }, (_, i) => addDays(start, -(leadCount - i)));
    const trailCount = 6 - end.getDay();
    const trailDays = Array.from({ length: trailCount }, (_, i) => addDays(end, i + 1));
    const allDays = [...leadDays, ...periodDays, ...trailDays];

    const bubbles = computeBubbles(periodDays, records);
    const bubbleByKey = new Map<string, Bubble>();
    for (const b of bubbles) {
      periodDays
        .filter((d) => {
          const k = dateKey(d);
          return k >= b.startKey && k <= b.endKey;
        })
        .forEach((d) => bubbleByKey.set(dateKey(d), b));
    }

    return { allDays, bubbleByKey, inPeriodSet };
  }, [periodKey, records]);

  const rows = useMemo(() => chunk(allDays, 7), [allDays]);

  const handleTap = (key: string) => {
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

  return (
    <div className="month-grid">
      <div className="month-grid__weekdays">
        {WEEKDAYS.map((w) => (
          <div key={w} className="month-grid__weekday">
            {w}
          </div>
        ))}
      </div>
      {rows.map((row, ri) => (
        <div className="month-grid__row" key={ri}>
          {row.map((d, col) => {
            const key = dateKey(d);
            const inPeriod = inPeriodSet.has(key);
            const style = { gridColumn: col + 1, gridRow: 1 };
            if (!inPeriod) {
              return (
                <div key={key} className="cell cell--pad" style={style}>
                  <span className="cell__date">{d.getDate()}</span>
                </div>
              );
            }
            const status = effectiveStatus(records[key]?.status);
            const isBubbled = bubbleByKey.has(key);

            return (
              <button
                key={key}
                type="button"
                className={`cell cell--${status}`}
                style={style}
                onClick={() => handleTap(key)}
              >
                <span className="cell__date">
                  {d.getDate()}
                  <span className="cell__weekday">({weekdayJa(d)})</span>
                </span>
                {!isBubbled && <span className="cell__status">{STATUS_LABEL[status]}</span>}
              </button>
            );
          })}
          {rowSegments(row, bubbleByKey).map((seg) => (
            <span
              key={seg.startCol}
              className={`row-bubble ${seg.bubble.edge ? 'row-bubble--edge' : ''}`}
              style={{ gridColumn: `${seg.startCol + 1} / ${seg.endCol + 2}` }}
            >
              {seg.bubble.count}勤
            </span>
          ))}
        </div>
      ))}
    </div>
  );
};

export default MonthGrid;

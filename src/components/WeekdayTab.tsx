import { useMemo } from 'react';
import { useData } from '../context/DataContext';
import { formatYen } from '../utils/format';
import { weekdayStats } from '../utils/stats';
import './WeekdayTab.css';

const WEEKDAY_LABEL = ['日', '月', '火', '水', '木', '金', '土'];

const WeekdayTab = () => {
  const { records } = useData();
  const stats = useMemo(() => weekdayStats(records), [records]);

  const withData = stats.filter((s) => s.count > 0);
  const hasData = withData.length > 0;
  const maxAverage = hasData ? Math.max(...withData.map((s) => s.average)) : 0;
  const bestWeekday = hasData
    ? withData.reduce((best, s) => (s.average > best.average ? s : best)).weekday
    : null;

  return (
    <div className="screen weekday-tab">
      <h2 className="screen__title">曜日別</h2>
      <p className="screen__hint">全期間のデータから、曜日ごとの平均運収を算出</p>

      {!hasData && <p className="weekday-tab__empty">運収を入力したら、ここに曜日別の統計が出てくるで</p>}

      {hasData && (
        <div className="weekday-tab__list">
          {stats.map((s) => {
            const isBest = s.weekday === bestWeekday;
            const barPct = maxAverage > 0 ? (s.average / maxAverage) * 100 : 0;
            return (
              <div key={s.weekday} className={`weekday-card ${isBest ? 'weekday-card--best' : ''}`}>
                <div className="weekday-card__row">
                  <span className="weekday-card__label">{WEEKDAY_LABEL[s.weekday]}</span>
                  <span className="weekday-card__bar-track">
                    <span className="weekday-card__bar-fill" style={{ width: `${barPct}%` }} />
                  </span>
                  <span className="weekday-card__amounts">
                    <span className="weekday-card__average">{formatYen(s.average)}</span>
                    <span className="weekday-card__count">{s.count}件</span>
                  </span>
                </div>
                {isBest && (
                  <p className="weekday-card__message">一番稼げてるのは{WEEKDAY_LABEL[s.weekday]}曜日やで！</p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default WeekdayTab;

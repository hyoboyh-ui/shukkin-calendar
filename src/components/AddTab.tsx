import { useMemo, useState } from 'react';
import { useData } from '../context/DataContext';
import MonthGrid from './MonthGrid';
import MonthList from './MonthList';
import { formatYen } from '../utils/format';
import { appToday, listPeriodKeysAround, periodKey, periodLabel } from '../utils/period';
import { periodStats } from '../utils/stats';
import './AddTab.css';

const MONTHS_BEFORE = 36;
const MONTHS_AFTER = 6;

type ViewMode = 'grid' | 'list';

const HINT: Record<ViewMode, string> = {
  grid: 'タップで休日、ダブルタップで有給休暇',
  list: 'タップでステータス切替、金額はそのまま入力',
};

const AddTab = () => {
  const { records } = useData();
  const options = useMemo(() => listPeriodKeysAround(MONTHS_BEFORE, MONTHS_AFTER), []);
  const [selected, setSelected] = useState(() => periodKey(appToday()));
  const [view, setView] = useState<ViewMode>('grid');
  const stats = useMemo(() => periodStats(selected, records), [selected, records]);

  return (
    <div className="screen">
      <div className="screen__row">
        <h2 className="screen__title">{periodLabel(selected)}の出勤表</h2>
        <select
          className="period-select"
          value={selected}
          onChange={(e) => setSelected(e.target.value)}
        >
          {options.map((key) => (
            <option key={key} value={key}>
              {periodLabel(key)}
            </option>
          ))}
        </select>
      </div>

      <div className="view-toggle">
        <button
          type="button"
          className={`view-toggle__btn ${view === 'grid' ? 'is-active' : ''}`}
          onClick={() => setView('grid')}
        >
          カレンダー
        </button>
        <button
          type="button"
          className={`view-toggle__btn ${view === 'list' ? 'is-active' : ''}`}
          onClick={() => setView('list')}
        >
          リスト
        </button>
      </div>

      <p className="screen__hint">{HINT[view]}</p>
      {view === 'grid' ? <MonthGrid periodKey={selected} /> : <MonthList periodKey={selected} />}

      <div className="month-total">
        <p className="month-total__label">{periodLabel(selected)}の合計</p>
        <p className="month-total__value">{formatYen(stats.total)}</p>
        <p className="month-total__sub">{stats.work}勤</p>
      </div>
    </div>
  );
};

export default AddTab;

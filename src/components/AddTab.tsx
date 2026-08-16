import { useMemo, useState } from 'react';
import { useData } from '../context/DataContext';
import MonthGrid from './MonthGrid';
import { appToday, listPeriodKeysAround, periodKey, periodLabel } from '../utils/period';
import { periodStats } from '../utils/stats';
import './AddTab.css';

const MONTHS_BEFORE = 6;
const MONTHS_AFTER = 6;

const AddTab = () => {
  const { records } = useData();
  const options = useMemo(() => listPeriodKeysAround(MONTHS_BEFORE, MONTHS_AFTER), []);
  const [selected, setSelected] = useState(() => periodKey(appToday()));
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
      <p className="screen__hint">タップで休日、ダブルタップで有給休暇</p>
      <MonthGrid periodKey={selected} />

      <div className="month-total">
        <p className="month-total__label">{periodLabel(selected)}の合計</p>
        <p className="month-total__value">{stats.work}勤</p>
      </div>
    </div>
  );
};

export default AddTab;

import { useMemo } from 'react';
import { useData } from '../context/DataContext';
import MonthGrid from './MonthGrid';
import { periodKey, periodLabel } from '../utils/period';
import { periodStats } from '../utils/stats';
import './AddTab.css';

const AddTab = () => {
  const { records } = useData();
  const key = periodKey(new Date());
  const stats = useMemo(() => periodStats(key, records), [key, records]);

  return (
    <div className="screen">
      <h2 className="screen__title">{periodLabel(key)}の出勤表</h2>
      <p className="screen__hint">タップで休日、ダブルタップで有給休暇</p>
      <MonthGrid periodKey={key} />

      <div className="month-total">
        <p className="month-total__label">{periodLabel(key)}の合計</p>
        <p className="month-total__value">{stats.work}勤</p>
      </div>
    </div>
  );
};

export default AddTab;

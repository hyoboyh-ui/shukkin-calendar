import { useState } from 'react';
import MonthGrid from './MonthGrid';
import { listRecentPeriodKeys, periodKey, periodLabel } from '../utils/period';

const PAST_RANGE = 36;

const PastTab = () => {
  const options = listRecentPeriodKeys(PAST_RANGE).reverse();
  const [selected, setSelected] = useState(() => periodKey(new Date()));

  return (
    <div className="screen">
      <div className="screen__row">
        <h2 className="screen__title">過去の出勤表</h2>
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
      <MonthGrid periodKey={selected} />
    </div>
  );
};

export default PastTab;

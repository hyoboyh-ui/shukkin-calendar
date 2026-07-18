import MonthGrid from './MonthGrid';
import { periodKey, periodLabel } from '../utils/period';

const AddTab = () => {
  const key = periodKey(new Date());
  return (
    <div className="screen">
      <h2 className="screen__title">{periodLabel(key)}の出勤表</h2>
      <p className="screen__hint">タップで休日、ダブルタップで有給休暇</p>
      <MonthGrid periodKey={key} />
    </div>
  );
};

export default AddTab;

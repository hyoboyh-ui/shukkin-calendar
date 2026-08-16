import { useMemo } from 'react';
import { useData } from '../context/DataContext';
import { formatYen } from '../utils/format';
import { afterTax, messageForTotal } from '../utils/message';
import { appToday, periodKey, periodLabel } from '../utils/period';
import { periodStats } from '../utils/stats';
import './TotalTab.css';

const TotalTab = () => {
  const { records } = useData();
  const key = periodKey(appToday());
  const stats = useMemo(() => periodStats(key, records), [key, records]);
  const tier = messageForTotal(stats.total);

  return (
    <div className="screen total-tab">
      <p className="total-tab__label">{periodLabel(key)}の合計運収</p>
      <p className="total-tab__amount">{formatYen(stats.total)}</p>
      <p className="total-tab__tax">（税引き：{formatYen(afterTax(stats.total))}）</p>
      <p className="total-tab__message">{tier.message}</p>
    </div>
  );
};

export default TotalTab;

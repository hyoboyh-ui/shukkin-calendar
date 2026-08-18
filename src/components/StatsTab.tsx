import {
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  Tooltip,
} from 'chart.js';
import { useMemo, useState } from 'react';
import { Bar } from 'react-chartjs-2';
import { useData } from '../context/DataContext';
import { formatYen } from '../utils/format';
import { listRecentPeriodKeys, periodLabel } from '../utils/period';
import { periodStats } from '../utils/stats';
import './StatsTab.css';

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

const RANGE_OPTIONS = [
  { label: '6期間', value: 6 },
  { label: '12期間', value: 12 },
  { label: '全期間', value: 36 },
];

const StatsTab = () => {
  const { records } = useData();
  const [range, setRange] = useState(12);

  const stats = useMemo(() => {
    const keys = listRecentPeriodKeys(range);
    return keys.map((k) => periodStats(k, records));
  }, [range, records]);

  const labels = stats.map((s) => periodLabel(s.key).replace('年', '/'));

  const revenueData = {
    labels,
    datasets: [
      {
        label: '運収',
        data: stats.map((s) => s.total),
        backgroundColor: '#FB925B',
        borderRadius: 6,
      },
    ],
  };

  return (
    <div className="screen stats-tab">
      <div className="screen__row">
        <h2 className="screen__title">集計</h2>
        <div className="range-toggle">
          {RANGE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              className={`range-toggle__btn ${range === opt.value ? 'is-active' : ''}`}
              onClick={() => setRange(opt.value)}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div className="stats-card">
        <p className="stats-card__title">運収の推移</p>
        <Bar
          data={revenueData}
          options={{
            responsive: true,
            plugins: {
              legend: { display: false },
              tooltip: { callbacks: { label: (ctx) => formatYen(ctx.parsed.y ?? 0) } },
            },
            scales: { y: { ticks: { callback: (v) => `${Number(v) / 10000}万` } } },
          }}
        />
      </div>

      <div className="stats-card">
        <p className="stats-card__title">月別の運収</p>
        <div className="stats-list">
          {stats.map((s, i) => {
            const diff = i > 0 ? s.total - stats[i - 1].total : null;
            return (
              <div key={s.key} className="stats-list__row">
                <span className="stats-list__label">{labels[i]}</span>
                <span className="stats-list__right">
                  {diff !== null && (
                    <span className={`stats-list__diff ${diff >= 0 ? 'stats-list__diff--up' : 'stats-list__diff--down'}`}>
                      <span className="stats-list__diff-arrow">{diff >= 0 ? '▲' : '▼'}</span> {formatYen(Math.abs(diff))}
                    </span>
                  )}
                  <span className="stats-list__amount">{formatYen(s.total)}</span>
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default StatsTab;

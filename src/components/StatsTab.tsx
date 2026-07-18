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
        backgroundColor: '#FF8C00',
        borderRadius: 6,
      },
    ],
  };

  const breakdownData = {
    labels,
    datasets: [
      { label: '出勤', data: stats.map((s) => s.work), backgroundColor: '#FFD9A8', stack: 'a' },
      { label: '休日', data: stats.map((s) => s.off), backgroundColor: '#FF5A36', stack: 'a' },
      { label: '有給', data: stats.map((s) => s.paid), backgroundColor: '#FFD24C', stack: 'a' },
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
        <p className="stats-card__title">出勤・休日・有給の内訳</p>
        <Bar
          data={breakdownData}
          options={{
            responsive: true,
            plugins: { legend: { position: 'bottom' } },
            scales: { x: { stacked: true }, y: { stacked: true } },
          }}
        />
      </div>
    </div>
  );
};

export default StatsTab;

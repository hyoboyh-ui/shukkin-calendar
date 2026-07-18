import './BottomNav.css';

export type TabKey = 'add' | 'past' | 'home' | 'total' | 'stats';

const TABS: { key: TabKey; label: string; icon: string }[] = [
  { key: 'add', label: '＋', icon: '＋' },
  { key: 'past', label: '過去月', icon: '🗓️' },
  { key: 'home', label: 'ホーム', icon: '🏠' },
  { key: 'total', label: '合計', icon: '💴' },
  { key: 'stats', label: '集計', icon: '📊' },
];

interface Props {
  active: TabKey;
  onChange: (key: TabKey) => void;
}

const BottomNav = ({ active, onChange }: Props) => {
  return (
    <nav className="bottom-nav">
      {TABS.map((tab) => (
        <button
          key={tab.key}
          type="button"
          className={`bottom-nav__btn ${tab.key === 'home' ? 'bottom-nav__btn--fab' : ''} ${
            active === tab.key ? 'is-active' : ''
          }`}
          onClick={() => onChange(tab.key)}
        >
          <span className="bottom-nav__icon">{tab.icon}</span>
          <span className="bottom-nav__label">{tab.label}</span>
        </button>
      ))}
    </nav>
  );
};

export default BottomNav;

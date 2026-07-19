import './BottomNav.css';

export type TabKey = 'add' | 'past' | 'home' | 'total' | 'stats';

const ICON_BASE = `${import.meta.env.BASE_URL}nav-icons/`;

const TABS: { key: TabKey; label: string; icon: string }[] = [
  { key: 'add', label: '追加', icon: `${ICON_BASE}add.png` },
  { key: 'past', label: '過去月', icon: `${ICON_BASE}past.png` },
  { key: 'home', label: 'ホーム', icon: `${ICON_BASE}home.png` },
  { key: 'total', label: '合計', icon: `${ICON_BASE}total.png` },
  { key: 'stats', label: '集計', icon: `${ICON_BASE}stats.png` },
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
          aria-label={tab.label}
          className={`bottom-nav__btn ${tab.key === 'home' ? 'bottom-nav__btn--fab' : ''} ${
            active === tab.key ? 'is-active' : ''
          }`}
          onClick={() => onChange(tab.key)}
        >
          <span className="bottom-nav__icon" style={{ maskImage: `url(${tab.icon})`, WebkitMaskImage: `url(${tab.icon})` }} />
        </button>
      ))}
    </nav>
  );
};

export default BottomNav;

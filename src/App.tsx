import { useState, type ReactElement } from 'react';
import './App.css';
import AddTab from './components/AddTab';
import BottomNav, { type TabKey } from './components/BottomNav';
import HomeTab from './components/HomeTab';
import PastTab from './components/PastTab';
import SettingsPanel from './components/SettingsPanel';
import StatsTab from './components/StatsTab';
import TotalTab from './components/TotalTab';
import { DataProvider } from './context/DataContext';

const TAB_COMPONENTS: Record<TabKey, () => ReactElement> = {
  add: AddTab,
  past: PastTab,
  home: HomeTab,
  total: TotalTab,
  stats: StatsTab,
};

function App() {
  const [tab, setTab] = useState<TabKey>('home');
  const [settingsOpen, setSettingsOpen] = useState(false);
  const ActiveTab = TAB_COMPONENTS[tab];

  return (
    <DataProvider>
      <header className="app-header">
        <span className="app-header__title">出勤カレンダー</span>
        <button
          type="button"
          className="app-header__settings"
          onClick={() => setSettingsOpen(true)}
          aria-label="設定"
        >
          ⚙️
        </button>
      </header>

      <main className="app-main">
        <ActiveTab />
      </main>

      <BottomNav active={tab} onChange={setTab} />

      {settingsOpen && <SettingsPanel onClose={() => setSettingsOpen(false)} />}
    </DataProvider>
  );
}

export default App;

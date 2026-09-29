import { useRef, useState } from 'react';
import { useData } from '../context/DataContext';
import { exportDataToFile, importDataFromFile } from '../utils/storage';
import './SettingsPanel.css';

interface Props {
  onClose: () => void;
}

const formatSyncedAt = (ms: number): string => {
  const d = new Date(ms);
  return `${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`;
};

const SettingsPanel = ({ onClose }: Props) => {
  const {
    records,
    restoreBackup,
    syncEnabled,
    loggedIn,
    login,
    pendingCount,
    syncing,
    lastSyncedAt,
    syncError,
    syncNow,
  } = useData();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [password, setPassword] = useState('');
  const [loggingIn, setLoggingIn] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  const handleImportClick = () => fileInputRef.current?.click();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    let data;
    try {
      data = await importDataFromFile(file);
    } catch {
      setMessage('このアプリのバックアップファイルではないようです。ファイルを確認してください');
      return;
    }
    const days = Object.keys(data).length;
    if (!window.confirm(`いまの記録をすべて、バックアップの内容（${days}日分）に置き換えます。よろしいですか？`)) return;
    restoreBackup(data);
    setMessage('バックアップを読み込みました');
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password || loggingIn) return;
    setLoggingIn(true);
    setLoginError(null);
    try {
      await login(password);
      setPassword('');
    } catch (err) {
      setLoginError(err instanceof Error ? err.message : 'ログインに失敗しました');
    } finally {
      setLoggingIn(false);
    }
  };

  return (
    <div className="settings-overlay" onClick={onClose}>
      <div className="settings-panel" onClick={(e) => e.stopPropagation()}>
        <div className="settings-panel__header">
          <h2>⚙️ 設定・バックアップ</h2>
          <button type="button" className="settings-panel__close" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="settings-panel__sync">
          <span className="settings-panel__sync-title">オンライン同期</span>
          {syncEnabled && !loggedIn && (
            <form className="settings-panel__login" onSubmit={handleLogin}>
              <span className="settings-panel__sync-status">
                同期するにはパスワードを入力してください
                {pendingCount > 0 && `（未同期の変更: ${pendingCount}件）`}
              </span>
              <input
                type="password"
                className="settings-panel__password"
                placeholder="パスワード"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button type="submit" className="settings-panel__action" disabled={!password || loggingIn}>
                {loggingIn ? '確認中…' : 'ログイン'}
              </button>
              {loginError && <span className="settings-panel__sync-error">{loginError}</span>}
            </form>
          )}
          {syncEnabled && loggedIn && (
            <>
              <span className="settings-panel__sync-status">
                {pendingCount > 0 ? `未同期の変更: ${pendingCount}件` : 'すべて同期済み'}
                {lastSyncedAt && ` ・ 最終同期 ${formatSyncedAt(lastSyncedAt)}`}
              </span>
              <button
                type="button"
                className="settings-panel__action settings-panel__action--outline"
                onClick={syncNow}
                disabled={syncing}
              >
                {syncing ? '同期中…' : '今すぐ同期'}
              </button>
              {syncError && <span className="settings-panel__sync-error">同期に失敗しました（{syncError}）</span>}
            </>
          )}
          {!syncEnabled && <span className="settings-panel__sync-status">オンライン同期は未設定です</span>}
        </div>

        <button type="button" className="settings-panel__action" onClick={() => exportDataToFile(records)}>
          JSONファイルを書き出す
        </button>
        <button type="button" className="settings-panel__action settings-panel__action--outline" onClick={handleImportClick}>
          JSONファイルを読み込む
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="application/json"
          className="settings-panel__file-input"
          onChange={handleFileChange}
        />

        {message && <p className="settings-panel__message">{message}</p>}
      </div>
    </div>
  );
};

export default SettingsPanel;

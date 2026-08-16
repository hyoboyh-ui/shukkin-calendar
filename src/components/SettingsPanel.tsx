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
  const { records, replaceAll, syncEnabled, pendingCount, syncing, lastSyncedAt, syncError, syncNow } = useData();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState<string | null>(null);

  const handleImportClick = () => fileInputRef.current?.click();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    try {
      const data = await importDataFromFile(file);
      replaceAll(data);
      setMessage('バックアップを読み込みました');
    } catch {
      setMessage('読み込みに失敗しました。ファイルを確認してください');
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
          {syncEnabled ? (
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
          ) : (
            <span className="settings-panel__sync-status">オンライン同期は未設定です</span>
          )}
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

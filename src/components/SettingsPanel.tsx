import { useRef, useState } from 'react';
import { useData } from '../context/DataContext';
import { exportDataToFile, importDataFromFile } from '../utils/storage';
import './SettingsPanel.css';

interface Props {
  onClose: () => void;
}

const SettingsPanel = ({ onClose }: Props) => {
  const { records, replaceAll } = useData();
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

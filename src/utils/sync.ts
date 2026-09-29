import type { DataStore } from '../types';
import { parseDataStore } from './storage';

// Apps Script の「ウェブアプリのURL」。公開されて困るものではない（合言葉はGAS側で確認する）。
export const SYNC_URL = 'https://script.google.com/macros/s/AKfycby3lEuk4oJar_PF5-S6JqWCzoB5V5ObJQuS0rxwCblh1aZMECVVT_lj12OO6xTV0pd4cA/exec';

export const isSyncConfigured = (): boolean => SYNC_URL.length > 0;

/** ログインが切れている・無効になったとき。端末のトークンを捨ててログインし直してもらう。 */
export class AuthError extends Error {}

const LOGIN_ERROR_MESSAGE: Record<string, string> = {
  wrong_password: 'パスワードが違います',
  locked: '失敗が続いたため15分間ログインできません',
  not_configured: 'サーバー側でパスワードが未設定です',
};

// Content-Typeを指定しない（text/plain送信）ことでブラウザのCORSプリフライトを避け、
// GASのdoPostにそのまま届くようにしている。
const post = async (body: object): Promise<Record<string, unknown>> => {
  const res = await fetch(SYNC_URL, { method: 'POST', body: JSON.stringify(body) });
  const text = await res.text();
  try {
    return JSON.parse(text) as Record<string, unknown>;
  } catch {
    throw new Error('サーバーから予期しない応答がありました');
  }
};

export const gasLogin = async (password: string): Promise<string> => {
  const json = await post({ action: 'login', password });
  if (typeof json.token === 'string') return json.token;
  const code = String(json.error ?? '');
  throw new Error(LOGIN_ERROR_MESSAGE[code] ?? (code || 'ログインに失敗しました'));
};

/**
 * ローカルの未同期変更をサーバーへ送り、サーバー側でLast-Write-Winsマージした
 * 全レコードを受け取る。
 */
export const gasSync = async (changes: DataStore, token: string): Promise<DataStore> => {
  const json = await post({ action: 'sync', token, changes });
  if (json.error === 'unauthorized') throw new AuthError('ログインが必要です');
  if (json.error) throw new Error(String(json.error));
  return parseDataStore(json.records, false) ?? {};
};

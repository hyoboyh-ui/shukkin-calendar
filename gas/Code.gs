// ============================================================
// 出勤カレンダー - Google Apps Script バックエンド
// ============================================================

// このスクリプトが紐づいているスプレッドシートを使うため、通常はIDの設定は不要。
// スプレッドシートから独立したスクリプトとして動かす場合のみ、下記にIDを入れる。
// （スプレッドシートのURL https://docs.google.com/spreadsheets/d/★ここ★/edit の部分）
const SPREADSHEET_ID = '';

function getSS() {
  const active = SpreadsheetApp.getActive();
  if (active) return active;
  if (!SPREADSHEET_ID) {
    throw new Error('スプレッドシートに紐づいていません。Code.gs の SPREADSHEET_ID を設定してください。');
  }
  return SpreadsheetApp.openById(SPREADSHEET_ID);
}

const SHEET_NAME = 'records';
const HEADERS = ['date', 'status', 'revenue', 'updatedAt'];

function getSheet() {
  const ss = getSS();
  let ws = ss.getSheetByName(SHEET_NAME);
  if (!ws) {
    ws = ss.insertSheet(SHEET_NAME);
    ws.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]);
    ws.setFrozenRows(1);
  }
  return ws;
}

// ============================================================
// 認証
// ============================================================
//
// アプリのコードは公開されているので、秘密はアプリ側に一切置かない。
// 鍵は本人が覚えるパスワードだけで、スクリプトプロパティにはそのハッシュだけを保存する。
// ログインに成功した端末にはトークンを発行し、以降の同期はトークンで認証する。
//
// 初回設定・パスワード変更の手順:
//   1. プロジェクトの設定 → スクリプト プロパティに SETUP_PASSWORD = 新しいパスワード を追加
//   2. エディタで setupPassword を実行（SETUP_PASSWORD は実行後に自動で消える）
//   ※ 実行すると全端末がログアウトされる

const PWD_ITERATIONS = 2000;
const MAX_TOKENS = 10;
const MAX_FAILED_LOGINS = 5;
const LOGIN_LOCK_MS = 15 * 60 * 1000;

const PROP_SALT = 'PWD_SALT';
const PROP_HASH = 'PWD_HASH';
const PROP_TOKENS = 'TOKENS';
const PROP_FAILS = 'LOGIN_FAILS';
const PROP_LOCKED_UNTIL = 'LOGIN_LOCKED_UNTIL';
const PROP_SETUP = 'SETUP_PASSWORD';

function toHex(bytes) {
  return bytes.map((b) => ('0' + (b & 0xff).toString(16)).slice(-2)).join('');
}

function sha256Hex(text) {
  return toHex(Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, text, Utilities.Charset.UTF_8));
}

function hashPassword(password, salt) {
  let h = salt + ':' + password;
  for (let i = 0; i < PWD_ITERATIONS; i++) h = sha256Hex(salt + h);
  return h;
}

function setupPassword() {
  const props = PropertiesService.getScriptProperties();
  const password = props.getProperty(PROP_SETUP);
  if (!password) {
    throw new Error('スクリプト プロパティに SETUP_PASSWORD を追加してから実行してください。');
  }
  const salt = Utilities.getUuid();
  props.setProperties({
    [PROP_SALT]: salt,
    [PROP_HASH]: hashPassword(password, salt),
    [PROP_TOKENS]: '[]',
    [PROP_FAILS]: '0',
    [PROP_LOCKED_UNTIL]: '0',
  });
  props.deleteProperty(PROP_SETUP);
  Logger.log('パスワードを設定しました。全端末がログアウトされています。');
}

/** 締め出されたときにエディタから実行して、ログイン失敗の回数をリセットする。 */
function resetLoginLock() {
  PropertiesService.getScriptProperties().setProperties({ [PROP_FAILS]: '0', [PROP_LOCKED_UNTIL]: '0' });
  Logger.log('ログインのロックを解除しました。');
}

function readTokens(props) {
  try {
    return JSON.parse(props.getProperty(PROP_TOKENS) || '[]');
  } catch (e) {
    return [];
  }
}

function login(password) {
  const props = PropertiesService.getScriptProperties();
  const salt = props.getProperty(PROP_SALT);
  const hash = props.getProperty(PROP_HASH);
  if (!salt || !hash) return { error: 'not_configured' };

  const lockedUntil = Number(props.getProperty(PROP_LOCKED_UNTIL)) || 0;
  if (Date.now() < lockedUntil) return { error: 'locked' };

  if (typeof password !== 'string' || hashPassword(password, salt) !== hash) {
    const fails = (Number(props.getProperty(PROP_FAILS)) || 0) + 1;
    if (fails >= MAX_FAILED_LOGINS) {
      props.setProperties({ [PROP_FAILS]: '0', [PROP_LOCKED_UNTIL]: String(Date.now() + LOGIN_LOCK_MS) });
      return { error: 'locked' };
    }
    props.setProperty(PROP_FAILS, String(fails));
    return { error: 'wrong_password' };
  }

  const token = Utilities.getUuid() + Utilities.getUuid();
  const tokens = readTokens(props);
  tokens.push(sha256Hex(token));
  props.setProperties({
    [PROP_TOKENS]: JSON.stringify(tokens.slice(-MAX_TOKENS)),
    [PROP_FAILS]: '0',
  });
  return { token };
}

function isValidToken(token) {
  if (typeof token !== 'string' || !token) return false;
  const tokens = readTokens(PropertiesService.getScriptProperties());
  return tokens.indexOf(sha256Hex(token)) !== -1;
}

// ============================================================
// エントリポイント
// ============================================================
//
// doGet は置かない（URLをブラウザで開いただけでデータが読めてしまうため）。

function doPost(e) {
  const lock = LockService.getScriptLock();
  try {
    // 同時に来た同期が互いの書き込みを上書きしないよう、1件ずつ順番に処理する。
    lock.waitLock(20000);
    const data = JSON.parse(e.postData.contents);
    let result;

    switch (data.action) {
      case 'login':
        result = login(data.password);
        break;
      case 'sync':
        result = isValidToken(data.token) ? syncRecords(data.changes || {}) : { error: 'unauthorized' };
        break;
      default:
        result = { error: 'Unknown action' };
    }
    return json(result);
  } catch (err) {
    return json({ error: err.message });
  } finally {
    lock.releaseLock();
  }
}

function json(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

// ============================================================
// 同期（Last-Write-Wins マージ）
// ============================================================
//
// changes: { "2026-08-16": { status: "work", revenue: 12345, updatedAt: 1755300000000 }, ... }
// レコードは日付キーごとの完全なスナップショット（status/revenueが無ければ未設定＝クリア扱い）。
// 各日付についてサーバー側のupdatedAtより新しい場合だけ書き込む。
// 戻り値は常にシート全体のマージ後の状態（クライアントはこれで丸ごと置き換える）。

// スプレッドシートは "2026-08-16" のような文字列を書き込むと自動でDate型に
// 変換してしまうため、読み出し時は必ずこの関数でyyyy-MM-dd文字列に戻す。
// doPost実行コンテキストでは `instanceof Date` が実レルムの違いで効かないことが
// あるため、内部の[[Class]]を見るObject.prototype.toString判定を使う。
function normalizeDateKey(v) {
  if (Object.prototype.toString.call(v) === '[object Date]') {
    return Utilities.formatDate(v, 'Asia/Tokyo', 'yyyy-MM-dd');
  }
  return v ? String(v) : '';
}

function syncRecords(changes) {
  const ws = getSheet();
  const lastRow = ws.getLastRow();

  let values = [];
  const rowIndexByDate = {};
  if (lastRow > 1) {
    values = ws.getRange(2, 1, lastRow - 1, HEADERS.length).getValues();
    values.forEach((row, i) => {
      const date = normalizeDateKey(row[0]);
      if (date) rowIndexByDate[date] = i;
    });
  }

  let changed = false;
  Object.keys(changes).forEach((date) => {
    const incoming = changes[date] || {};
    const incomingUpdatedAt = Number(incoming.updatedAt) || 0;
    const idx = rowIndexByDate[date];
    const newRow = [date, incoming.status || '', incoming.revenue || 0, incomingUpdatedAt];

    if (idx === undefined) {
      values.push(newRow);
      rowIndexByDate[date] = values.length - 1;
      changed = true;
    } else {
      const existingUpdatedAt = Number(values[idx][3]) || 0;
      if (incomingUpdatedAt > existingUpdatedAt) {
        values[idx] = newRow;
        changed = true;
      }
    }
  });

  if (changed) {
    ws.getRange(2, 1, values.length, HEADERS.length).setValues(values);
    SpreadsheetApp.flush();
  }

  const records = {};
  values.forEach((row) => {
    const date = normalizeDateKey(row[0]);
    if (!date) return;
    const rec = { updatedAt: Number(row[3]) || 0 };
    if (row[1]) rec.status = row[1];
    if (row[2]) rec.revenue = row[2];
    records[date] = rec;
  });

  return { records };
}

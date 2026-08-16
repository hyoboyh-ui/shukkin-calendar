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
// エントリポイント
// ============================================================

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    let result;

    switch (data.action) {
      case 'sync': result = syncRecords(data.changes || {}); break;
      default: result = { error: 'Unknown action' };
    }
    return ContentService
      .createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ error: err.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  return doPost({ postData: { contents: JSON.stringify(e.parameter) } });
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

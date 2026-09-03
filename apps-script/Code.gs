/**
 * 특별실 예약 서버 (Google Apps Script Web App)
 *
 * 사용법:
 * 1) 구글 스프레드시트 생성 (탭은 자동 생성됨)
 * 2) 확장 프로그램 → Apps Script 에서 이 파일 내용을 붙여넣기
 * 3) 아래 SHEET_ID, ADMIN_PW 를 실제 값으로 수정
 * 4) 배포 → 새 배포 → 웹앱 → 실행: 나 / 액세스: "모든 사용자"
 * 5) 발급된 /exec URL 을 config.js 의 apiUrl 에 입력
 *
 * ⚠️ 실제 SHEET_ID·비밀번호를 이 파일에 넣고 저장소에 커밋하지 말 것.
 *    값은 Apps Script 편집기 안에서만 입력합니다. (저장소엔 플레이스홀더 유지)
 */

const SHEET_ID = '여기에_구글시트_ID_입력';
const ADMIN_PW = '여기에_관리자_비밀번호_입력';

const HEADERS = {
  reservations: ['id', 'room', 'date', 'period', 'name', 'classroom', 'purpose', 'passwordHash', 'createdAt'],
  rooms: ['name', 'order'],
  schedule: ['room', 'dayOfWeek', 'period', 'label'],
  dateRules: ['id', 'room', 'startDate', 'endDate', 'periods', 'daysOfWeek', 'label', 'blocked'],
  holidays: ['id', 'startDate', 'endDate', 'label'],
  logs: ['ts', 'action', 'summary'],   // 없어진 것 기록 (삭제·수정·가림). 누가 했는지는 안 남김
};

const FIELD_KO = { room: '특별실', date: '날짜', period: '교시', name: '이름', classroom: '학급', purpose: '목적' };

// ===== 엔트리 포인트 =====
function doGet(e) {
  const action = (e.parameter && e.parameter.action) || 'ping';
  try {
    if (action === 'ping')     return json({ ok: true, ts: new Date().toISOString() });
    if (action === 'list')     return json(readSheet('reservations'));
    if (action === 'schedule') return json(readSheet('schedule'));
    if (action === 'rooms')    return json(readSheet('rooms'));
    if (action === 'logs')     return json(readLogs());
    if (action === 'loadAll')  return json({
      rooms: readSheet('rooms').sort((a,b)=>(a.order||0)-(b.order||0)).map(r => r.name),
      reservations: readSheet('reservations'),
      schedule: readSheet('schedule'),
      dateRules: readSheet('dateRules'),
      holidays: readSheet('holidays'),
    });
    return json({ error: 'unknown action: ' + action });
  } catch (err) {
    return json({ error: String(err) });
  }
}

function doPost(e) {
  let body = {};
  try { body = JSON.parse(e.postData.contents); } catch (_) {}
  const action = body.action;
  try {
    if (action === 'create')  return json(createReservation(body));
    if (action === 'update')  return json(updateReservation(body));
    if (action === 'delete')  return json(deleteReservation(body));
    if (action === 'cleanup') return json(cleanup(body));
    if (action === 'checkAdmin') return json(checkAdmin(body));
    if (action === 'createDateRule') return json(createDateRule(body));
    if (action === 'updateDateRule') return json(updateDateRule(body));
    if (action === 'deleteDateRule') return json(deleteDateRule(body));
    if (action === 'applyDateRules') return json(applyDateRules(body));
    if (action === 'addRoom')      return json(addRoom(body));
    if (action === 'deleteRoom')   return json(deleteRoom(body));
    if (action === 'reorderRooms') return json(reorderRooms(body));
    if (action === 'createHoliday') return json(createHoliday(body));
    if (action === 'updateHoliday') return json(updateHoliday(body));
    if (action === 'deleteHoliday') return json(deleteHoliday(body));
    if (action === 'log')          return json(logEvent(body));
    return json({ error: 'unknown action: ' + action });
  } catch (err) {
    return json({ error: String(err) });
  }
}

// ===== 핵심 로직 =====
function checkAdmin(body) {
  return { ok: body.pw === ADMIN_PW };
}

// 동시에 같은 칸을 예약하는 경우를 막기 위해 중복확인+저장을 잠금으로 묶음
function createReservation(body) {
  const lock = LockService.getScriptLock();
  lock.waitLock(45000);
  try {
    const all = readSheet('reservations');
    if (all.some(r => r.room === body.room && r.date === body.date && String(r.period) === String(body.period))) {
      return { ok: false, error: 'already reserved' };
    }
    const sheet = sheetOf('reservations');
    sheet.appendRow([
      body.id || Utilities.getUuid(),
      body.room, body.date, body.period,
      body.name, body.classroom || '', body.purpose || '',
      body.passwordHash || '',
      body.createdAt || new Date().toISOString(),
    ]);
    return { ok: true, id: body.id };
  } finally {
    lock.releaseLock();
  }
}

function updateReservation(body) {
  const sheet = sheetOf('reservations');
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const idCol = headers.indexOf('id');
  for (let i = 1; i < data.length; i++) {
    if (data[i][idCol] === body.id) {
      const changes = [];
      ['room','date','period','name','classroom','purpose'].forEach(k => {
        if (body[k] !== undefined) {
          const col = headers.indexOf(k);
          const oldV = plainStr(data[i][col]);
          const newV = String(body[k]);
          if (oldV !== newV) changes.push(`${FIELD_KO[k] || k} "${oldV}"→"${newV}"`);
          sheet.getRange(i+1, col+1).setValue(body[k]);
        }
      });
      if (changes.length) {
        const r = rowObj(headers, data[i]);
        appendLog('예약수정', `${r.room} ${plainStr(r.date)} ${r.period}교시 · ${changes.join(', ')}`);
      }
      return { ok: true };
    }
  }
  return { ok: false, error: 'not found' };
}

function deleteReservation(body) {
  const sheet = sheetOf('reservations');
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const idCol = headers.indexOf('id');
  for (let i = 1; i < data.length; i++) {
    if (data[i][idCol] === body.id) {
      const r = rowObj(headers, data[i]);
      sheet.deleteRow(i+1);
      appendLog('예약삭제', reservationSummary(r));
      return { ok: true };
    }
  }
  return { ok: false, error: 'not found' };
}

// 모든 데이터는 실시간 낱개 저장(create*/update*/delete*)으로 관리됨.
// "통째 덮어쓰기(saveAll)"는 로딩 덜 된 값으로 서버를 비우는 사고 위험이 있어 제거함.

// ===== 기간 정규시간(dateRules) 낱개 저장 =====
function dateRuleRow(r) {
  return [
    r.id || Utilities.getUuid(),
    r.room, r.startDate, r.endDate,
    JSON.stringify(r.periods || []),
    JSON.stringify(r.daysOfWeek || []),
    r.label || '',
    r.blocked ? 'true' : 'false',
  ];
}

function createDateRule(body) {
  const lock = LockService.getScriptLock();
  lock.waitLock(45000);
  try {
    const sheet = sheetOf('dateRules');
    const row = dateRuleRow(body);
    sheet.appendRow(row);
    // 방금 추가된 줄을 텍스트로 고정 후 다시 씀 — JSON 문자열·'true'·날짜가 재해석되는 것 방지
    const range = sheet.getRange(sheet.getLastRow(), 1, 1, row.length);
    range.setNumberFormat('@');
    range.setValues([row]);
    return { ok: true, id: row[0] };
  } finally {
    lock.releaseLock();
  }
}

function updateDateRule(body) {
  const lock = LockService.getScriptLock();
  lock.waitLock(45000);
  try {
    const sheet = sheetOf('dateRules');
    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    const idCol = headers.indexOf('id');
    for (let i = 1; i < data.length; i++) {
      if (data[i][idCol] === body.id) {
        const before = rowObj(headers, data[i]);
        const row = dateRuleRow(body);
        const range = sheet.getRange(i + 1, 1, 1, row.length);
        range.setNumberFormat('@');
        range.setValues([row]);
        const changes = [];
        if (plainStr(before.label) !== String(body.label || '')) changes.push(`라벨 "${plainStr(before.label)}"→"${body.label || ''}"`);
        const wasBlocked = (before.blocked === true || before.blocked === 'true');
        if (wasBlocked !== !!body.blocked) changes.push(body.blocked ? '예약금지 설정' : '예약금지 해제');
        if (changes.length) appendLog('기간규칙수정', `${body.room} · ${changes.join(', ')}`);
        return { ok: true };
      }
    }
    return { ok: false, error: 'not found' };
  } finally {
    lock.releaseLock();
  }
}

function deleteDateRule(body) {
  const lock = LockService.getScriptLock();
  lock.waitLock(45000);
  try {
    const sheet = sheetOf('dateRules');
    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    const idCol = headers.indexOf('id');
    for (let i = 1; i < data.length; i++) {
      if (data[i][idCol] === body.id) {
        const r = rowObj(headers, data[i]);
        sheet.deleteRow(i + 1);
        appendLog('기간규칙삭제', dateRuleSummary(r));
        return { ok: true };
      }
    }
    return { ok: false, error: 'not found' };
  } finally {
    lock.releaseLock();
  }
}

// 여러 기간정규시간 변경(생성·수정·삭제)을 잠금 1회로 한꺼번에 처리.
// 관리자 편성철에 규칙 수십 건을 만들 때, 건마다 요청/잠금 대기하다 타임아웃 나는 것을 없앰.
// body.ops = [{type:'create', rule}, {type:'update', rule}, {type:'delete', id}]
// "전체 목록 덮어쓰기"가 아니라 명시적 op만 받으므로 saveAll 류의 데이터 소실 위험 없음.
function applyDateRules(body) {
  const ops = Array.isArray(body.ops) ? body.ops : [];
  if (!ops.length) return { ok: true, results: [] };
  const lock = LockService.getScriptLock();
  lock.waitLock(45000);
  try {
    const sheet = sheetOf('dateRules');
    const results = [];
    const pendingLogs = [];

    // 1) 생성 — 전부 모아서 한 번에 씀 (건마다 setValues 하면 행당 몇 초씩 걸려 잠금을 오래 잡음)
    const creates = ops.filter(o => o.type === 'create');
    if (creates.length) {
      try {
        const rows = creates.map(o => dateRuleRow(o.rule));
        const rg = sheet.getRange(sheet.getLastRow() + 1, 1, rows.length, rows[0].length);
        rg.setNumberFormat('@');
        rg.setValues(rows);
        creates.forEach((o, k) => results.push({ id: rows[k][0], ok: true }));
      } catch (e) {
        creates.forEach(o => results.push({ id: o.rule && o.rule.id, ok: false, error: String(e) }));
      }
    }

    // 2) 수정·삭제 — 시트를 한 번만 읽고 처리 (삭제는 행 번호 큰 것부터 → 인덱스 안 밀림)
    const updates = ops.filter(o => o.type === 'update');
    const deletes = ops.filter(o => o.type === 'delete');
    if (updates.length || deletes.length) {
      const data = sheet.getDataRange().getValues();
      const headers = data[0];
      const idCol = headers.indexOf('id');
      const rowOf = {};
      for (let i = 1; i < data.length; i++) rowOf[data[i][idCol]] = i;

      for (const op of updates) {
        const i = rowOf[op.rule.id];
        if (i === undefined) { results.push({ id: op.rule.id, ok: false, error: 'not found' }); continue; }
        try {
          const before = rowObj(headers, data[i]);
          const row = dateRuleRow(op.rule);
          const rg = sheet.getRange(i + 1, 1, 1, row.length);
          rg.setNumberFormat('@');
          rg.setValues([row]);
          const changes = [];
          if (plainStr(before.label) !== String(op.rule.label || '')) changes.push(`라벨 "${plainStr(before.label)}"→"${op.rule.label || ''}"`);
          const wasBlocked = (before.blocked === true || before.blocked === 'true');
          if (wasBlocked !== !!op.rule.blocked) changes.push(op.rule.blocked ? '예약금지 설정' : '예약금지 해제');
          if (changes.length) pendingLogs.push(['기간규칙수정', `${op.rule.room} · ${changes.join(', ')}`]);
          results.push({ id: op.rule.id, ok: true });
        } catch (e) {
          results.push({ id: op.rule.id, ok: false, error: String(e) });
        }
      }

      deletes
        .map(op => ({ op, i: rowOf[op.id] }))
        .sort((a, b) => (b.i === undefined ? -1 : b.i) - (a.i === undefined ? -1 : a.i))
        .forEach(({ op, i }) => {
          if (i === undefined) { results.push({ id: op.id, ok: false, error: 'not found' }); return; }
          try {
            const r = rowObj(headers, data[i]);
            sheet.deleteRow(i + 1);
            pendingLogs.push(['기간규칙삭제', dateRuleSummary(r)]);
            results.push({ id: op.id, ok: true });
          } catch (e) {
            results.push({ id: op.id, ok: false, error: String(e) });
          }
        });
    }

    pendingLogs.forEach(l => appendLog(l[0], l[1]));
    return { ok: results.every(r => r.ok), results: results };
  } finally {
    lock.releaseLock();
  }
}

// ===== 특별실(rooms) 낱개 저장 — 서버의 현재 목록을 읽어 반영(동시 편집 시 유실 방지) =====
function addRoom(body) {
  const lock = LockService.getScriptLock();
  lock.waitLock(45000);
  try {
    const name = String(body.name || '').trim();
    if (!name) return { ok: false, error: 'empty' };
    const rooms = readSheet('rooms');
    if (rooms.some(r => String(r.name).trim() === name)) return { ok: false, error: 'exists' };
    sheetOf('rooms').appendRow([name, rooms.length]);
    return { ok: true };
  } finally {
    lock.releaseLock();
  }
}

function deleteRoom(body) {
  const lock = LockService.getScriptLock();
  lock.waitLock(45000);
  try {
    const name = String(body.name || '').trim();

    // rooms 시트는 작고 order 재정렬이 필요해 통째 다시 쓰기 유지
    const kept = readSheet('rooms').filter(r => String(r.name).trim() !== name);
    writeSheet('rooms', kept.map((r, i) => ({ name: r.name, order: i })));

    // 딸린 데이터는 "해당 행만" 삭제 — clear() 후 setValues() 사이에 실패하면
    // 시트 전체가 날아가는 위험이 있어서 통째 다시 쓰기(writeSheet)를 쓰지 않음
    const resGone  = deleteRowsWhere('reservations', r => String(r.room).trim() === name);
    const schGone  = deleteRowsWhere('schedule',     r => String(r.room).trim() === name);
    const ruleGone = deleteRowsWhere('dateRules',    r => String(r.room).trim() === name);

    appendLog('특별실삭제', `"${name}" — 함께 삭제: 예약 ${resGone} / 정규시간 ${schGone} / 기간규칙 ${ruleGone}`);
    return { ok: true };
  } finally {
    lock.releaseLock();
  }
}

// 조건에 맞는 행만 아래에서 위로 삭제 (인덱스가 밀리지 않도록 역순).
// clear+rewrite와 달리 "시트가 비는 순간"이 없어, 중간에 실패해도 나머지 데이터는 무사.
function deleteRowsWhere(sheetName, matchFn) {
  const sheet = sheetOf(sheetName);
  const data = sheet.getDataRange().getValues();
  if (data.length < 2) return 0;
  const headers = data[0];
  let removed = 0;
  for (let i = data.length - 1; i >= 1; i--) {
    if (matchFn(rowObj(headers, data[i]))) {
      sheet.deleteRow(i + 1);
      removed++;
    }
  }
  return removed;
}

function reorderRooms(body) {
  const lock = LockService.getScriptLock();
  lock.waitLock(45000);
  try {
    const current = readSheet('rooms').map(r => String(r.name));
    const desired = (body.order || []).map(String).filter(n => current.indexOf(n) !== -1);
    const missing = current.filter(n => desired.indexOf(n) === -1);  // 그 사이 다른 사용자가 추가한 방
    const finalOrder = desired.concat(missing);
    writeSheet('rooms', finalOrder.map((name, i) => ({ name, order: i })));
    return { ok: true };
  } finally {
    lock.releaseLock();
  }
}

// ===== 학교휴일(holidays) 낱개 저장 =====
function createHoliday(body) {
  const lock = LockService.getScriptLock();
  lock.waitLock(45000);
  try {
    const sheet = sheetOf('holidays');
    const row = [body.id || Utilities.getUuid(), body.startDate, body.endDate, body.label || ''];
    sheet.appendRow(row);
    const r = sheet.getRange(sheet.getLastRow(), 1, 1, row.length);
    r.setNumberFormat('@');
    r.setValues([row]);
    return { ok: true, id: row[0] };
  } finally {
    lock.releaseLock();
  }
}

function updateHoliday(body) {
  const lock = LockService.getScriptLock();
  lock.waitLock(45000);
  try {
    const sheet = sheetOf('holidays');
    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    const idCol = headers.indexOf('id');
    for (let i = 1; i < data.length; i++) {
      if (data[i][idCol] === body.id) {
        const before = rowObj(headers, data[i]);
        const row = [body.id, body.startDate, body.endDate, body.label || ''];
        const r = sheet.getRange(i + 1, 1, 1, row.length);
        r.setNumberFormat('@');
        r.setValues([row]);
        if (plainStr(before.label) !== String(body.label || '') ||
            plainStr(before.startDate) !== String(body.startDate) ||
            plainStr(before.endDate) !== String(body.endDate)) {
          appendLog('학교휴일수정', `"${plainStr(before.label)}" (${plainStr(before.startDate)}~${plainStr(before.endDate)}) → "${body.label || ''}" (${body.startDate}~${body.endDate})`);
        }
        return { ok: true };
      }
    }
    return { ok: false, error: 'not found' };
  } finally {
    lock.releaseLock();
  }
}

function deleteHoliday(body) {
  const lock = LockService.getScriptLock();
  lock.waitLock(45000);
  try {
    const sheet = sheetOf('holidays');
    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    const idCol = headers.indexOf('id');
    for (let i = 1; i < data.length; i++) {
      if (data[i][idCol] === body.id) {
        const h = rowObj(headers, data[i]);
        sheet.deleteRow(i + 1);
        appendLog('학교휴일삭제', `${plainStr(h.startDate)}~${plainStr(h.endDate)} · "${plainStr(h.label)}"`);
        return { ok: true };
      }
    }
    return { ok: false, error: 'not found' };
  } finally {
    lock.releaseLock();
  }
}

function cleanup(body) {
  if (body.adminPw !== ADMIN_PW) return { ok: false, error: 'unauthorized' };
  // 빈 행, 중복 id 제거
  const res = readSheet('reservations');
  const seen = new Set();
  const cleaned = res.filter(r => {
    if (!r.id || seen.has(r.id)) return false;
    seen.add(r.id); return true;
  });
  writeSheet('reservations', cleaned);
  return { ok: true, removed: res.length - cleaned.length };
}

// ===== 시트 헬퍼 =====
// openById 는 실행(요청)마다 1회만 — 잠금을 잡은 채 스프레드시트를 여러 번 여는 비용을 없앰.
// Apps Script 는 요청마다 전역을 새로 초기화하므로 _ss 는 자동으로 리셋됨.
let _ss = null;
function spreadsheet_() {
  if (!_ss) _ss = SpreadsheetApp.openById(SHEET_ID);
  return _ss;
}
function sheetOf(name) {
  const ss = spreadsheet_();
  let s = ss.getSheetByName(name);
  if (!s) {
    s = ss.insertSheet(name);
    s.appendRow(HEADERS[name]);
  }
  return s;
}

function readSheet(name) {
  const sheet = sheetOf(name);
  const data = sheet.getDataRange().getValues();
  if (data.length < 2) return [];
  const headers = data[0];
  return data.slice(1).filter(row => row.some(v => v !== ''))
    .map(row => Object.fromEntries(headers.map((h, i) => [h, normalizeCell(h, row[i])])));
}

// 'date' 컬럼은 항상 'YYYY-MM-DD' 문자열로 정규화 (시트가 Date 객체로 돌려줘도 안전)
// 컬럼 종류 무관하게 Date 객체면 무조건 문자열로 바꿈 — 라벨 등 텍스트 칸에 날짜처럼 보이는 값을
// 입력하면 시트가 멋대로 Date로 인식해버려서, 그대로 두면 JSON 응답에 타임스탬프가 새어나감
function normalizeCell(header, value) {
  const isDateCol = header === 'date' || header === 'startDate' || header === 'endDate';
  if (value instanceof Date) {
    return Utilities.formatDate(value, 'Asia/Seoul', 'yyyy-MM-dd');
  }
  if (isDateCol && typeof value === 'string' && value.indexOf('T') > 0) {
    // ISO 형식 문자열이면 한국시간 기준 날짜만 추출
    const d = new Date(value);
    return Utilities.formatDate(d, 'Asia/Seoul', 'yyyy-MM-dd');
  }
  if ((header === 'periods' || header === 'daysOfWeek') && typeof value === 'string') {
    try { return JSON.parse(value); } catch (e) { return []; }
  }
  if (header === 'blocked') {
    return value === true || value === 'true' || value === 'TRUE';
  }
  return value;
}

function writeSheet(name, rows) {
  const sheet = sheetOf(name);
  const headers = HEADERS[name];
  sheet.clear();
  sheet.appendRow(headers);
  if (!rows.length) return;
  const matrix = rows.map(r => headers.map(h => r[h] !== undefined ? r[h] : ''));
  const range = sheet.getRange(2, 1, matrix.length, headers.length);
  range.setNumberFormat('@');  // 전부 일반 텍스트로 고정 — 날짜처럼 보이는 라벨을 시트가 Date로 재해석하는 것 방지
  range.setValues(matrix);
}

function json(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

// ===== 변경 로그 (없어진 것: 삭제·수정·가림) =====
const LOG_CAP = 3000;

function appendLog(action, summary) {
  try {
    const sheet = sheetOf('logs');
    const ts = Utilities.formatDate(new Date(), 'Asia/Seoul', 'yyyy-MM-dd HH:mm');
    sheet.appendRow([ts, String(action || ''), String(summary || '')]);
    const last = sheet.getLastRow();
    sheet.getRange(last, 1, 1, 3).setNumberFormat('@');
    if (last - 1 > LOG_CAP) sheet.deleteRows(2, last - 1 - LOG_CAP);
  } catch (e) { /* 로그 실패가 본 작업을 막지 않도록 무시 */ }
}

// 클라이언트가 직접 남기는 로그 (라벨 가림 등)
function logEvent(body) {
  appendLog(String(body.kind || '기타'), String(body.summary || ''));
  return { ok: true };
}

function readLogs() {
  const sheet = sheetOf('logs');
  const data = sheet.getDataRange().getValues();
  if (data.length < 2) return [];
  return data.slice(Math.max(1, data.length - 500))
    .filter(row => row[0] !== '' || row[1] !== '' || row[2] !== '')
    .map(row => ({ ts: String(row[0]), action: String(row[1]), summary: String(row[2]) }))
    .reverse();  // 최신 먼저
}

// ===== 로그 요약 헬퍼 =====
function rowObj(headers, row) {
  return Object.fromEntries(headers.map((h, i) => [h, row[i]]));
}

function plainStr(v) {
  if (v instanceof Date) return Utilities.formatDate(v, 'Asia/Seoul', 'yyyy-MM-dd');
  return String(v == null ? '' : v);
}

function reservationSummary(r) {
  const parts = [r.room, plainStr(r.date), r.period + '교시', r.classroom, r.purpose, r.name]
    .map(x => plainStr(x)).filter(x => x !== '' && x !== '교시');
  return parts.join(' · ');
}

function dateRuleSummary(r) {
  let periods = r.periods, days = r.daysOfWeek;
  try { periods = JSON.parse(r.periods); } catch (e) {}
  try { days = JSON.parse(r.daysOfWeek); } catch (e) {}
  const blk = (r.blocked === true || r.blocked === 'true') ? ' (예약금지)' : '';
  return `${r.room} ${plainStr(r.startDate)}~${plainStr(r.endDate)} [${(days || []).join(',')}] ${(periods || []).join('·')}교시 · "${plainStr(r.label)}"${blk}`;
}

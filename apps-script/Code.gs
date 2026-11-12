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
  logs: ['ts', 'action', 'summary'],   // 변경 기록 (삭제·수정·가림·특별실 추가/순서/삭제). 누가 했는지는 안 남김
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
    if (action === 'loadAll') {
      const reservations = readSheet('reservations');
      const dateRules = readSheet('dateRules');
      return json({
        rooms: roomsForClient_(readSheet('rooms'), reservations, dateRules),
        reservations,
        schedule: readSheet('schedule'),
        dateRules,
        holidays: readSheet('holidays'),
      });
    }
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
// ⚠️ rooms 탭은 clear()로 비운 뒤 다시 쓰지 않는다. 쓰는 도중 실패하면 목록이 통째로 사라지는
//    사고(2026-11-12)가 있었음. 항상 "기존 행을 제자리에서 덮어쓰기 / 해당 행만 삭제"로만 바꾼다.
//    (시트에서 rooms 탭을 사람이 직접 수정하는 것도 피할 것)
function addRoom(body) {
  const lock = LockService.getScriptLock();
  lock.waitLock(45000);
  try {
    const name = String(body.name || '').trim();
    if (!name) return { ok: false, error: 'empty' };
    const rooms = readSheet('rooms');
    if (rooms.some(r => String(r.name).trim() === name)) return { ok: false, error: 'exists' };
    sheetOf('rooms').appendRow([name, rooms.length]);
    appendLog('특별실추가', `"${name}"`);
    return { ok: true };
  } finally {
    lock.releaseLock();
  }
}

// rooms 탭에서 비어있지 않은 방 행 → [{ row: 시트 행 번호, name }]
function roomRows_() {
  const data = sheetOf('rooms').getDataRange().getValues();
  const out = [];
  for (let i = 1; i < data.length; i++) {
    if (data[i].some(v => v !== '')) out.push({ row: i + 1, name: String(data[i][0]).trim() });
  }
  return out;
}

// 현재 방 행 수와 같은 개수의 이름 목록을 order 0..n-1 로 제자리에 덮어씀 (행 수가 다르면 아무것도 안 쓰고 중단)
function writeRoomsInPlace_(names) {
  const rows = roomRows_();
  if (rows.length !== names.length) throw new Error('rooms 행 수가 달라 쓰기를 중단했습니다');
  if (!rows.length) return;
  const sheet = sheetOf('rooms');
  const matrix = names.map((n, i) => [n, i]);
  const contiguous = rows.every((r, i) => r.row === rows[0].row + i);
  if (contiguous) {
    const rg = sheet.getRange(rows[0].row, 1, rows.length, 2);
    rg.setNumberFormat('@');   // 방 이름이 날짜처럼 보여도 시트가 재해석하지 않게
    rg.setValues(matrix);
  } else {
    rows.forEach((r, i) => {
      const rg = sheet.getRange(r.row, 1, 1, 2);
      rg.setNumberFormat('@');
      rg.setValues([matrix[i]]);
    });
  }
}

function deleteRoom(body) {
  const lock = LockService.getScriptLock();
  lock.waitLock(45000);
  try {
    const name = String(body.name || '').trim();
    if (!name) return { ok: false, error: 'empty' };

    // 시작을 먼저 기록 — 중간에 실패해도 "삭제를 시도했다"는 흔적이 남음
    appendLog('특별실삭제(시작)', `"${name}"`);

    // 딸린 데이터를 "해당 행만" 먼저 삭제 (통째 다시 쓰기 금지).
    // 목록에서 방을 빼는 건 맨 마지막 — 중간에 실패해도 방이 목록에 남아 있어 다시 삭제하면 이어서 끝난다.
    const resGone  = deleteRowsWhere('reservations', r => String(r.room).trim() === name);
    const schGone  = deleteRowsWhere('schedule',     r => String(r.room).trim() === name);
    const ruleGone = deleteRowsWhere('dateRules',    r => String(r.room).trim() === name);

    // 목록에서는 그 방의 행만 지우고, order 만 0부터 다시 매김 (clear 안 씀)
    roomRows_().filter(r => r.name === name).map(r => r.row).sort((a, b) => b - a)
      .forEach(row => sheetOf('rooms').deleteRow(row));
    writeRoomsInPlace_(roomRows_().map(r => r.name));

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
    const current = roomRows_().map(r => r.name);
    const seen = {};
    const desired = (body.order || []).map(String).filter(n => current.indexOf(n) !== -1 && !seen[n] && (seen[n] = true));
    const missing = current.filter(n => desired.indexOf(n) === -1);  // 그 사이 다른 사용자가 추가한 방
    const finalOrder = desired.concat(missing);
    writeRoomsInPlace_(finalOrder);   // 제자리 덮어쓰기 — 비우고 다시 쓰지 않음
    appendLog('특별실순서변경', finalOrder.join(' > '));
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

// 화면에 보여줄 특별실 목록 = rooms 탭(order 순) + 탭에는 없지만 "오늘 이후 예약" 또는 "아직 끝나지 않은
// 기간규칙"이 남아 있는 방(맨 뒤). 목록이 어긋나도 예약이 있는 방이 화면에서 숨겨지지 않게 한다.
// 지난 예약만 남은 방은 보충하지 않는다(옛 방이 되살아나지 않도록).
function roomsForClient_(rooms, reservations, dateRules) {
  const names = rooms.slice().sort((a, b) => (a.order || 0) - (b.order || 0)).map(r => r.name);
  const known = {};
  names.forEach(n => { known[String(n).trim()] = true; });
  const today = Utilities.formatDate(new Date(), 'Asia/Seoul', 'yyyy-MM-dd');
  const extra = [];
  const add = room => {
    const n = String(room == null ? '' : room).trim();
    if (n && !known[n]) { known[n] = true; extra.push(n); }
  };
  reservations.forEach(r => { if (String(r.date) >= today) add(r.room); });
  dateRules.forEach(r => { if (String(r.endDate) >= today) add(r.room); });
  return names.concat(extra.sort());
}

function json(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

// ===== 변경 로그 (삭제·수정·가림·특별실 추가/순서변경/삭제) =====
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

// ===== 자동 백업 — 매일 새벽 시트 사본을 저장하고 30일치만 보관 =====
// 사용법(한 번만): Apps Script 편집기에서 함수 선택 창에 setupBackup 을 고르고 ▶ 실행 → Drive 접근 허용.
// 사본은 내 드라이브의 "특별실예약-백업" 폴더에 "<시트이름>-백업-YYYY-MM-DD" 로 쌓인다.
// 문제가 생기면 그 날짜의 사본을 열어 필요한 탭의 내용만 복사해 운영 시트에 붙여넣는다(시트 전체 복원 금지).
const BACKUP_FOLDER = '특별실예약-백업';
const BACKUP_KEEP_DAYS = 30;

function setupBackup() {
  ScriptApp.getProjectTriggers()
    .filter(t => t.getHandlerFunction() === 'dailyBackup')
    .forEach(t => ScriptApp.deleteTrigger(t));
  ScriptApp.newTrigger('dailyBackup').timeBased().everyDays(1).atHour(3).inTimezone('Asia/Seoul').create();
  dailyBackup();   // 설정하자마자 한 번 실행해서 바로 확인할 수 있게
}

function dailyBackup() {
  const file = DriveApp.getFileById(SHEET_ID);
  const folders = DriveApp.getFoldersByName(BACKUP_FOLDER);
  const folder = folders.hasNext() ? folders.next() : DriveApp.createFolder(BACKUP_FOLDER);
  const prefix = file.getName() + '-백업-';
  const name = prefix + Utilities.formatDate(new Date(), 'Asia/Seoul', 'yyyy-MM-dd');
  if (!folder.getFilesByName(name).hasNext()) file.makeCopy(name, folder);   // 같은 날 두 번 만들지 않음

  // 오래된 백업은 휴지통으로 (30일간 복구 가능). 이 폴더 안에서 이름이 prefix 로 시작하는 것만 대상.
  const cutoff = Date.now() - BACKUP_KEEP_DAYS * 24 * 60 * 60 * 1000;
  const files = folder.getFiles();
  while (files.hasNext()) {
    const f = files.next();
    if (f.getName().indexOf(prefix) === 0 && f.getDateCreated().getTime() < cutoff) f.setTrashed(true);
  }
}

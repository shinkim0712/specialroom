// ===== 상수/기본값 =====
const DEFAULT_ROOMS = ['강당', '운동장', '농구장', '시청각실', '소통광장'];
const PERIODS = [
  { key: '1',   label: '1교시', time: '09:00~09:40' },
  { key: '2',   label: '2교시', time: '09:50~10:30' },
  { key: '3',   label: '3교시', time: '10:40~11:20' },
  { key: '4A',  label: '4교시(1)', time: '11:30~12:10' },
  { key: '4E',  label: '4교시(2)', time: '12:20~13:00' },
  { key: '5EH', label: '5교시', time: '13:10~13:50' },
  { key: '6',   label: '6교시', time: '14:00~14:40' },
];
const DAYS = ['월', '화', '수', '목', '금'];
const ADMIN_PW_LOCAL = '1012';  // 데모용. 서버 연동 시 서버에서 검증

// ===== 상태 =====
const state = {
  rooms: load('rooms', DEFAULT_ROOMS),
  reservations: load('reservations', []),  // {id, room, date, period, name, classroom, purpose, createdAt}
  schedule: load('schedule', []),          // {room, dayOfWeek, period, label}
  dateRules: load('dateRules', []),        // {id, room, startDate, endDate, periods:[], label}
  currentRoom: null,
  weekStart: getMondayOf(new Date()),
  isAdmin: sessionStorage.getItem('isAdmin') === '1',
  pendingCell: null,  // {room, date, period}
  multiSelect: false,
  selectedCells: [],   // [{room, date, period}]
  pendingBatch: null,  // 다중 선택 저장 시 사용
  autoLoadTimer: null,
};

function load(key, def) {
  const v = localStorage.getItem(key);
  return v ? JSON.parse(v) : def;
}
function save(key, val) { localStorage.setItem(key, JSON.stringify(val)); }
function saveState() {
  save('rooms', state.rooms);
  save('reservations', state.reservations);
  save('schedule', state.schedule);
}

// ===== 날짜 유틸 =====
function getMondayOf(d) {
  const date = new Date(d);
  const day = date.getDay() || 7;  // 일=0→7
  date.setDate(date.getDate() - day + 1);
  date.setHours(0, 0, 0, 0);
  return date;
}
function addDays(d, n) { const x = new Date(d); x.setDate(x.getDate() + n); return x; }
function fmtDate(d) {
  return `${d.getFullYear()}.${d.getMonth()+1}.${d.getDate()}`;
}
function fmtDateKey(d) {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}
function weekLabel(start) {
  const end = addDays(start, 4);
  return `${start.getFullYear()}년 ${start.getMonth()+1}.${start.getDate()}~${end.getMonth()+1}.${end.getDate()}`;
}

// ===== 해시 (브라우저 SubtleCrypto) =====
async function sha256(text) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2,'0')).join('');
}

// ===== 렌더링 =====
function renderTabs() {
  const nav = document.getElementById('roomTabs');
  nav.innerHTML = '';
  state.rooms.forEach(r => {
    const b = document.createElement('button');
    b.className = 'tab' + (r === state.currentRoom ? ' active' : '');
    b.textContent = r;
    b.onclick = () => { state.currentRoom = r; render(); };
    // 관리자: 우클릭으로 삭제
    if (state.isAdmin) {
      b.oncontextmenu = (e) => {
        e.preventDefault();
        if (state.rooms.length <= 1) { alert('마지막 특별실은 삭제할 수 없습니다.'); return; }
        if (confirm(`'${r}' 특별실을 삭제할까요?`)) {
          state.rooms = state.rooms.filter(x => x !== r);
          if (state.currentRoom === r) state.currentRoom = state.rooms[0] || null;
          saveState(); render();
        }
      };
    }
    nav.appendChild(b);
  });
  const add = document.createElement('button');
  add.className = 'tab add-tab';
  add.textContent = '+ 특별실 추가';
  add.onclick = addRoom;
  nav.appendChild(add);
}

function addRoom() {
  const name = prompt('특별실 이름을 입력하세요:');
  if (!name) return;
  if (state.rooms.includes(name)) { alert('이미 존재합니다.'); return; }
  state.rooms.push(name);
  state.currentRoom = name;
  saveState();
  render();
}

function renderWeekSelect() {
  const sel = document.getElementById('weekSelect');
  sel.innerHTML = '';
  const base = getMondayOf(new Date());
  for (let i = -8; i <= 8; i++) {
    const w = addDays(base, i*7);
    const opt = document.createElement('option');
    opt.value = w.toISOString();
    opt.textContent = weekLabel(w);
    if (w.getTime() === state.weekStart.getTime()) opt.selected = true;
    sel.appendChild(opt);
  }
}

function renderSchedule() {
  document.getElementById('roomTitle').textContent = (state.currentRoom || '') + ' 시간표';
  const table = document.getElementById('scheduleTable');
  table.innerHTML = '';

  // 헤더
  const thead = document.createElement('thead');
  const headRow = document.createElement('tr');
  headRow.innerHTML = '<th>교시/시간</th>' + DAYS.map((d, i) => {
    const day = addDays(state.weekStart, i);
    return `<th>${d} (${fmtDate(day)})</th>`;
  }).join('');
  thead.appendChild(headRow);
  table.appendChild(thead);

  const tbody = document.createElement('tbody');
  PERIODS.forEach(p => {
    const tr = document.createElement('tr');
    const td = document.createElement('td');
    td.className = 'period-cell';
    td.innerHTML = `${p.label}<span class="period-time">${p.time}</span>`;
    tr.appendChild(td);

    if (p.lunch) {
      for (let i = 0; i < 5; i++) tr.appendChild(emptyLunchCell());
    } else {
      DAYS.forEach((dayName, i) => {
        const dateObj = addDays(state.weekStart, i);
        const dateKey = fmtDateKey(dateObj);
        const cell = makeCell(state.currentRoom, dateKey, p.key, dayName);
        tr.appendChild(cell);
      });
    }
    tbody.appendChild(tr);
  });
  table.appendChild(tbody);
}

function emptyLunchCell() {
  const td = document.createElement('td');
  td.className = 'lunch-row';
  return td;
}

function makeCell(room, dateKey, periodKey, dayName) {
  const td = document.createElement('td');
  const reservation = state.reservations.find(r =>
    r.room === room && r.date === dateKey && r.period === periodKey
  );
  const sch = state.schedule.find(s => s.room === room && s.dayOfWeek === dayName && s.period === periodKey);
  const matchingRules = state.dateRules.filter(r =>
    r.room === room && r.periods.includes(periodKey) &&
    dateKey >= r.startDate && dateKey <= r.endDate
  );
  const dateRule = matchingRules.length ? matchingRules[matchingRules.length - 1] : null;
  const scheduleNote = dateRule ? dateRule.label : (sch ? sch.label : null);
  if (reservation) {
    td.className = 'reserved';
    const noteHtml = scheduleNote ? `<span class="schedule-note">${escapeHtml(scheduleNote)}</span>` : '';
    td.innerHTML = `
      <div><span class="star">★</span> <span class="name">${escapeHtml(reservation.name)}</span></div>
      <div class="meta">${escapeHtml(reservation.classroom || '')}</div>
      <div class="meta">${escapeHtml(reservation.purpose || '')}</div>
      ${noteHtml}
    `;
    td.onclick = () => openDetail(reservation, { room, dayName, periodKey, sch });
  } else {
    td.className = 'empty';
    if (scheduleNote) {
      td.classList.add('has-schedule');
      td.innerHTML = `<span class="schedule-note">${escapeHtml(scheduleNote)}</span>`;
    }
    td.onclick = () => {
      // 다중 선택 모드 (관리자/일반 공통)
      if (state.multiSelect) {
        // 관리자: 요일+교시 기준 / 일반: 날짜+교시 기준
        const key = state.isAdmin
          ? `${room}|${dayName}|${periodKey}`
          : `${room}|${dateKey}|${periodKey}`;
        const idx = state.selectedCells.findIndex(c => c._key === key);
        if (idx >= 0) {
          state.selectedCells.splice(idx, 1);
          td.classList.remove('selected');
        } else {
          const cell = state.isAdmin
            ? { _key: key, room, dayName, period: periodKey, sch: sch || null }
            : { _key: key, room, date: dateKey, period: periodKey };
          state.selectedCells.push(cell);
          td.classList.add('selected');
        }
        updateMultiBar();
        return;
      }
      if (state.isAdmin) {
        editScheduleLabel(room, dayName, periodKey, sch || null);
        return;
      }
      openReservation(room, dateKey, periodKey);
    };
  }
  return td;
}

function escapeHtml(s) {
  return String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}

// ===== 예약 흐름 =====
function openReservation(room, date, period) {
  state.pendingCell = { room, date, period };
  document.getElementById('resName').value = '';
  document.getElementById('resGrade').value = '';
  document.getElementById('resClassNum').value = '';
  document.getElementById('resPurpose').value = '';
  showModal('reservationModal');
}

document.getElementById('saveReservationBtn').onclick = async () => {
  const name = document.getElementById('resName').value.trim();
  const grade = document.getElementById('resGrade').value;
  const classNum = document.getElementById('resClassNum').value;
  const classroom = (grade && classNum) ? `${grade} ${classNum}` : (grade || classNum);
  const purpose = document.getElementById('resPurpose').value.trim();
  if (!name) { alert('예약자명을 입력하세요.'); return; }

  const cells = state.pendingBatch || (state.pendingCell ? [state.pendingCell] : []);
  const newReservations = cells.map(cell => ({
    id: crypto.randomUUID(),
    ...cell,
    name, classroom, purpose,
    createdAt: new Date().toISOString(),
  }));
  state.reservations.push(...newReservations);
  state.pendingBatch = null;
  saveState();
  closeAllModals();
  exitMultiSelect();

  if (API.enabled() && localStorage.getItem('autoSave') === '1') {
    for (const r of newReservations) {
      try { await API.createReservation(r); } catch (e) { console.warn(e); }
    }
  }
};

async function openDetail(r, ctx) {
  document.getElementById('detailInfo').innerHTML = `
    <p><strong>${escapeHtml(r.name)}</strong> (${escapeHtml(r.classroom||'-')})</p>
    <p>${escapeHtml(r.room)} · ${r.date} · ${periodLabel(r.period)}</p>
    <p>목적: ${escapeHtml(r.purpose||'-')}</p>
  `;
  const modal = document.getElementById('detailModal');
  modal.dataset.id = r.id;
  const schBtn = document.getElementById('editScheduleFromDetailBtn');
  if (state.isAdmin && ctx) {
    schBtn.hidden = false;
    schBtn.textContent = ctx.sch ? '정규시간 편집' : '정규시간 추가';
    schBtn.onclick = () => {
      closeAllModals();
      editScheduleLabel(ctx.room, ctx.dayName, ctx.periodKey, ctx.sch || null);
    };
  } else {
    schBtn.hidden = true;
    schBtn.onclick = null;
  }
  showModal('detailModal');
}

function periodLabel(key) {
  const p = PERIODS.find(x => x.key === key);
  return p ? `${p.label} (${p.time})` : key;
}

document.getElementById('deleteResBtn').onclick = async () => {
  const id = document.getElementById('detailModal').dataset.id;
  const r = state.reservations.find(x => x.id === id);
  if (!r) return;
  if (!confirm(`'${r.name}'님의 예약을 정말 삭제하시겠습니까?\n${r.date} ${periodLabel(r.period)}`)) return;
  state.reservations = state.reservations.filter(x => x.id !== id);
  saveState();
  closeAllModals();
  render();
  if (API.enabled() && localStorage.getItem('autoSave') === '1') {
    try { await API.deleteReservation(id, ADMIN_PW_LOCAL); } catch (e) { console.warn(e); }
  }
};

document.getElementById('editResBtn').onclick = async () => {
  const id = document.getElementById('detailModal').dataset.id;
  const r = state.reservations.find(x => x.id === id);
  if (!r) return;
  const newPurpose = prompt('목적을 수정하세요:', r.purpose || '');
  if (newPurpose === null) return;
  r.purpose = newPurpose.trim();
  saveState();
  closeAllModals();
  render();
};

// ===== 내 예약 보기 =====
document.getElementById('myReservationsBtn').onclick = () => {
  const name = prompt('예약자명을 입력하세요:');
  if (!name) return;
  const list = state.reservations.filter(r => r.name === name)
    .sort((a, b) => (a.date+a.period).localeCompare(b.date+b.period));
  document.getElementById('myListTitle').textContent = `${name}님의 예약 목록`;
  document.getElementById('myListBody').innerHTML = list.length
    ? list.map(r => `
        <div class="my-item">
          <div>
            <div class="room">${escapeHtml(r.room)}</div>
            <div class="info">${r.date} ${periodLabel(r.period)} | ${escapeHtml(r.classroom||'-')}</div>
            <div class="info">${escapeHtml(r.purpose||'')}</div>
          </div>
          <button class="btn btn-blue" onclick='gotoReservation("${r.id}")'>보기</button>
        </div>`).join('')
    : '<p>예약이 없습니다.</p>';
  showModal('myListModal');
};

window.gotoReservation = (id) => {
  const r = state.reservations.find(x => x.id === id);
  if (!r) return;
  closeAllModals();
  state.currentRoom = r.room;
  state.weekStart = getMondayOf(new Date(r.date));
  render();
  setTimeout(() => openDetail(r), 100);
};

// ===== 정규시간표 편집 =====
let _schedulePending = null;

function editScheduleLabel(room, dayOfWeek, period, existing) {
  _schedulePending = { room, dayOfWeek, period };
  const pLabel = PERIODS.find(p => p.key === period)?.label || period;
  document.getElementById('scheduleLabelTitle').textContent = `정규시간 설정 — ${dayOfWeek} ${pLabel}`;
  document.getElementById('scheduleLabelInput').value = existing ? existing.label : '';
  showModal('scheduleLabelModal');
  setTimeout(() => document.getElementById('scheduleLabelInput').focus(), 50);
}

document.getElementById('scheduleLabelSaveBtn').onclick = () => {
  if (!_schedulePending) return;
  const { room, dayOfWeek, period } = _schedulePending;
  const v = document.getElementById('scheduleLabelInput').value.trim();
  state.schedule = state.schedule.filter(s => !(s.room === room && s.dayOfWeek === dayOfWeek && s.period === period));
  if (v) state.schedule.push({ room, dayOfWeek, period, label: v });
  saveState();
  closeAllModals();
  render();
  _schedulePending = null;
};

// ===== 관리자 모드 =====
document.getElementById('adminBtn').onclick = () => {
  if (state.isAdmin) {
    state.isAdmin = false;
    sessionStorage.removeItem('isAdmin');
    document.body.classList.remove('admin');
    alert('관리자 모드 해제 — 사용자 화면으로 돌아갑니다.');
    render();
    return;
  }
  const pw = prompt('관리자 비밀번호:');
  if (pw === ADMIN_PW_LOCAL) {
    state.isAdmin = true;
    sessionStorage.setItem('isAdmin', '1');
    document.body.classList.add('admin');
    alert('관리자 모드 활성화\n\n[정규시간 관리]\n- 빈 셀 클릭 → 정규시간 추가/편집\n- 기간 정규시간 버튼 → 날짜 범위로 일괄 설정\n- 다중 선택 → 여러 셀 한번에 설정\n\n[특별실 관리]\n- 탭 우클릭 → 특별실 삭제\n- + 특별실 추가 버튼으로 추가 가능\n\n[서버]\n- 구글시트 설정에서 연동 관리');
    render();
  } else {
    alert('비밀번호가 틀립니다.');
  }
};

// ===== 주간 이동 =====
document.getElementById('prevWeek').onclick = () => { state.weekStart = addDays(state.weekStart, -7); renderWeekSelect(); renderSchedule(); };
document.getElementById('nextWeek').onclick = () => { state.weekStart = addDays(state.weekStart, 7); renderWeekSelect(); renderSchedule(); };
document.getElementById('todayBtn').onclick = () => { state.weekStart = getMondayOf(new Date()); renderWeekSelect(); renderSchedule(); };
document.getElementById('weekSelect').onchange = (e) => {
  state.weekStart = new Date(e.target.value);
  renderSchedule();
};

// ===== 서버 동기화 =====
document.getElementById('saveToServerBtn').onclick = async () => {
  if (!API.enabled()) { alert('서버 연동이 비활성화되어 있습니다. 구글시트 설정에서 활성화하세요.'); return; }
  try {
    const result = await API.saveAll({
      rooms: state.rooms,
      reservations: state.reservations,
      schedule: state.schedule,
    });
    alert(result.ok ? '서버에 저장되었습니다.' : '저장 실패: ' + (result.error || ''));
  } catch (e) { alert('오류: ' + e.message); }
};

document.getElementById('loadFromServerBtn').onclick = async () => {
  if (!API.enabled()) { alert('서버 연동이 비활성화되어 있습니다.'); return; }
  if (!confirm('서버(구글 시트)의 데이터로 현재 데이터를 덮어쓰시겠습니까?\n(서버가 비어있으면 로컬 데이터가 모두 사라집니다)')) return;
  await loadFromServer({ force: true });
  alert('서버에서 불러왔습니다.');
};

function normalizeDateStr(v) {
  if (!v) return v;
  if (typeof v === 'string') {
    // 이미 YYYY-MM-DD 면 그대로
    if (/^\d{4}-\d{2}-\d{2}$/.test(v)) return v;
    // ISO 타임스탬프면 한국시간 기준 날짜 추출
    if (v.indexOf('T') > 0) {
      const d = new Date(v);
      const kst = new Date(d.getTime() + 9 * 60 * 60 * 1000);
      return kst.toISOString().slice(0, 10);
    }
  }
  if (v instanceof Date) {
    const kst = new Date(v.getTime() + 9 * 60 * 60 * 1000);
    return kst.toISOString().slice(0, 10);
  }
  return v;
}

async function loadFromServer({ force = false } = {}) {
  try {
    const data = await API.loadAll();
    if (Array.isArray(data.reservations)) {
      data.reservations = data.reservations.map(r => ({
        ...r,
        date: normalizeDateStr(r.date),
        period: String(r.period),
      }));
    }
    if (Array.isArray(data.reservations) && (force || data.reservations.length > 0)) {
      state.reservations = data.reservations;
    }
    // 방 목록·정규시간표는 force(명시적 불러오기)일 때만 덮어씀
    if (force) {
      if (Array.isArray(data.rooms) && data.rooms.length > 0) state.rooms = data.rooms;
      if (Array.isArray(data.schedule)) state.schedule = data.schedule;
    }
    saveState();
    render();
  } catch (e) { console.warn('loadFromServer failed', e); }
}

// ===== 설정 모달 =====
document.getElementById('settingsHelpBtn').onclick = () => showModal('settingsHelpModal');

document.getElementById('sheetSettingsBtn').onclick = () => {
  document.getElementById('apiUrlInput').value = localStorage.getItem('apiUrl') || '';
  document.getElementById('serverEnabled').checked = localStorage.getItem('serverEnabled') === '1';
  document.getElementById('autoSave').checked = localStorage.getItem('autoSave') === '1';
  document.getElementById('autoLoad').checked = localStorage.getItem('autoLoad') === '1';
  document.getElementById('autoLoadInterval').value = localStorage.getItem('autoLoadInterval') || '600';
  showModal('settingsModal');
};

document.getElementById('saveSettingsBtn').onclick = () => {
  localStorage.setItem('apiUrl', document.getElementById('apiUrlInput').value.trim());
  localStorage.setItem('serverEnabled', document.getElementById('serverEnabled').checked ? '1' : '0');
  localStorage.setItem('autoSave', document.getElementById('autoSave').checked ? '1' : '0');
  localStorage.setItem('autoLoad', document.getElementById('autoLoad').checked ? '1' : '0');
  localStorage.setItem('autoLoadInterval', document.getElementById('autoLoadInterval').value);
  setupAutoLoad();
  closeAllModals();
  alert('설정이 저장되었습니다.');
};

document.getElementById('testConnBtn').onclick = async () => {
  const inputUrl = document.getElementById('apiUrlInput').value.trim();
  if (!inputUrl) { alert('URL을 먼저 입력하세요.'); return; }
  try {
    const url = new URL(inputUrl);
    url.searchParams.set('action', 'ping');
    const res = await fetch(url.toString());
    const r = await res.json();
    alert('연결 성공: ' + JSON.stringify(r));
  } catch (e) { alert('연결 실패: ' + e.message); }
};

document.getElementById('cleanServerBtn').onclick = async () => {
  const pw = prompt('관리자 비밀번호를 입력하세요:');
  if (!pw) return;
  try {
    const r = await API.cleanup(pw);
    alert(r.ok ? '서버 데이터를 정리했습니다.' : '실패: ' + (r.error || ''));
  } catch (e) { alert('오류: ' + e.message); }
};

document.getElementById('resetLocalBtn').onclick = () => {
  if (!confirm('이 브라우저의 데이터를 모두 삭제할까요? (서버 데이터는 유지됨)')) return;
  localStorage.clear();
  location.reload();
};

function setupAutoLoad() {
  if (state.autoLoadTimer) clearInterval(state.autoLoadTimer);
  if (API.enabled() && localStorage.getItem('autoLoad') === '1') {
    const sec = parseInt(localStorage.getItem('autoLoadInterval') || '600', 10);
    state.autoLoadTimer = setInterval(loadFromServer, sec * 1000);
  }
}

// ===== 모달 헬퍼 =====
function showModal(id) { document.getElementById(id).hidden = false; }
function closeAllModals() {
  document.querySelectorAll('.modal-backdrop').forEach(m => m.hidden = true);
}
document.querySelectorAll('[data-close]').forEach(b => b.onclick = closeAllModals);
document.querySelectorAll('.modal-backdrop').forEach(m => {
  m.addEventListener('click', (e) => { if (e.target === m) closeAllModals(); });
});

// ===== flatpickr 초기화 =====
const fpStart = flatpickr('#drStart', { locale: 'ko', dateFormat: 'Y-m-d', disableMobile: true });
const fpEnd   = flatpickr('#drEnd',   { locale: 'ko', dateFormat: 'Y-m-d', disableMobile: true });

// ===== 기간 정규시간 =====
document.getElementById('dateRuleBtn').onclick = () => {
  const sel = document.getElementById('drRoom');
  sel.innerHTML = state.rooms.map(r => `<option value="${escapeHtml(r)}">${escapeHtml(r)}</option>`).join('');
  document.getElementById('drPeriods').innerHTML = PERIODS.map(p => `
    <label class="period-check-item">
      <input type="checkbox" value="${p.key}"> ${p.label}
    </label>`).join('');
  const today = new Date().toISOString().slice(0, 10);
  fpStart.setDate(today, true);
  fpEnd.setDate(today, true);
  document.getElementById('drLabel').value = '';
  renderDateRuleList();
  showModal('dateRuleModal');
};

function renderDateRuleList() {
  const list = document.getElementById('dateRuleList');
  if (!state.dateRules.length) { list.innerHTML = ''; return; }
  list.innerHTML = `
    <p style="margin:16px 0 8px; font-weight:600; font-size:13px; color:#555;">등록된 기간 규칙</p>
    ${state.dateRules.map(r => `
      <div class="date-rule-item">
        <div>
          <strong>${escapeHtml(r.room)}</strong> · ${r.startDate} ~ ${r.endDate}<br>
          <span style="font-size:12px; color:#555;">${r.periods.map(k => PERIODS.find(p=>p.key===k)?.label||k).join(', ')} · ${escapeHtml(r.label)}</span>
        </div>
        <button class="btn btn-red" style="font-size:12px; padding:4px 10px;" onclick="deleteDateRule('${r.id}')">삭제</button>
      </div>`).join('')}`;
}

function deleteDateRule(id) {
  state.dateRules = state.dateRules.filter(r => r.id !== id);
  saveState();
  render();
  renderDateRuleList();
}

document.getElementById('saveDateRuleBtn').onclick = () => {
  const room = document.getElementById('drRoom').value;
  const startDate = document.getElementById('drStart').value;
  const endDate = document.getElementById('drEnd').value;
  const label = document.getElementById('drLabel').value.trim();
  const periods = [...document.querySelectorAll('#drPeriods input:checked')].map(el => el.value);
  if (!startDate || !endDate) { alert('기간을 입력하세요.'); return; }
  if (startDate > endDate) { alert('시작일이 종료일보다 늦습니다.'); return; }
  if (!periods.length) { alert('교시를 하나 이상 선택하세요.'); return; }
  if (!label) { alert('라벨을 입력하세요.'); return; }
  state.dateRules.push({ id: crypto.randomUUID(), room, startDate, endDate, periods, label });
  saveState();
  render();
  renderDateRuleList();
};

// ===== 다중 선택 =====
function updateMultiBar() {
  const n = state.selectedCells.length;
  const bar = document.getElementById('multiSelectBar');
  document.getElementById('multiSelectCount').textContent = `${n}개 선택됨`;
  document.getElementById('multiSelectConfirmBtn').textContent = state.isAdmin
    ? `${n}개 정규시간 추가`
    : `${n}개 예약하기`;
  bar.hidden = !state.multiSelect;
}

function exitMultiSelect() {
  state.multiSelect = false;
  state.selectedCells = [];
  document.body.classList.remove('multi-select');
  document.getElementById('multiSelectBtn').classList.remove('active');
  document.getElementById('multiSelectBar').hidden = true;
  render();
}

document.getElementById('multiSelectBtn').onclick = () => {
  state.multiSelect = !state.multiSelect;
  state.selectedCells = [];
  document.body.classList.toggle('multi-select', state.multiSelect);
  document.getElementById('multiSelectBtn').classList.toggle('active', state.multiSelect);
  updateMultiBar();
  if (state.multiSelect) render();
};

document.getElementById('multiSelectCancelBtn').onclick = exitMultiSelect;

document.getElementById('multiSelectConfirmBtn').onclick = () => {
  if (state.selectedCells.length === 0) return;

  if (state.isAdmin) {
    // 관리자: 정규시간 라벨 일괄 입력
    const label = prompt(`선택한 ${state.selectedCells.length}개 칸의 정규시간 라벨을 입력하세요:\n(비우면 해당 칸의 정규시간 삭제)`);
    if (label === null) return; // 취소
    for (const c of state.selectedCells) {
      state.schedule = state.schedule.filter(
        s => !(s.room === c.room && s.dayOfWeek === c.dayName && s.period === c.period)
      );
      if (label.trim()) {
        state.schedule.push({ room: c.room, dayOfWeek: c.dayName, period: c.period, label: label.trim() });
      }
    }
    saveState();
    exitMultiSelect();
    return;
  }

  // 일반 사용자: 예약 일괄 입력
  state.pendingCell = null;
  state.pendingBatch = [...state.selectedCells];
  document.getElementById('resName').value = '';
  document.getElementById('resGrade').value = '';
  document.getElementById('resClassNum').value = '';
  document.getElementById('resPurpose').value = '';
  document.getElementById('resPassword').value = '';
  showModal('reservationModal');
};

// ===== 초기화 =====
function render() {
  renderTabs();
  renderWeekSelect();
  renderSchedule();
}

function init() {
  if (!state.currentRoom) state.currentRoom = state.rooms[0] || null;
  if (state.isAdmin) document.body.classList.add('admin');
  render();
  setupAutoLoad();
}
init();

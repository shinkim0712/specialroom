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
  { key: '7',   label: '7교시', time: '14:50~15:30' },
  { key: '8',   label: '8교시', time: '15:40~16:20' },
];
const DAYS = ['월', '화', '수', '목', '금'];

// 대한민국 법정공휴일(2026). 제헌절은 국경일이지만 2008년부터 공휴일에서 제외되어 목록에 넣지 않음.
// ▶ 다음 해가 되면 이 배열에 새 연도 항목을 추가하세요.
const KR_HOLIDAYS = [
  { date: '2026-01-01', label: '신정' },
  { date: '2026-02-16', label: '설날연휴' },
  { date: '2026-02-17', label: '설날' },
  { date: '2026-02-18', label: '설날연휴' },
  { date: '2026-03-01', label: '삼일절' },
  { date: '2026-03-02', label: '대체공휴일' },
  { date: '2026-05-05', label: '어린이날' },
  { date: '2026-05-24', label: '부처님오신날' },
  { date: '2026-05-25', label: '대체공휴일' },
  { date: '2026-06-06', label: '현충일' },
  { date: '2026-08-15', label: '광복절' },
  { date: '2026-08-17', label: '대체공휴일' },
  { date: '2026-09-24', label: '추석연휴' },
  { date: '2026-09-25', label: '추석' },
  { date: '2026-09-26', label: '추석연휴' },
  { date: '2026-10-03', label: '개천절' },
  { date: '2026-10-05', label: '대체공휴일' },
  { date: '2026-10-09', label: '한글날' },
  { date: '2026-12-25', label: '크리스마스' },
  { date: '2027-01-01', label: '신정' },
  { date: '2027-02-06', label: '설날연휴' },
  { date: '2027-02-07', label: '설날' },
  { date: '2027-02-08', label: '설날연휴' },
  { date: '2027-02-09', label: '대체공휴일' },
  { date: '2027-03-01', label: '삼일절' },
  { date: '2027-05-05', label: '어린이날' },
  { date: '2027-05-13', label: '부처님오신날' },
  { date: '2027-06-06', label: '현충일' },
  { date: '2027-08-15', label: '광복절' },
  { date: '2027-08-16', label: '대체공휴일' },
  { date: '2027-09-14', label: '추석연휴' },
  { date: '2027-09-15', label: '추석' },
  { date: '2027-09-16', label: '추석연휴' },
  { date: '2027-10-03', label: '개천절' },
  { date: '2027-10-04', label: '대체공휴일' },
  { date: '2027-10-09', label: '한글날' },
  { date: '2027-10-11', label: '대체공휴일' },
  { date: '2027-12-25', label: '크리스마스' },
  { date: '2027-12-27', label: '대체공휴일' },
  { date: '2028-01-01', label: '신정' },
  { date: '2028-01-26', label: '설날연휴' },
  { date: '2028-01-27', label: '설날' },
  { date: '2028-01-28', label: '설날연휴' },
  { date: '2028-03-01', label: '삼일절' },
  { date: '2028-05-02', label: '부처님오신날' },
  { date: '2028-05-05', label: '어린이날' },
  { date: '2028-06-06', label: '현충일' },
  { date: '2028-08-15', label: '광복절' },
  { date: '2028-10-02', label: '추석연휴' },
  { date: '2028-10-03', label: '추석·개천절' },
  { date: '2028-10-04', label: '추석연휴' },
  { date: '2028-10-05', label: '대체공휴일' },
  { date: '2028-10-09', label: '한글날' },
  { date: '2028-12-25', label: '크리스마스' },
];

// 공휴일(고정) + 학교자체 휴일(관리자가 추가, 기간으로 등록) 중 해당 날짜의 라벨을 반환
function getHolidayLabel(dateKey) {
  const custom = state.customHolidays.find(h => dateKey >= h.startDate && dateKey <= h.endDate);
  if (custom) return custom.label;
  const kr = KR_HOLIDAYS.find(h => h.date === dateKey);
  return kr ? kr.label : null;
}

// ===== 상태 =====
const state = {
  rooms: load('rooms', DEFAULT_ROOMS),
  reservations: load('reservations', []),  // {id, room, date, period, name, classroom, purpose, createdAt}
  schedule: load('schedule', []),          // {room, dayOfWeek, period, label}
  dateRules: load('dateRules', []),        // {id, room, startDate, endDate, periods:[], label}
  customHolidays: load('customHolidays', []),  // {id, startDate, endDate, label} — 방학·재량휴업일 등 학교자체 휴일
  currentRoom: null,
  weekStart: getMondayOf(new Date()),
  viewMode: 'week',  // 'week' | 'month'
  monthCursor: new Date(),  // 월별 보기에서 현재 보고 있는 달의 아무 날짜
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
  save('dateRules', state.dateRules);
  save('customHolidays', state.customHolidays);
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

// ===== 렌더링 =====
function renderTabs() {
  const nav = document.getElementById('roomTabs');
  nav.innerHTML = '';
  state.rooms.forEach(r => {
    const b = document.createElement('button');
    b.className = 'tab' + (r === state.currentRoom ? ' active' : '');
    b.textContent = r;
    b.addEventListener('click', () => {
      if (b.dataset.suppressClick === '1') { delete b.dataset.suppressClick; return; }
      state.currentRoom = r;
      render();
    });
    // 관리자: 우클릭으로 삭제, 꾹 눌러서 좌우로 끌면 순서 변경 (삭제·순서변경은 관리자만)
    if (state.isAdmin) {
      b.oncontextmenu = (e) => {
        e.preventDefault();
        if (state.rooms.length <= 1) { alert('마지막 특별실은 삭제할 수 없습니다.'); return; }
        const resN = state.reservations.filter(x => x.room === r).length;
        const ruleN = state.dateRules.filter(x => x.room === r).length;
        const extra = (resN || ruleN)
          ? `\n\n이 특별실의 예약 ${resN}건·기간 규칙 ${ruleN}건도 함께 삭제됩니다.`
          : '';
        if (confirm(`'${r}' 특별실을 삭제하시겠습니까?${extra}`)) {
          state.rooms = state.rooms.filter(x => x !== r);
          state.reservations = state.reservations.filter(x => x.room !== r);
          state.dateRules = state.dateRules.filter(x => x.room !== r);
          if (state.currentRoom === r) state.currentRoom = state.rooms[0] || null;
          saveState(); render();
          if (API.enabled() && localStorage.getItem('autoSave') === '1') {
            API.deleteRoom(r).catch(e => console.warn(e));  // 서버에서 딸린 데이터까지 정리
          }
        }
      };
      enableTabDrag(b);
    }
    nav.appendChild(b);
  });
  // 특별실 추가는 사용자도 가능 (삭제·순서변경만 관리자 전용)
  const add = document.createElement('button');
  add.className = 'tab add-tab';
  add.textContent = '+ 특별실 추가';
  add.onclick = addRoom;
  nav.appendChild(add);
}

// 관리자 모드: 탭을 꾹 눌렀다가(롱프레스) 좌우로 끌면 특별실 순서가 바뀜 (마우스·터치 공통)
function enableTabDrag(btn) {
  const LONG_PRESS_MS = 350;
  let pressTimer = null;
  let dragging = false;
  let moved = false;
  let startX = 0;

  const cancelPress = () => { if (pressTimer) { clearTimeout(pressTimer); pressTimer = null; } };

  btn.addEventListener('pointerdown', (e) => {
    if (e.button !== undefined && e.button !== 0) return;
    startX = e.clientX;
    cancelPress();
    pressTimer = setTimeout(() => {
      dragging = true;
      moved = false;
      btn.dataset.suppressClick = '1';
      btn.classList.add('dragging');
      try { btn.setPointerCapture(e.pointerId); } catch (_) {}
    }, LONG_PRESS_MS);
  });

  btn.addEventListener('pointermove', (e) => {
    if (!dragging) {
      if (pressTimer && Math.abs(e.clientX - startX) > 10) cancelPress();
      return;
    }
    e.preventDefault();
    btn.style.transform = `translateX(${e.clientX - startX}px)`;
    // 드래그 중인 탭 자신이 그 자리를 시각적으로 덮고 있을 수 있어 elementFromPoint 대신 스택 전체를 훑음
    const stack = document.elementsFromPoint(e.clientX, e.clientY);
    const hovered = stack.find(el => el.closest && el.closest('.tab:not(.add-tab):not(.dragging)'));
    const target = hovered && hovered.closest('.tab:not(.add-tab):not(.dragging)');
    if (target && target.parentElement === btn.parentElement) {
      const nav = btn.parentElement;
      const tabs = [...nav.querySelectorAll('.tab:not(.add-tab)')];
      const fromIdx = tabs.indexOf(btn);
      const toIdx = tabs.indexOf(target);
      if (fromIdx !== -1 && toIdx !== -1 && fromIdx !== toIdx) {
        nav.insertBefore(btn, fromIdx < toIdx ? target.nextSibling : target);
        // 두 칸 맞바꾸기가 아니라 실제 옮겨진 화면 순서를 그대로 저장 (여러 칸 건너뛰어도 어긋나지 않게)
        state.rooms = [...nav.querySelectorAll('.tab:not(.add-tab)')].map(t => t.textContent);
        moved = true;
        startX = e.clientX;  // 위치가 옮겨졌으니 손가락 기준점 재설정
        btn.style.transform = 'translateX(0px)';
      }
    }
  });

  const endDrag = () => {
    cancelPress();
    if (dragging) {
      dragging = false;
      btn.classList.remove('dragging');
      btn.style.transform = '';
      if (moved) {
        saveState();
        if (API.enabled() && localStorage.getItem('autoSave') === '1') {
          API.reorderRooms(state.rooms).catch(e => console.warn(e));
        }
      }
      setTimeout(() => { delete btn.dataset.suppressClick; }, 0);
    }
  };
  btn.addEventListener('pointerup', endDrag);
  btn.addEventListener('pointercancel', endDrag);
}

async function addRoom() {
  const raw = prompt('특별실 이름을 입력하세요:');
  if (!raw) return;
  const name = raw.trim();
  if (!name) return;
  if (state.rooms.includes(name)) { alert('이미 존재합니다.'); return; }
  const prevRoom = state.currentRoom;
  state.rooms.push(name);
  state.currentRoom = name;
  saveState();
  render();
  if (API.enabled() && localStorage.getItem('autoSave') === '1') {
    try {
      const res = await API.addRoom(name);
      if (!res.ok) {
        state.rooms = state.rooms.filter(r => r !== name);
        state.currentRoom = state.rooms.includes(prevRoom) ? prevRoom : (state.rooms[0] || null);
        saveState();
        render();
        alert(res.error === 'exists'
          ? '다른 사람이 먼저 같은 이름의 특별실을 추가했습니다.'
          : '특별실 추가를 서버에 저장하지 못했습니다.');
      }
    } catch (e) {
      console.warn(e);
      state.rooms = state.rooms.filter(r => r !== name);
      state.currentRoom = state.rooms.includes(prevRoom) ? prevRoom : (state.rooms[0] || null);
      saveState();
      render();
      alert('특별실 추가를 서버에 저장하지 못했습니다. 네트워크를 확인하고 다시 시도해 주세요.');
    }
  }
}

function renderWeekSelect() {
  document.getElementById('weekSelect').textContent = weekLabel(state.weekStart);
}

function renderSchedule() {
  document.getElementById('roomTitle').textContent = (state.currentRoom || '') + ' 시간표';
  const table = document.getElementById('scheduleTable');
  table.innerHTML = '';

  // 헤더
  const thead = document.createElement('thead');
  const headRow = document.createElement('tr');
  headRow.innerHTML = '<th>교시</th>' + DAYS.map((d, i) => {
    const day = addDays(state.weekStart, i);
    const dateKey = fmtDateKey(day);
    const holiday = getHolidayLabel(dateKey);
    const holidayHtml = holiday ? `<span class="th-holiday">${escapeHtml(holiday)}</span>` : '';
    return `<th class="${holiday ? 'holiday' : ''}"><span class="th-day">${d}</span><span class="th-date">${day.getMonth()+1}.${day.getDate()}</span>${holidayHtml}</th>`;
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

    DAYS.forEach((dayName, i) => {
      const dateObj = addDays(state.weekStart, i);
      const dateKey = fmtDateKey(dateObj);
      const cell = makeCell(state.currentRoom, dateKey, p.key, dayName);
      tr.appendChild(cell);
    });
    tbody.appendChild(tr);
  });
  table.appendChild(tbody);
}

function makeCell(room, dateKey, periodKey, dayName) {
  const td = document.createElement('td');
  const reservation = state.reservations.find(r =>
    r.room === room && r.date === dateKey && r.period === periodKey
  );
  const matchingRules = state.dateRules.filter(r =>
    r.room === room && r.periods.includes(periodKey) &&
    dateKey >= r.startDate && dateKey <= r.endDate &&
    (!r.daysOfWeek || !r.daysOfWeek.length || r.daysOfWeek.includes(dayName))
  );
  // 여러 규칙이 겹치면: 예약금지 규칙이 있으면 무조건 그게 이김(나중에 만든 라벨 규칙에 가려지지 않도록),
  // 없으면 마지막에 만든 규칙의 라벨을 표시
  const blockedRule = matchingRules.find(r => r.blocked) || null;
  const dateRule = blockedRule || (matchingRules.length ? matchingRules[matchingRules.length - 1] : null);
  const scheduleNote = dateRule ? dateRule.label : null;
  if (reservation) {
    td.className = 'reserved' + (reservation.classroom === '회의/행사' ? ' meeting' : '');
    const noteHtml = scheduleNote ? `<span class="schedule-note">${escapeHtml(scheduleNote)}</span>` : '';
    td.innerHTML = `
      <div><span class="star">📌</span> <span class="name">${escapeHtml(reservation.classroom || '')}</span></div>
      <div class="meta meta-class">${escapeHtml(reservation.purpose || '')}</div>
      <div class="meta meta-purpose">${escapeHtml(reservation.name)}</div>
      ${noteHtml}
    `;
    if (state.multiSelect && state.selectedCells.some(c => c._key === `${room}|${dateKey}|${periodKey}|res`)) {
      td.classList.add('selected');
    }
    td.onclick = () => {
      // 다중 선택 모드: 예약된 칸은 일괄 삭제 대상으로 선택
      if (state.multiSelect) {
        const key = `${room}|${dateKey}|${periodKey}|res`;
        const idx = state.selectedCells.findIndex(c => c._key === key);
        if (idx >= 0) {
          state.selectedCells.splice(idx, 1);
          td.classList.remove('selected');
        } else {
          state.selectedCells.push({ _key: key, kind: 'reservation', reservationId: reservation.id, room, date: dateKey, period: periodKey });
          td.classList.add('selected');
        }
        updateMultiBar();
        return;
      }
      openDetail(reservation);
    };
  } else {
    td.className = 'empty';
    const holiday = getHolidayLabel(dateKey);
    if (holiday) td.classList.add('holiday-cell');
    if (blockedRule) td.classList.add('blocked-cell');
    if (scheduleNote) {
      td.classList.add('has-schedule');
      const noteText = (blockedRule ? '🔒 ' : '') + scheduleNote;
      td.innerHTML = `<span class="schedule-note">${escapeHtml(noteText)}</span>`;
    }
    if (state.multiSelect) {
      const key = `${room}|${dateKey}|${periodKey}|empty`;
      if (state.selectedCells.some(c => c._key === key)) td.classList.add('selected');
    }
    td.onclick = () => {
      if (blockedRule && !state.multiSelect) {
        alert(`예약이 금지된 시간입니다: ${blockedRule.label}`);
        return;
      }
      // 다중 선택 모드 (관리자/일반 공통 — 빈 칸은 일괄 예약 대상)
      if (state.multiSelect) {
        if (blockedRule) {
          alert(`예약이 금지된 시간입니다: ${blockedRule.label}`);
          return;
        }
        const key = `${room}|${dateKey}|${periodKey}|empty`;
        const idx = state.selectedCells.findIndex(c => c._key === key);
        if (idx >= 0) {
          state.selectedCells.splice(idx, 1);
          td.classList.remove('selected');
        } else {
          state.selectedCells.push({ _key: key, kind: 'empty', room, date: dateKey, period: periodKey });
          td.classList.add('selected');
        }
        updateMultiBar();
        return;
      }
      openReservation(room, dateKey, periodKey, scheduleNote);
    };
  }
  return td;
}

function escapeHtml(s) {
  return String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}

// ===== 예약 흐름 =====
// 예약자명/학급은 이 브라우저에서 마지막으로 쓴 값을 기억해뒀다가 다음 예약에 기본값으로 채움.
// 정규시간표 라벨이 "N학년" 형태로 정확히 일치하면 그걸 우선 채움(예: 강당은 항상 3학년이 씀).
function prefillNameAndClassroom(scheduleNote) {
  document.getElementById('resName').value = localStorage.getItem('lastResName') || '';
  const gradeMatch = scheduleNote && /^[1-6]학년$/.test(scheduleNote);
  document.getElementById('resGrade').value = gradeMatch ? scheduleNote : (localStorage.getItem('lastResGrade') || '');
  document.getElementById('resClassNum').value = gradeMatch ? '' : (localStorage.getItem('lastResClassNum') || '');
}

// 관리자 권한 없이 누구나 자기 브라우저의 "마지막 입력값 기억"만 지울 수 있는 버튼
document.getElementById('clearRememberedBtn').onclick = (e) => {
  e.preventDefault();
  localStorage.removeItem('lastResName');
  localStorage.removeItem('lastResGrade');
  localStorage.removeItem('lastResClassNum');
  document.getElementById('resName').value = '';
  document.getElementById('resGrade').value = '';
  document.getElementById('resClassNum').value = '';
};

let _editingReservationId = null;

function updateMeetingModeUI() {
  const isMeeting = document.getElementById('resMeetingMode').checked;
  document.getElementById('resClassroomFields').style.display = isMeeting ? 'none' : 'flex';
}
document.getElementById('resMeetingMode').onchange = updateMeetingModeUI;

function openReservation(room, date, period, scheduleNote) {
  _editingReservationId = null;
  document.getElementById('reservationModalTitle').textContent = '예약하기';
  state.pendingCell = { room, date, period };
  prefillNameAndClassroom(scheduleNote);
  document.getElementById('resMeetingMode').checked = false;
  document.getElementById('resPurpose').value = '';
  updateMeetingModeUI();
  showModal('reservationModal');
}

// 예약 수정: 새 예약과 같은 입력 폼을 재사용해 기존 값을 채워서 엶
function openEditReservation(r) {
  _editingReservationId = r.id;
  document.getElementById('reservationModalTitle').textContent = '예약 수정';
  document.getElementById('resName').value = r.name || '';
  const isMeetingClassroom = r.classroom === '회의/행사' || r.classroom === '회의' || r.classroom === '회의/학급';
  document.getElementById('resMeetingMode').checked = isMeetingClassroom;
  if (!isMeetingClassroom && r.classroom) {
    const m = r.classroom.match(/^([1-6]학년)(?:\s+(\d+반))?$/);
    document.getElementById('resGrade').value = m ? m[1] : '';
    document.getElementById('resClassNum').value = (m && m[2]) ? m[2] : '';
  } else {
    document.getElementById('resGrade').value = '';
    document.getElementById('resClassNum').value = '';
  }
  document.getElementById('resPurpose').value = r.purpose || '';
  updateMeetingModeUI();
  showModal('reservationModal');
}

document.getElementById('saveReservationBtn').onclick = async () => {
  const name = document.getElementById('resName').value.trim();
  const isMeeting = document.getElementById('resMeetingMode').checked;
  const grade = document.getElementById('resGrade').value;
  const classNum = document.getElementById('resClassNum').value;
  const classroom = isMeeting ? '회의/행사' : ((grade && classNum) ? `${grade} ${classNum}` : (grade || classNum));
  const purpose = document.getElementById('resPurpose').value.trim();
  if (!name) { alert('예약자명을 입력하세요.'); return; }

  // 다음 예약 때 기본값으로 쓰기 위해 기억 (회의 체크 시엔 학급을 안 쓴 것이므로 기억값에 반영하지 않음)
  localStorage.setItem('lastResName', name);
  if (!isMeeting) {
    if (grade) localStorage.setItem('lastResGrade', grade);
    if (classNum) localStorage.setItem('lastResClassNum', classNum);
  }

  // 예약 수정 모드: 기존 예약을 갱신 (새 예약 생성 로직과 분리)
  if (_editingReservationId) {
    const editedId = _editingReservationId;
    const r = state.reservations.find(x => x.id === editedId);
    _editingReservationId = null;
    if (r) {
      r.name = name; r.classroom = classroom; r.purpose = purpose;
      saveState();
    }
    closeAllModals();
    render();
    if (r && API.enabled() && localStorage.getItem('autoSave') === '1') {
      try { await API.updateReservation({ id: editedId, name, classroom, purpose }); } catch (e) { console.warn(e); }
    }
    return;
  }

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
    // 서버가 거부한(이미 예약된) 칸은 화면에서 되돌리고 알림 — 겹치기 예약 방지
    const rejected = [];
    for (const r of newReservations) {
      try {
        const result = await API.createReservation(r);
        if (!result.ok) {
          state.reservations = state.reservations.filter(x => x.id !== r.id);
          rejected.push(r);
        }
      } catch (e) { console.warn(e); }
    }
    if (rejected.length) {
      saveState();
      render();
      const list = rejected.map(r => `${r.room} ${r.date} ${periodLabel(r.period)}`).join('\n');
      alert(`다른 사람이 먼저 예약해서 아래 시간은 취소되었습니다:\n${list}`);
    }
  }
};

async function openDetail(r) {
  document.getElementById('detailInfo').innerHTML = `
    <p><strong>${escapeHtml(r.name)}</strong> (${escapeHtml(r.classroom||'-')})</p>
    <p>${escapeHtml(r.room)} · ${r.date} · ${periodLabel(r.period)}</p>
    <p>목적: ${escapeHtml(r.purpose||'-')}</p>
  `;
  const modal = document.getElementById('detailModal');
  modal.dataset.id = r.id;
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
    try { await API.deleteReservation(id); } catch (e) { console.warn(e); }
  }
};

document.getElementById('editResBtn').onclick = () => {
  const id = document.getElementById('detailModal').dataset.id;
  const r = state.reservations.find(x => x.id === id);
  if (!r) return;
  closeAllModals();
  openEditReservation(r);
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

// ===== 관리자 모드 =====
// 비밀번호는 서버(Apps Script)에서만 검증 — 브라우저 코드에 남기지 않음
function updateAdminBtnLabel() {
  document.getElementById('adminBtn').textContent = state.isAdmin ? '사용자 모드로 전환' : '관리자 모드';
}

const ADMIN_HELP_TEXT = `관리자 모드 활성화

[정규시간 / 예약 금지]
- 기간 정규시간 버튼 → 특별실·날짜 범위·요일·교시로 라벨 설정 또는 예약 금지 (사용자도 가능, 추가·수정·삭제 즉시 서버 반영)
- 관리자 모드에서도 빈 칸 클릭 = 예약 (사용자와 동일)

[특별실 관리]
- + 특별실 추가: 사용자도 가능 (추가 즉시 서버 반영)
- 탭 우클릭 → 삭제 (관리자만). 그 특별실의 예약·정규시간·기간 규칙도 함께 삭제됨
- 탭 꾹 눌러 드래그 → 순서 변경 (관리자만, 즉시 서버 반영)

[학교휴일 관리]
- 학교휴일 관리 버튼 → 방학·재량휴업일·개교기념일 등 학교자체 휴일 등록/삭제 (즉시 서버 반영)
  (법정공휴일은 별도 설정 없이 자동으로 표시됨)

[예약 관리]
- 예약 삭제·수정에는 비밀번호 확인이 없습니다 (관리자든 일반 사용자든 동일)
- 다중 선택으로 예약된 칸 여러 개를 골라 한 번에 삭제 가능

[서버]
- 모든 변경(예약·특별실·기간 정규시간·학교휴일)은 즉시 서버에 저장됩니다. 따로 "저장" 누를 필요 없음
- 변경 기록 버튼: 삭제·수정·가림된 내용을 최근순으로 확인
- 구글시트 설정 버튼 → Apps Script 연동 URL·자동저장/불러오기 설정, 서버 데이터 정리
- "서버에서 불러오기": 서버 데이터로 내 화면을 강제 교체 (관리자만)`;

document.getElementById('adminBtn').onclick = async () => {
  if (state.isAdmin) {
    state.isAdmin = false;
    sessionStorage.removeItem('isAdmin');
    document.body.classList.remove('admin');
    updateAdminBtnLabel();
    if (state.multiSelect) exitMultiSelect();  // 관리자/사용자 모드는 다중선택 키 기준이 달라 전환 시 선택 초기화
    alert('사용자 모드로 전환 — 관리자 기능이 화면에서 사라집니다.');
    render();
    return;
  }
  if (!API.enabled()) { alert('서버 연동이 꺼져 있어 관리자 인증을 할 수 없습니다. 구글시트 설정에서 활성화하세요.'); return; }
  const pw = prompt('관리자 비밀번호:');
  if (pw === null) return;
  try {
    const r = await API.checkAdmin(pw);
    if (r.ok) {
      state.isAdmin = true;
      sessionStorage.setItem('isAdmin', '1');
      document.body.classList.add('admin');
      updateAdminBtnLabel();
      if (state.multiSelect) exitMultiSelect();
      alert(ADMIN_HELP_TEXT);
      render();
    } else {
      alert('비밀번호가 틀립니다.');
    }
  } catch (e) {
    alert('서버 연결 오류: ' + e.message);
  }
};

// ===== 주간 이동 =====
document.getElementById('prevWeek').onclick = () => { state.weekStart = addDays(state.weekStart, -7); renderWeekSelect(); renderSchedule(); };
document.getElementById('nextWeek').onclick = () => { state.weekStart = addDays(state.weekStart, 7); renderWeekSelect(); renderSchedule(); };
document.getElementById('todayBtn').onclick = () => { state.weekStart = getMondayOf(new Date()); renderWeekSelect(); renderSchedule(); };
document.getElementById('weekSelect').onclick = () => {
  const wp = document.getElementById('weekPicker');
  if (fpWeek) fpWeek.open();
  else if (wp.showPicker) wp.showPicker();
  else wp.focus();
};

// ===== 서버 동기화 =====
document.getElementById('loadFromServerBtn').onclick = async () => {
  if (!API.enabled()) { alert('서버 연동이 비활성화되어 있습니다.'); return; }
  if (!confirm('서버(구글 시트)의 데이터로 현재 데이터를 덮어쓰시겠습니까?\n(서버가 비어있으면 로컬 데이터가 모두 사라집니다)')) return;
  await loadFromServer({ force: true });
  alert('서버에서 불러왔습니다.');
};

document.getElementById('changeLogBtn').onclick = async () => {
  if (!API.enabled()) { alert('서버 연동이 꺼져 있어 변경 기록을 볼 수 없습니다.'); return; }
  const body = document.getElementById('changeLogBody');
  body.innerHTML = '<p style="color:#888; font-size:13px;">불러오는 중…</p>';
  showModal('changeLogModal');
  try {
    const logs = await API.logs();
    if (logs && logs.error) {
      body.innerHTML = `<p style="color:#dc2626; font-size:13px;">서버 오류: ${escapeHtml(logs.error)}<br>서버 코드가 최신인지 확인하세요.</p>`;
      return;
    }
    if (!Array.isArray(logs) || !logs.length) {
      body.innerHTML = '<p style="color:#888; font-size:13px;">아직 기록이 없습니다.</p>';
      return;
    }
    body.innerHTML = logs.map(l => `
      <div class="log-item">
        <div class="log-head">
          <span class="log-badge">${escapeHtml(l.action)}</span>
          <span class="log-ts">${escapeHtml(l.ts)}</span>
        </div>
        <div class="log-summary">${escapeHtml(l.summary)}</div>
      </div>`).join('');
  } catch (e) {
    body.innerHTML = `<p style="color:#dc2626; font-size:13px;">불러오기 실패: ${escapeHtml(e.message)}</p>`;
  }
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

async function loadFromServer({ force = false, includeSettings = false } = {}) {
  try {
    const data = await API.loadAll();
    if (Array.isArray(data.reservations)) {
      data.reservations = data.reservations.map(r => ({
        ...r,
        date: normalizeDateStr(r.date),
        period: String(r.period),
      }));
    }
    if (Array.isArray(data.reservations)) {
      if (force) {
        state.reservations = data.reservations;
      } else {
        // 자동 불러오기: 서버에 아직 없는 로컬 전용 예약은 보존하되,
        // 서버에 같은 자리(방·날짜·교시) 예약이 이미 있으면 로컬 전용 건은 버림 (유령 중복 방지)
        const serverIds = new Set(data.reservations.map(r => r.id));
        const serverSlots = new Set(data.reservations.map(r => `${r.room}|${r.date}|${r.period}`));
        const localOnly = state.reservations.filter(r =>
          !serverIds.has(r.id) && !serverSlots.has(`${r.room}|${r.date}|${r.period}`)
        );
        state.reservations = [...data.reservations, ...localOnly];
      }
    }
    // 방 목록·정규시간표·기간정규시간·학교휴일은 force(명시적 불러오기) 또는 사용자 모드 자동갱신일 때만 덮어씀
    if (force || includeSettings) {
      if (Array.isArray(data.rooms) && data.rooms.length > 0) state.rooms = data.rooms;
      if (Array.isArray(data.schedule)) state.schedule = data.schedule;
      // 아직 서버로 못 보낸 기간정규시간 편집이 있으면 자동갱신으로 덮지 않음 (명시적 불러오기는 예외)
      if (Array.isArray(data.dateRules) && (force || !_pendingDateRuleOps.length)) {
        state.dateRules = data.dateRules.map(r => ({
          ...r,
          periods: Array.isArray(r.periods) ? r.periods : JSON.parse(r.periods || '[]'),
          daysOfWeek: Array.isArray(r.daysOfWeek) ? r.daysOfWeek : JSON.parse(r.daysOfWeek || '[]'),
        }));
      }
      if (Array.isArray(data.holidays)) state.customHolidays = data.holidays;
    }
    saveState();
    render();
  } catch (e) { console.warn('loadFromServer failed', e); }
}

// ===== 설정 모달 =====
// 서버 코드(Code.gs)는 앱에 사본을 두지 않음 — 저장소의 apps-script/Code.gs 를 직접 사용
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
  updateNoServerBanner();
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
    state.autoLoadTimer = setInterval(() => {
      if (state.isAdmin) return;  // 관리자 모드에서는 편집 중 화면이 바뀌지 않도록 자동 갱신 정지
      loadFromServer({ includeSettings: true });
    }, sec * 1000);
  }
}

// ===== 모달 헬퍼 =====
function showModal(id) { document.getElementById(id).hidden = false; }
function closeAllModals() {
  // 기간정규시간 모달을 닫을 때 아직 안 보낸 변경이 있으면 즉시 전송 (버튼 없이 자동 저장)
  if (typeof _pendingDateRuleOps !== 'undefined' && _pendingDateRuleOps.length) flushDateRules();
  document.querySelectorAll('.modal-backdrop').forEach(m => m.hidden = true);
}
document.querySelectorAll('[data-close]').forEach(b => b.onclick = closeAllModals);
document.querySelectorAll('.modal-backdrop').forEach(m => {
  m.addEventListener('click', (e) => { if (e.target === m) closeAllModals(); });
});

// ===== flatpickr 초기화 =====
// CDN 로드 실패(오프라인/차단) 시에도 앱이 뜨도록 방어. 실패하면 일반 날짜 입력창으로 대체.
let fpStart = null, fpEnd = null, fpHolStart = null, fpHolEnd = null, fpWeek = null;
if (window.flatpickr) {
  fpStart = flatpickr('#drStart', { locale: 'ko', dateFormat: 'Y-m-d', disableMobile: true });
  fpEnd   = flatpickr('#drEnd',   { locale: 'ko', dateFormat: 'Y-m-d', disableMobile: true });
  fpHolStart = flatpickr('#holStart', { locale: 'ko', dateFormat: 'Y-m-d', disableMobile: true });
  fpHolEnd   = flatpickr('#holEnd',   { locale: 'ko', dateFormat: 'Y-m-d', disableMobile: true });
  fpWeek = flatpickr('#weekPicker', {
    locale: 'ko', dateFormat: 'Y-m-d', disableMobile: true,
    positionElement: document.getElementById('weekSelect'),  // 숨겨둔 input이 아니라 실제 버튼 위치 기준으로 팝업 표시
    onChange: (selectedDates) => {
      if (!selectedDates.length) return;
      state.weekStart = getMondayOf(selectedDates[0]);
      renderWeekSelect();
      renderSchedule();
    },
  });
} else {
  document.getElementById('drStart').removeAttribute('readonly');
  document.getElementById('drEnd').removeAttribute('readonly');
  document.getElementById('holStart').removeAttribute('readonly');
  document.getElementById('holEnd').removeAttribute('readonly');
  const wp = document.getElementById('weekPicker');
  wp.type = 'date';
  wp.style.display = '';
  wp.onchange = () => { if (wp.value) { state.weekStart = getMondayOf(new Date(wp.value)); renderWeekSelect(); renderSchedule(); } };
}

// ===== 기간 정규시간 =====
let _editingDateRuleId = null;
// 규칙 변경(생성·수정·삭제)은 화면에 바로 반영하되, 서버 전송은 자동으로 묶는다.
// 편집이 1.5초 멈추거나 모달을 닫으면 그때까지 쌓인 것을 한 요청으로 보냄.
// (건마다 즉시 전송하면 편성철에 요청이 수십 개 몰려 잠금 타임아웃 → 저장 실패)
let _pendingDateRuleOps = [];
let _dateRuleFlushTimer = null;
let _dateRuleFlushing = false;
let _dateRuleFlushAgain = false;

function drOpId(op) { return op.type === 'delete' ? op.id : op.rule.id; }

function stageDateRuleOp(op) {
  const id = drOpId(op);
  const hadLocalCreate = _pendingDateRuleOps.some(o => o.type === 'create' && drOpId(o) === id);
  _pendingDateRuleOps = _pendingDateRuleOps.filter(o => drOpId(o) !== id);
  if (op.type === 'delete' && hadLocalCreate) {
    // 서버에 보내기 전에 만든 규칙을 다시 삭제 → 보낼 것 없음
  } else if (op.type === 'update' && hadLocalCreate) {
    _pendingDateRuleOps.push({ ...op, type: 'create' });   // 아직 서버엔 없으니 create 유지
  } else {
    _pendingDateRuleOps.push(op);
  }
  scheduleDateRuleFlush();
}

function setDateRuleStatus(kind, text) {
  const el = document.getElementById('dateRuleStatus');
  if (!el) return;
  el.className = 'dr-status ' + (kind || '');
  el.textContent = text || '';
  el.hidden = !text;
}

function scheduleDateRuleFlush(delay = 1500, keepStatus = false) {
  clearTimeout(_dateRuleFlushTimer);
  if (!_pendingDateRuleOps.length) return;
  if (!keepStatus) setDateRuleStatus('saving', '저장 대기 중…');
  _dateRuleFlushTimer = setTimeout(flushDateRules, delay);
}

async function flushDateRules() {
  clearTimeout(_dateRuleFlushTimer);
  if (_dateRuleFlushing) { _dateRuleFlushAgain = true; return; }
  if (!_pendingDateRuleOps.length) { setDateRuleStatus('', ''); return; }
  if (!(API.enabled() && localStorage.getItem('autoSave') === '1')) {
    _pendingDateRuleOps = [];   // 서버 미연결 — 로컬에만 반영
    setDateRuleStatus('', '');
    return;
  }
  _dateRuleFlushing = true;
  const sent = _pendingDateRuleOps.slice();   // 이번에 보낼 op들 (전송 중 새로 쌓이는 건 다음 회차)
  const payload = sent.map(o => o.type === 'delete' ? { type: 'delete', id: o.id } : { type: o.type, rule: o.rule });
  setDateRuleStatus('saving', '저장 중…');
  try {
    const res = await API.applyDateRules(payload);
    const results = res.results || [];
    const okIds = new Set(results.filter(r => r.ok).map(r => r.id));
    sent.forEach(o => {
      if (o.shadowLog && okIds.has(drOpId(o))) API.log('라벨가림', o.shadowLog).catch(e => console.warn(e));
    });
    const sentSet = new Set(sent);
    _pendingDateRuleOps = _pendingDateRuleOps.filter(o => !sentSet.has(o));
    const failed = results.filter(r => !r.ok);
    if (failed.length) {
      await loadFromServer({ force: true });   // 일부 실패 → 화면을 서버 기준으로
      renderDateRuleList();
      setDateRuleStatus('failed', `${failed.length}건 저장 실패 — 화면을 서버 기준으로 맞췄습니다`);
      alert(`기간 정규시간 ${results.length}건 중 ${failed.length}건을 저장하지 못했습니다.\n` +
        failed.map(f => `· ${f.error || '알 수 없는 오류'}`).join('\n') +
        '\n\n화면은 서버의 현재 상태로 맞췄습니다. 필요하면 다시 편집해 주세요.');
    } else if (_pendingDateRuleOps.length) {
      scheduleDateRuleFlush(400);   // 전송 중 쌓인 게 있으면 이어서
    } else {
      setDateRuleStatus('saved', '저장됨');
      setTimeout(() => { if (!_pendingDateRuleOps.length && !_dateRuleFlushing) setDateRuleStatus('', ''); }, 2500);
    }
  } catch (e) {
    // 아무것도 저장 안 됨(네트워크·잠금). op는 그대로 두고 자동 재시도.
    console.warn(e);
    setDateRuleStatus('failed', '저장 실패 — 잠시 후 자동 재시도');
    scheduleDateRuleFlush(6000, true);
  } finally {
    _dateRuleFlushing = false;
    if (_dateRuleFlushAgain) { _dateRuleFlushAgain = false; scheduleDateRuleFlush(300); }
  }
}

// 탭/브라우저를 닫는 순간 아직 안 보낸 기간정규시간 변경을 마지막으로 한 번 전송.
// sendBeacon 은 페이지가 종료돼도 브라우저가 전송을 보장한다(응답은 못 받음).
window.addEventListener('beforeunload', () => {
  if (!_pendingDateRuleOps.length || _dateRuleFlushing) return;   // 전송 중이면 그쪽에 맡김(중복 방지)
  if (!(API.enabled() && localStorage.getItem('autoSave') === '1')) return;
  const payload = _pendingDateRuleOps.map(o => o.type === 'delete'
    ? { type: 'delete', id: o.id }
    : { type: o.type, rule: o.rule });
  try {
    if (navigator.sendBeacon(API.url(), JSON.stringify({ action: 'applyDateRules', ops: payload }))) {
      _pendingDateRuleOps = [];                 // 보냈으니 큐 비움 — 페이지가 안 죽어도 debounce가 중복 전송 안 하게
      clearTimeout(_dateRuleFlushTimer);
    }
  } catch (e) { /* 종료 중이라 더 할 수 있는 게 없음 */ }
});

document.getElementById('dateRuleBtn').onclick = () => {
  const sel = document.getElementById('drRoom');
  sel.innerHTML = state.rooms.map(r => `<option value="${escapeHtml(r)}">${escapeHtml(r)}</option>`).join('');
  document.getElementById('drPeriods').innerHTML = PERIODS.map(p => `
    <label class="period-check-item">
      <input type="checkbox" value="${p.key}"> ${p.label}
    </label>`).join('');
  // 요일은 기본 전체 체크 — 특정 요일만 쓰려면 나머지를 체크 해제
  document.getElementById('drDays').innerHTML = DAYS.map(d => `
    <label class="period-check-item">
      <input type="checkbox" value="${d}" checked> ${d}
    </label>`).join('');
  const today = new Date().toISOString().slice(0, 10);
  if (fpStart) fpStart.setDate(today, true); else document.getElementById('drStart').value = today;
  if (fpEnd)   fpEnd.setDate(today, true);   else document.getElementById('drEnd').value = today;
  document.getElementById('drLabel').value = '';
  document.getElementById('drBlock').checked = false;
  _editingDateRuleId = null;
  document.getElementById('saveDateRuleBtn').textContent = '추가';
  setDateRuleStatus('', '');
  if (_pendingDateRuleOps.length) scheduleDateRuleFlush(400);   // 직전에 못 보낸 게 있으면 이어서
  sel.onchange = renderDateRuleList;  // 특별실 바꾸면 목록도 그 특별실 것만 다시 표시
  renderDateRuleList();
  showModal('dateRuleModal');
};

function editDateRule(id) {
  const r = state.dateRules.find(x => x.id === id);
  if (!r) return;
  document.getElementById('drRoom').value = r.room;
  if (fpStart) fpStart.setDate(r.startDate, true); else document.getElementById('drStart').value = r.startDate;
  if (fpEnd)   fpEnd.setDate(r.endDate, true);     else document.getElementById('drEnd').value = r.endDate;
  document.querySelectorAll('#drDays input').forEach(el => { el.checked = r.daysOfWeek.includes(el.value); });
  document.querySelectorAll('#drPeriods input').forEach(el => { el.checked = r.periods.includes(el.value); });
  document.getElementById('drBlock').checked = !!r.blocked;
  document.getElementById('drLabel').value = r.label;
  _editingDateRuleId = id;
  document.getElementById('saveDateRuleBtn').textContent = '수정 완료';
  renderDateRuleList();
}

function renderDateRuleList() {
  const list = document.getElementById('dateRuleList');
  const room = document.getElementById('drRoom').value;
  const rules = state.dateRules.filter(r => r.room === room);
  if (!rules.length) {
    list.innerHTML = `<p style="margin:16px 0 8px; font-size:13px; color:#888;">${escapeHtml(room)}에 등록된 기간 규칙이 없습니다.</p>`;
    return;
  }
  list.innerHTML = `
    <p style="margin:16px 0 8px; font-weight:600; font-size:13px; color:#555;">${escapeHtml(room)}의 기간 규칙 (${rules.length}건)</p>
    ${rules.map(r => `
      <div class="date-rule-item">
        <div>
          <strong>${escapeHtml(r.room)}</strong> · ${r.startDate} ~ ${r.endDate} · 매주 ${(r.daysOfWeek && r.daysOfWeek.length ? r.daysOfWeek.join(',') : '전체')}요일${r.blocked ? ' · <span style="color:#dc2626;">🚫 예약금지</span>' : ''}<br>
          <span style="font-size:12px; color:#555;">${r.periods.map(k => PERIODS.find(p=>p.key===k)?.label||k).join(', ')} · ${escapeHtml(r.label)}</span>
        </div>
        <div style="display:flex; gap:6px;">
          <button class="btn btn-gray" style="font-size:12px; padding:4px 10px;" onclick="editDateRule('${r.id}')">수정</button>
          <button class="btn btn-red" style="font-size:12px; padding:4px 10px;" onclick="deleteDateRule('${r.id}')">삭제</button>
        </div>
      </div>`).join('')}`;
}

function deleteDateRule(id) {
  if (!state.dateRules.some(r => r.id === id)) return;
  state.dateRules = state.dateRules.filter(r => r.id !== id);
  if (_editingDateRuleId === id) {
    _editingDateRuleId = null;
    document.getElementById('saveDateRuleBtn').textContent = '추가';
  }
  saveState();
  render();
  renderDateRuleList();
  stageDateRuleOp({ type: 'delete', id });   // 자동으로 묶여서 전송됨
}

// 요일이 학교 근무일(월~금) 밖이면 null — 주말 예약은 애초에 만들어지지 않지만 방어적으로 처리
function dateToDayName(dateKey) {
  const dow = new Date(dateKey + 'T00:00:00').getDay(); // 0=일 ~ 6=토
  const idx = dow - 1; // 월=0
  return (idx >= 0 && idx <= 4) ? DAYS[idx] : null;
}

document.getElementById('saveDateRuleBtn').onclick = async () => {
  const room = document.getElementById('drRoom').value;
  const startDate = document.getElementById('drStart').value;
  const endDate = document.getElementById('drEnd').value;
  const blocked = document.getElementById('drBlock').checked;
  const label = document.getElementById('drLabel').value.trim();
  const periods = [...document.querySelectorAll('#drPeriods input:checked')].map(el => el.value);
  const daysOfWeek = [...document.querySelectorAll('#drDays input:checked')].map(el => el.value);
  if (!startDate || !endDate) { alert('기간을 입력하세요.'); return; }
  if (startDate > endDate) { alert('시작일이 종료일보다 늦습니다.'); return; }
  if (!periods.length) { alert('교시를 하나 이상 선택하세요.'); return; }
  if (!daysOfWeek.length) { alert('요일을 하나 이상 선택하세요.'); return; }
  if (!label) { alert('라벨을 입력하세요.'); return; }

  // 이번 규칙과 겹치는 기존 기간규칙 (같은 특별실 · 교시 겹침 · 날짜 겹침 · 요일 겹침)
  const overlap = state.dateRules.filter(r =>
    r.id !== _editingDateRuleId && r.room === room &&
    (r.periods || []).some(p => periods.includes(p)) &&
    !(r.endDate < startDate || r.startDate > endDate) &&
    (r.daysOfWeek || []).some(d => daysOfWeek.includes(d))
  );
  const overlapBlocked = overlap.filter(r => r.blocked);
  const overlapLabels = overlap.filter(r => !r.blocked);
  const uniqLabels = arr => '"' + [...new Set(arr.map(r => r.label))].join('", "') + '"';
  let shadowed = [];  // 이번 저장으로 화면에서 가려지는 기존 라벨들 (로그용)

  if (blocked) {
    // 예약금지로 걸려는 기간·교시에 이미 예약이 있으면: 자동취소하지 않고 목록만 보여준 뒤 중단
    const conflicts = state.reservations.filter(r =>
      r.room === room && periods.includes(r.period) &&
      r.date >= startDate && r.date <= endDate &&
      daysOfWeek.includes(dateToDayName(r.date))
    );
    if (conflicts.length) {
      const list = conflicts
        .sort((a, b) => a.date.localeCompare(b.date))
        .map(r => `- ${r.date} ${periodLabel(r.period)} / ${r.name}${r.classroom ? ' (' + r.classroom + ')' : ''}${r.purpose ? ' · ' + r.purpose : ''}`)
        .join('\n');
      alert(`이 기간·교시에 예약이 ${conflicts.length}건 있어 예약금지로 설정할 수 없습니다.\n\n예약하신 분께 직접 요청해 아래 예약을 취소한 뒤 다시 시도해 주세요:\n\n${list}`);
      return;
    }
    if (overlapBlocked.length && !confirm('이 기간·교시 중 일부가 이미 예약금지로 설정되어 있습니다.\n중복으로 규칙을 추가하시겠습니까?')) {
      return;
    }
    if (overlapLabels.length) {
      if (!confirm(`이 기간·교시에 이미 정규시간이 있습니다: ${uniqLabels(overlapLabels)}\n예약금지로 설정하면 이 라벨은 화면에서 가려지고 예약금지 표시가 대신 나옵니다.\n계속하시겠습니까?`)) return;
      shadowed = overlapLabels;
    }
  } else {
    if (overlapBlocked.length && !confirm('이 기간·교시 중 일부는 이미 예약금지 상태입니다.\n지금 추가하는 라벨은 예약금지가 풀리기 전까지 화면에 표시되지 않습니다.\n계속하시겠습니까?')) {
      return;
    }
    if (overlapLabels.length) {
      if (!confirm(`이 기간·교시에 이미 정규시간이 있습니다: ${uniqLabels(overlapLabels)}\n새 라벨("${label}")을 추가하면 화면엔 이번 것이 표시되고 기존 것은 가려집니다.\n계속하시겠습니까?`)) return;
      shadowed = overlapLabels;
    }
  }

  const editingId = _editingDateRuleId;
  const rule = { id: editingId || crypto.randomUUID(), room, startDate, endDate, periods, daysOfWeek, label, blocked };

  let shadowLog = null;
  if (shadowed.length) {
    const pShort = k => PERIODS.find(p => p.key === k)?.label || k;
    const names = [...new Set(shadowed.map(r => r.label))].join('", "');
    const how = blocked ? '예약금지로 가려짐' : `"${label}"에 가려짐`;
    shadowLog = `${room} [${daysOfWeek.join(',')}] ${periods.map(pShort).join('·')} · "${names}"이(가) ${how}`;
  }

  const prevIdx = editingId ? state.dateRules.findIndex(r => r.id === editingId) : -1;
  if (editingId) {
    if (prevIdx !== -1) state.dateRules[prevIdx] = rule;
  } else {
    state.dateRules.push(rule);
  }
  _editingDateRuleId = null;
  document.getElementById('saveDateRuleBtn').textContent = '추가';
  saveState();
  render();
  renderDateRuleList();

  // 화면엔 이미 반영됨. 서버 전송은 stageDateRuleOp이 자동으로 묶어서(1.5초 후 or 모달 닫을 때) 보냄
  stageDateRuleOp(editingId ? { type: 'update', rule, shadowLog } : { type: 'create', rule, shadowLog });
};

// ===== 학교자체 휴일 관리 (관리자) =====
let _editingHolidayId = null;

document.getElementById('holidayBtn').onclick = () => {
  const today = new Date().toISOString().slice(0, 10);
  if (fpHolStart) fpHolStart.setDate(today, true); else document.getElementById('holStart').value = today;
  if (fpHolEnd)   fpHolEnd.setDate(today, true);   else document.getElementById('holEnd').value = today;
  document.getElementById('holLabel').value = '';
  _editingHolidayId = null;
  document.getElementById('saveHolidayBtn').textContent = '추가';
  renderHolidayList();
  showModal('holidayModal');
};

function editHoliday(id) {
  const h = state.customHolidays.find(x => x.id === id);
  if (!h) return;
  if (fpHolStart) fpHolStart.setDate(h.startDate, true); else document.getElementById('holStart').value = h.startDate;
  if (fpHolEnd)   fpHolEnd.setDate(h.endDate, true);     else document.getElementById('holEnd').value = h.endDate;
  document.getElementById('holLabel').value = h.label;
  _editingHolidayId = id;
  document.getElementById('saveHolidayBtn').textContent = '수정 완료';
}

function renderHolidayList() {
  const list = document.getElementById('holidayList');
  if (!state.customHolidays.length) { list.innerHTML = '<p style="font-size:13px; color:#888;">등록된 학교자체 휴일이 없습니다.</p>'; return; }
  const sorted = [...state.customHolidays].sort((a, b) => a.startDate.localeCompare(b.startDate));
  list.innerHTML = sorted.map(h => `
    <div class="date-rule-item">
      <div>${h.startDate}${h.startDate !== h.endDate ? ' ~ ' + h.endDate : ''} · ${escapeHtml(h.label)}</div>
      <div style="display:flex; gap:6px;">
        <button class="btn btn-gray" style="font-size:12px; padding:4px 10px;" onclick="editHoliday('${h.id}')">수정</button>
        <button class="btn btn-red" style="font-size:12px; padding:4px 10px;" onclick="deleteHoliday('${h.id}')">삭제</button>
      </div>
    </div>`).join('');
}

async function deleteHoliday(id) {
  const prev = state.customHolidays.find(h => h.id === id);
  if (!prev) return;
  state.customHolidays = state.customHolidays.filter(h => h.id !== id);
  if (_editingHolidayId === id) {
    _editingHolidayId = null;
    document.getElementById('saveHolidayBtn').textContent = '추가';
  }
  saveState();
  render();
  renderHolidayList();
  if (API.enabled() && localStorage.getItem('autoSave') === '1') {
    try {
      const res = await API.deleteHoliday(id);
      if (!res || !res.ok) throw new Error((res && res.error) || 'delete failed');
    } catch (e) {
      console.warn(e);
      state.customHolidays.push(prev);   // 서버 반영 실패 → 화면 되돌림
      saveState();
      render();
      renderHolidayList();
      alert('학교휴일 삭제를 서버에 반영하지 못했습니다. 잠시 후 다시 시도해 주세요.');
    }
  }
}

document.getElementById('saveHolidayBtn').onclick = async () => {
  const startDate = document.getElementById('holStart').value;
  const endDate = document.getElementById('holEnd').value;
  const label = document.getElementById('holLabel').value.trim();
  if (!startDate || !endDate) { alert('기간을 입력하세요.'); return; }
  if (startDate > endDate) { alert('시작일이 종료일보다 늦습니다.'); return; }
  if (!label) { alert('휴일 이름을 입력하세요. (예: 방학, 재량휴업일)'); return; }

  const editingId = _editingHolidayId;
  const hol = { id: editingId || crypto.randomUUID(), startDate, endDate, label };
  const prevIdx = editingId ? state.customHolidays.findIndex(h => h.id === editingId) : -1;
  const prevSnapshot = prevIdx !== -1 ? { ...state.customHolidays[prevIdx] } : null;

  if (editingId) {
    if (prevIdx !== -1) state.customHolidays[prevIdx] = hol;
  } else {
    state.customHolidays.push(hol);
  }
  _editingHolidayId = null;
  document.getElementById('saveHolidayBtn').textContent = '추가';
  saveState();
  render();
  renderHolidayList();
  document.getElementById('holLabel').value = '';

  if (API.enabled() && localStorage.getItem('autoSave') === '1') {
    try {
      const res = editingId ? await API.updateHoliday(hol) : await API.createHoliday(hol);
      if (!res || !res.ok) throw new Error((res && res.error) || 'save failed');
    } catch (e) {
      console.warn(e);
      if (editingId && prevSnapshot) {
        const i = state.customHolidays.findIndex(h => h.id === editingId);
        if (i !== -1) state.customHolidays[i] = prevSnapshot;
      } else {
        state.customHolidays = state.customHolidays.filter(h => h.id !== hol.id);
      }
      saveState();
      render();
      renderHolidayList();
      alert('학교휴일을 서버에 저장하지 못했습니다. 네트워크를 확인하고 다시 시도해 주세요.');
    }
  }
};

// ===== 다중 선택 =====
function updateMultiBar() {
  const n = state.selectedCells.length;
  const nDelete = state.selectedCells.filter(c => c.kind === 'reservation').length;
  const nEmpty = n - nDelete;
  const bar = document.getElementById('multiSelectBar');
  document.getElementById('multiSelectCount').textContent = `${n}개 선택됨`;
  let label;
  if (nDelete && nEmpty) label = `${nDelete}건 삭제 + ${nEmpty}개 예약`;
  else if (nDelete) label = `${nDelete}건 삭제`;
  else label = `${nEmpty}개 예약하기`;
  document.getElementById('multiSelectConfirmBtn').textContent = label;
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

document.getElementById('multiSelectConfirmBtn').onclick = async () => {
  if (state.selectedCells.length === 0) return;

  const toDelete = state.selectedCells.filter(c => c.kind === 'reservation');
  const toEmpty = state.selectedCells.filter(c => c.kind !== 'reservation');

  // 선택한 예약들 일괄 삭제 (관리자/일반 공통 — 예약 삭제엔 비밀번호가 필요 없는 정책)
  if (toDelete.length) {
    const short = k => PERIODS.find(p => p.key === k)?.label || k;
    const rs = toDelete
      .map(c => state.reservations.find(r => r.id === c.reservationId))
      .filter(Boolean)
      .sort((a, b) => (a.date + a.period).localeCompare(b.date + b.period));
    const shown = rs.slice(0, 15)
      .map(r => `- ${r.room} ${r.date} ${short(r.period)} / ${r.name}${r.classroom ? ' (' + r.classroom + ')' : ''}`)
      .join('\n');
    const more = rs.length > 15 ? `\n… 외 ${rs.length - 15}건` : '';
    if (!confirm(`아래 예약 ${toDelete.length}건을 삭제하시겠습니까? 되돌릴 수 없습니다.\n\n${shown}${more}`)) return;
    state.reservations = state.reservations.filter(r => !toDelete.some(c => c.reservationId === r.id));
    saveState();
    if (API.enabled() && localStorage.getItem('autoSave') === '1') {
      for (const c of toDelete) {
        try { await API.deleteReservation(c.reservationId); } catch (e) { console.warn(e); }
      }
    }
    // 처리한 삭제 대상은 선택에서 제거 (다시 확인 눌러도 중복 삭제 시도 안 하도록)
    state.selectedCells = state.selectedCells.filter(c => c.kind !== 'reservation');
  }

  if (toEmpty.length) {
    // 빈 칸 일괄 예약 (관리자·일반 공통)
    _editingReservationId = null;
    document.getElementById('reservationModalTitle').textContent = '예약하기';
    state.pendingCell = null;
    state.pendingBatch = toEmpty.map(c => ({ room: c.room, date: c.date, period: c.period }));
    prefillNameAndClassroom();
    document.getElementById('resMeetingMode').checked = false;
    document.getElementById('resPurpose').value = '';
    updateMeetingModeUI();
    showModal('reservationModal');
    return;
  }

  exitMultiSelect();
};

// ===== 초기화 =====
function render() {
  renderTabs();
  const isMonth = state.viewMode === 'month';
  document.querySelector('.date-nav').style.display = isMonth ? 'none' : 'flex';
  document.getElementById('roomTitle').style.display = isMonth ? 'none' : '';
  document.getElementById('scheduleTable').style.display = isMonth ? 'none' : '';
  document.getElementById('monthView').style.display = isMonth ? 'block' : 'none';
  document.getElementById('monthViewBtn').textContent = isMonth ? '주간 보기' : '월별 보기';
  if (isMonth) {
    renderMonthView();
  } else {
    renderWeekSelect();
    renderSchedule();
  }
}

// ===== 월별 보기 =====
function renderMonthView() {
  const y = state.monthCursor.getFullYear();
  const m = state.monthCursor.getMonth();
  document.getElementById('monthLabel').textContent = `${y}년 ${m + 1}월`;

  const firstOfMonth = new Date(y, m, 1);
  const lastOfMonth = new Date(y, m + 1, 0);
  const gridStart = getMondayOf(firstOfMonth);
  const gridEnd = getMondayOf(lastOfMonth);
  const weeksNeeded = Math.round((gridEnd - gridStart) / (7 * 86400000)) + 1;

  const table = document.getElementById('monthTable');
  table.innerHTML = `<thead><tr>${DAYS.map(d => `<th>${d}</th>`).join('')}</tr></thead>`;
  const tbody = document.createElement('tbody');

  for (let w = 0; w < weeksNeeded; w++) {
    const tr = document.createElement('tr');
    for (let d = 0; d < 5; d++) {  // 주말은 항상 비어있어서 아예 뺌 — 월~금만
      const day = addDays(gridStart, w * 7 + d);
      const dateKey = fmtDateKey(day);
      const inMonth = day.getMonth() === m;
      const td = document.createElement('td');
      td.innerHTML = `<span class="day-num">${day.getDate()}</span>`;
      if (!inMonth) {
        td.classList.add('outside');
      } else {
        const holiday = getHolidayLabel(dateKey);
        if (holiday) {
          td.classList.add('holiday');
          td.innerHTML += `<span class="day-holiday">${escapeHtml(holiday)}</span>`;
        }

        // 그날 예약을 교시 순서대로 '교시 학년반(또는 회의/행사)' 그대로 글로 나열 — 해석 필요 없이 읽으면 끝
        const dayRes = state.reservations
          .filter(r => r.room === state.currentRoom && r.date === dateKey)
          .sort((a, b) => PERIODS.findIndex(p => p.key === a.period) - PERIODS.findIndex(p => p.key === b.period));
        const MAX_SHOW = 5;
        dayRes.slice(0, MAX_SHOW).forEach(r => {
          const pLabel = PERIODS.find(p => p.key === r.period)?.label || r.period;
          const who = r.classroom || r.name;
          const chipClass = 'day-res-chip' + (r.classroom === '회의/행사' ? ' meeting' : '');
          td.innerHTML += `<span class="${chipClass}">${escapeHtml(pLabel)} ${escapeHtml(who)}</span>`;
        });
        if (dayRes.length > MAX_SHOW) {
          td.innerHTML += `<span class="day-res-more">+${dayRes.length - MAX_SHOW}건 더</span>`;
        }

        td.classList.add('day-cell');
        td.onclick = () => {
          state.weekStart = getMondayOf(day);
          state.viewMode = 'week';
          render();
        };
      }
      tr.appendChild(td);
    }
    tbody.appendChild(tr);
  }
  table.appendChild(tbody);
}

document.getElementById('monthViewBtn').onclick = () => {
  state.viewMode = state.viewMode === 'month' ? 'week' : 'month';
  if (state.viewMode === 'month') state.monthCursor = new Date(state.weekStart);
  render();
};
document.getElementById('prevMonth').onclick = () => {
  state.monthCursor = new Date(state.monthCursor.getFullYear(), state.monthCursor.getMonth() - 1, 1);
  renderMonthView();
};
document.getElementById('nextMonth').onclick = () => {
  state.monthCursor = new Date(state.monthCursor.getFullYear(), state.monthCursor.getMonth() + 1, 1);
  renderMonthView();
};
document.getElementById('monthTodayBtn').onclick = () => {
  state.monthCursor = new Date();
  renderMonthView();
};

// config.js 의 apiUrl 은 Vercel 빌드 때 환경변수(APP_CONFIG_API_URL)로 주입됨.
// 주입 안 됐거나('__API_URL__' 그대로) 빈 값이면 = 서버 미설정 → 서버 연동 없이 로컬 전용으로 동작.
// (저장소를 포크한 사이트가 원본 서버·시트에 붙는 것을 방지)
function configApiUrl() {
  const u = (typeof APP_CONFIG !== 'undefined' && APP_CONFIG.apiUrl) || '';
  return u.indexOf('__API_URL__') === -1 ? u : '';
}

// config.js 값을 localStorage에 적용. config version이 바뀌면 모든 브라우저에 다시 적용.
// (같은 version 안에서는 사용자가 설정창에서 바꾼 값이 유지됨)
function seedConfigDefaults() {
  if (typeof APP_CONFIG === 'undefined') return;
  if (localStorage.getItem('configVersion') === String(APP_CONFIG.version)) return;
  const url = configApiUrl();
  localStorage.setItem('apiUrl', url);
  localStorage.setItem('serverEnabled', (url && APP_CONFIG.serverEnabled) ? '1' : '0');
  localStorage.setItem('autoSave', APP_CONFIG.autoSave ? '1' : '0');
  localStorage.setItem('autoLoad', APP_CONFIG.autoLoad ? '1' : '0');
  localStorage.setItem('autoLoadInterval', String(APP_CONFIG.autoLoadInterval));
  localStorage.setItem('configVersion', String(APP_CONFIG.version));
}

function updateNoServerBanner() {
  const banner = document.getElementById('noServerBanner');
  if (banner) banner.hidden = !!(API.enabled() && API.url());
}

function init() {
  seedConfigDefaults();
  updateNoServerBanner();
  if (!state.currentRoom) state.currentRoom = state.rooms[0] || null;
  if (state.isAdmin) document.body.classList.add('admin');
  updateAdminBtnLabel();
  render();
  setupAutoLoad();
  if (API.enabled()) loadFromServer({ includeSettings: true });   // 시작 시 공유 시트 상태를 바로 반영
}
init();

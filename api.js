// Apps Script Web App 통신 모듈
const API = {
  url() { return localStorage.getItem('apiUrl') || ''; },
  enabled() { return localStorage.getItem('serverEnabled') === '1'; },

  async _get(action, params = {}) {
    const url = new URL(this.url());
    url.searchParams.set('action', action);
    for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
    const res = await fetch(url.toString());
    return await res.json();
  },

  async _post(action, body) {
    // Apps Script CORS 회피: Content-Type 헤더 생략, body는 JSON 문자열
    const res = await fetch(this.url(), {
      method: 'POST',
      body: JSON.stringify({ action, ...body }),
    });
    return await res.json();
  },

  ping()                   { return this._get('ping'); },
  listReservations()       { return this._get('list'); },
  listSchedule()           { return this._get('schedule'); },
  listRooms()              { return this._get('rooms'); },
  createReservation(r)     { return this._post('create', r); },
  updateReservation(r)     { return this._post('update', r); },
  deleteReservation(id)    { return this._post('delete', { id }); },
  loadAll()                { return this._get('loadAll'); },
  cleanup(adminPw)         { return this._post('cleanup', { adminPw }); },
  checkAdmin(pw)           { return this._post('checkAdmin', { pw }); },
  createDateRule(r)        { return this._post('createDateRule', r); },
  updateDateRule(r)        { return this._post('updateDateRule', r); },
  deleteDateRule(id)       { return this._post('deleteDateRule', { id }); },

  // 기간정규시간 여러 건을 잠금 1회로 저장. ops=[{type:'create'|'update', rule} | {type:'delete', id}]
  // 서버가 op별 결과({results})를 주면 그게 최종 — 재시도 안 함(중복 방지).
  // 아무 결과 없이 실패(네트워크·잠금 시간초과)면 아무것도 안 써졌으므로 1회 재시도.
  async applyDateRules(ops) {
    for (let attempt = 0; attempt < 2; attempt++) {
      let res;
      try {
        res = await this._post('applyDateRules', { ops });
      } catch (e) {
        if (attempt === 0) { await new Promise(r => setTimeout(r, 1500)); continue; }
        throw e;
      }
      if (res && Array.isArray(res.results)) return res;
      if (attempt === 0) { await new Promise(r => setTimeout(r, 1500)); continue; }
      throw new Error((res && res.error) || 'applyDateRules failed');
    }
  },
  addRoom(name)            { return this._post('addRoom', { name }); },
  deleteRoom(name)         { return this._post('deleteRoom', { name }); },
  reorderRooms(order)      { return this._post('reorderRooms', { order }); },
  createHoliday(h)         { return this._post('createHoliday', h); },
  updateHoliday(h)         { return this._post('updateHoliday', h); },
  deleteHoliday(id)        { return this._post('deleteHoliday', { id }); },
  log(kind, summary)       { return this._post('log', { kind, summary }); },
  logs()                   { return this._get('logs'); },
};

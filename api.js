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
  deleteReservation(id, pw){ return this._post('delete', { id, password: pw }); },
  saveAll(data)            { return this._post('saveAll', data); },
  loadAll()                { return this._get('loadAll'); },
  cleanup(adminPw)         { return this._post('cleanup', { adminPw }); },
};

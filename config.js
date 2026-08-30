// ===== 앱 설정 (구글시트 연결) =====
// ▶ 아래 apiUrl 은 "이 사이트가 어느 서버(=어느 구글시트)에 연결되는지"를 정합니다.
//   이 저장소를 Fork 해서 다른 학교용으로 쓸 때는, 자기 Apps Script 를 배포한 뒤
//   아래 apiUrl 을 그 URL(.../exec)로 반드시 교체해야 합니다.
//   안 바꾸면 새 사이트가 원래 학교의 서버·시트에 연결됩니다.
//   교체할 때 version 숫자를 +1, index.html 의 <script src="config.js?v=N"> 의 N 도 +1.
//   자세한 절차는 GUIDE.md 6-5 (신규 구축) / 9장 (인수인계) 참고.
const APP_CONFIG = {
  version: 2,
  apiUrl: 'https://script.google.com/macros/s/AKfycbxYOrmLo9opdrbxXmCsWshDWfhtzDBFyAT2WIFOO-RZHMsMj73fPpgyNH7tbXb8JOY/exec',
  serverEnabled: true,   // 기본 서버 연동 ON
  autoSave: true,        // 자동 저장 ON (예약 생성/삭제/수정이 바로 서버에 반영)
  autoLoad: true,        // 자동 불러오기 ON
  autoLoadInterval: 60,  // 자동 불러오기 주기(초) — 내 입력은 즉시 저장되지만, 남의 입력을 보는 주기라 10분은 너무 길어서 1분으로 단축
};

// ===== 앱 설정 (구글시트 연결) =====
// ▶ 다른 구글시트로 바꿀 때는 아래 apiUrl 을 새 Apps Script URL(.../exec)로 교체하고,
//   version 숫자를 +1 하세요. (version을 올려야 기존 사용자 브라우저에도 새 URL이 적용됩니다)
//   ⚠️ index.html의 <script src="config.js?v=N">의 N도 함께 올려야 합니다.
//      (안 올리면 브라우저가 이 파일을 캐시해서 새 값을 못 받아올 수 있음)
//   자세한 방법은 README의 "인수인계" 참고
const APP_CONFIG = {
  version: 2,
  apiUrl: 'https://script.google.com/macros/s/AKfycbxYOrmLo9opdrbxXmCsWshDWfhtzDBFyAT2WIFOO-RZHMsMj73fPpgyNH7tbXb8JOY/exec',
  serverEnabled: true,   // 기본 서버 연동 ON
  autoSave: true,        // 자동 저장 ON (예약 생성/삭제/수정이 바로 서버에 반영)
  autoLoad: true,        // 자동 불러오기 ON
  autoLoadInterval: 60,  // 자동 불러오기 주기(초) — 내 입력은 즉시 저장되지만, 남의 입력을 보는 주기라 10분은 너무 길어서 1분으로 단축
};

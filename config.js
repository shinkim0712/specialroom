// ===== 앱 설정 (구글시트 연결) =====
// apiUrl 은 "이 사이트가 어느 서버(=어느 구글시트)에 연결되는지"를 정합니다.
//
// 이 값은 저장소에 넣지 않습니다. Vercel 빌드(build.js) 때 환경변수
//   APP_CONFIG_API_URL  의 값이 아래 apiUrl 자리표시자에 주입됩니다.
// 환경변수가 없으면 빈 값이 되고, 앱은 "서버 미연결"(로컬 전용)로 뜹니다.
// → 이 저장소를 Fork 한 사이트가 원본 학교 서버·시트에 붙는 것을 방지합니다.
//
// 설정 방법: Vercel 프로젝트 → Settings → Environment Variables 에 APP_CONFIG_API_URL 등록.
//   임시로 붙여 쓰려면 관리자 모드 → 구글시트 설정에서 주소 입력 (그 브라우저 한정).
// 자세한 절차: GUIDE.md 6-5·6-6 (신규 구축) / 9장 (인수인계).
//
// version 을 올리면 이미 접속한 브라우저에도 새 설정이 다시 적용됩니다.
// (그때 index.html 의 <script src="config.js?v=N"> 의 N 도 함께 +1)
const APP_CONFIG = {
  version: 3,
  apiUrl: '__API_URL__',   // ← Vercel 빌드 때 APP_CONFIG_API_URL 로 치환
  serverEnabled: true,
  autoSave: true,
  autoLoad: true,
  autoLoadInterval: 60,     // 자동 불러오기 주기(초) — 남의 예약 반영 간격
};

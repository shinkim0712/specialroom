// Vercel 빌드 시 실행됨 (package.json / vercel.json 의 build 커맨드).
// config.js 의 '__API_URL__' 자리를 환경변수 APP_CONFIG_API_URL 값으로 치환한다.
//
// 환경변수가 없으면 빈 문자열을 넣고, 앱은 "서버 미연결"(로컬 전용)로 뜬다.
// → 이 저장소를 Fork 해서 자기 Vercel 에 올린 사람이 원본 서버·시트에 붙는 것을 막는다.
//
// 로컬에서 직접 만들려면:  APP_CONFIG_API_URL='https://.../exec' node build.js

const fs = require('fs');
const FILE = 'config.js';
const NEEDLE = "apiUrl: '__API_URL__'";
const url = (process.env.APP_CONFIG_API_URL || '').trim();

let src = fs.readFileSync(FILE, 'utf8');
if (src.indexOf(NEEDLE) === -1) {
  console.log('[build] config.js 에 apiUrl 자리표시자가 없음 — 건너뜀 (이미 주입됨?)');
  process.exit(0);
}
src = src.replace(NEEDLE, "apiUrl: '" + url + "'");
fs.writeFileSync(FILE, src);
console.log(url
  ? '[build] config.js: apiUrl 주입 완료'
  : '[build] APP_CONFIG_API_URL 미설정 — apiUrl 빈 값으로 배포됨 (서버 미연결)');

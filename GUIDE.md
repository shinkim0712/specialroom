# 특별실 예약 관리 웹앱 — 인수인계서

**이 문서 하나로 시스템을 이해하고, 새로 구축하고, 유지보수하고, 다음 담당자에게 넘길 수 있습니다.**

- 최종 갱신: 2026-08-28
- 코드 전체가 필요하면: GitHub `songlim26/specialroom` 저장소를 **Fork** 하거나 **초록색 Code 버튼 → Download ZIP**
- **이 문서 맨 뒤에 부록 A(서버 코드 전문)와 부록 B(설정값·운영 주소)가 있습니다.**

---

## 1. 개요

교직원이 브라우저로 학교 특별실(강당·운동장·시청각실·도서관·컴퓨터실 등)을 예약하는 웹앱입니다. 서버 비용이 없고, 로그인이 없습니다.

| 항목 | 내용 |
|---|---|
| 상태 | 학교에서 실제 운영 중 |
| 접속 주소 | Vercel (`specialroom-eight.vercel.app`) |
| 소스 저장소 | GitHub `songlim26/specialroom` (여기에 반영하면 Vercel이 자동 재배포) |
| 서버 실행 계정 | 처음 배포한 사람의 개인 Google 계정 (→ 9장 인수인계) |

---

## 2. 구조

```
브라우저 ──▶ Vercel (HTML·CSS·JS 파일만 전달)
   │
   └──▶ Google Apps Script (Code.gs) ──▶ Google Sheets (데이터 저장)
```

- **화면**: 순수 HTML·CSS·JS, 빌드 과정 없음
- **서버**: Apps Script 웹앱 1개. 예약 저장·조회, 관리자 비밀번호 확인
- **DB**: 스프레드시트 1개. 탭 하나가 표 하나

브라우저는 데이터를 자기 안에도 저장해서, 서버가 잠깐 죽어도 마지막 화면은 그대로 보입니다.

### 파일 구성 (저장소를 받으면 이런 구조)

| 파일 | 역할 |
|---|---|
| `index.html` | 화면 뼈대와 팝업 |
| `style.css` | 디자인 |
| `config.js` | 구글시트 연결 주소. `apiUrl`만 바꾸면 다른 시트로 연결됨 (내용은 문서 맨 뒤 부록 B) |
| `api.js` | 서버 통신 함수 |
| `app.js` | 클라이언트 전체 로직 |
| `apps-script/Code.gs` | 서버 코드 (전문은 문서 맨 뒤 부록 A) |

> **CSS·JS를 고치면 `index.html`에 있는 그 파일의 `?v=` 번호를 1 올려야** 브라우저가 새 파일을 받습니다.

---

## 3. 데이터 (Google Sheets 탭)

없는 탭은 서버가 처음 실행될 때 자동 생성합니다.

| 탭 | 내용 | 주요 칸 |
|---|---|---|
| `reservations` | 예약 | `room · date · period · name · classroom · purpose` |
| `rooms` | 특별실 목록 | `name · order` |
| `dateRules` | 기간 정규시간 / 예약 금지 | `room · startDate · endDate · periods · daysOfWeek · label · blocked` |
| `holidays` | 학교자체 휴일 (방학 등) | `startDate · endDate · label` |
| `logs` | 변경 기록 (삭제·수정·가림) | `ts · action · summary` |

- `period`: `1`~`8`, `4A`(4교시 저학년), `4E`(4교시 고학년), `5EH`(5교시)
- `blocked`가 `true`면 그 칸은 예약이 막힘
- 법정공휴일은 시트가 아니라 `app.js`의 `KR_HOLIDAYS` 목록에 있음 (현재 2028년까지)
- `logs`는 누가 했는지는 안 남기고 무엇이 없어졌는지만 남김. 3,000줄까지 보관

---

## 4. 동작 핵심

- **모든 변경은 즉시 서버에 저장됨** — 예약·특별실·정규시간·휴일. "저장" 버튼 없음
- 서버가 요청을 하나씩 잠그고 처리 → 같은 시간대 동시 예약은 한 명만 성공
- **자동 새로고침**: 사용자 모드는 60초마다 서버에서 다시 받아옴. 관리자 모드는 편집 중 화면이 안 바뀌게 자동 조회를 멈춤(단, 관리자가 바꾼 건 즉시 서버로 나감)
- **관리자 비밀번호**는 브라우저 코드에 없고 `Code.gs`의 `ADMIN_PW`에만 있음. 서버가 확인
- **`config.js`의 `version` 숫자를 올리면** 이미 접속한 브라우저에도 새 설정이 자동 적용됨 (담당자 인수인계 때 사용)

---

## 5. 기능

### 일반 사용자
- 주간 시간표 / 월별 보기
- 예약: 빈 칸 클릭 → 이름·학급·목적 (이름·학급은 다음에 자동 입력). 수정·삭제에 비밀번호 없음
- 다중 선택: 빈 칸 여러 개 한꺼번에 예약, 예약 여러 개 한꺼번에 삭제(목록 표시)
- 내 예약 보기 (이름 검색)
- 기간 정규시간 편성 / 특별실 추가

### 관리자 (위 기능에 더해)
- 특별실 삭제(탭 우클릭, 딸린 예약·규칙도 함께 삭제) / 순서 변경(탭 길게 눌러 이동)
- 학교휴일 관리
- 변경 기록 조회
- 구글시트 설정 / 서버에서 불러오기

### 예약 금지
- 막으려는 칸에 이미 예약이 있으면, 지우지 않고 목록만 보여준 뒤 멈춤 → 예약자에게 연락해 지운 뒤 다시 시도
- 규칙이 겹치면 예약 금지가 먼저 표시됨. 규칙끼리 덮어써도 안 지워지므로 위엣것을 삭제하면 아래 것이 다시 나옴

---

## 6. 새로 만드는 방법 (다른 학교에서 도입할 때)

준비물: 담당 교사의 Google 계정 1개, GitHub 계정 1개. 모두 무료.
아래 순서대로 하면 약 20~30분 걸립니다.

### 6-1. 코드 받기

1. 브라우저에서 `https://github.com/songlim26/specialroom` 접속
2. 우측 상단 **Fork** 버튼 클릭 → 내 GitHub 계정으로 복사본이 생성됨 (`https://github.com/내아이디/specialroom`)
   - Fork를 쓰면 나중에 원본이 개선될 때 가져오기 쉽습니다.
   - Fork 대신 초록색 **Code → Download ZIP** 으로 파일만 받아도 됩니다.
3. 파일을 수정해야 하므로, Fork한 저장소를 내 컴퓨터로 받거나(`git clone`) GitHub 웹에서 직접 편집합니다.

### 6-2. Google 스프레드시트 만들기 + 시트 ID 확인

1. `https://sheets.new` 접속 (또는 Google Drive → 새로 만들기 → Google 스프레드시트)
2. 이름은 아무거나 (예: `특별실예약DB`). 탭(reservations 등)은 **안 만들어도 됩니다** — 서버가 자동으로 만듭니다.
3. **시트 ID는 주소창에서 확인합니다.** 스프레드시트를 열면 주소가 이렇게 생겼습니다:

   `https://docs.google.com/spreadsheets/d/`**`1AbCdEf... (약 44자)`**`/edit#gid=0`

   `/d/` 와 `/edit` 사이의 긴 문자열이 시트 ID입니다. **그 부분만** 복사해 둡니다.

### 6-3. Apps Script에 서버 코드 넣기

1. 그 스프레드시트 상단 메뉴 → **확장 프로그램 → Apps Script**
2. 새 탭에 코드 편집기가 열립니다. 기본으로 있는 `function myFunction() { }` 를 **전체 선택(Ctrl/Cmd + A) → 삭제**
3. **이 문서 맨 뒤 「부록 A. 서버 코드 전문」의 코드 전체**를 복사해서 붙여넣습니다.
4. 붙여넣은 코드 위쪽에서 이 두 줄을 찾습니다:
   ```js
   const SHEET_ID = '여기에_구글시트_ID_입력';
   const ADMIN_PW = '여기에_관리자_비밀번호_입력';
   ```
   - **`SHEET_ID`** → 6-2에서 복사한 시트 ID로 교체
     예: `const SHEET_ID = '1AbCdEf...';`
     (서버가 어느 스프레드시트에 예약을 저장할지 알려주는 값입니다.)
   - **`ADMIN_PW`** → 관리자 비밀번호를 원하는 값으로 정합니다
     예: `const ADMIN_PW = 'school2026!';`
     - **용도**: 사이트 우측 상단 "관리자 모드" 버튼을 눌렀을 때 입력하는 비밀번호입니다.
     - **무엇을 잠그나**: 예약·수정·삭제는 비밀번호 없이 누구나 합니다. 이 비밀번호는 **특별실 추가/삭제, 학교휴일 관리, 변경 기록 조회, 구글시트 설정** 같은 "관리" 기능만 잠급니다.
     - **안전한가**: 코드에 그대로 적히지만 서버(Google) 안에만 있고, 사용자 브라우저로는 전송되지 않습니다. 검증도 서버에서만 합니다.
5. 편집기 상단 **저장** (디스크 아이콘, 또는 Ctrl/Cmd + S)

### 6-4. Apps Script를 웹앱으로 배포

1. 편집기 우측 상단 **배포 → 새 배포**
2. 왼쪽 톱니바퀴(유형 선택) → **웹 앱** 선택
3. 설정:
   - 설명: 아무거나 (예: `v1`)
   - **실행 계정: 나** (본인 계정)
   - **액세스 권한: 모든 사용자**
4. **배포** 클릭 → 처음이면 권한 승인 창이 뜹니다:
   - "Google에서 확인하지 않은 앱입니다" 경고 → **고급** → **(안전하지 않음) 이동** → 권한 **허용**
   - (본인이 만든 코드라 안전합니다. 이 경고는 개인 스크립트면 항상 나옵니다.)
5. **웹 앱 URL**을 복사합니다: `https://script.google.com/macros/s/AKfy............/exec` 형태
6. **확인**: 그 URL 뒤에 `?action=ping` 을 붙여 브라우저 새 탭으로 엽니다
   → `{"ok":true,"ts":"..."}` 가 보이면 서버 정상입니다.

### 6-5. 코드에 서버 주소 연결 (`config.js`) — 반드시 필요

**이 단계를 건너뛰면 새로 만든 사이트가 원래 학교의 서버에 연결되어 예약이 엉뚱한 곳에 저장됩니다.** 새 사이트를 방금 만든 내 서버(6-4)로 연결하는 단계입니다.

1. 6-1에서 받은 코드의 `config.js` 파일을 엽니다.
2. 아래처럼 수정합니다 (원본 형태는 이 문서 맨 뒤 「부록 B」):
   ```js
   const APP_CONFIG = {
     version: 3,          // 원래 숫자에서 +1 (원래 2였으면 3)
     apiUrl: 'https://script.google.com/macros/s/AKfy............/exec',  // 6-4에서 복사한 웹 앱 URL
     serverEnabled: true,
     autoSave: true,
     autoLoad: true,
     autoLoadInterval: 60,
   };
   ```
3. `index.html` 을 열어 `<script src="config.js?v=2">` 를 찾아 **`config.js?v=3`** 으로 바꿉니다 (위 `version` 숫자와 똑같이 맞춤).
4. 저장하고 GitHub에 반영:
   - GitHub 웹에서 편집했으면 각 파일에서 **Commit changes**
   - 내 컴퓨터에서 편집했으면:
     ```bash
     git add -A && git commit -m "우리 학교 설정" && git push
     ```

### 6-6. Vercel에 배포

1. `https://vercel.com` 접속 → **Sign Up** (또는 로그인). **Continue with GitHub** 로 GitHub 계정 연결을 권장합니다.
2. Vercel 대시보드 → **Add New... → Project**
3. **Import Git Repository** 목록에서 6-1의 `specialroom` 저장소를 찾아 **Import**
   - 목록에 안 보이면 **Adjust GitHub App Permissions** → 그 저장소 접근을 허용한 뒤 새로고침
4. 설정 화면 (대부분 자동으로 잡힘):
   - **Framework Preset**: `Other`
   - **Root Directory**: 그대로 (`./`)
   - **Build and Output Settings**: **건드리지 않음** (빌드 과정이 없는 정적 사이트입니다)
5. **Deploy** 클릭 → 1~2분 뒤 완료
6. 완료 화면 또는 프로젝트 페이지에서 **도메인** 확인: `https://specialroom-xxxx.vercel.app`
   - 더 짧은 주소를 원하면 프로젝트 → **Settings → Domains** 에서 추가·변경
7. 이후 GitHub에 push 하면 Vercel이 **자동으로 다시 배포**합니다. 따로 할 일 없습니다.

### 6-7. 접속 주소 공유 + 초기 데이터 입력

1. 6-6의 Vercel 주소를 교직원에게 공유합니다.
2. 그 주소로 접속 → 우측 상단 **관리자 모드** → 6-3에서 정한 비밀번호 입력
3. 등록:
   - **특별실**: 탭 줄 맨 끝 `+ 특별실 추가`
   - **정규시간표**: `기간 정규시간` 버튼 → 특별실·기간·요일·교시·라벨 입력
   - **학교휴일**: `학교휴일 관리` → 방학·재량휴업일·개교기념일 등
4. 법정공휴일은 자동으로 표시됩니다. 단 `app.js`의 `KR_HOLIDAYS` 목록이 2028년까지라, 2029년이 되기 전에 새 연도 공휴일을 추가하고 `app.js?v=` 번호를 올려 push 해야 합니다.

---

## 7. 고치는 방법

### 화면 (HTML·CSS·JS)
```bash
# 파일 수정 → 고친 파일에 맞춰 index.html의 ?v= 번호 +1
git add -A && git commit -m "수정 내용" && git push
# 1~2분 뒤 Vercel 자동 반영
```
로컬 미리보기: `python3 -m http.server 8123 --directory specialroom` → http://localhost:8123
(서버 기능을 시험할 때는 반드시 테스트 전용 시트로 → 8장)

### 서버 (Code.gs)
1. 서버 코드를 수정합니다. 저장소 파일은 `apps-script/Code.gs`이고 부록 A에도 같은 내용이 실려 있으니, 수정하면 둘 다 갱신합니다(둘이 다르면 파일이 기준).
2. 수정한 전체 코드를 Apps Script 편집기에 붙여넣고, 맨 위 `SHEET_ID` / `ADMIN_PW` 두 줄을 그 환경 값으로 다시 채웁니다 → 저장
3. **배포 → 배포 관리 → 편집(연필 아이콘) → 버전 "새 버전" → 배포**
   - "새 버전"을 안 고르면 코드가 안 바뀝니다 (가장 흔한 실수)
   - "새 배포"를 하면 웹 앱 주소가 바뀌므로 하지 않습니다

---

## 8. 테스트 (기능을 시험할 때)

운영 중인 예약을 실수로 건드리지 않도록, **운영과 완전히 분리된 테스트 전용 시트·Apps Script**를 따로 둡니다 (주소는 문서 맨 뒤 부록 B).

- 브라우저 개발자 콘솔(F12)에서 전환:
  ```js
  localStorage.setItem('apiUrl', '테스트 Apps Script 주소');
  location.reload();
  ```
- 끝나면 운영으로 복귀:
  ```js
  localStorage.removeItem('apiUrl');
  location.reload();
  ```
- 운영 서버에는 조회(`ping`, `loadAll`)만 합니다. 저장·삭제 테스트는 테스트 서버에서만.
- 담당자가 바뀌면 테스트 환경도 새 계정으로 다시 만듭니다 (9장).

---

## 9. 인수인계 (담당자가 바뀔 때)

### 9-1. 왜 필요한가

서버(Apps Script)는 **처음 배포한 사람의 Google 계정 권한으로 실행**됩니다. 그 계정이 전근·퇴직으로 정지·삭제되면 서버가 멈춰 예약이 안 됩니다. 그래서 담당자가 바뀌면 **후임 담당자 계정으로 서버를 처음부터 새로 배포**해야 합니다.

### 9-2. 전임 담당자가 넘겨줄 것

- 이 인수인계서 (부록 A 서버 코드, 부록 B 설정·주소 포함)
- **현재 관리자 비밀번호** (`ADMIN_PW` 값) — 문서에 없으니 따로 알려줌
- GitHub 저장소 위치 (후임이 Fork 하거나 협업자로 추가)
- 기존 예약 데이터를 이어받을지 여부 결정

### 9-3. 절차 — 기존 데이터를 이어받지 않는 경우 (가장 단순)

새로 시작하고 특별실·정규시간표·휴일만 다시 등록하는 방식입니다.

1. **후임 담당자**가 자기 Google Drive에 새 스프레드시트 생성 (6-2 참고, 시트 ID 확인)
2. 확장 프로그램 → Apps Script → 기본 코드 삭제 → **부록 A** 붙여넣기 (6-3 참고)
3. `SHEET_ID` = 새 시트 ID / `ADMIN_PW` = 기존 값 그대로 쓰거나 새로 정함 → 저장
4. 배포 → 새 배포 → 웹앱 (실행: 나 / 액세스: 모든 사용자) → 새 `.../exec` 주소 복사 (6-4 참고)
5. `config.js`의 `apiUrl`을 새 주소로 교체, `version` +1. `index.html`의 `config.js?v=` 도 +1
6. GitHub에 commit + push
7. **Vercel 처리** (둘 중 하나):
   - 후임이 저장소를 **새로 Fork** 했으면 → Vercel에서 그 저장소로 새 프로젝트 Import (6-6 참고). **접속 주소가 바뀌므로 교직원에게 새 주소를 공지**합니다.
   - 후임이 **기존 저장소를 그대로** 물려받으면(협업자 권한) → push만으로 기존 Vercel이 자동 재배포. **접속 주소 그대로 유지**됩니다.
8. 접속 → 관리자 모드(새 `ADMIN_PW`) → 특별실·정규시간표·학교휴일 다시 등록
9. **테스트 전용 시트·Apps Script**도 위 1~4를 별도 스프레드시트로 반복해 후임 계정에 다시 만듭니다
10. 후임이 **부록 B의 URL·시트 ID 표를 새 값으로 갱신**하고 commit

### 9-4. 절차 — 기존 예약 데이터를 이어받는 경우

위 3번에서 새 시트를 만드는 대신:

1. 전임 담당자가 자기 스프레드시트에서 **파일 → 사본 만들기**
   - 사본 저장 위치를 후임 담당자 Drive(또는 공유 폴더)로 지정
   - 또는 전임이 시트를 후임에게 "편집자"로 공유한 뒤, 후임이 사본 생성
2. 그 사본의 시트 ID를 후임 `Code.gs`의 `SHEET_ID`에 입력
3. 나머지는 9-3의 4번부터 동일

→ 예약·정규시간·학교휴일·변경 기록이 그대로 유지됩니다.

### 9-5. 확인

- 새 `.../exec?action=ping` → `{"ok":true, ...}`
- 사이트 접속 → 예약 하나 만들어 보고 새로고침 → 그대로 남아 있으면 정상
- 관리자 모드에 새 비밀번호로 진입되는지 확인
- (데이터 이어받은 경우) 기존 예약·정규시간표가 보이는지 확인

---

## 부록 A. 서버 코드 전문 (`Code.gs`)

서버를 새로 만들거나 코드를 갱신할 때 아래 내용을 Apps Script 편집기에 통째로 붙여넣고, 맨 위 `SHEET_ID`·`ADMIN_PW` 두 줄만 실제 값으로 채웁니다.

> 저장소 파일은 `apps-script/Code.gs`이며 그게 기준입니다. 서버 코드를 수정하면 이 블록도 함께 갱신합니다.

```javascript
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
  lock.waitLock(10000);
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
  lock.waitLock(10000);
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
  lock.waitLock(10000);
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
  lock.waitLock(10000);
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

// ===== 특별실(rooms) 낱개 저장 — 서버의 현재 목록을 읽어 반영(동시 편집 시 유실 방지) =====
function addRoom(body) {
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
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
  lock.waitLock(10000);
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
  lock.waitLock(10000);
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
  lock.waitLock(10000);
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
  lock.waitLock(10000);
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
  lock.waitLock(10000);
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
function sheetOf(name) {
  const ss = SpreadsheetApp.openById(SHEET_ID);
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
```

---

## 부록 B. 설정 파일과 현재 운영 정보

### `config.js` 원본

```javascript
// ===== 앱 설정 (구글시트 연결) =====
// 다른 구글시트로 바꿀 때는 apiUrl 을 새 Apps Script URL(.../exec)로 교체하고 version 을 +1.
// version 을 올려야 기존 사용자 브라우저에도 새 URL 이 적용됨.
// index.html 의 <script src="config.js?v=N"> 의 N 도 함께 +1 (캐시 방지).
const APP_CONFIG = {
  version: 2,
  apiUrl: 'https://script.google.com/macros/s/AKfycbxYOrmLo9opdrbxXmCsWshDWfhtzDBFyAT2WIFOO-RZHMsMj73fPpgyNH7tbXb8JOY/exec',
  serverEnabled: true,   // 서버 연동 ON
  autoSave: true,        // 자동 저장 ON
  autoLoad: true,        // 자동 불러오기 ON
  autoLoadInterval: 60,  // 자동 불러오기 주기(초)
};
```

### 현재 운영/테스트 정보

| 구분 | 값 |
|---|---|
| 접속 주소 | `https://specialroom-eight.vercel.app` |
| 소스 저장소 | `https://github.com/songlim26/specialroom` |
| 운영 Apps Script URL | `https://script.google.com/macros/s/AKfycbxYOrmLo9opdrbxXmCsWshDWfhtzDBFyAT2WIFOO-RZHMsMj73fPpgyNH7tbXb8JOY/exec` |
| 운영 구글시트 ID | `12XFU15WU8BylhAIF2FISd-mVpAQgr8Xvz1MU0iWIFHg` |
| 테스트 Apps Script URL | `https://script.google.com/macros/s/AKfycbxBID2kGhX5Tna7VjLbdLJIJ7qAcok3-9XifjflctLZfj5EWfxVR5NF_b5LxnVl950Atg/exec` |
| 테스트 구글시트 ID | `1IY1woiMdLKPQOUYMNzWoMbVBAFnECMfDiQiOP9iH4Rk` (운영 시트의 사본) |
| 관리자 비밀번호 | 이 문서에 없음. Apps Script 편집기의 `ADMIN_PW` 값. 현재 담당자에게 문의 |

> 위 URL·시트는 **현재 담당자 계정**에 묶여 있습니다. 담당자가 바뀌면 전부 새 계정으로 다시 만들어야 하며(9장), 그 뒤 이 표를 새 값으로 갱신합니다.

### 교시 키값 (`period`)

| 키 | 뜻 | 시간 |
|---|---|---|
| `1`~`3` | 1~3교시 | 09:00~11:20 |
| `4A` | 4교시 (저학년) | 11:30~12:10 |
| `4E` | 4교시 (고학년) | 12:20~13:00 |
| `5EH` | 5교시 | 13:10~13:50 |
| `6`~`8` | 6~8교시 | 14:00~16:20 |

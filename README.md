# 특별실 예약 관리 (학교용 웹앱)

GitHub Pages + Google Apps Script + Google Sheets 로 무료 운영하는 학교 특별실 예약 시스템.

## 폴더 구조

```
specialroom/
├── index.html         화면 구조
├── style.css          디자인
├── app.js             클라이언트 로직
├── api.js             Apps Script 통신
├── config.js          구글시트(Apps Script) 연결 URL 설정
├── apps-script/
│   └── Code.gs        서버 코드 (Apps Script에 붙여넣기용)
└── README.md
```

## 빠른 실행 (로컬 테스트)

VS Code Live Server 확장으로 `index.html` 열거나, 폴더에서:

```bash
python3 -m http.server 8000
```

브라우저에서 http://localhost:8000 접속. 로컬에서는 LocalStorage만 사용 (서버 없어도 모든 기능 동작).

## 관리자 모드

- 우측 상단 "관리자 모드" 클릭 → 비밀번호 입력 → **서버(Apps Script)에서 검증** (비밀번호는 브라우저 코드에 존재하지 않음)
  - 비밀번호는 `apps-script/Code.gs` 상단의 `ADMIN_PW` 값. 바꾸려면 Code.gs 수정 후 재배포 필요
  - 서버 연동이 꺼져 있으면 관리자 모드 진입 불가 (관리자 인증은 항상 온라인 사용을 전제로 함)
  - 관리자 모드에 있는 동안엔 버튼이 "사용자 모드로 전환"으로 바뀌며, 눌러서 언제든 빠져나올 수 있음
  - 관리자 모드에 있는 동안엔 빈 셀을 클릭해도 예약이 아니라 정규시간표 편집으로 연결됨 — 관리자 본인이 방을 예약하려면 먼저 "사용자 모드로 전환"으로 나가야 함
- 관리자 기능:
  - **정규시간표**: 빈 셀 클릭 → 라벨 추가/편집, 기간 정규시간(날짜 범위 일괄), 다중 선택(여러 빈 칸 일괄 설정/삭제)
  - **특별실 관리**: 추가·삭제 모두 관리자만 가능 — "+ 특별실 추가" 버튼(일반 사용자에겐 안 보임), 탭 **우클릭**으로 삭제
  - **학교휴일 관리**: 방학·재량휴업일·개교기념일 등 학교자체 휴일 등록/삭제 (법정공휴일은 자동 표시). 휴일인 날은 1~8교시 빈 칸이 전부 회색으로 표시됨(예약은 계속 가능)
  - **예약 관리**: 삭제·수정에 별도 비밀번호 확인 없음(일반 사용자도 동일). 다중 선택으로 예약된 칸 여러 개를 골라 한 번에 삭제 가능
  - **서버**: 구글시트 설정에서 연동 관리, 정규시간표 서버저장 버튼으로 정규시간표·특별실·학교휴일을 구글시트에 저장(예약은 자동 저장되므로 이 버튼은 안 건드려도 됨)

## 서버 연동 (구글 시트 + Apps Script)

지금 배포된 사이트는 `config.js`에 Apps Script URL이 이미 심어져 있어서, 사용자가 아무것도 설정하지 않아도 자동으로 서버에 연결됩니다. 아래는 이 연결을 처음부터 새로 만들 때의 절차입니다 (관리자를 바꿀 때는 아래 "인수인계" 섹션 참고).

### 1. 구글 시트 만들기
1. drive.google.com → 새 스프레드시트
2. 시트 이름: `특별실예약DB` (아무거나)
3. URL에서 ID 복사 (예: `https://docs.google.com/spreadsheets/d/【여기】/edit`)
   - 시트 안의 개별 탭(`reservations`/`rooms`/`schedule`/`holidays`)은 직접 안 만들어도 됩니다 — Code.gs가 처음 호출될 때 자동 생성합니다

### 2. Apps Script 배포
1. 시트 → 확장 프로그램 → Apps Script
2. `apps-script/Code.gs` 내용을 붙여넣기
3. 상단의 `SHEET_ID`, `ADMIN_PW` 수정
4. 배포 → 새 배포 → 유형: **웹앱**
   - 실행: 나
   - 액세스: **모든 사용자**
5. 발급된 URL 복사 (`https://script.google.com/macros/s/.../exec`)

### 3. config.js에 연결 (권장 방법)
- `config.js`의 `apiUrl`을 발급받은 URL로 교체
- `version` 숫자를 +1 (버전을 올려야 이미 사이트를 써본 사용자 브라우저에도 새 설정이 적용됨)
- `index.html`의 `<script src="config.js?v=N">`의 `N`도 함께 +1 (안 올리면 브라우저가 config.js를 캐시해서 새 값을 못 받아올 수 있음)
- `git add config.js index.html && git commit -m "구글시트 연결" && git push` → 1~2분 뒤 모든 사용자에게 자동 반영

### (참고) 수동 연결 — 임시 테스트용
- 관리자 모드 → "구글시트 설정"에서 URL을 직접 입력하는 방법도 있지만, **그 브라우저 하나에만** 적용되고 일부 브라우저(사파리 등)는 며칠 뒤 저장된 값을 자동으로 지웁니다. 정식 연결은 항상 `config.js` 방식을 쓰세요.
- `연결 테스트` 버튼으로 URL이 살아있는지 확인만 하는 용도로는 유용합니다.

## GitHub Pages 배포

```bash
cd specialroom
git init
git add .
git commit -m "initial"
git remote add origin https://github.com/【아이디】/specialroom.git
git push -u origin main
```

GitHub 저장소 → Settings → Pages → Source: `main` / `/(root)` → Save.
1~2분 후 `https://【아이디】.github.io/specialroom/` 접속 가능.

## 인수인계 (관리자를 바꿀 때)

이 앱의 서버(Apps Script 웹앱)는 **배포한 사람의 구글 계정 권한으로 계속 실행**됩니다. 그 계정이 학교 계정이라 나중에 정지·삭제되면(전근·퇴직 등) 서버가 멈추므로, **관리자가 바뀔 때는 반드시 새 관리자의 계정으로 새로 연결**해야 합니다.

지난 예약 기록은 유지하지 않아도 된다는 전제로, 매번 완전히 새 시트로 시작하는 가장 단순하고 확실한 방법입니다 (기존 관리자 계정에 전혀 의존하지 않음).

### 절차
1. **새 관리자**가 자신의 구글 드라이브에서 새 스프레드시트 생성 (이름은 자유)
2. 확장 프로그램 → Apps Script → 이 저장소의 `apps-script/Code.gs` 내용을 그대로 붙여넣기
3. 코드 상단 두 줄 수정
   - `SHEET_ID` → 새 시트 URL의 `/d/` 뒤 긴 문자열
   - `ADMIN_PW` → 새 관리자 비밀번호
4. 배포 → 새 배포 → 웹앱 (실행: 나 / 액세스: 모든 사용자) → 발급된 `.../exec` URL 복사
5. 이 저장소의 `config.js` 수정
   - `apiUrl`을 새 URL로 교체
   - `version` 숫자를 +1
6. `index.html`의 `<script src="config.js?v=N">`의 `N`도 함께 +1 (캐시 방지)
7. `git add config.js index.html && git commit -m "관리자 인수인계: 새 구글시트 연결" && git push`
8. 1~2분 뒤 사이트에 접속하면 모든 사용자 브라우저가 자동으로 새 시트에 연결됩니다 — **관리자 모드에 들어가 URL을 입력할 필요는 없음**

### 새로 입력해야 하는 것 (기존 데이터는 안 넘어옴)
- 특별실 목록 → 관리자 모드에서 "+ 특별실 추가"로 재등록
- 정규시간표 라벨 → 빈 칸 클릭해서 재설정
- 학교자체 휴일 → "학교휴일 관리"에서 재등록

### 확인 방법
- 새로 배포한 URL 뒤에 `?action=ping`을 붙여 브라우저로 직접 열어보기 (예: `.../exec?action=ping`) → `{"ok":true,...}` 응답이 오면 정상

## 데이터 모델

### `reservations` (예약)
| id | room | date | period | name | classroom | purpose | passwordHash | createdAt |
|----|------|------|--------|------|-----------|---------|--------------|-----------|

- `date`: `YYYY-MM-DD`
- `period`: `1`, `2`, ... 또는 `4MH`, `5EH` 등 (저학년·중학년·고학년 구분 키, `app.js` 의 `PERIODS` 참고)
- `passwordHash`: SHA-256 (브라우저에서 해시 후 전송)

### `rooms` (특별실)
| name | order |

### `schedule` (정규시간표 - 회색 셀)
| room | dayOfWeek | period | label |

- `dayOfWeek`: `월`/`화`/`수`/`목`/`금`
- 예: `도서실, 화, 1, 2학년`

## 개선 아이디어 (TODO)

- [ ] 예약 수정 폼 (현재는 목적만 prompt로 수정)
- [ ] 충돌 처리(서버 측 동시 예약 방지 — 현재는 마지막 쓰기가 이김에 가까움)
- [ ] 모바일 반응형 정리
- [ ] 정규시간표를 학년·요일·교시 단위로 일괄 입력

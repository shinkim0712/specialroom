# 특별실 예약 관리 (학교용 웹앱)

GitHub Pages + Google Apps Script + Google Sheets 로 무료 운영하는 학교 특별실 예약 시스템.

## 폴더 구조

```
specialroom/
├── index.html         화면 구조
├── style.css          디자인
├── app.js             클라이언트 로직
├── api.js             Apps Script 통신
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

- 우측 상단 🔒 클릭 → 비밀번호 `9999` (소스에서 수정 가능: `app.js` 의 `ADMIN_PW_LOCAL`)
- 관리자 기능:
  - 빈 셀 **더블클릭** → 정규시간표 라벨 추가 (회색 글자, 예: "1학년", "방과후")
  - 라벨 있는 셀 클릭 → 라벨 수정/삭제
  - 탭 **우클릭** → 특별실 삭제
  - 예약 비밀번호 무시하고 수정/삭제 가능

## 서버 연동 (구글 시트 + Apps Script)

### 1. 구글 시트 만들기
1. drive.google.com → 새 스프레드시트
2. 시트 이름: `특별실예약DB` (아무거나)
3. URL에서 ID 복사 (예: `https://docs.google.com/spreadsheets/d/【여기】/edit`)

### 2. Apps Script 배포
1. 시트 → 확장 프로그램 → Apps Script
2. `apps-script/Code.gs` 내용을 붙여넣기
3. 상단의 `SHEET_ID`, `ADMIN_PW` 수정
4. 배포 → 새 배포 → 유형: **웹앱**
   - 실행: 나
   - 액세스: **모든 사용자**
5. 발급된 URL 복사 (`https://script.google.com/macros/s/.../exec`)

### 3. 앱에서 설정
- 웹앱에서 `구글시트 설정` 클릭
- URL 붙여넣기 + "서버 연동 활성화" 체크 + 저장
- `연결 테스트` 로 응답 확인
- `서버로 저장` 으로 현재 로컬 데이터를 시트에 업로드

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

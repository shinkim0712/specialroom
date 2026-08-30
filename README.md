# 특별실 예약 관리 (학교용 웹앱)

선생님들이 브라우저로 학교 특별실(강당·운동장·시청각실·도서관·컴퓨터실 등)을 예약하는 웹앱.
서버 비용 없이 **Vercel + Google Apps Script + Google Sheets**로 무료 운영.
접속 주소: `sr-specialroom.vercel.app` · 소스: GitHub `shinkim0712/specialroom`

> **자세한 내용은 `GUIDE.md`** — 구조·기능·설치·유지보수·인수인계를 하나부터 열까지 정리해뒀습니다.
> `GUIDE.md` 맨 뒤 부록에 서버 코드 전문(Code.gs)과 설정값·운영 주소가 모두 들어 있습니다.

## 폴더 구조

```
specialroom/
├── index.html      화면 뼈대 + 모달
├── style.css       디자인
├── config.js       ★ 구글시트 연결 URL 설정
├── api.js          Apps Script 통신
├── app.js          ★ 전체 클라이언트 로직
└── apps-script/
    └── Code.gs     서버 코드 (저장소에 포함, 플레이스홀더만). Apps Script 편집기에 붙여넣어 사용
```

## 로컬 실행

```bash
python3 -m http.server 8123 --directory specialroom
```
http://localhost:8123 접속. 서버 없이도 모든 기능 동작 (localStorage 사용).
서버 기능을 테스트하려면 **반드시 테스트 전용 시트**를 쓸 것 (`GUIDE.md` 8장)

## 배포

- **클라이언트**: 파일 수정 → `index.html`의 `?v=` 숫자 +1 → `git push` → 1~2분 뒤 Vercel 자동 재배포
- **서버(Code.gs)**: Apps Script 편집기에 붙여넣기 → 배포 관리 → 편집 → **버전 "새 버전"** → 배포

## 핵심 개념 3가지

1. **모든 변경은 즉시 서버에 저장됨** (예약·특별실·기간 정규시간·학교휴일). "저장" 버튼 없음
2. **관리자 비밀번호는 브라우저 코드에 없음** — `Code.gs`의 `ADMIN_PW`에만 있고 서버가 검증
3. **서버는 배포한 사람의 구글 계정으로 실행됨** — 담당자가 바뀌면 새 계정으로 재배포 필요 (`GUIDE.md` 9장)

## 데이터 (Google Sheets 탭)

| 탭 | 내용 |
|---|---|
| `reservations` | 예약 |
| `rooms` | 특별실 목록 |
| `dateRules` | 기간 정규시간 / 예약 금지 |
| `holidays` | 학교자체 휴일 (법정공휴일은 `app.js`의 `KR_HOLIDAYS`에 하드코딩) |
| `logs` | 변경 기록 (삭제·수정·가림) |

# 특별실 예약 관리 (학교용 웹앱)

선생님들이 브라우저로 학교 특별실(강당·운동장·시청각실·도서관·컴퓨터실 등)을 예약하는 웹앱.
서버 비용 없이 **GitHub Pages + Google Apps Script + Google Sheets**로 무료 운영.

> **자세한 내용은 [`GUIDE.md`](GUIDE.md)** — 구조·기능·설치·유지보수·인수인계를 하나부터 열까지 정리해뒀습니다.
> 개발 메모: [`CONTEXT.md`](CONTEXT.md) · 변경 내역: [`CHANGELOG.md`](CHANGELOG.md)

## 폴더 구조

```
specialroom/
├── index.html      화면 뼈대 + 모달
├── style.css       디자인
├── config.js       ★ 구글시트 연결 URL 설정
├── api.js          Apps Script 통신
├── app.js          ★ 전체 클라이언트 로직
└── apps-script/
    └── Code.gs     서버 코드 (Apps Script에 붙여넣기용, .gitignore로 제외)
```

## 로컬 실행

```bash
python3 -m http.server 8123 --directory specialroom
```
http://localhost:8123 접속. 서버 없이도 모든 기능 동작 (localStorage 사용).
서버 기능을 테스트하려면 **반드시 테스트 전용 시트**를 쓸 것 → [`GUIDE.md` 9번](GUIDE.md)

## 배포

- **클라이언트**: 파일 수정 → `index.html`의 `?v=` 숫자 +1 → `git push` → 1~2분 뒤 자동 재배포
- **서버(Code.gs)**: Apps Script 편집기에 붙여넣기 → 배포 관리 → 편집 → **버전 "새 버전"** → 배포

## 핵심 개념 3가지

1. **모든 변경은 즉시 서버에 저장됨** (예약·특별실·기간 정규시간·학교휴일). "저장" 버튼 없음
2. **관리자 비밀번호는 브라우저 코드에 없음** — `Code.gs`의 `ADMIN_PW`에만 있고 서버가 검증
3. **서버는 배포한 사람의 구글 계정으로 실행됨** — 담당자가 바뀌면 새 계정으로 재배포 필요 ([`GUIDE.md` 10번](GUIDE.md))

## 데이터 (Google Sheets 탭)

| 탭 | 내용 |
|---|---|
| `reservations` | 예약 |
| `rooms` | 특별실 목록 |
| `dateRules` | 기간 정규시간 / 예약 금지 |
| `holidays` | 학교자체 휴일 (법정공휴일은 `app.js`의 `KR_HOLIDAYS`에 하드코딩) |
| `logs` | 변경 기록 (삭제·수정·가림) |
| `schedule` | 죽은 탭 (2026-08-28 기능 제거) |

# 특별실 예약 관리 웹앱 — 컨텍스트

> 이 문서는 세션이 바뀌어도 이어서 작업할 수 있도록 정리한 현재 상태 스냅샷입니다.
> 마지막 갱신: 2026-08-23 (긴 작업 세션 이후)

## ⚠️ 지금 당장 알아야 할 것 (우선순위 순)

1. **이번 세션 변경사항이 GitHub에 아직 안 올라갔습니다.** 로컬 파일(`index.html`, `style.css`, `app.js`, `api.js`, `README.md`)이 전부 수정된 상태(`git status`에 `M`)이고, `config.js`는 아예 새 파일이라 untracked입니다. **커밋·푸시 전까지는 실제 배포된 사이트(GitHub Pages)에 오늘 작업한 내용이 하나도 반영 안 됩니다.**
2. **Apps Script(Code.gs) 재배포도 아직 안 됐습니다.** 로컬의 `apps-script/Code.gs`는 최신인데, 실제 배포된 서버는 구버전이라 다음이 서버에서 안 먹힙니다: 예약 삭제 인증 제거, 관리자 비번 서버검증(`checkAdmin`), 학교휴일 기간등록, 기간정규시간(dateRules) 동기화, 겹치기예약 방지(LockService), period 타입 정규화. 재배포 방법은 이 대화 후반부에 전체 코드와 함께 안내되어 있음 — 필요하면 새 세션에서 다시 요청.
3. `apps-script/`는 `.gitignore`로 GitHub에서 항상 제외됨 (시트ID·비번 노출 방지) — Code.gs는 GitHub push와 무관하게 **Apps Script 편집기에 직접 붙여넣기**해야 반영됨.

## 프로젝트 개요
학교 특별실(강당, 운동장, 농구장, 시청각실, 소통광장 등) 예약을 관리하는 웹앱. 선생님들이 브라우저로 접속해서 주간 시간표 형태로 예약. 서버 비용 없이 무료 운영.

**구조**: GitHub Pages(정적 호스팅) + Google Apps Script(서버 역할) + Google Sheets(DB)

## 파일 위치
```
/Users/kimhyunjoonn/Documents/claude/specialroom/
├── index.html      화면 구조
├── style.css       디자인 (Stitch로 만든 Slate Blue 테마 적용)
├── app.js          전체 클라이언트 로직 (제일 큼, ~1150줄)
├── api.js          Apps Script 통신
├── config.js       구글시트 연결 URL·자동연결 설정 (신규, 아직 git 미추적)
├── .gitignore      apps-script/ 제외
├── README.md       설치·관리자·인수인계 안내 (이번 세션에 대폭 갱신)
├── CONTEXT.md       이 파일
└── apps-script/
    └── Code.gs     서버 코드 (Apps Script에 붙여넣기용, git 제외)
```

로컬 프리뷰용 `.claude/launch.json`은 프로젝트 상위 폴더(`/Users/kimhyunjoonn/Documents/claude/.claude/launch.json`)에 있고, `python3 -m http.server 8123 --directory specialroom` 로 specialroom을 서빙하도록 설정됨.

## 서버 정보
- **Google Sheets ID**: `12XFU15WU8BylhAIF2FISd-mVpAQgr8Xvz1MU0iWIFHg` (미확인 — 이전 세션 기록, 재확인 권장)
- **Apps Script Web App URL**: `https://script.google.com/macros/s/AKfycbxYOrmLo9opdrbxXmCsWshDWfhtzDBFyAT2WIFOO-RZHMsMj73fPpgyNH7tbXb8JOY/exec` (config.js에 하드코딩됨, ping 테스트로 살아있음 확인됨)
- **관리자 비밀번호**: 이제 클라이언트 코드엔 없음. `apps-script/Code.gs`의 `ADMIN_PW`에만 있고, 서버가 `checkAdmin` 액션으로 검증. **실제 값은 세션 기록에 없음** (물어봐야 함).

## GitHub
- **계정**: shinkim0712
- **저장소**: https://github.com/shinkim0712/specialroom
- **배포 URL**: https://shinkim0712.github.io/specialroom/

## 로컬 실행
```bash
cd /Users/kimhyunjoonn/Documents/claude
python3 -m http.server 8123 --directory specialroom
# 브라우저: http://localhost:8123
```

## 배포 (수정 후)
```bash
cd /Users/kimhyunjoonn/Documents/claude/specialroom
git add .
git commit -m "수정 내용"
git push
# 1~2분 후 GitHub Pages 자동 반영
```
Code.gs를 바꿨다면 **별도로** Apps Script 편집기에서 붙여넣기 + "배포 관리 → 편집 → 새 버전"으로 재배포해야 함 (git push와 무관).

## 기능 목록 (이번 세션 이후 기준)

### 시간표
- 주간 뷰 (월~금 × 1~8교시, 4교시는 저/고학년용 2칸으로 분리 → 총 9행)
- 교시별 시간 표시 (데스크톱만; 모바일은 공간 부족으로 숨김, 폰트는 최대한 키움)
- 법정공휴일 자동 표시 (`KR_HOLIDAYS` 배열, **2026년치만 있음 — 연도 바뀌면 추가 필요**), 휴일인 날은 빈 칸 전체 회색
- 학교자체 휴일 (방학 등, 관리자가 기간범위로 등록/삭제, 자동 겹침 검증은 없음)

### 예약
- 이름·학급(학년/반 드롭다운)·목적 입력. "회의/학급" 체크박스 — 체크 시 학급란 무시하고 `classroom: '회의/학급'`로 저장, 목적에 내용 적음
- 이름·학급은 브라우저에 기억되어 다음 예약에 자동 채워짐 (회의 체크 시엔 기억 안 함)
- 정규시간표 라벨이 "N학년" 형태로 일치하면 학년 드롭다운 자동 선택
- **예약 삭제·수정에 비밀번호 없음** — 누구나 가능 (의도적 정책)
- "수정" 버튼은 prompt가 아니라 예약 입력 폼을 재사용 (기존 값 채워서 열림)
- 다중 선택: 빈 칸(정규시간 라벨 or 일괄예약) + 예약된 칸(일괄 삭제) 모두 지원
- 겹치기 예약 방지: 서버 LockService(잠금) + 클라이언트가 서버 거부 시 화면 롤백·알림
- 예약자명 옆 "자동입력 지우기" 링크 — 관리자 아니어도 이 브라우저의 기억값만 지울 수 있음

### 정규시간표
- 요일별 고정 라벨 (빈 칸 클릭 또는 다중선택으로 관리자가 설정)
- **기간 정규시간(dateRules)**: 날짜범위 + **요일 필터**(신규, 기본 전체 선택) + 교시. 서버엔 `periods`/`daysOfWeek`를 JSON 문자열로 직렬화해서 저장

### 특별실
- 추가/삭제 모두 **관리자 전용** (원래 추가는 누구나 가능했던 허점을 이번에 수정)

### 관리자 모드
- 비밀번호는 서버에서만 검증 (`checkAdmin`), 서버 연동 꺼져있으면 로그인 불가
- 진입 시 버튼이 "사용자 모드로 전환"으로 바뀜
- **관리자 모드 중엔 빈 칸 클릭이 예약이 아니라 정규시간표 편집으로 감** (알려진 제약, 의도적으로 안 고치기로 함 — 예약하려면 사용자 모드로 전환 필요)

### 서버 동기화 — 중요, 헷갈리기 쉬움
- **예약만** 자동 동기화: 저장 즉시 서버 반영(`autoSave`), 1분마다 자동 불러오기(`autoLoad`, config.js 기본값)
- **특별실/정규시간표/기간정규시간/학교휴일은 수동**: "정규시간표 서버저장"(로컬→서버, 전체 덮어쓰기) / "서버에서 불러오기"(서버→로컬, 전체 덮어쓰기, 확인창 뜸) 버튼을 직접 눌러야 함
- **페이지 새로고침해도 이 4가지는 서버에서 안 불러와짐** (초기 로드도 예약만 `force:false`로 불러옴)
- 관리자↔사용자 모드 전환은 서버 재조회 없음 — 그냥 로컬 상태로 재렌더링만 함

### 디자인
- Google Stitch로 만든 시안을 반영: Slate Blue(#0e3b69) 포인트 컬러, 미니멀 카드, 은은한 그림자, Hanken Grotesk(제목) + Noto Sans KR(본문)
- 강원교육서체는 시도했다가 사용자 요청으로 되돌림 (Noto Sans KR 유지)
- 휴일 색은 Stitch 시안(빨강)과 무관하게 **회색 유지** (이전 명시적 요청)

## 데이터 구조 (Google Sheets 시트 5개)

### reservations
| id | room | date | period | name | classroom | purpose | passwordHash | createdAt |
- `passwordHash`는 더 이상 클라이언트가 채우지 않음 (죽은 필드, 스키마만 남아있음)

### rooms
| name | order |

### schedule (정규시간표 - 요일별 고정)
| room | dayOfWeek | period | label |

### dateRules (기간 정규시간 - 신규)
| id | room | startDate | endDate | periods | daysOfWeek | label |
- `periods`, `daysOfWeek`는 JSON 문자열로 저장 (예: `["1","2"]`)

### holidays (학교자체 휴일)
| id | startDate | endDate | label |
- 예전엔 `date` 단일 컬럼이었는데 기간범위로 스키마 변경됨

## 교시 키값 (app.js PERIODS) — 현재 최종
| key   | label       | time        |
|-------|-------------|-------------|
| 1     | 1교시        | 09:00~09:40 |
| 2     | 2교시        | 09:50~10:30 |
| 3     | 3교시        | 10:40~11:20 |
| 4A    | 4교시(1)     | 11:30~12:10 |
| 4E    | 4교시(2)     | 12:20~13:00 |
| 5EH   | 5교시        | 13:10~13:50 |
| 6     | 6교시        | 14:00~14:40 |
| 7     | 7교시        | 14:50~15:30 |
| 8     | 8교시        | 15:40~16:20 |

## 알려진 제약 / 의도적으로 안 고친 것
- 관리자 모드에서 직접 예약 생성 불가 (사용자 모드로 나가야 함)
- 학교자체 휴일 기간 겹침 검증 없음
- 특별실 삭제 등은 "저장" 안 누르면 서버에 안 반영되고, 관리자↔사용자 전환으로도 안 돌아옴 → "서버에서 불러오기"로 복구 가능(단, 다른 미저장 변경도 같이 날아감)

## 남은 작업 / TODO
- [ ] **git commit & push** (가장 시급 — 지금 로컬 변경사항이 배포 사이트에 전혀 반영 안 된 상태)
- [ ] **Apps Script 재배포**
- [ ] 다음 해 되면 `KR_HOLIDAYS` 배열에 새 연도 공휴일 추가
- [ ] (선택) 학교자체 휴일 겹침 시 경고 추가할지 결정

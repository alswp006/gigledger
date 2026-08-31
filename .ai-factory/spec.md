# SPEC — GigLedger

> 플랫폼: 앱인토스 (Vite + React + TypeScript + TDS + React Router + localStorage)
> 언어: 한국어 / 통화: KRW(정수 원) / 타임존: Asia/Seoul
> 본 SPEC은 PRD를 유일한 진실 원천으로 하며, PRD에 없는 기능(푸시, 서버 동기화, OCR 자동수집, SNS 연동)은 범위 밖이다.

---

## Common Principles

### CP-1. 아키텍처 원칙
- 서버 없음. 모든 데이터는 `localStorage`에 저장한다. 외부 API 호출 없음(→ API Contract 섹션 "해당 없음").
- 인증은 토스 앱이 자동 제공한다. 로그인 화면/로그인 호출을 구현하지 않는다. 사용자 식별이 필요한 경우에만 `getIsTossLoginIntegratedService()`로 연동 여부를 확인한다.
- 라우팅은 `react-router-dom`의 `BrowserRouter` + `Routes`를 사용한다. 하단 네비게이션은 템플릿 제공 `src/components/FloatingTabBar`를 사용한다(TDS에 TabBar 없음).
- 모든 화면은 템플릿의 `ScreenScaffold`(= PageShell)로 감싼다. raw `<div>` 페이지 골격 금지.
- 계산 로직(합산, 실질 시급, 스트릭, 달성률)은 `src/lib/*.ts` 순수 함수로 분리하고 UI에서 분리 테스트 가능해야 한다.

### CP-2. 표기 규칙(테스트 가능한 고정값)
- 금액 표기: `amount.toLocaleString('ko-KR') + '원'` (예: `1250000` → `1,250,000원`).
- 시간 표기: 분 단위 저장 → `Math.floor(m/60) + '시간 ' + (m%60) + '분'` (예: `330` → `5시간 30분`).
- 실질 시급: `Math.round((수입합 - 경비합) / (근무분합 / 60))`, 근무분합이 `0`이면 시급은 `null`이며 UI에 `"—"` 표시.
- 날짜 키: `YYYY-MM-DD` (로컬 기준). 월 키: `YYYY-MM`. 주 시작 요일: 월요일 고정.
- 증감률: `Math.round((이번달 - 지난달) / 지난달 * 1000) / 10` (소수 1자리, %). 지난달이 `0`이면 `"—"` 표시.

### CP-3. 공통 UI 원칙
- UI는 TDS 컴포넌트(`Top`, `ListRow`, `Button`, `TextField`, `Paragraph.Text`, `Chip`, `Switch`, `AlertDialog`, `BottomSheet`, `Toast`, `Tab`, `Spacing`, `Asset.ContentIcon`)만 사용한다.
- TDS 컴포넌트의 내장 padding/margin을 Tailwind/인라인 스타일로 덮어쓰지 않는다. 간격은 `Spacing`(size prop 필수)만 사용한다.
- 커스텀 CSS는 TDS가 제공하지 않는 flex/grid 배치에만 허용한다.
- 색상은 `var(--tds-color-*)` CSS 변수 또는 TDS 컴포넌트 기본값만 사용한다(다크모드 필수 지원).
- 모든 탭 가능한 요소의 터치 타깃은 최소 44×44px.

### CP-4. 공통 Acceptance Criteria (전 화면 적용)

- **AC-G1 [W][P0]: Scenario: 외부 도메인 이탈 차단**
  Given 앱이 실행 중일 때
  When 코드 어디에서든 `window.location.href` 또는 `window.open`으로 외부 URL 이동을 시도
  Then 해당 호출이 코드베이스에 존재하지 않아야 함 (정적 검사: `grep -rn "window.open\|location.href" src/` 결과 0건)

- **AC-G2 [W][P0]: Scenario: 앱 설치 유도/외부 링크 금지**
  Given 앱의 모든 화면 텍스트가 렌더링될 때
  Then `"설치"`, `"다운로드"`, `"앱스토어"`, `"플레이스토어"` 문구와 외부 서비스 링크가 존재하지 않음
  And 법률 고지·공공기관 링크 외 외부 이동 UI가 없음

- **AC-G3 [U][P0]: Scenario: 콘솔 에러 0개**
  Given 프로덕션 빌드(`vite build`)를 실행한 앱에서
  When 전체 화면(`/`, `/entry`, `/platforms`, `/wage`, `/report`, `/share`, `/settings`)을 순회
  Then `console.error` 출력이 0건

- **AC-G4 [U][P0]: Scenario: HEX 하드코딩 금지**
  Given 소스 코드 전체에서
  When `src/**/*.{ts,tsx,css}`를 검사
  Then `#RRGGBB` / `#RGB` 형태의 색상 리터럴이 0건이고, 색상은 `var(--tds-color-*)`만 사용

- **AC-G5 [U][P0]: Scenario: Android 7+ / iOS 16+ 호환**
  Given 빌드 타깃 설정에서
  Then `Array.prototype.at`, `Object.groupBy`, `Array.prototype.toSorted`, 정규식 lookbehind를 사용하지 않음
  And `crypto.randomUUID` 미지원 환경 대비 `genId()` 폴백(`Date.now().toString(36) + Math.random().toString(36).slice(2,10)`)을 사용

- **AC-G6 [W][P0]: Scenario: 외부 로깅 금지**
  Given `package.json` 및 소스 전체에서
  Then `google-analytics`, `gtag`, `amplitude`, `mixpanel`, `sentry` 관련 의존성/스크립트가 0건

- **AC-G7 [U][P0]: Scenario: 생성형 AI 미사용**
  Given GigLedger의 모든 리포트/시급/추이 값이 표시될 때
  Then 모든 값은 사용자가 입력한 데이터의 결정적 산술 계산 결과이며, LLM/생성형 AI 호출이 코드에 존재하지 않음
  And 따라서 "AI가 생성한 결과입니다" 라벨 요구사항은 적용 대상 아님 (Assumptions A-6 참조)

- **AC-G8 [U][P1]: Scenario: 터치 타깃 44px**
  Given 모든 화면의 버튼/ListRow/Chip/탭 항목이 렌더링될 때
  Then 각 요소의 계산된 높이(`getBoundingClientRect().height`)가 44 이상

- **AC-G9 [W][P0]: Scenario: localStorage 쓰기 실패 처리**
  Given `localStorage.setItem`이 `QuotaExceededError`를 던지는 상황일 때
  When 사용자가 저장 동작(수입 기록/플랫폼 추가/설정 변경)을 수행
  Then TDS Toast로 `"저장 공간이 부족해요. 오래된 기록을 삭제해주세요"` 표시
  And 화면이 크래시하지 않고 직전 상태를 유지함

- **AC-G10 [W][P1]: Scenario: 손상된 저장 데이터 복구**
  Given `localStorage.getItem('gigledger.entries.v1')`가 `"{{broken"` 인 상태일 때
  When 앱을 시작
  Then `JSON.parse` 실패를 캐치하고 빈 배열 `[]`로 초기화
  And Toast로 `"일부 저장 데이터를 불러오지 못했어요"` 표시하며 앱은 정상 렌더링됨

---

## Data Models

### Platform — 수입원 플랫폼

```ts
export type PlatformCategory = 'delivery' | 'driving' | 'logistics' | 'freelance' | 'etc';

export interface Platform {
  id: string;                 // genId(), 8~24자
  name: string;               // 1~12자, 공백 trim 후 필수, 동일 name 중복 불가(대소문자/공백 무시)
  category: PlatformCategory; // 기본 'etc'
  colorToken: string;         // 'blue' | 'green' | 'orange' | 'purple' | 'red' | 'grey' (TDS 색 토큰 키)
  archived: boolean;          // true면 입력 폼 선택지에서 제외, 과거 기록은 유지
  createdAt: string;          // ISO8601
}
```
- 제약: 최대 20개. `archived === false`인 플랫폼이 최소 1개 있어야 수입 입력 가능.

### IncomeEntry — 일일 플랫폼 수입 기록

```ts
export interface IncomeEntry {
  id: string;          // genId()
  platformId: string;  // Platform.id 참조 (존재하지 않으면 '삭제된 플랫폼'으로 표시)
  date: string;        // 'YYYY-MM-DD', 미래 날짜 불가
  amount: number;      // 정수, 1 ~ 10_000_000 (총수입, 원)
  expense: number;     // 정수, 0 ~ amount (경비: 유류비/수수료 등)
  minutes: number;     // 정수, 0 ~ 1440 (근무 시간, 분)
  memo: string;        // 0~50자
  createdAt: string;   // ISO8601
  updatedAt: string;   // ISO8601
}
```
- 제약: 동일 `(platformId, date)` 조합 중복 허용(같은 날 여러 건 가능). 총 개수 상한 `MAX_ENTRIES = 5000`.
- 파생값: `net = amount - expense`.

### Settings — 목표/환경 설정

```ts
export interface Settings {
  monthlyGoal: number;   // 0(미설정) 또는 10_000 ~ 50_000_000
  bestStreak: number;    // 0 이상 정수 (역대 최고 연속 기록일)
  noticeSeenAt: string | null; // 최초 온보딩 안내 확인 시각 ISO8601
}
```

### ReportUnlockMap — 월간 리포트 광고 해금 상태

```ts
export type ReportUnlockMap = Record<string, string>; // key: 'YYYY-MM', value: 해금 시각 ISO8601
```

### localStorage 키 및 크기 추정

| Key | Shape | 1건 크기 | 예상 최대 |
|---|---|---|---|
| `gigledger.platforms.v1` | `Platform[]` | ~130B | 20건 → **2.6KB** |
| `gigledger.entries.v1` | `IncomeEntry[]` | ~185B | 5,000건 → **~925KB** |
| `gigledger.settings.v1` | `Settings` | ~90B | **90B** |
| `gigledger.reportUnlocks.v1` | `ReportUnlockMap` | ~35B | 36개월 → **1.3KB** |
| **합계** | | | **≈ 0.93MB (< 5MB)** |

- 저장 시 `entries.length > 5000`이면 가장 오래된 `date` 기준 정렬 후 초과분 저장을 거부한다(F1 AC 참조).

---

## Feature List

### F1. 데이터 레이어 & 저장소 (Storage + 계산 순수 함수)

- **Description**: `Platform` / `IncomeEntry` / `Settings` / `ReportUnlockMap`에 대한 localStorage 읽기·쓰기 리포지토리와 유효성 검사, 그리고 합산·실질시급·스트릭·달성률을 계산하는 순수 함수 모듈을 구현한다. UI는 이 레이어만 호출하며, 모든 파싱 실패와 용량 초과는 이 레이어에서 흡수한다. 최초 실행 시 기본 플랫폼 3종(`배달`, `대리운전`, `쿠팡플렉스`)을 시드한다.
- **Data**: Platform, IncomeEntry, Settings, ReportUnlockMap
- **API**: 해당 없음 (로컬 전용)
- **Requirements**: `src/lib/storage.ts`(repo), `src/lib/calc.ts`(순수 계산), `src/lib/validate.ts`(검증)

- **AC-1 [E][P0]: Scenario: 최초 실행 시 기본 플랫폼 시드**
  Given `localStorage`에 `gigledger.platforms.v1` 키가 없을 때
  When 앱을 시작
  Then `[{name:"배달",category:"delivery"},{name:"대리운전",category:"driving"},{name:"쿠팡플렉스",category:"logistics"}]` 3건이 생성되어 저장됨
  And 각 항목은 고유 `id`와 `archived: false`를 가짐

- **AC-2 [E][P0]: Scenario: 수입 기록 저장**
  Given 플랫폼 `배달`(id: `p1`)이 존재할 때
  When `saveEntry({ platformId: "p1", date: "2026-08-31", amount: 128000, expense: 18000, minutes: 330, memo: "피크타임" })` 호출
  Then `gigledger.entries.v1`에 1건이 추가되고 `id`, `createdAt`, `updatedAt`이 채워짐
  And `getEntries()`가 해당 항목을 포함한 배열을 반환하고 `net`은 `110000`으로 계산됨

- **AC-3 [U][P0]: Scenario: 실질 시급 계산**
  Given `[{amount:128000, expense:18000, minutes:330}, {amount:60000, expense:0, minutes:120}]` 기록이 있을 때
  When `calcHourlyWage(entries)` 호출
  Then `Math.round(170000 / (450/60))` = `22667`을 반환

- **AC-4 [W][P1]: Scenario: 근무시간 0분 시급 처리**
  Given `[{amount:50000, expense:0, minutes:0}]` 기록만 있을 때
  When `calcHourlyWage(entries)` 호출
  Then `null`을 반환 (0으로 나누기 예외 없음)

- **AC-5 [U][P0]: Scenario: 연속 기록 스트릭 계산**
  Given 오늘이 `2026-08-31`이고 기록 날짜가 `["2026-08-31","2026-08-30","2026-08-29","2026-08-27"]`일 때
  When `calcStreak(entries, "2026-08-31")` 호출
  Then `{ current: 3, lastDate: "2026-08-31" }`를 반환
  And 기록 날짜가 `["2026-08-29"]`뿐이면 `{ current: 0, lastDate: "2026-08-29" }`를 반환

- **AC-6 [W][P1]: Scenario: 유효하지 않은 입력 거부**
  Given 저장 레이어가 초기화되어 있을 때
  When `saveEntry({ platformId:"p1", date:"2026-08-31", amount: 0, expense: 0, minutes: 60, memo:"" })` 호출
  Then `{ ok: false, error: "금액을 입력해주세요" }`를 반환하고 `localStorage`는 변경되지 않음
  And `amount: 128000, expense: 200000` 인 경우 `{ ok:false, error: "경비는 수입보다 클 수 없어요" }`를 반환
  And `date: "2099-01-01"`(미래)인 경우 `{ ok:false, error: "미래 날짜는 기록할 수 없어요" }`를 반환

- **AC-7 [W][P1]: Scenario: 기록 상한 초과**
  Given `gigledger.entries.v1`에 5,000건이 저장되어 있을 때
  When `saveEntry(...)`로 5,001번째를 저장 시도
  Then `{ ok:false, error: "기록은 최대 5,000건까지 저장할 수 있어요" }`를 반환하고 저장되지 않음

- **AC-8 [S][P1]: Scenario: 데이터 로딩 상태 제공**
  Given 앱 부팅 중 저장소 읽기가 완료되기 전일 때
  While `useLedger()` 훅의 `status === 'loading'`
  Then 훅은 `{ platforms: [], entries: [], status: 'loading' }`를 반환하고, 완료 후 `status === 'ready'`로 1회 전환됨

---

### F2. 플랫폼 관리

- **Description**: 사용자가 자신의 수입원 플랫폼을 추가·수정·보관(archive)할 수 있는 화면과 로직이다. 기본 3종 외에 `크몽`, `배민커넥트` 등 임의 플랫폼을 최대 20개까지 등록할 수 있으며, 각 플랫폼은 카테고리와 색상 토큰을 갖는다. 삭제 대신 보관 처리를 하여 과거 기록의 무결성을 유지한다.
- **Data**: Platform, IncomeEntry(참조 무결성)
- **API**: 해당 없음
- **Requirements**: 화면 `/platforms`, BottomSheet 기반 추가/수정 폼

- **AC-1 [E][P0]: Scenario: 플랫폼 추가 성공**
  Given `/platforms` 화면에서 등록 플랫폼이 3개일 때
  When BottomSheet에서 `{ name: "크몽", category: "freelance", colorToken: "purple" }` 입력 후 TDS Button `"추가"` 탭
  Then 목록에 `크몽` ListRow가 추가되고 Toast `"플랫폼을 추가했어요"` 표시
  And `gigledger.platforms.v1` 길이가 4가 됨

- **AC-2 [W][P1]: Scenario: 중복 이름 거부**
  Given 플랫폼 `배달`이 이미 존재할 때
  When `{ name: " 배달 " }`로 추가 시도
  Then TDS TextField 하단에 `"이미 등록된 플랫폼이에요"` 에러 문구 표시
  And 목록 길이가 변하지 않음

- **AC-3 [W][P1]: Scenario: 이름 길이 검증**
  Given 플랫폼 추가 BottomSheet가 열려 있을 때
  When `name`이 빈 문자열이면 `"플랫폼 이름을 입력해주세요"` 표시
  And `name`이 13자 이상이면 입력이 12자에서 잘리고 `"12자까지 입력할 수 있어요"` 표시
  Then 두 경우 모두 `"추가"` 버튼은 `disabled` 상태

- **AC-4 [E][P0]: Scenario: 플랫폼 보관**
  Given 플랫폼 `대리운전`(id: `p2`)에 기록 5건이 있을 때
  When 해당 ListRow 탭 → BottomSheet → `"보관하기"` 탭 → AlertDialog `"보관할까요?"`에서 `"보관"` 확인
  Then `p2.archived === true`가 되고, `/entry` 플랫폼 선택 Chip 목록에서 사라짐
  And 기존 기록 5건은 삭제되지 않고 `/`(홈) 목록에 계속 표시됨

- **AC-5 [W][P1]: Scenario: 등록 상한**
  Given 활성 플랫폼이 20개일 때
  When `"플랫폼 추가"` 버튼 탭
  Then Toast `"플랫폼은 최대 20개까지 등록할 수 있어요"` 표시되고 BottomSheet가 열리지 않음

- **AC-6 [S][P1]: Scenario: 전부 보관된 빈 상태**
  Given 모든 플랫폼이 `archived: true`일 때
  While `/platforms` 화면 표시 중
  Then `Asset.ContentIcon`과 `"등록된 플랫폼이 없어요"` 문구, `display="block"` TDS Button `"플랫폼 추가"`가 표시됨

- **AC-7 [U][P1]: Scenario: 목록 레이아웃 계약**
  Given `/platforms` 화면이 렌더링될 때
  Then 화면은 `ScreenScaffold`로 감싸이고, 각 플랫폼은 `data-testid="platform-row"` TDS ListRow로 렌더링되며 좌측에 색상 Chip, 우측에 누적 순수입 금액이 표시됨

---

### F3. 일일 수입 입력

- **Description**: 하루 단위로 플랫폼을 선택해 총수입·경비·근무시간·메모를 입력하는 폼 화면이다. 홈에서 기존 기록을 탭하면 동일 폼이 수정 모드로 열리며 삭제도 가능하다. 모바일 키보드에서 금액/시간 입력이 끊기지 않도록 숫자 키패드와 스크롤 보정을 적용한다.
- **Data**: IncomeEntry, Platform
- **API**: 해당 없음
- **Requirements**: 화면 `/entry`, 신규/수정 모드 분기

- **AC-1 [E][P0]: Scenario: 신규 기록 저장 성공**
  Given `/entry`에 `location.state = { date: "2026-08-31" }`로 진입했고 플랫폼 `배달`을 선택했을 때
  When `{ amount: 128000, expense: 18000, minutes: 330, memo: "피크타임" }` 입력 후 하단 고정 SubmitFooter의 TDS Button `"저장"` 탭
  Then 기록이 저장되고 Toast `"기록을 저장했어요"` 표시
  And `navigate('/', { replace: true })`로 홈 이동, 홈 오늘 합계가 `128,000원`으로 갱신됨

- **AC-2 [E][P0]: Scenario: 기존 기록 수정**
  Given `/entry`에 `location.state = { entryId: "e1" }`로 진입했을 때
  When 폼이 기존 값 `{ amount: 128000 }`으로 프리필된 상태에서 `amount`를 `150000`으로 변경 후 `"저장"` 탭
  Then 같은 `id: "e1"` 레코드의 `amount`가 `150000`, `updatedAt`이 갱신되고 새 레코드는 생성되지 않음(entries 길이 불변)

- **AC-3 [E][P0]: Scenario: 기록 삭제**
  Given 수정 모드(`entryId: "e1"`)일 때
  When Top 우측 `"삭제"` 탭 → TDS AlertDialog `"이 기록을 삭제할까요?"`에서 `"삭제"` 확인
  Then `e1`이 제거되고 Toast `"기록을 삭제했어요"` 표시 후 홈으로 이동

- **AC-4 [W][P1]: Scenario: 필수값 미입력 거부**
  Given `/entry` 신규 모드일 때
  When 플랫폼 미선택 상태로 `"저장"` 탭
  Then `"플랫폼을 선택해주세요"` 에러 표시되고 저장되지 않음
  And `amount`가 비어 있거나 `0`이면 `"금액을 입력해주세요"` 표시
  And `expense > amount`이면 `"경비는 수입보다 클 수 없어요"` 표시

- **AC-5 [W][P1]: Scenario: 범위 초과 입력 방어**
  Given `/entry` 입력 폼에서
  When `amount`에 `99999999`(1천만 초과) 입력
  Then `"금액은 1,000만원까지 입력할 수 있어요"` 표시 및 `"저장"` 버튼 `disabled`
  And `minutes` 입력이 `1500`이면 `"근무 시간은 24시간을 넘을 수 없어요"` 표시

- **AC-6 [U][P0]: Scenario: 모바일 키보드 동작**
  Given `/entry` 폼이 렌더링될 때
  Then 금액/경비/시간 TDS TextField는 `inputMode="numeric"`, `pattern="[0-9]*"`를 가지며
  And 포커스 시 해당 필드가 키보드 위로 스크롤되고(`scrollIntoView({ block: 'center' })`), SubmitFooter가 입력 필드를 가리지 않음
  And 메모 필드에서 `Enter` 입력 시 폼이 제출되지 않음

- **AC-7 [S][P1]: Scenario: 플랫폼 0개 상태**
  Given 활성 플랫폼이 0개일 때
  While `/entry` 화면 표시 중
  Then 입력 폼 대신 `Asset.ContentIcon` + `"먼저 플랫폼을 등록해주세요"`와 `display="block"` TDS Button `"플랫폼 등록하기"`가 표시됨
  And 버튼 탭 시 `navigate('/platforms')`

- **AC-8 [U][P1]: Scenario: 폼 레이아웃 계약**
  Given `/entry` 화면이 렌더링될 때
  Then 화면은 `ScreenScaffold` + `Top`(title `"수입 기록"`)으로 구성되고
  And 플랫폼 선택은 가로 스크롤 TDS Chip 그룹(`data-testid="platform-chips"`), 저장 버튼은 하단 고정 `SubmitFooter`(`data-testid="entry-submit"`)에 배치되며 좌측 글자폭 버튼을 사용하지 않음

---

### F4. 홈 대시보드 (주간/월간 합산)

- **Description**: 이번 주·이번 달 총수입, 순수입, 근무시간을 한 화면에서 합산해 보여주는 앱의 메인 화면이다. 상단 TDS Tab으로 `주간`/`월간`을 전환하며, 최근 14일 순수입 추이 Sparkline과 플랫폼별 비중 MiniBar를 제공한다. 하단에는 최근 기록 리스트가 날짜 내림차순으로 표시된다.
- **Data**: IncomeEntry, Platform
- **API**: 해당 없음
- **Requirements**: 화면 `/`, `calcPeriodSummary(entries, period)` 사용

- **AC-1 [U][P0]: Scenario: 기간 합계 표시**
  Given 이번 달 기록이 `[{amount:128000,expense:18000,minutes:330},{amount:60000,expense:5000,minutes:120}]`일 때
  When `/` 화면의 Tab이 `월간`일 때
  Then `data-testid="summary-hero"` SummaryHero에 순수입 `165,000원`이 CountUp으로 표시되고
  And 보조 지표로 총수입 `188,000원`, 경비 `23,000원`, 근무 `7시간 30분`이 표시됨

- **AC-2 [E][P0]: Scenario: 주간/월간 탭 전환**
  Given `/` 화면에서 Tab이 `월간`일 때
  When TDS Tab의 `주간` 탭을 탭
  Then 집계 기간이 월요일 시작 이번 주로 바뀌고 SummaryHero 값이 해당 기간 합계로 갱신됨
  And 선택된 탭 상태가 리렌더 후에도 유지됨

- **AC-3 [U][P0]: Scenario: 추이/비중 시각화**
  Given 최근 14일 중 8일에 기록이 있을 때
  When `/` 화면이 렌더링될 때
  Then `data-testid="trend-sparkline"` Sparkline이 14개 데이터 포인트(기록 없는 날은 `0`)로 렌더링되고
  And `data-testid="platform-minibar"` MiniBar가 플랫폼별 순수입 비중을 내림차순으로 표시하며 각 항목에 플랫폼명과 백분율(정수, 반올림)이 표기됨

- **AC-4 [E][P0]: Scenario: 기록 항목 탭 → 수정 진입**
  Given 최근 기록 리스트에 `id: "e1"` 항목이 있을 때
  When 해당 TDS ListRow를 탭
  Then `navigate('/entry', { state: { entryId: "e1" } })`가 호출됨

- **AC-5 [S][P1]: Scenario: 빈 상태**
  Given `entries.length === 0`일 때
  While `/` 화면 표시 중
  Then SummaryHero 대신 `Asset.ContentIcon` + `"아직 기록이 없어요"` + `"오늘 번 돈을 기록해보세요"`가 표시되고
  And `display="block"` TDS Button `"수입 기록하기"`가 표시되며 탭 시 `navigate('/entry', { state: { date: <오늘 YYYY-MM-DD> } })`

- **AC-6 [S][P1]: Scenario: 로딩 상태**
  Given `useLedger().status === 'loading'`일 때
  While `/` 화면 표시 중
  Then `data-testid="home-skeleton"` 스켈레톤 3블록이 표시되고 SummaryHero/리스트는 렌더링되지 않음

- **AC-7 [W][P1]: Scenario: 삭제된 플랫폼 기록 표시**
  Given `entries`에 `platformId: "deleted-x"`(존재하지 않는 플랫폼) 기록이 있을 때
  When `/` 화면 리스트가 렌더링될 때
  Then 해당 ListRow의 플랫폼명이 `"삭제된 플랫폼"`으로 표시되고 크래시가 발생하지 않음

- **AC-8 [U][P1]: Scenario: 긴 목록 스크롤 성능**
  Given `entries`가 1,000건일 때
  When `/` 화면을 렌더링
  Then 최근 기록 리스트는 초기 30건만 렌더링하고, 리스트 하단 200px 진입 시 30건씩 추가 로드(무한 스크롤)하며 DOM ListRow 노드 수가 항상 100 이하로 유지됨

- **AC-9 [U][P1]: Scenario: 배너 광고 배치**
  Given `/` 화면에 기록이 1건 이상 있을 때
  Then `<AdSlot adGroupId={import.meta.env.VITE_TOSS_AD_GROUP_ID} />`가 요약 카드 섹션과 최근 기록 리스트 섹션 **사이**에 1회만 배치되고, 콘텐츠를 덮거나 고정 오버레이로 표시되지 않음

---

### F5. 플랫폼별 실질 시급

- **Description**: 플랫폼마다 (총수입 − 경비) ÷ 근무시간으로 실질 시급을 계산해 순위로 비교하는 화면이다. 기간(이번 주 / 이번 달 / 전체) 필터를 제공하며, 각 플랫폼 카드에 시급·순수입·근무시간·건수를 함께 보여준다. 최저임금(2026년 기준 `10,320원`, 상수)과 비교 배지를 표기한다.
- **Data**: IncomeEntry, Platform
- **API**: 해당 없음
- **Requirements**: 화면 `/wage`, `calcHourlyWage` 재사용

- **AC-1 [U][P0]: Scenario: 플랫폼별 시급 계산 및 정렬**
  Given 이번 달 기록이 `배달: {net:110000, minutes:330}`, `대리운전: {net:80000, minutes:180}`일 때
  When `/wage` 화면에서 기간 `월간` 선택
  Then `data-testid="wage-card"` Card가 2개 렌더링되고 시급 내림차순으로 `대리운전 26,667원` → `배달 20,000원` 순서로 표시됨

- **AC-2 [U][P0]: Scenario: 최저임금 비교 배지**
  Given 플랫폼 `배달`의 실질 시급이 `9,500원`일 때
  When `/wage` 화면이 렌더링될 때
  Then 해당 Card에 TDS Chip 배지 `"최저임금 미만"`이 표시됨
  And 시급이 `20,000원`인 플랫폼에는 `"최저임금 대비 194%"` 배지가 표시됨

- **AC-3 [E][P1]: Scenario: 기간 필터 전환**
  Given `/wage` 화면에서 기간이 `월간`일 때
  When TDS Chip `"전체"`를 탭
  Then 전체 기록 기준으로 재계산되어 Card 값이 갱신되고, 선택된 Chip이 활성 상태로 표시됨

- **AC-4 [W][P1]: Scenario: 근무시간 미입력 플랫폼**
  Given 플랫폼 `크몽`의 해당 기간 `minutes` 합이 `0`일 때
  When `/wage` 화면이 렌더링될 때
  Then 해당 Card의 시급이 `"—"`로 표시되고 보조 문구 `"근무 시간을 입력하면 시급을 계산해드려요"`가 표시되며 정렬 시 목록 최하단에 배치됨

- **AC-5 [W][P1]: Scenario: 경비가 수입을 초과하는 과거 데이터**
  Given 저장된 기록 중 `net`이 음수인 항목이 있을 때
  When 시급을 계산
  Then 음수 시급도 그대로 `-3,000원`처럼 표시되며 `NaN`/`Infinity`가 화면에 출력되지 않음

- **AC-6 [S][P1]: Scenario: 빈 상태**
  Given 선택 기간에 기록이 0건일 때
  While `/wage` 화면 표시 중
  Then `Asset.ContentIcon` + `"이 기간에는 기록이 없어요"`가 표시되고 Card는 렌더링되지 않음

- **AC-7 [U][P1]: Scenario: 레이아웃 계약**
  Given `/wage` 화면이 렌더링될 때
  Then 화면은 `ScreenScaffold` + `Top`(title `"실질 시급"`)으로 구성되고, 각 플랫폼은 Card(`data-testid="wage-card"`)로 묶이며 시급 값은 t2 강조 타이포로 표시됨(맨 div 나열 금지)

---

### F6. 스트릭 & 목표 달성률

- **Description**: 연속 기록 일수(스트릭)와 이번 달 목표 수입 대비 달성률을 계산·표시한다. 목표 금액은 설정 화면에서 지정하며, 홈 상단 카드에 현재 스트릭·최고 스트릭·달성률 진행바가 노출된다. 오늘 기록이 없으면 스트릭 유지 안내를 표시한다.
- **Data**: IncomeEntry, Settings
- **API**: 해당 없음
- **Requirements**: 화면 `/settings`(목표 설정) + `/` 상단 카드(스트릭/달성률)

- **AC-1 [U][P0]: Scenario: 목표 달성률 계산 및 표시**
  Given `monthlyGoal = 3000000`이고 이번 달 총수입이 `1,200,000원`일 때
  When `/` 화면이 렌더링될 때
  Then `data-testid="goal-card"` Card에 `"40%"`와 `"1,200,000원 / 3,000,000원"`이 표시되고 진행바 width가 `40%`로 렌더링됨

- **AC-2 [U][P0]: Scenario: 달성률 100% 상한**
  Given `monthlyGoal = 1000000`이고 이번 달 총수입이 `1,500,000원`일 때
  Then 진행바 width는 `100%`로 고정되고 텍스트는 `"150%"`와 Chip 배지 `"목표 달성"`이 표시됨

- **AC-3 [E][P0]: Scenario: 목표 금액 설정**
  Given `/settings` 화면에서
  When TDS TextField에 `3000000` 입력 후 `"저장"` 탭
  Then `gigledger.settings.v1.monthlyGoal === 3000000`이 저장되고 Toast `"목표를 저장했어요"` 표시

- **AC-4 [U][P0]: Scenario: 스트릭 표시 및 최고 기록 갱신**
  Given 오늘이 `2026-08-31`, 기록 날짜가 `["2026-08-31","2026-08-30","2026-08-29"]`이고 `bestStreak = 2`일 때
  When `/` 화면이 렌더링될 때
  Then `data-testid="streak-card"`에 `"3일 연속 기록 중"`이 표시되고 `settings.bestStreak`가 `3`으로 갱신되어 저장됨

- **AC-5 [S][P1]: Scenario: 오늘 미기록 상태**
  Given 오늘 `2026-08-31` 기록이 없고 어제 `2026-08-30` 기록이 있을 때
  While `/` 화면 표시 중
  Then 스트릭 카드에 `"오늘 기록하면 2일 연속이 이어져요"` 문구와 `display="block"` TDS Button `"오늘 기록하기"`가 표시됨

- **AC-6 [W][P1]: Scenario: 잘못된 목표 금액 거부**
  Given `/settings` 목표 입력 필드에서
  When `5000` 입력 후 `"저장"` 탭
  Then `"목표는 10,000원 이상으로 설정해주세요"` 표시되고 저장되지 않음
  And `100000000` 입력 시 `"목표는 5,000만원까지 설정할 수 있어요"` 표시

- **AC-7 [S][P1]: Scenario: 목표 미설정 상태**
  Given `monthlyGoal === 0`일 때
  While `/` 화면 표시 중
  Then 목표 카드 자리에 `"이번 달 목표를 정해보세요"` 문구와 `"목표 설정"` 버튼이 표시되고 진행바는 렌더링되지 않음

---

### F7. 월간 소득 리포트 (리워드 광고 게이트)

- **Description**: 한 달치 수입을 정리한 리포트(총수입·총경비·순수입·평균 실질시급·플랫폼별 순위·전월 대비 증감·최고 수입일)를 제공한다. 리포트 본문은 `TossRewardAd`로 게이트하며, 사용자가 보상형 광고를 끝까지 시청하면 해당 월이 해금되어 이후 재시청 없이 열람 가능하다. 월 선택은 최근 12개월 범위에서 이전/다음 이동으로 한다.
- **Data**: IncomeEntry, Platform, ReportUnlockMap
- **API**: 해당 없음
- **Requirements**: 화면 `/report`, 템플릿 `TossRewardAd` 사용

- **AC-1 [E][P0]: Scenario: 결과 보기 전 보상형 광고**
  Given `2026-08` 리포트가 해금되지 않은 상태(`reportUnlocks["2026-08"]` 없음)에서 `/report` 진입
  When 잠금 화면의 TDS Button `"광고 보고 리포트 확인"` 탭 후 `TossRewardAd` 광고 시청 완료
  Then 리포트 본문이 표시되고 `gigledger.reportUnlocks.v1["2026-08"]`에 해금 시각(ISO8601)이 저장됨

- **AC-2 [S][P0]: Scenario: 해금된 월 재열람**
  Given `reportUnlocks["2026-08"]`가 존재할 때
  While `/report`에서 `2026-08`을 보고 있음
  Then 광고 게이트 없이 즉시 리포트 본문이 표시됨

- **AC-3 [U][P0]: Scenario: 리포트 지표 정확성**
  Given `2026-08` 기록이 총수입 `2,400,000원`, 총경비 `300,000원`, 총 근무 `12,000분`이고 `2026-07` 순수입이 `1,750,000원`일 때
  When 리포트 본문이 표시될 때
  Then `data-testid="report-hero"`에 순수입 `2,100,000원`(CountUp), 평균 실질 시급 `10,500원`,
  And 전월 대비 `"+20%"`, 플랫폼별 순위 Card 목록, `data-testid="report-best-day"`에 최고 수입일(날짜 + 금액)이 표시됨

- **AC-4 [W][P1]: Scenario: 광고 로드/시청 실패**
  Given `/report` 잠금 화면에서
  When 광고 로드 실패 또는 사용자가 중도 종료
  Then Toast `"광고를 불러오지 못했어요. 잠시 후 다시 시도해주세요"` 표시
  And 해당 월은 잠금 상태를 유지하고 `reportUnlocks`에 키가 추가되지 않으며, 잠금 화면에 `"다시 시도"` 버튼이 표시됨

- **AC-5 [S][P1]: Scenario: 기록 없는 월**
  Given `2026-06`에 기록이 0건일 때
  While `/report`에서 `2026-06`을 선택
  Then 광고 게이트를 표시하지 않고 `Asset.ContentIcon` + `"이 달에는 기록이 없어요"`가 표시됨

- **AC-6 [W][P1]: Scenario: 월 이동 범위 제한**
  Given 오늘이 `2026-08-31`이고 `/report`에서 `2026-08`을 보고 있을 때
  When `"다음 달"` 버튼을 탭
  Then 버튼이 `disabled` 상태로 동작하지 않음
  And `2025-09`(12개월 전)에서 `"이전 달"` 버튼도 `disabled`

- **AC-7 [E][P1]: Scenario: 공유 카드로 이동**
  Given `2026-08` 리포트 본문이 표시된 상태일 때
  When 하단 TDS Button `"공유 카드 만들기"` 탭
  Then `navigate('/share', { state: { month: "2026-08" } })`가 호출됨

- **AC-8 [U][P1]: Scenario: 리포트 레이아웃 계약 및 광고 배치**
  Given 리포트 본문이 표시될 때
  Then 화면은 `ScreenScaffold`로 감싸이고 지표는 `data-testid="report-metric-card"` Card 3개 이상으로 묶이며 핵심 값은 t2~t3 강조 타이포로 표시됨
  And `<AdSlot adGroupId={import.meta.env.VITE_TOSS_AD_GROUP_ID} />`가 리포트 본문 **아래**(공유 버튼 위)에 1회 배치되어 콘텐츠와 겹치지 않음

---

### F8. 수입 변동 공유 카드

- **Description**: 선택한 월의 순수입·실질 시급·스트릭·플랫폼 비중을 한 장으로 요약한 카드 뷰를 생성한다. 카드는 화면 안에서 미리보기로 렌더링되고, 요약 텍스트 클립보드 복사와 이미지 저장(Canvas → PNG DataURL)을 지원한다. 외부 SNS 앱 호출이나 외부 도메인 이동은 하지 않는다.
- **Data**: IncomeEntry, Platform, Settings
- **API**: 해당 없음
- **Requirements**: 화면 `/share`, Canvas 2D 렌더링(`devicePixelRatio` 반영)

- **AC-1 [U][P0]: Scenario: 공유 카드 미리보기 렌더링**
  Given `/share`에 `location.state = { month: "2026-08" }`로 진입했을 때
  When 화면이 렌더링될 때
  Then `data-testid="share-card"` 카드가 표시되고 내부에 `"2026년 8월"`, 순수입 `2,100,000원`, 실질 시급 `10,500원`, `"3일 연속 기록"`, 플랫폼 비중 MiniBar가 포함됨

- **AC-2 [E][P0]: Scenario: 요약 텍스트 복사**
  Given `/share` 카드가 표시된 상태일 때
  When TDS Button `"요약 복사"` 탭
  Then `navigator.clipboard.writeText`에 `"2026년 8월 순수입 2,100,000원 · 실질 시급 10,500원 (GigLedger)"` 문자열이 전달되고 Toast `"요약을 복사했어요"` 표시

- **AC-3 [E][P1]: Scenario: 이미지 저장**
  Given `/share` 카드가 표시된 상태일 때
  When TDS Button `"이미지 저장"` 탭
  Then Canvas가 `1080 × 1350`(px) 크기로 그려지고 `toDataURL('image/png')` 결과가 생성되어 저장 동작이 트리거되며 Toast `"이미지를 저장했어요"` 표시

- **AC-4 [W][P1]: Scenario: 클립보드 미지원/차단**
  Given `navigator.clipboard`가 `undefined`이거나 `writeText`가 reject할 때
  When `"요약 복사"` 탭
  Then Toast `"복사할 수 없어요. 아래 텍스트를 길게 눌러 복사해주세요"` 표시
  And 선택 가능한 요약 텍스트 블록(`data-testid="share-fallback-text"`)이 카드 하단에 노출됨

- **AC-5 [W][P1]: Scenario: 잘못된 진입 state**
  Given `/share`에 `location.state`가 `null`이거나 `month`가 `"YYYY-MM"` 형식이 아닐 때
  When 화면이 렌더링될 때
  Then 현재 달(`오늘 기준 YYYY-MM`)로 대체 렌더링되고 크래시가 발생하지 않음

- **AC-6 [S][P1]: Scenario: 카드 생성 로딩 상태**
  Given `"이미지 저장"`을 탭한 직후 Canvas 렌더링이 진행 중일 때
  While 렌더링 중
  Then 버튼이 `loading` 상태로 전환되어 중복 탭이 무시되고, 완료 후 원래 라벨로 복귀함

- **AC-7 [W][P0]: Scenario: 외부 공유 경로 차단**
  Given `/share` 화면 코드에서
  Then `navigator.share`, `window.open`, 카카오/인스타 등 외부 앱 스킴(`intent://`, `kakaolink://`) 호출이 0건이며, 공유는 클립보드 복사와 이미지 저장으로만 제공됨

---

## Screen Definitions

### S1. 홈 대시보드 — `/`
- **TDS 컴포넌트**: `Top`(title `"GigLedger"`), `Tab`(주간/월간), `Paragraph.Text`, `ListRow`(최근 기록), `Chip`(플랫폼 색), `Button`, `Spacing`, `Toast`, `Asset.ContentIcon`
- **템플릿/커스텀**: `ScreenScaffold`, `SummaryHero`(CountUp), `Sparkline`(최근 14일 순수입), `MiniBar`(플랫폼 비중), `FloatingTabBar`, `AdSlot`
- **레이아웃 계약**: `ScreenScaffold` > `Top` > `Tab` > `SummaryHero`(`data-testid="summary-hero"`) > Card 2개(`data-testid="streak-card"`, `data-testid="goal-card"`) > `Sparkline`(`data-testid="trend-sparkline"`) + `MiniBar`(`data-testid="platform-minibar"`) > `AdSlot` > 최근 기록 `ListRow` 목록. 섹션 간격은 `Spacing size={16}`만 사용.
- **상태**: Loading = `data-testid="home-skeleton"` 스켈레톤 3블록 / Empty = `Asset.ContentIcon` + `"아직 기록이 없어요"` + `display="block"` Button `"수입 기록하기"` / Error = Toast `"일부 저장 데이터를 불러오지 못했어요"` 후 빈 상태 렌더
- **터치**: 모든 `ListRow` 높이 ≥ 56px, FAB형 `"기록하기"` 버튼 56×56px, Tab 항목 높이 ≥ 44px
- **스크롤**: 최근 기록은 초기 30건 + 하단 200px 진입 시 30건 추가 로드, DOM 노드 100 이하 유지
- **Navigation state 계약**
  - Outgoing: `"기록하기" → navigate('/entry', { state: { date: string /* 'YYYY-MM-DD' */ } })`
  - Outgoing: `기록 ListRow 탭 → navigate('/entry', { state: { entryId: string } })`
  - Outgoing: `"목표 설정" → navigate('/settings')` (state 없음)
  - Outgoing: `시급 카드 더보기 → navigate('/wage')` (state 없음)
  - Incoming: `location.state = null` (홈은 state를 읽지 않음)

### S2. 수입 입력/수정 — `/entry`
- **TDS 컴포넌트**: `Top`(title `"수입 기록"`, 우측 액션 `"삭제"`는 수정 모드에서만), `Chip`(플랫폼 선택), `TextField`(금액/경비/시간/메모), `Button`, `AlertDialog`(삭제 확인), `Toast`, `Spacing`
- **템플릿/커스텀**: `ScreenScaffold`, `SubmitFooter`(하단 고정 저장 버튼)
- **레이아웃 계약**: `ScreenScaffold` > `Top` > 날짜 선택 Row > 플랫폼 Chip 가로 스크롤(`data-testid="platform-chips"`) > TextField 4개 > `SubmitFooter`(`data-testid="entry-submit"`, `display="block"` Button). 좌측 글자폭 버튼 금지.
- **상태**: Loading = 수정 모드에서 `entryId` 조회 중 스켈레톤 폼 / Empty = 활성 플랫폼 0개 시 `Asset.ContentIcon` + `"먼저 플랫폼을 등록해주세요"` / Error = 필드별 인라인 에러 문구(F3 AC-4, AC-5의 고정 문구)
- **키보드**: 금액/경비/시간 필드 `inputMode="numeric"` + `pattern="[0-9]*"`, 포커스 시 `scrollIntoView({ block:'center' })`, 메모 필드 Enter는 제출 트리거 아님, `SubmitFooter`는 키보드 오픈 시 입력 필드를 가리지 않음
- **터치**: Chip 높이 44px 이상, 저장 버튼 높이 56px
- **Navigation state 계약**
  - Incoming: `location.state = { date: string } | { entryId: string } | null`
    - `{ date }` → 신규 모드, 해당 날짜 프리필
    - `{ entryId }` → 수정 모드, 해당 기록 프리필. 없는 id면 Toast `"기록을 찾을 수 없어요"` 후 `navigate('/', { replace: true })`
    - `null` → 신규 모드, 오늘 날짜 프리필
  - Outgoing: `저장/삭제 완료 → navigate('/', { replace: true })` (state 없음)
  - Outgoing: `"플랫폼 등록하기" → navigate('/platforms')` (state 없음)

### S3. 플랫폼 관리 — `/platforms`
- **TDS 컴포넌트**: `Top`(title `"플랫폼"`), `ListRow`, `Chip`(카테고리/색상), `BottomSheet`(추가·수정 폼), `TextField`, `Button`, `AlertDialog`(보관 확인), `Toast`, `Spacing`, `Asset.ContentIcon`
- **템플릿/커스텀**: `ScreenScaffold`
- **레이아웃 계약**: `ScreenScaffold` > `Top` > `ListRow` 목록(`data-testid="platform-row"`, 좌: 색상 Chip + 이름, 우: 누적 순수입) > 하단 고정 `SubmitFooter`의 `display="block"` Button `"플랫폼 추가"`
- **상태**: Loading = ListRow 스켈레톤 3개 / Empty = `Asset.ContentIcon` + `"등록된 플랫폼이 없어요"` / Error = 중복·길이 검증 인라인 에러(F2 AC-2, AC-3)
- **키보드**: 플랫폼 이름 TextField는 `maxLength=12`, BottomSheet 오픈 시 자동 포커스, 키보드 위로 시트 컨텐츠 리프트
- **터치**: ListRow 56px, BottomSheet 내 색상 선택 Chip 44×44px
- **Navigation state 계약**
  - Incoming: `location.state = null`
  - Outgoing: 없음(추가/수정은 BottomSheet 내 처리, 라우팅 이동 없음)

### S4. 실질 시급 — `/wage`
- **TDS 컴포넌트**: `Top`(title `"실질 시급"`), `Chip`(기간 필터: 주간/월간/전체), `Paragraph.Text`, `Spacing`, `Asset.ContentIcon`
- **템플릿/커스텀**: `ScreenScaffold`, Card(`data-testid="wage-card"`), `MiniBar`(플랫폼 간 시급 비교)
- **레이아웃 계약**: `ScreenScaffold` > `Top` > 기간 Chip 그룹 > 플랫폼 Card 목록(시급 내림차순). 각 Card는 시급 t2 강조 + 최저임금 비교 Chip 배지 + 보조 라인(순수입 / 근무시간 / 기록 건수). 맨 div 나열 금지.
- **상태**: Loading = Card 스켈레톤 2개 / Empty = `Asset.ContentIcon` + `"이 기간에는 기록이 없어요"` / Error = 시급 계산 불가 시 `"—"` + 안내 문구
- **터치**: 기간 Chip 44px, Card 전체는 비인터랙티브(탭 액션 없음)
- **스크롤**: 최대 20개 플랫폼 → 일반 세로 스크롤(가상 스크롤 불필요)
- **Navigation state 계약**
  - Incoming: `location.state = { period?: 'week' | 'month' | 'all' } | null` (없으면 `'month'` 기본)
  - Outgoing: 없음

### S5. 월간 리포트 — `/report`
- **TDS 컴포넌트**: `Top`(title `"월간 리포트"`), `Button`(이전/다음 달, 광고 시청, 공유 카드), `Paragraph.Text`, `Chip`(증감 배지), `Toast`, `Spacing`, `Asset.ContentIcon`
- **템플릿/커스텀**: `ScreenScaffold`, `TossRewardAd`(리포트 본문 게이트), `SummaryHero`(`data-testid="report-hero"`), Card(`data-testid="report-metric-card"`), `MiniBar`, `Sparkline`(월 내 일별 순수입 추이), `AdSlot`
- **레이아웃 계약**: `ScreenScaffold` > `Top` > 월 네비게이션 Row > `<TossRewardAd slotId={import.meta.env.VITE_TOSS_AD_SLOT_ID}>` 안에 리포트 본문(SummaryHero + metric Card 3개 + 플랫폼 순위 + `data-testid="report-best-day"` + Sparkline) > `AdSlot` > `SubmitFooter`의 `display="block"` Button `"공유 카드 만들기"`
- **게이트 대상**: `TossRewardAd`가 감싸는 콘텐츠 = 월간 순수입/경비/평균시급/플랫폼 순위/최고 수입일 전체. 잠금 상태에서는 월 총 기록 건수만 노출.
- **상태**: Loading = 광고 로드 중 버튼 `loading` 상태 / Empty = 기록 0건 월은 게이트 없이 `"이 달에는 기록이 없어요"` / Error = 광고 실패 Toast `"광고를 불러오지 못했어요. 잠시 후 다시 시도해주세요"` + `"다시 시도"` 버튼
- **터치**: 이전/다음 달 버튼 44×44px, 광고 시청 버튼 높이 56px
- **Navigation state 계약**
  - Incoming: `location.state = { month?: string /* 'YYYY-MM' */ } | null` (없으면 오늘 기준 현재 월)
  - Outgoing: `"공유 카드 만들기" → navigate('/share', { state: { month: string /* 'YYYY-MM' */ } })`

### S6. 공유 카드 — `/share`
- **TDS 컴포넌트**: `Top`(title `"공유 카드"`, 좌측 뒤로), `Button`(요약 복사 / 이미지 저장), `Paragraph.Text`, `Toast`, `Spacing`
- **템플릿/커스텀**: `ScreenScaffold`, Card(`data-testid="share-card"`), `MiniBar`, hidden `<canvas>`
- **레이아웃 계약**: `ScreenScaffold` > `Top` > 미리보기 Card(가로폭 100%, 비율 4:5 고정) > `Spacing size={16}` > 버튼 2개(세로 스택, 각 `display="block"`) > 실패 시 `data-testid="share-fallback-text"` 텍스트 블록
- **상태**: Loading = 이미지 생성 중 버튼 `loading` / Empty = 해당 월 기록 0건이면 `"기록이 있어야 카드를 만들 수 있어요"` + `"기록하러 가기"` 버튼 / Error = 클립보드 실패 시 fallback 텍스트 노출
- **터치**: 두 버튼 모두 높이 56px
- **Navigation state 계약**
  - Incoming: `location.state = { month: string /* 'YYYY-MM' */ } | null` (형식 불일치/null → 현재 월로 대체)
  - Outgoing: `"기록하러 가기" → navigate('/entry', { state: { date: string } })`

### S7. 설정 — `/settings`
- **TDS 컴포넌트**: `Top`(title `"설정"`), `TextField`(월 목표 금액), `ListRow`(플랫폼 관리 이동, 데이터 초기화), `Switch`(추후 확장 없음 — 미사용), `Button`, `AlertDialog`(초기화 확인), `Toast`, `Spacing`
- **템플릿/커스텀**: `ScreenScaffold`, `SubmitFooter`
- **레이아웃 계약**: `ScreenScaffold` > `Top` > 목표 금액 TextField 섹션 > `ListRow` 목록(`"플랫폼 관리"`, `"데이터 초기화"`) > `SubmitFooter`의 `display="block"` Button `"저장"`
- **상태**: Loading = 설정 로드 중 필드 `disabled` / Empty = 해당 없음(항상 폼 존재) / Error = 목표 범위 검증 인라인 에러(F6 AC-6)
- **키보드**: 목표 금액 `inputMode="numeric"`, 포커스 시 SubmitFooter가 필드를 가리지 않도록 리프트
- **터치**: ListRow 56px, 저장 버튼 56px
- **Navigation state 계약**
  - Incoming: `location.state = null`
  - Outgoing: `"플랫폼 관리" → navigate('/platforms')` (state 없음)

### 하단 네비게이션 (FloatingTabBar)
- 4개 탭: `홈`(`/`), `기록`(`/entry`), `리포트`(`/report`), `설정`(`/settings`). 각 탭 터치 타깃 ≥ 48×48px.
- `/platforms`, `/wage`, `/share`는 탭 없이 푸시된 하위 화면이며 `Top` 좌측 뒤로 버튼으로 복귀한다.

---

## API Contract

**해당 없음.** GigLedger는 외부 API를 호출하지 않는다. 모든 데이터는 사용자의 기기 `localStorage`에만 저장되며 네트워크 요청은 광고 SDK(`@apps-in-toss/web-framework`)가 내부적으로 수행하는 호출뿐이다.

- **AC-API-1 [U][P0]: Scenario: 외부 네트워크 요청 없음**
  Given 앱 소스 전체에서
  When `fetch(`, `XMLHttpRequest`, `axios` 사용을 검사
  Then 앱 코드 내 직접 호출이 0건 (따라서 CORS 에러 0건, 에러 응답 shape `{ error: string }` 규약 적용 대상 없음)

---

## Assumptions

- **A-1** 수입 데이터는 사용자가 수동 입력한다. 배달앱/대리운전 플랫폼의 자동 연동·크롤링·OCR은 범위 밖이다.
- **A-2** 데이터는 기기 로컬에만 존재하므로 앱 삭제·브라우저 스토리지 초기화 시 소실된다. 이 사실을 `/settings` 하단에 `"기록은 이 기기에만 저장돼요"` 문구로 고지한다.
- **A-3** 통화는 KRW 정수 원 단위만 지원하며 소수점·다중 통화는 지원하지 않는다.
- **A-4** 주 시작 요일은 월요일 고정, 타임존은 기기 로컬(Asia/Seoul 가정) 기준이다.
- **A-5** 최저임금 비교 기준값은 `10,320원`(2026년) 상수이며 코드 상수 `MIN_WAGE_2026`로 관리한다. 법정 고시 변경 시 상수만 수정한다.
- **A-6** 모든 리포트·시급·추이 값은 사용자가 입력한 데이터의 결정적 산술 계산 결과이며 생성형 AI를 사용하지 않는다. 따라서 "생성형 AI 고지" 및 "AI 결과물 라벨" 요구사항은 적용 대상이 아니다. 향후 AI 코멘트 기능을 추가하면 해당 AC 2건을 반드시 추가해야 한다.
- **A-7** 수익화는 광고 단독(배너 2슬롯 + 월간 리포트 리워드 광고)이며 IAP(`TossPurchase`)는 MVP 범위 밖이다.
- **A-8** 광고 그룹 ID / 슬롯 ID는 앱인토스 콘솔에서 발급받아 `VITE_TOSS_AD_GROUP_ID`, `VITE_TOSS_AD_SLOT_ID` 환경변수로 주입한다.
- **A-9** 프로모션 리워드(`grantPromotionReward`)는 MVP에 포함하지 않는다. 도입 시 `amount ≤ 5000` 검증 AC를 추가한다.
- **A-10** 세금(3.3% 원천징수, 종합소득세) 계산은 범위 밖이다. `경비` 필드는 사용자가 직접 입력하는 단일 숫자다.

---

## Open Questions

- **Q-1** 같은 날 같은 플랫폼에 여러 건 기록을 허용하는 현재 설계 대신, 하루 1건으로 합쳐 편집하는 방식이 긱워커 실사용에 더 맞는가? (현재 SPEC: 다건 허용)
- **Q-2** 월간 리포트 리워드 광고 해금을 "월 단위 영구 해금"으로 할지, "30일 후 재시청 요구"로 할지? (현재 SPEC: 영구 해금 — 재시청 유도 시 광고 수익 증가하나 UX 마찰)
- **Q-3** 경비를 항목별(유류비/수수료/식비)로 세분화할 필요가 있는가? (현재 SPEC: 단일 합계 필드)
- **Q-4** 5,000건 상한 도달 시 자동 아카이빙(오래된 12개월 초과 기록 요약 후 삭제)을 도입할지, 사용자 수동 삭제만 둘지?
- **Q-5** 공유 카드 이미지 저장이 토스 앱 웹뷰에서 실제 갤러리 저장까지 되는지 플랫폼 확인 필요. 불가 시 "이미지 저장" 버튼을 제거하고 클립보드 복사만 남긴다.
- **Q-6** 목표 수입을 월 단위 외에 주 단위로도 설정할 수 있어야 하는가? (현재 SPEC: 월 단위만)
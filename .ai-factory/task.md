# TASK — GigLedger (v2, 교차검증 반영판)

> 전제: 템플릿에 이미 존재하는 것 — `ScreenScaffold(PageShell)`, `FloatingTabBar`, `AdSlot`, `TossRewardAd`, `TossPurchase`, TDS 세팅, 토스 로그인(자동). 이들에 대한 태스크는 없음.
> 모든 태스크 완료 시점마다 `npm run build`(vite build)가 에러 0으로 통과해야 한다.

### 변경 이력 (v1 → v2)

| # | 갭 | 영향 태스크 | 조치 |
|---|---|---|---|
| GAP-1 (Blocking) | `bestStreak` 갱신 시점이 SPEC F6-AC4(`/` 렌더 시)와 TASK(앱 부팅 1회)에서 불일치 | **2.5 수정**, **4.4 수정** | `useLedger`에서 `bestStreak` 동기화를 부팅 1회가 아니라 `entries` 변경마다 실행되는 파생 효과로 재정의. 4.4에 "저장 직후 홈 복귀 시 갱신" 회귀 DoD 추가 |
| GAP-2 | 보관(archived) 플랫폼이 `/entry` Chip에서 제외된다는 계약이 4.3에 미명시 | **4.3 수정**, **2.2 수정** | 4.3에 `archived===false` 필터 DoD 추가. 2.2에 "수정 모드에서 archived 플랫폼 참조는 저장 허용" 규칙 추가(기록 무결성) |
| GAP-3 | 플랫폼 `colorToken` 선택 UI 패턴 미정의 | **4.2 수정** | BottomSheet 내 색상 Chip 그룹(6종) 렌더 + 선택 상태 표시 DoD 추가 |
| GAP-4 | 보관 파급효과(기존 기록 유지)의 화면 간 일관성 검증 부재 | **5.4 수정** | 보관 → 홈/시급/리포트 3화면 종단 회귀 시나리오 DoD 추가 |

AC 총계·커버리지는 v1과 동일(**72/72, 미커버 0**)하며, 위 조치는 기존 AC의 **검증 위치·시점 정정**이다.

---

## Epic 1. 타입 & 계약 (types only, 런타임 코드 없음)

**Risk Assessment**
- Complexity: **Low**
- Risk factors: RouteState 누락 시 페이지 간 `location.state` 형태가 페이지마다 달라져 `/entry`·`/share`·`/report`에서 런타임 크래시. 상수(MIN_WAGE_2026, 상한값)가 각 파일에 흩어지면 F3/F5/F6 검증 문구와 실제 한계값이 어긋남.
- Mitigation: 데이터 레이어·페이지보다 먼저 단일 `types.ts` + `constants.ts`를 확정하고, 이후 모든 태스크가 이 파일을 import하도록 Depends on으로 강제.

### Task 1.1 엔티티 타입 + RouteState 계약 정의
- **Description**: `Platform`, `PlatformCategory`, `IncomeEntry`, `Settings`, `ReportUnlockMap`, 계산 결과 타입(`PeriodSummary`, `StreakResult`, `WageRow`, `MonthlyReport`), 저장 결과 타입(`SaveResult = { ok: true; data: T } | { ok: false; error: string }`), 그리고 **RouteState**를 정의한다. 런타임 코드 없이 `export type/interface`만 작성한다.
- **DoD**:
  - `src/lib/types.ts`에 아래 RouteState가 정확히 존재한다.
    ```ts
    export type RouteState = {
      '/': null;
      '/entry': { date: string } | { entryId: string } | null;
      '/platforms': null;
      '/wage': { period?: 'week' | 'month' | 'all' } | null;
      '/report': { month?: string } | null;
      '/share': { month: string } | null;
      '/settings': null;
    };
    ```
  - `IncomeEntry`는 `id/platformId/date/amount/expense/minutes/memo/createdAt/updatedAt` 9필드를 모두 갖는다 (SPEC Data Models와 필드명·타입 1:1 일치).
  - `Settings`는 `monthlyGoal/bestStreak/noticeSeenAt` 3필드.
  - `Platform`은 `id/name/category/colorToken/archived/createdAt` 6필드를 가지며 `colorToken: ColorToken`(`constants.ts`의 `COLOR_TOKENS[number]`와 동일 유니온)으로 선언된다.
  - `npx tsc --noEmit` 통과, 파일 내 `function`/`const` 런타임 선언 0건 (`grep -c "^const\|^function" src/lib/types.ts` = 0).
- **Covers**: (계약 정의 — 후속 태스크 전 AC의 전제)
- **Files**: `src/lib/types.ts`
- **Depends on**: none

### Task 1.2 상수 모듈 정의
- **Description**: 저장소 키와 도메인 상수를 한 파일로 모은다.
- **DoD**:
  - `src/lib/constants.ts`에 `STORAGE_KEYS = { platforms:'gigledger.platforms.v1', entries:'gigledger.entries.v1', settings:'gigledger.settings.v1', reportUnlocks:'gigledger.reportUnlocks.v1' }` 존재.
  - `MIN_WAGE_2026 = 10320`, `MAX_ENTRIES = 5000`, `MAX_PLATFORMS = 20`, `MAX_AMOUNT = 10_000_000`, `MAX_MINUTES = 1440`, `MAX_MEMO = 50`, `MAX_PLATFORM_NAME = 12`, `GOAL_MIN = 10_000`, `GOAL_MAX = 50_000_000`, `REPORT_MONTH_RANGE = 12` 존재.
  - `COLOR_TOKENS = ['blue','green','orange','purple','red','grey'] as const` 존재하며 값에 `#` 문자가 0건. `export type ColorToken = typeof COLOR_TOKENS[number]` 함께 export.
  - `COLOR_TOKENS`의 각 키를 CSS 변수로 매핑하는 `colorVar(token) → 'var(--tds-color-<token>-500)'` 형태의 매핑 테이블이 존재하고 HEX 리터럴 0건.
  - `DEFAULT_PLATFORM_SEEDS`에 `배달/delivery`, `대리운전/driving`, `쿠팡플렉스/logistics` 3건이 순서대로 정의됨.
  - `npx tsc --noEmit` 통과.
- **Covers**: (F1-AC1, F5-AC2, F6-AC6의 상수 근거 — 실동작은 2.2/2.3/4.x에서 검증)
- **Files**: `src/lib/constants.ts`
- **Depends on**: Task 1.1

---

## Epic 2. 데이터 레이어 (순수 함수 → 저장소 → 상태)

**Risk Assessment**
- Complexity: **High**
- Risk factors: (1) entries 5,000건 ≈ 0.93MB — 개별 저장 시마다 전체 배열 JSON.stringify하면 저장 지연 및 `QuotaExceededError`; (2) 손상 JSON(`"{{broken"`)이 부팅을 막아 전 화면 백지; (3) 스트릭/주 시작(월요일)/타임존 처리를 각 페이지가 제각각 구현하면 홈·리포트·공유 카드 값이 서로 불일치; (4) `Array.prototype.at`, `Object.groupBy`, `toSorted` 무의식적 사용으로 Android 7 크래시; (5) **[GAP-1]** `bestStreak`를 부팅 시점에만 갱신하면 "기록 저장 → 홈 복귀" 경로에서 SPEC F6-AC4가 깨진다.
- Mitigation: format/date/genId(2.1) → validate(2.2) → storage(2.3) → calc(2.4) → useLedger(2.5) 순으로 아래에서 위로 쌓아 UI가 계산·저장 로직을 절대 재구현하지 않게 한다. 파싱 실패·쿼터 초과는 2.3에서 전부 흡수해 상위 레이어가 크래시 경로를 갖지 않는다. `bestStreak`는 2.5에서 `entries` 파생 효과로 단일화해 어느 화면에서 진입해도 동일 값이 나오게 한다. 레거시 API 금지는 2.1에서 grep 게이트로 조기 차단.

### Task 2.1 포맷/날짜/ID 유틸
- **Description**: CP-2 표기 규칙과 날짜 키 유틸, `genId()` 폴백을 구현한다. 순수 함수만.
- **DoD**:
  - `formatKRW(1250000) === '1,250,000원'`, `formatKRW(0) === '0원'`.
  - `formatMinutes(330) === '5시간 30분'`, `formatMinutes(0) === '0시간 0분'`.
  - `formatWage(null) === '—'`, `formatWage(-3000) === '-3,000원'`.
  - `formatDelta(2100000, 1750000) === '+20%'`, `formatDelta(x, 0) === '—'`, 계산식은 `Math.round((a-b)/b*1000)/10`.
  - `toDateKey(new Date(2026,7,31)) === '2026-08-31'`, `toMonthKey('2026-08-31') === '2026-08'`.
  - `startOfWeek('2026-08-31')`가 월요일 날짜 키를 반환 (일요일 입력 시 6일 전 월요일 반환).
  - `addMonthKey('2026-01', -1) === '2025-12'`.
  - `genId()`가 `crypto.randomUUID` 없을 때 `Date.now().toString(36) + Math.random().toString(36).slice(2,10)`로 폴백하고 길이 8~24자, 1,000회 호출 시 중복 0건.
  - `grep -rn "\.at(\|Object.groupBy\|toSorted\|(?<=" src/lib/` 결과 0건.
- **Covers**: [AC-G5]
- **Files**: `src/lib/format.ts`, `src/lib/date.ts`, `src/lib/id.ts`
- **Depends on**: Task 1.2

### Task 2.2 검증 모듈 (validate.ts)  ← **[GAP-2 반영 수정]**
- **Description**: 엔트리/플랫폼/설정 입력에 대한 고정 에러 문구 검증 함수를 구현한다. localStorage 접근 없음. **보관(archived) 플랫폼 참조 규칙을 명시적으로 정의**한다.
- **DoD**:
  - `validateEntry({amount:0,...})` → `{ ok:false, error:'금액을 입력해주세요' }`.
  - `validateEntry({amount:128000, expense:200000,...})` → `{ ok:false, error:'경비는 수입보다 클 수 없어요' }`.
  - `validateEntry({date:'2099-01-01',...})` → `{ ok:false, error:'미래 날짜는 기록할 수 없어요' }`.
  - `amount > 10_000_000` → `'금액은 1,000만원까지 입력할 수 있어요'`, `minutes > 1440` → `'근무 시간은 24시간을 넘을 수 없어요'`, `platformId` 빈 값 → `'플랫폼을 선택해주세요'`.
  - **[신규] `validateEntry`는 `platformId`의 존재 여부·`archived` 상태를 검사하지 않는다.** 즉 `platformId`가 보관된 플랫폼이거나 저장소에 없는 id여도 `{ ok:true }`를 반환한다(과거 기록 수정·보관 후 재저장이 막히지 않도록). 활성 플랫폼 제한은 **입력 UI(4.3 Chip 필터)에서만** 수행한다. 이 규칙을 파일 상단 주석 1줄로 명시한다.
  - **[신규] 회귀 테스트**: `archived:true`인 `p2`를 참조하는 기존 기록의 `amount`만 변경해 `validateEntry` 호출 → `{ ok:true }`. 존재하지 않는 `platformId:'deleted-x'` 기록 수정 → `{ ok:true }`.
  - `validatePlatformName('', list)` → `'플랫폼 이름을 입력해주세요'`; `validatePlatformName(' 배달 ', [{name:'배달'}])` → `'이미 등록된 플랫폼이에요'` (trim + 대소문자 무시 비교); 13자 이상 → `'12자까지 입력할 수 있어요'`.
  - **[신규] 중복 검사는 `archived` 여부와 무관하게 전체 플랫폼을 대상으로 한다** — 보관된 `대리운전`이 있을 때 `'대리운전'` 신규 추가 시도 → `'이미 등록된 플랫폼이에요'`.
  - `validateGoal(5000)` → `'목표는 10,000원 이상으로 설정해주세요'`, `validateGoal(100000000)` → `'목표는 5,000만원까지 설정할 수 있어요'`, `validateGoal(0)` → `{ ok:true }`(미설정 허용).
  - 모든 반환은 `{ ok:true } | { ok:false, error:string }` 단일 shape.
- **Covers**: [F1-AC6, F2-AC2(검증부), F2-AC3(검증부), F3-AC4(검증부), F3-AC5(검증부), F6-AC6(검증부), F2-AC4(참조 무결성 규칙부)]
- **Files**: `src/lib/validate.ts`
- **Depends on**: Task 2.1

### Task 2.3 localStorage 리포지토리 (storage.ts)
- **Description**: 4개 키에 대한 안전한 읽기/쓰기, 최초 실행 시드, 상한·쿼터 처리를 구현한다. UI는 이 모듈만 통해 저장소에 접근한다.
- **DoD**:
  - `getPlatforms()` 호출 시 `gigledger.platforms.v1`가 없으면 `배달/대리운전/쿠팡플렉스` 3건이 각각 고유 `id`, `archived:false`, `createdAt` ISO8601을 갖고 생성·저장된다.
  - `saveEntry({platformId:'p1',date:'2026-08-31',amount:128000,expense:18000,minutes:330,memo:'피크타임'})` → `{ok:true}` 반환, entries 길이 +1, `id/createdAt/updatedAt` 채워짐, `getEntries()` 결과에 포함.
  - `saveEntry`가 기존 `id`를 포함해 호출되면 해당 레코드만 갱신하고 `updatedAt`만 변경, 배열 길이 불변.
  - `deleteEntry(id)` 후 해당 id가 `getEntries()`에 없음.
  - entries 5,000건 상태에서 `saveEntry` → `{ok:false, error:'기록은 최대 5,000건까지 저장할 수 있어요'}`, 저장소 길이 5,000 유지.
  - `setItem`이 `QuotaExceededError`를 던지도록 모킹 시 함수가 throw하지 않고 `{ok:false, error:'저장 공간이 부족해요. 오래된 기록을 삭제해주세요'}`를 반환하며 메모리/저장소 상태가 호출 전과 동일.
  - `localStorage.setItem('gigledger.entries.v1','{{broken')` 후 `getEntries()`가 `[]`를 반환하고 `{ corrupted: true }` 플래그를 노출(Toast는 상위에서 처리), 예외 전파 0건.
  - `getSettings()` 기본값 `{monthlyGoal:0,bestStreak:0,noticeSeenAt:null}`, `getReportUnlocks()` 기본값 `{}`.
  - `savePlatform`은 `MAX_PLATFORMS(20)` 초과 시 `{ok:false, error:'플랫폼은 최대 20개까지 등록할 수 있어요'}`. **상한 카운트는 `archived===false`인 플랫폼만 센다**(보관 플랫폼은 상한에 포함되지 않음).
  - `archivePlatform(id)`는 해당 플랫폼의 `archived`만 `true`로 바꾸고 **entries는 단 1건도 수정·삭제하지 않는다**(호출 전후 `getEntries()` deep-equal).
  - `resetAll()`이 4개 키를 모두 제거.
- **Covers**: [F1-AC1, F1-AC2, F1-AC7, F2-AC4(저장부), AC-G9, AC-G10]
- **Files**: `src/lib/storage.ts`
- **Depends on**: Task 2.2

### Task 2.4 계산 순수 함수 (calc.ts)
- **Description**: 합산·실질시급·스트릭·달성률·플랫폼 집계·월간 리포트 계산을 순수 함수로 구현한다. React import 0건.
- **DoD**:
  - `calcHourlyWage([{amount:128000,expense:18000,minutes:330},{amount:60000,expense:0,minutes:120}]) === 22667`.
  - `calcHourlyWage([{amount:50000,expense:0,minutes:0}]) === null` (예외/NaN/Infinity 미발생).
  - `calcStreak(entries,'2026-08-31')`가 날짜 `['2026-08-31','2026-08-30','2026-08-29','2026-08-27']`에 대해 `{current:3,lastDate:'2026-08-31'}`, `['2026-08-29']`만일 때 `{current:0,lastDate:'2026-08-29'}` 반환.
  - `calcPeriodSummary(entries,'month','2026-08')`가 `{gross:188000, expense:23000, net:165000, minutes:450, count:2}` 반환(주간은 월요일 시작).
  - `calcPlatformWages(entries, platforms, period)`가 시급 내림차순 정렬 배열을 반환하고, `minutes` 합이 0인 플랫폼은 `hourly:null`로 **항상 배열 최하단**에 배치.
  - **[신규] `calcPlatformWages`·`calcMonthlyReport`의 플랫폼 집계는 `archived` 여부와 무관하게 해당 기간에 기록이 있는 모든 플랫폼을 포함한다.** 보관된 플랫폼도 과거 기록이 있으면 결과 배열에 나타난다(기록 0건인 플랫폼은 제외).
  - `net`이 음수인 데이터에서 시급이 음수 정수로 반환되고 `Number.isFinite` 검사 통과.
  - `calcGoalProgress(1200000,3000000)` → `{ percent:40, barWidth:40, achieved:false }`, `calcGoalProgress(1500000,1000000)` → `{ percent:150, barWidth:100, achieved:true }`, `goal===0` → `{ percent:null }`.
  - `calcTrend14(entries,'2026-08-31')`가 길이 14 배열을 반환하고 기록 없는 날은 `0`.
  - `calcMonthlyReport(entries,platforms,'2026-08')`가 `{gross,expense,net,minutes,hourly,byPlatform,bestDay:{date,amount}|null,prevNet}`를 반환하며 예시 데이터(총수입 2,400,000 / 경비 300,000 / 12,000분)에서 `net===2100000`, `hourly===10500`.
  - 모든 함수에 대해 빈 배열 입력 시 크래시 없이 0/`null` 반환.
- **Covers**: [F1-AC3, F1-AC4, F1-AC5, F5-AC5(계산부)]
- **Files**: `src/lib/calc.ts`
- **Depends on**: Task 2.1, Task 1.2

### Task 2.5 상태 관리 훅 (useLedger) ← **[GAP-1 반영 수정: bestStreak 갱신 시점 재정의]**
- **Description**: storage + calc를 묶어 앱 전역 상태를 제공하는 Context/Provider와 `useLedger()` 훅을 구현한다. 손상 데이터 Toast, **entries 변경에 반응하는 bestStreak 동기화** 포함.
- **DoD**:
  - 마운트 직후 `useLedger()`가 `{ platforms: [], entries: [], settings: null, status: 'loading' }`를 반환하고, 저장소 읽기 완료 후 `status === 'ready'`로 **정확히 1회** 전환된다(전환 횟수 카운트 테스트 통과).
  - `addEntry / updateEntry / removeEntry / addPlatform / updatePlatform / archivePlatform / saveSettings / unlockReport / resetAll` 액션이 노출되며 각각 `SaveResult`를 반환하고, 성공 시 state가 재조회 없이 즉시 갱신된다.
  - 저장 실패(`ok:false`) 시 state가 변경되지 않는다(직전 스냅샷과 deep-equal).
  - **[수정] bestStreak 동기화는 부팅 1회가 아니라 `entries` 파생 효과다.** Provider 내부에 아래 계약의 `useEffect`를 둔다.
    ```ts
    // deps: [status, entries, settings?.bestStreak]
    useEffect(() => {
      if (status !== 'ready' || !settings) return;
      const { current } = calcStreak(entries, toDateKey(new Date()));
      if (current > settings.bestStreak) saveSettings({ ...settings, bestStreak: current });
    }, [status, entries, settings?.bestStreak]);
    ```
  - **[수정] 회귀 케이스 A (부팅)**: 기록 3일 연속 + 저장된 `bestStreak:2` 상태로 앱 시작 → `status==='ready'` 직후 `gigledger.settings.v1.bestStreak === 3`.
  - **[신규] 회귀 케이스 B (런타임 갱신 — GAP-1 본체)**: `bestStreak:2`, 기록 2일 연속(`08-29`,`08-30`) 상태에서 앱이 이미 `ready`일 때 `addEntry({date:'2026-08-31',...})` 성공 → **앱 재시작 없이** 동일 세션에서 `gigledger.settings.v1.bestStreak === 3`으로 갱신되고, `useLedger().settings.bestStreak`도 `3`을 반환한다.
  - **[신규] 회귀 케이스 C (역행 방지)**: 위 상태에서 `removeEntry('2026-08-31 기록')` → `current`가 2로 줄어도 `bestStreak`는 `3`을 유지한다(최고 기록은 감소하지 않음).
  - **[신규] 무한 루프 방지**: `current <= settings.bestStreak`이면 `saveSettings` 호출 0건. 케이스 B 시나리오에서 `localStorage.setItem`(settings 키) 호출 횟수가 **정확히 1회**이며, 이후 리렌더 10회에도 추가 호출 0건.
  - storage가 `corrupted:true`를 반환하면 TDS Toast `"일부 저장 데이터를 불러오지 못했어요"`가 1회 노출되고 앱은 빈 상태로 정상 렌더된다.
  - 쿼터 실패 시 TDS Toast `"저장 공간이 부족해요. 오래된 기록을 삭제해주세요"` 노출. **bestStreak 동기화가 쿼터 실패로 `ok:false`를 받아도 렌더 루프·크래시가 발생하지 않는다**(실패 시 재시도 0회).
  - Provider가 `main.tsx`에 연결되어도 기존 화면 빌드가 깨지지 않는다.
- **Covers**: [F1-AC8, F6-AC4(bestStreak 저장·갱신 시점 전체), AC-G9(UI 노출부), AC-G10(UI 노출부)]
- **Files**: `src/lib/useLedger.tsx`, `src/main.tsx`(Provider 삽입만)
- **Depends on**: Task 2.3, Task 2.4

---

## Epic 3. 공용 UI 컴포넌트 (페이지보다 먼저)

**Risk Assessment**
- Complexity: **Medium**
- Risk factors: 페이지마다 Sparkline/MiniBar/SummaryHero를 각각 구현하면 중복 + `data-testid` 불일치로 AC 검증 실패. 커스텀 컴포넌트에 HEX 색상이나 임의 padding이 섞이면 AC-G4/CP-3 위반으로 검수 반려. **[GAP-3]** 색상 토큰 선택 UI가 4.2에만 있으면 Chip 표현이 화면마다 달라진다.
- Mitigation: 홈·시급·리포트·공유가 공유하는 시각화 컴포넌트를 페이지 태스크 이전에 한 번만 만들고 `data-testid`를 컴포넌트 내부에 고정. 색상 토큰 렌더는 `ColorDot` 하나로 통일해 목록·Chip·미니바가 같은 CSS 변수를 쓰게 한다. 색상은 `var(--tds-color-*)`만 사용하도록 DoD에 grep 게이트 포함.

### Task 3.1 시각화 컴포넌트 (SummaryHero / Sparkline / MiniBar / ColorDot) ← **[GAP-3 반영 수정]**
- **Description**: 숫자 CountUp 히어로, 14포인트 스파크라인(SVG), 비중 미니바, **플랫폼 색상 토큰 표시용 `ColorDot`**을 공용 컴포넌트로 구현한다. 데이터는 props로만 받는 표현 전용 컴포넌트.
- **DoD**:
  - `<SummaryHero testId="summary-hero" value={165000} subItems={[...]} />`가 `data-testid="summary-hero"` 요소를 렌더하고 값이 `165,000원`으로 표기되며, 마운트 시 CountUp 애니메이션 후 최종값이 정확히 일치한다.
  - `<Sparkline data={number[14]} />`가 `data-testid="trend-sparkline"` SVG를 렌더하고 데이터 포인트(`<circle>` 또는 polyline point) 수가 정확히 14.
  - 모든 값이 0인 배열 입력 시 크래시 없이 평평한 선을 그린다(NaN path 0건).
  - `<MiniBar items={[{label,value,colorToken}]} testId />`가 내림차순 정렬 후 각 행에 라벨과 `Math.round(비율*100)` 정수 백분율을 표기하고, 합계 0이면 모든 행 `0%`.
  - **[신규] `<ColorDot token="purple" size="sm|md" selected?={boolean} />`** 가 `constants.ts`의 `colorVar(token)` 결과만으로 배경색을 지정하고, `token`이 `COLOR_TOKENS`에 없으면 `'grey'`로 폴백한다(크래시 0건).
  - **[신규] `ColorDot`의 `size="md"` 렌더 박스는 44×44px 이상**(터치 타깃 용도), `size="sm"`은 목록 내 표시 전용으로 12~16px. `selected` 시 TDS 토큰 기반 외곽선이 나타나고 `aria-selected` 속성이 `true`가 된다.
  - `grep -rn "#[0-9a-fA-F]\{3,6\}" src/components/` 결과 0건.
  - TDS `Paragraph.Text`로 텍스트를 렌더하고 인라인 style은 flex/grid/width(%)/background-color(`var(--tds-color-*)`)에만 사용.
- **Covers**: [F4-AC3(렌더 계약부), F2-AC1(색상 표현부), F2-AC7(색상 Chip 렌더부)]
- **Files**: `src/components/SummaryHero.tsx`, `src/components/Sparkline.tsx`, `src/components/MiniBar.tsx`, `src/components/ColorDot.tsx`
- **Depends on**: Task 2.1

### Task 3.2 레이아웃/상태 공용 컴포넌트 (SubmitFooter / EmptyState / SkeletonBlock)
- **Description**: 하단 고정 저장 버튼 영역, 빈 상태 블록, 스켈레톤 블록을 공용화한다.
- **DoD**:
  - `<SubmitFooter testId="entry-submit"><Button display="block" …/></SubmitFooter>`가 화면 하단 고정(`position: fixed`, `bottom: 0`, safe-area inset 반영)으로 렌더되고 버튼 높이가 56px 이상.
  - SubmitFooter 사용 페이지의 스크롤 컨테이너 하단에 footer 높이만큼 여백이 생겨, 마지막 입력 필드가 footer에 가려지지 않는다(최하단 스크롤 시 필드 bottom < footer top).
  - `<EmptyState icon title description actionLabel onAction />`가 TDS `Asset.ContentIcon` + `Paragraph.Text` + `display="block"` Button을 렌더하고, `actionLabel` 미지정 시 버튼을 렌더하지 않는다.
  - `<SkeletonBlock count={3} testId="home-skeleton" />`가 `data-testid` 요소 1개 안에 3개 블록을 렌더.
  - 간격은 TDS `Spacing`(size prop 필수)만 사용하고 TDS 컴포넌트에 `style={{padding|margin…}}` 0건 (`grep -n "padding\|margin" src/components/*.tsx` 결과가 TDS 컴포넌트 props에 붙지 않음).
- **Covers**: [F3-AC8(SubmitFooter 계약부), F4-AC6(스켈레톤 계약부)]
- **Files**: `src/components/SubmitFooter.tsx`, `src/components/EmptyState.tsx`, `src/components/SkeletonBlock.tsx`
- **Depends on**: Task 3.1

---

## Epic 4. 코어 UI 페이지 (한 태스크 = 한 화면/한 섹션)

**Risk Assessment**
- Complexity: **High**
- Risk factors: (1) `/entry`, `/report`, `/share`가 `location.state`를 캐스팅만 하고 null 확인을 빠뜨리면 새로고침·딥링크 시 즉시 크래시(2026-08-03 SplitMate 실사고 — 결과 배열 undefined에 `.map()` 호출로 가상 사용자 3인 완주 0%); (2) 홈 화면이 요약+카드+차트+리스트+무한스크롤을 한 패킷에 담으면 10분 초과; (3) 모바일 키보드가 SubmitFooter/입력 필드를 가려 저장 불가; (4) **[GAP-2]** 보관 플랫폼이 `/entry` Chip에 남으면 F2-AC4가 화면 레벨에서 깨진다; (5) **[GAP-3]** colorToken 입력 수단이 없으면 F2-AC1을 만족시킬 수 없다.
- Mitigation: 각 페이지 태스크에 "state 없이 직접 진입해도 크래시하지 않는다"는 DoD를 필수로 넣고, 홈은 요약 섹션(4.4)/리스트 섹션(4.5), 리포트는 게이트(4.7)/본문(4.8)으로 분할. 보관 필터는 "쓰기 화면(4.3)은 활성만 / 읽기 화면(4.4·4.5·4.6·4.8)은 전체"로 규칙을 못박아 태스크별 DoD에 명시. 데이터·계산은 Epic 2에서 이미 완성되어 페이지는 조립만 수행.

> **보관(archived) 플랫폼 표시 규칙 (Epic 4 전역 계약)**
> | 화면 | 보관 플랫폼 처리 |
> |---|---|
> | `/entry` 플랫폼 선택 Chip | **제외** (`archived===false`만) — 단, 수정 모드에서 기존 기록이 보관 플랫폼을 참조하면 그 Chip 1개만 예외로 표시·선택 유지 |
> | `/platforms` 목록 | **표시**하되 비활성 스타일 + `"보관됨"` Chip |
> | `/`(홈) 리스트·요약, `/wage`, `/report`, `/share` | **표시** (과거 기록 무결성 유지) |

### Task 4.1 `/settings` 설정 화면
- **Description**: 월 목표 금액 입력·저장, 플랫폼 관리 이동, 데이터 초기화, 로컬 저장 고지 문구를 구현한다.
- **DoD**:
  - `ScreenScaffold` + `Top(title="설정")` 구조로 렌더되고 raw `<div>` 페이지 골격 0건.
  - 목표 TextField가 `inputMode="numeric"`, `pattern="[0-9]*"`를 갖고 포커스 시 `scrollIntoView({block:'center'})` 호출.
  - `3000000` 입력 후 `SubmitFooter`의 `"저장"` 탭 → `localStorage['gigledger.settings.v1']`의 `monthlyGoal === 3000000`, Toast `"목표를 저장했어요"` 노출.
  - `5000` 입력 후 저장 → 인라인 에러 `"목표는 10,000원 이상으로 설정해주세요"` 표시, 저장소 값 불변.
  - `100000000` 입력 → `"목표는 5,000만원까지 설정할 수 있어요"` 표시, 저장소 값 불변.
  - **[신규] 목표 저장이 `settings` 객체를 통째로 덮어쓰더라도 `bestStreak`와 `noticeSeenAt`이 보존된다**(저장 전 `bestStreak:3` → 저장 후에도 `3`). GAP-1 수정으로 bestStreak가 런타임에 갱신되므로 스프레드 누락 시 회귀가 발생함.
  - `"플랫폼 관리"` ListRow(높이 ≥56px) 탭 시 `navigate('/platforms')` 호출(state 없음).
  - `"데이터 초기화"` ListRow 탭 → TDS AlertDialog 확인 시 4개 키 삭제 후 홈으로 이동.
  - 화면 하단에 `"기록은 이 기기에만 저장돼요"` 문구가 표시된다.
  - `status==='loading'`이면 TextField와 저장 버튼이 `disabled`.
  - `location.state` 없이 `/settings` 직접 진입 시 크래시 없음.
- **Covers**: [F6-AC3, F6-AC6]
- **Files**: `src/pages/SettingsPage.tsx`
- **Depends on**: Task 2.5, Task 3.2

### Task 4.2 `/platforms` 플랫폼 관리 화면 ← **[GAP-3 반영 수정: 색상 선택 UI 명세]**
- **Description**: 플랫폼 목록·추가/수정 BottomSheet(**이름 + 카테고리 + 색상 선택**)·보관 처리를 구현한다.
- **DoD**:
  - `ScreenScaffold` + `Top(title="플랫폼")`; 각 플랫폼이 `data-testid="platform-row"` TDS ListRow(높이 ≥56px)로 렌더되고 좌측 `<ColorDot size="sm" token={platform.colorToken} />` + 이름, 우측 누적 순수입(`formatKRW`) 표시.
  - **[신규] BottomSheet 폼 구성 순서가 고정된다**: ① 이름 `TextField`(`maxLength=12`, 자동 포커스) → ② 카테고리 선택 TDS `Chip` 그룹 5종(`배달/운전/물류/프리랜스/기타` ↔ `delivery/driving/logistics/freelance/etc`) → ③ **색상 선택 `data-testid="color-picker"` Chip 그룹 6종** → ④ `display="block"` Button(신규 `"추가"` / 수정 `"저장"`) → ⑤ 수정 모드에서만 `"보관하기"` 텍스트 Button.
  - **[신규] 색상 선택 계약**: `data-testid="color-picker"` 안에 `COLOR_TOKENS` 순서(`blue, green, orange, purple, red, grey`)대로 정확히 6개의 선택 요소가 렌더되고, 각 요소는 `<ColorDot size="md" />`를 포함해 터치 타깃 44×44px 이상이며 `data-color-token` 속성에 토큰 문자열을 갖는다.
  - **[신규] 선택 상태**: 신규 BottomSheet 오픈 시 기본 선택은 `'blue'`(선택된 요소 `aria-selected="true"` 1개). `purple` 요소 탭 → `aria-selected="true"`가 `purple` 1개로 이동하고, 저장 시 `gigledger.platforms.v1`의 해당 레코드 `colorToken === 'purple'`.
  - **[신규] 수정 모드 프리필**: `colorToken:'red'`인 플랫폼 행을 탭해 BottomSheet를 열면 `red` 요소가 `aria-selected="true"` 상태로 프리필된다.
  - **[신규] 색상 값에 HEX 0건**: `grep -n "#[0-9a-fA-F]\{3,6\}" src/pages/PlatformsPage.tsx` 결과 0건이며 색상은 `ColorDot`(=`colorVar`)로만 표현.
  - 활성 3개 상태에서 BottomSheet에 `{name:'크몽', category:'freelance', colorToken:'purple'}` 입력 후 `"추가"` 탭 → 목록 4행, `gigledger.platforms.v1` 길이 4, Toast `"플랫폼을 추가했어요"`.
  - `" 배달 "` 입력 시 TextField 하단 `"이미 등록된 플랫폼이에요"` 표시, 목록 길이 불변.
  - 빈 이름 → `"플랫폼 이름을 입력해주세요"`; 13자 입력 시 값이 12자에서 잘리고 `"12자까지 입력할 수 있어요"` 표시; 두 경우 모두 `"추가"` 버튼 `disabled === true`.
  - 플랫폼 행 탭 → BottomSheet → `"보관하기"` → AlertDialog `"보관할까요?"`에서 `"보관"` 확인 시 해당 플랫폼 `archived===true`가 저장되고, **목록에서 사라지지 않고 비활성 스타일 + `"보관됨"` Chip으로 표시**되며, 해당 플랫폼의 기존 기록 건수는 변하지 않는다(entries 길이 불변, deep-equal).
  - **[신규] 보관 해제**: 보관된 행 탭 → BottomSheet에 `"보관 해제"` Button이 표시되고 탭 시 `archived===false`로 되돌아가 `/entry` Chip에 다시 나타난다(활성 20개 상한 초과 시엔 Toast `"플랫폼은 최대 20개까지 등록할 수 있어요"`로 거부).
  - 활성 플랫폼 20개 상태에서 `"플랫폼 추가"` 탭 → Toast `"플랫폼은 최대 20개까지 등록할 수 있어요"`, BottomSheet 미오픈.
  - 모든 플랫폼이 `archived:true`면 활성 목록 자리에 `EmptyState` `"등록된 플랫폼이 없어요"` + `display="block"` Button `"플랫폼 추가"` 표시(보관 섹션은 아래에 유지).
  - `status==='loading'`이면 ListRow 스켈레톤 3개 표시.
- **Covers**: [F2-AC1, F2-AC2, F2-AC3, F2-AC4, F2-AC5, F2-AC6, F2-AC7]
- **Files**: `src/pages/PlatformsPage.tsx`
- **Depends on**: Task 2.5, Task 3.1, Task 3.2

### Task 4.3 `/entry` 수입 입력/수정 화면 ← **[GAP-2 반영 수정: 보관 플랫폼 필터 명시]**
- **Description**: 신규/수정 모드 분기, **활성 플랫폼만 노출하는** Chip 선택, 4개 입력 필드, 저장·삭제를 구현한다.
- **DoD**:
  - **state 방어**: `const state = (useLocation().state as RouteState['/entry']) ?? null;`로 읽고, `null`이면 오늘 날짜 프리필 신규 모드로 정상 렌더한다. `/entry`를 새로고침·딥링크로 직접 진입해도 크래시하지 않는다.
  - **[신규] 보관 플랫폼 필터(F2-AC4 화면부)**: `data-testid="platform-chips"`에 렌더되는 Chip은 `platforms.filter(p => !p.archived)` 결과만이다. 활성 3 + 보관 1(총 4) 상태에서 Chip 노드 수는 **정확히 3**이고, 보관된 플랫폼 이름은 화면 텍스트에 0건.
  - **[신규] 수정 모드 예외**: 수정 대상 기록의 `platformId`가 보관된 플랫폼을 가리키면 그 플랫폼 Chip **1개만** 목록 끝에 `"보관됨"` 표기와 함께 추가로 렌더되어 선택 상태를 유지하고, 그대로 저장 시 `platformId`가 변경되지 않는다(저장 후 해당 기록의 `platformId` 불변, Chip 총 노드 수 = 활성 수 + 1).
  - **[신규] 삭제/미존재 플랫폼 수정**: 수정 대상의 `platformId`가 저장소에 아예 없으면(`'deleted-x'`) Chip 목록 끝에 `"삭제된 플랫폼"` Chip이 선택 상태로 렌더되고 크래시 0건. 사용자가 다른 활성 Chip을 선택하면 정상적으로 교체 저장된다.
  - `{ date:'2026-08-31' }` 진입 시 해당 날짜 프리필 신규 모드, `{ entryId:'e1' }` 진입 시 기존 값 프리필 수정 모드, 존재하지 않는 `entryId`면 Toast `"기록을 찾을 수 없어요"` 후 `navigate('/', {replace:true})`.
  - 신규 저장: 플랫폼 선택 + `{amount:128000, expense:18000, minutes:330, memo:'피크타임'}` 입력 후 `data-testid="entry-submit"` 저장 탭 → entries +1, Toast `"기록을 저장했어요"`, `navigate('/', {replace:true})`.
  - 수정 저장: `amount`를 `150000`으로 변경 후 저장 → 동일 `id:'e1'`의 amount가 150000, `updatedAt` 변경, entries 길이 불변.
  - 삭제: 수정 모드에서 `Top` 우측 `"삭제"` → AlertDialog `"이 기록을 삭제할까요?"` → `"삭제"` 확인 시 `e1` 제거, Toast `"기록을 삭제했어요"`, 홈 이동.
  - 인라인 에러: 플랫폼 미선택 저장 → `"플랫폼을 선택해주세요"`; amount 공란/0 → `"금액을 입력해주세요"`; `expense>amount` → `"경비는 수입보다 클 수 없어요"`; `99999999` → `"금액은 1,000만원까지 입력할 수 있어요"` + 저장 버튼 `disabled`; `minutes=1500` → `"근무 시간은 24시간을 넘을 수 없어요"`. 각 경우 저장소 불변.
  - 금액/경비/시간 TextField가 `inputMode="numeric"` + `pattern="[0-9]*"`를 갖고, 포커스 시 `scrollIntoView({block:'center'})` 호출, SubmitFooter가 포커스된 필드를 가리지 않음.
  - 메모 필드에서 `Enter` 키 입력 시 submit 핸들러 호출 0건.
  - 플랫폼 선택은 `data-testid="platform-chips"` 가로 스크롤 Chip 그룹(각 높이 ≥44px, 좌측 `<ColorDot size="sm" />` 포함), 저장 버튼은 하단 고정 `display="block"`(좌측 글자폭 버튼 0건).
  - **[신규] 활성 플랫폼 0개**(전부 보관 포함) 이면 폼 대신 `EmptyState` `"먼저 플랫폼을 등록해주세요"` + Button `"플랫폼 등록하기"` → `navigate('/platforms')`. 단 **수정 모드에서는 이 EmptyState를 표시하지 않고** 위 "수정 모드 예외" 경로로 폼을 렌더한다(기존 기록을 못 고치는 잠김 상태 방지).
  - 수정 모드 조회 중 스켈레톤 폼 표시.
- **Covers**: [F3-AC1, F3-AC2, F3-AC3, F3-AC4, F3-AC5, F3-AC6, F3-AC7, F3-AC8, F2-AC4(입력 폼 제외 검증부)]
- **Files**: `src/pages/EntryPage.tsx`
- **Depends on**: Task 2.5, Task 3.1, Task 3.2

### Task 4.4 `/` 홈 — 요약 섹션 (Tab / SummaryHero / 스트릭 / 목표 / 차트) ← **[GAP-1 반영 수정]**
- **Description**: 홈 상단부(주간·월간 Tab, 합계 히어로, 스트릭 카드, 목표 카드, Sparkline, MiniBar, 빈/로딩 상태)를 구현한다. 최근 기록 리스트는 4.5에서 추가.
- **DoD**:
  - `ScreenScaffold` > `Top(title="GigLedger")` > `Tab` > `SummaryHero` > 카드 2개 > Sparkline + MiniBar 순서로 렌더되고 섹션 간격은 `Spacing size={16}`만 사용.
  - 월간 Tab에서 예시 2건 기록 시 `data-testid="summary-hero"`에 순수입 `165,000원`(CountUp), 보조 지표 총수입 `188,000원` / 경비 `23,000원` / 근무 `7시간 30분` 표시.
  - `주간` 탭 탭 시 월요일 시작 주 합계로 값이 갱신되고, 리렌더 후에도 선택 탭이 유지된다(state 보존).
  - `data-testid="trend-sparkline"`이 14 포인트로 렌더(기록 없는 날 0), `data-testid="platform-minibar"`가 플랫폼별 순수입 비중을 내림차순 + 정수 백분율로 표시하며 **보관된 플랫폼도 기록이 있으면 포함**된다.
  - `data-testid="goal-card"`: goal 3,000,000 / 총수입 1,200,000 → `"40%"` + `"1,200,000원 / 3,000,000원"` + 진행바 width 40%. goal 1,000,000 / 1,500,000 → 진행바 width 100% 고정, 텍스트 `"150%"`, Chip `"목표 달성"`. `monthlyGoal===0` → `"이번 달 목표를 정해보세요"` + `"목표 설정"` 버튼(→ `navigate('/settings')`), 진행바 렌더 0건.
  - `data-testid="streak-card"`: 3일 연속 시 `"3일 연속 기록 중"` 표시. 오늘 미기록 + 어제 기록 시 `"오늘 기록하면 2일 연속이 이어져요"` + `display="block"` Button `"오늘 기록하기"` → `navigate('/entry', { state: { date: <오늘 YYYY-MM-DD> } })`.
  - **[신규] bestStreak 표시 계약**: 스트릭 카드는 `settings.bestStreak`를 보조 라인 `"최고 {n}일"`로 표시하며, **값은 `useLedger().settings.bestStreak`를 그대로 읽기만 하고 이 페이지에서 저장 호출을 하지 않는다**(`grep -n "saveSettings" src/pages/home/SummarySection.tsx` 결과 0건 — 갱신 책임은 2.5 단일 소유).
  - **[신규] GAP-1 종단 회귀 (F6-AC4)**: `bestStreak:2` + 2일 연속(`08-29`,`08-30`) 상태에서 홈 → `/entry`로 이동해 `08-31` 기록 저장 → `navigate('/', {replace:true})`로 홈 복귀 시, **앱 재시작 없이** 스트릭 카드에 `"3일 연속 기록 중"`과 `"최고 3일"`이 표시되고 `gigledger.settings.v1.bestStreak === 3`이다.
  - `entries.length===0`이면 SummaryHero 대신 `EmptyState` `"아직 기록이 없어요"` / `"오늘 번 돈을 기록해보세요"` + Button `"수입 기록하기"` → `navigate('/entry',{state:{date:오늘}})`.
  - `status==='loading'`이면 `data-testid="home-skeleton"` 3블록만 렌더되고 `summary-hero`/`goal-card` 노드 수 0.
  - Tab 항목 높이 ≥44px.
- **Covers**: [F4-AC1, F4-AC2, F4-AC3, F4-AC5, F4-AC6, F6-AC1, F6-AC2, F6-AC4(표시·종단 검증), F6-AC5, F6-AC7]
- **Files**: `src/pages/HomePage.tsx`, `src/pages/home/SummarySection.tsx`
- **Depends on**: Task 3.1, Task 3.2, Task 2.5

### Task 4.5 `/` 홈 — 최근 기록 리스트 + 무한 스크롤
- **Description**: 날짜 내림차순 최근 기록 ListRow 목록과 30건 단위 무한 스크롤, 삭제·보관 플랫폼 방어를 구현한다.
- **DoD**:
  - 기록이 날짜 내림차순으로 TDS ListRow(높이 ≥56px)로 렌더되고, 각 행에 `<ColorDot size="sm" />` · 플랫폼명 · 날짜 · 순수입(`formatKRW`)이 표시된다.
  - ListRow 탭 시 `navigate('/entry', { state: { entryId: '<해당 id>' } })` 호출.
  - entries 1,000건일 때 초기 렌더 ListRow DOM 노드 수 = 30, 리스트 하단 200px 진입 시 30건씩 추가 로드되며, 스크롤 어느 시점에도 ListRow DOM 노드 수 ≤ 100.
  - `platformId:'deleted-x'`(존재하지 않는 플랫폼) 기록이 있어도 크래시 없이 플랫폼명이 `"삭제된 플랫폼"`으로 렌더되고 `ColorDot`은 `grey` 폴백.
  - **[신규] 보관 플랫폼 기록(F2-AC4)**: `archived:true`인 `p2`의 기록 5건이 리스트에서 **필터되지 않고 5건 모두 렌더**되며, 플랫폼명이 실제 이름(`"대리운전"`)으로 표시된다(`"삭제된 플랫폼"` 아님).
  - 리스트가 비어 있어도(요약은 있으나 필터 결과 0건) 크래시 없이 안내 문구를 렌더한다.
  - FAB형 `"기록하기"` 버튼이 56×56px로 표시되고 탭 시 `navigate('/entry',{state:{date:오늘}})`.
- **Covers**: [F4-AC4, F4-AC7, F4-AC8, F2-AC4(기록 유지 표시부)]
- **Files**: `src/pages/home/RecentEntriesSection.tsx`, `src/pages/HomePage.tsx`(섹션 삽입)
- **Depends on**: Task 4.4

### Task 4.6 `/wage` 실질 시급 화면
- **Description**: 기간 필터 Chip과 플랫폼별 시급 Card 목록, 최저임금 비교 배지를 구현한다.
- **DoD**:
  - **state 방어**: `const state = (useLocation().state as RouteState['/wage']) ?? null;` 후 `state?.period ?? 'month'`로 초기화. state 없이 직접 진입/새로고침해도 크래시 없이 월간 기준으로 렌더된다.
  - `ScreenScaffold` + `Top(title="실질 시급")` + 기간 Chip 그룹(주간/월간/전체, 각 44px 이상).
  - 예시 데이터(배달 net 110,000 / 330분, 대리운전 net 80,000 / 180분)에서 `data-testid="wage-card"` 2개가 `대리운전 26,667원` → `배달 20,000원` 순으로 렌더.
  - 시급 9,500원 카드에 Chip `"최저임금 미만"`, 20,000원 카드에 Chip `"최저임금 대비 194%"`(= `Math.round(20000/10320*100)`) 표시.
  - `"전체"` Chip 탭 시 전체 기록 기준으로 카드 값이 갱신되고 선택 Chip이 활성 상태로 표시된다.
  - 해당 기간 `minutes` 합이 0인 플랫폼은 시급 `"—"` + 보조 문구 `"근무 시간을 입력하면 시급을 계산해드려요"`로 렌더되고 목록 최하단에 위치.
  - **[신규] 보관 플랫폼**: 기간 내 기록이 있는 보관 플랫폼은 카드에 포함되며 `"보관됨"` Chip이 함께 표시된다. 기록이 0건인 플랫폼(활성 포함)은 카드로 렌더되지 않는다.
  - `net` 음수 데이터에서 `-3,000원` 형태로 표시되며 화면 텍스트에 `NaN`/`Infinity` 0건.
  - 기간 내 기록 0건이면 `EmptyState` `"이 기간에는 기록이 없어요"`가 표시되고 `wage-card` 노드 수 0.
  - 각 카드는 시급 t2 강조 타이포 + 보조 라인(순수입 / 근무시간 / 기록 건수)을 포함하며 맨 `<div>` 나열이 아닌 Card 컴포넌트로 묶인다. 카드에 onClick 핸들러 0건.
  - 로딩 시 Card 스켈레톤 2개 표시.
- **Covers**: [F5-AC1, F5-AC2, F5-AC3, F5-AC4, F5-AC5, F5-AC6, F5-AC7]
- **Files**: `src/pages/WagePage.tsx`
- **Depends on**: Task 2.5, Task 3.2

### Task 4.7 `/report` 월 네비게이션 + 리워드 광고 게이트
- **Description**: 월 선택(이전/다음, 최근 12개월 제한), 해금 상태 판정, `TossRewardAd` 게이트, 실패 처리, 기록 없는 달 처리를 구현한다. 본문 지표는 4.8에서 채운다.
- **DoD**:
  - **state 방어**: `const state = (useLocation().state as RouteState['/report']) ?? null;` → `state?.month`가 `/^\d{4}-\d{2}$/`에 맞지 않으면 오늘 기준 현재 월로 대체. state 없이 직접 진입해도 크래시하지 않는다.
  - `2026-08`이 `reportUnlocks`에 없으면 잠금 화면에 월 총 기록 건수만 노출되고 `"광고 보고 리포트 확인"` Button(높이 56px)이 표시된다. 본문 지표 DOM(`report-hero`) 노드 수 0.
  - `<TossRewardAd slotId={import.meta.env.VITE_TOSS_AD_SLOT_ID}>` 시청 완료 시 본문이 표시되고 `gigledger.reportUnlocks.v1['2026-08']`에 ISO8601 문자열이 저장된다.
  - `reportUnlocks['2026-08']`가 존재하면 진입 즉시 게이트 없이 본문이 표시된다(광고 로드 호출 0건).
  - 광고 로드 실패/중도 종료 시 Toast `"광고를 불러오지 못했어요. 잠시 후 다시 시도해주세요"` 표시, `reportUnlocks`에 키 추가 0건, 잠금 화면에 `"다시 시도"` 버튼 표시.
  - 광고 로드 중 버튼이 `loading` 상태로 전환되어 중복 탭이 무시된다.
  - 해당 월 기록 0건이면 게이트를 렌더하지 않고 `EmptyState` `"이 달에는 기록이 없어요"` 표시.
  - 오늘이 `2026-08-31`일 때 `2026-08`에서 `"다음 달"` 버튼 `disabled === true`, `2025-09`에서 `"이전 달"` 버튼 `disabled === true`. 두 버튼 터치 타깃 44×44px.
  - 월 이동으로 미해금 월로 전환하면 게이트가 다시 표시되고, 해금 월로 돌아오면 광고 없이 본문이 표시된다(월별 독립 해금).
  - `ScreenScaffold` + `Top(title="월간 리포트")` 구조.
- **Covers**: [F7-AC1, F7-AC2, F7-AC4, F7-AC5, F7-AC6]
- **Files**: `src/pages/ReportPage.tsx`
- **Depends on**: Task 2.5, Task 3.2

### Task 4.8 `/report` 본문 지표 + 공유 이동
- **Description**: 해금된 월의 리포트 본문(히어로, metric Card 3개, 플랫폼 순위, 최고 수입일, 월내 Sparkline)과 공유 카드 이동 버튼을 구현한다.
- **DoD**:
  - 예시 데이터(총수입 2,400,000 / 경비 300,000 / 12,000분, 전월 순수입 1,750,000)에서 `data-testid="report-hero"`에 순수입 `2,100,000원`(CountUp), 평균 실질 시급 `10,500원`, 전월 대비 Chip `"+20%"`가 표시된다.
  - 전월 순수입이 0이면 증감 Chip이 `"—"`로 표시되고 `NaN`/`Infinity` 출력 0건.
  - `data-testid="report-metric-card"` Card가 3개 이상 렌더되고 핵심 값이 t2~t3 강조 타이포로 표시된다(맨 `<div>` 나열 0건).
  - 플랫폼별 순위가 순수입 내림차순 Card 목록 + MiniBar로 표시되며, **보관·삭제된 플랫폼 기록도 집계에 포함**된다(삭제 id는 `"삭제된 플랫폼"` 라벨, 크래시 0건).
  - `data-testid="report-best-day"`에 최고 수입일의 날짜(`YYYY-MM-DD`)와 금액(`formatKRW`)이 표시되고, 동점이면 더 이른 날짜를 선택한다.
  - 월내 일별 순수입 Sparkline이 해당 월 일수만큼의 포인트로 렌더된다(기록 없는 날 0).
  - 하단 `SubmitFooter`의 `display="block"` Button `"공유 카드 만들기"` 탭 시 `navigate('/share', { state: { month: '2026-08' } })`가 정확한 현재 선택 월로 호출된다.
- **Covers**: [F7-AC3, F7-AC7, F7-AC8(레이아웃부)]
- **Files**: `src/pages/report/ReportBody.tsx`, `src/pages/ReportPage.tsx`(본문 연결)
- **Depends on**: Task 4.7, Task 3.1

### Task 4.9 `/share` 공유 카드 화면
- **Description**: 월 요약 카드 미리보기, 클립보드 복사, Canvas PNG 저장, 폴백 텍스트를 구현한다.
- **DoD**:
  - **state 방어**: `const state = (useLocation().state as RouteState['/share']) ?? null;` → `state`가 `null`이거나 `state.month`가 `/^\d{4}-\d{2}$/` 불일치면 오늘 기준 현재 월로 대체 렌더하며 크래시하지 않는다(직접 진입/새로고침 테스트 통과).
  - `{month:'2026-08'}` 진입 시 `data-testid="share-card"` 안에 `"2026년 8월"`, 순수입 `2,100,000원`, 실질 시급 `10,500원`, `"3일 연속 기록"`, 플랫폼 비중 MiniBar가 모두 포함된다. 카드 가로폭 100%, 비율 4:5 고정.
  - `"요약 복사"` 탭 시 `navigator.clipboard.writeText`에 정확히 `"2026년 8월 순수입 2,100,000원 · 실질 시급 10,500원 (GigLedger)"`가 전달되고 Toast `"요약을 복사했어요"` 표시.
  - `navigator.clipboard`가 `undefined`이거나 `writeText`가 reject하면 Toast `"복사할 수 없어요. 아래 텍스트를 길게 눌러 복사해주세요"` 표시 + `data-testid="share-fallback-text"` 선택 가능 텍스트 블록이 카드 하단에 노출된다.
  - `"이미지 저장"` 탭 시 Canvas가 `1080 × 1350`으로 그려지고(`devicePixelRatio` 반영) `toDataURL('image/png')` 결과가 `data:image/png` 접두사로 생성되며 Toast `"이미지를 저장했어요"` 표시.
  - **[신규] Canvas 색상**: `shareCanvas.ts`에서 플랫폼 색은 `getComputedStyle(document.documentElement).getPropertyValue('--tds-color-...')`로 읽어 사용하며 HEX 리터럴 0건(`grep -n "#[0-9a-fA-F]\{3,6\}" src/lib/shareCanvas.ts` = 0). 변수 조회 실패 시 `grey` 폴백으로 그린다.
  - 이미지 생성 중 버튼이 `loading` 상태가 되어 연속 탭 시 렌더 호출이 1회만 발생하고 완료 후 원래 라벨로 복귀한다.
  - 해당 월 기록 0건이면 `"기록이 있어야 카드를 만들 수 있어요"` + `"기록하러 가기"` 버튼 → `navigate('/entry',{state:{date:오늘}})`.
  - `grep -n "navigator.share\|window.open\|intent://\|kakaolink://" src/pages/SharePage.tsx` 결과 0건.
  - 두 버튼 모두 세로 스택, `display="block"`, 높이 56px.
- **Covers**: [F8-AC1, F8-AC2, F8-AC3, F8-AC4, F8-AC5, F8-AC6, F8-AC7]
- **Files**: `src/pages/SharePage.tsx`, `src/lib/shareCanvas.ts`
- **Depends on**: Task 3.1, Task 2.5

---

## Epic 5. 통합 + 폴리시 (라우팅 · 광고 배치 · 검수 게이트)

**Risk Assessment**
- Complexity: **Medium**
- Risk factors: 광고를 요약/리스트 사이가 아닌 고정 오버레이로 붙이면 콘텐츠를 가려 검수 반려. HEX 색상·외부 링크·외부 로깅 의존성이 한 건이라도 남으면 즉시 반려. 라우팅 배선 시 미정의 경로가 흰 화면이 됨. **[GAP-4]** 보관 파급효과가 화면별로 엇갈리면(입력에선 제외, 조회에선 유지) 회귀 없이는 발견되지 않는다.
- Mitigation: 모든 페이지가 완성된 뒤 마지막에 배선·광고·정적 검사를 수행해 "완성된 화면 기준"으로 grep 게이트를 한 번에 통과시킨다. 정적 검사 태스크(5.3)를 릴리스 게이트로 두어 반려 사유를 사전 차단하고, 5.4에서 보관·bestStreak·손상 데이터 3대 상태 전이를 종단 회귀한다.

### Task 5.1 라우팅 배선 + FloatingTabBar + state 방어 회귀
- **Description**: `BrowserRouter`/`Routes`에 7개 경로를 연결하고 하단 4탭을 배선한다. 모든 state 수신 화면의 직접 진입 안전성을 회귀 검증한다.
- **DoD**:
  - `/`, `/entry`, `/platforms`, `/wage`, `/report`, `/share`, `/settings` 7개 Route가 등록되고, 미정의 경로는 `<Navigate to="/" replace />`로 처리된다.
  - `FloatingTabBar`가 `홈(/)`, `기록(/entry)`, `리포트(/report)`, `설정(/settings)` 4탭으로 렌더되고 각 탭 터치 타깃 ≥48×48px, 현재 경로 탭이 활성 표시된다.
  - `/platforms`, `/wage`, `/share`에서는 FloatingTabBar가 렌더되지 않고 `Top` 좌측 뒤로 버튼으로 복귀한다.
  - 7개 경로 전부를 `location.state` 없이 새로고침으로 직접 진입했을 때 흰 화면·throw 0건(각 경로 스크린샷/렌더 테스트 통과).
  - `grep -rn "useLocation().state as" src/pages/` 결과의 모든 사용처가 같은 줄 또는 다음 줄에 `?? null`을 포함하고, 구조 분해(`const { x } = useLocation().state as`) 패턴이 0건.
  - 모든 `navigate(path, { state })` 호출의 state 형태가 `RouteState[path]`와 타입 일치(`npx tsc --noEmit` 통과, `any` 캐스팅 0건).
- **Covers**: [F7-AC7(호출 배선 검증)]
- **Files**: `src/App.tsx`, `src/main.tsx`
- **Depends on**: Task 4.1~4.9

### Task 5.2 광고 배치 (AdSlot 2슬롯)
- **Description**: 홈과 리포트에 배너 광고를 SPEC이 지정한 위치에 정확히 1회씩 배치한다.
- **DoD**:
  - 홈에 기록이 1건 이상일 때 `<AdSlot adGroupId={import.meta.env.VITE_TOSS_AD_GROUP_ID} />`가 요약 카드 섹션과 최근 기록 리스트 섹션 **사이**에 정확히 1개 렌더된다(DOM 순서 검증: `summary-hero` < AdSlot < 첫 ListRow).
  - 홈이 빈 상태(`entries.length===0`)이면 AdSlot 렌더 0건.
  - 리포트 본문 표시 시 AdSlot이 본문 **아래**, `"공유 카드 만들기"` 버튼 **위**에 정확히 1개 렌더된다. 리포트가 잠금 상태이거나 기록 0건이면 AdSlot 렌더 0건.
  - AdSlot 요소의 computed `position`이 `fixed`/`sticky`가 아니며, 인접 콘텐츠와 bounding box가 겹치지 않는다(overlap 0px).
  - 광고 로드 실패 시에도 레이아웃이 무너지지 않고 콘텐츠가 정상 표시된다.
  - `.env.example`에 `VITE_TOSS_AD_GROUP_ID`, `VITE_TOSS_AD_SLOT_ID`가 문서화되고 소스에 ID 하드코딩 0건.
- **Covers**: [F4-AC9, F7-AC8(광고 배치부)]
- **Files**: `src/pages/HomePage.tsx`, `src/pages/report/ReportBody.tsx`, `.env.example`
- **Depends on**: Task 5.1

### Task 5.3 검수 정적 게이트 (금지 패턴 · 색상 · 터치 타깃)
- **Description**: 앱인토스 검수 반려 사유가 되는 패턴을 전수 검사하고 위반 항목을 수정한다. 검사 스크립트를 저장소에 남긴다.
- **DoD**:
  - `grep -rn "window.open\|location.href" src/` 결과 **0건**.
  - `grep -rniE "설치|다운로드|앱스토어|플레이스토어|https?://" src/` 결과 0건(법률 고지 예외 없음 — SPEC상 외부 링크 미사용).
  - `grep -rnE "#[0-9a-fA-F]{3}\b|#[0-9a-fA-F]{6}\b" src/**/*.{ts,tsx,css}` 결과 0건, 색상 지정은 `var(--tds-color-*)`만 사용(색상 토큰 매핑은 `constants.ts`의 `colorVar` 단일 출처).
  - `grep -rniE "google-analytics|gtag|amplitude|mixpanel|sentry" package.json src/ index.html` 결과 0건.
  - `grep -rn "fetch(\|XMLHttpRequest\|axios" src/` 결과 0건(광고 SDK 내부 호출 제외).
  - `grep -rniE "openai|anthropic|claude|gpt|generativeai|llm" src/` 결과 0건 — 모든 표시값이 사용자 입력의 산술 계산 결과임을 확인.
  - `grep -rn "shadcn\|@mui\|antd\|@chakra-ui" package.json src/` 결과 0건.
  - **[신규] 저장 책임 단일화 검사**: `grep -rn "localStorage" src/pages/ src/components/` 결과 0건(저장소 접근은 `src/lib/storage.ts` 단독). `grep -rn "bestStreak" src/pages/`의 모든 히트가 **읽기 전용**이며 `saveSettings(` 인접 호출 0건.
  - `vite build` 후 7개 경로(`/`, `/entry`, `/platforms`, `/wage`, `/report`, `/share`, `/settings`)를 순회하며 `console.error` 캡처 결과 **0건**.
  - 각 화면의 모든 Button/ListRow/Chip/Tab 항목 및 `data-testid="color-picker"` 내 6개 색상 요소에 대해 `getBoundingClientRect().height >= 44`를 만족(위반 요소 목록 출력 0건).
  - 라이트/다크 모드 각각에서 7개 화면 텍스트 대비가 깨지지 않음(TDS 토큰만 사용 확인).
  - 검사 명령이 `scripts/audit.sh`로 저장되어 재실행 가능.
- **Covers**: [AC-G1, AC-G2, AC-G3, AC-G4, AC-G6, AC-G7, AC-G8, AC-API-1]
- **Files**: `scripts/audit.sh`, 위반 발견 시 해당 소스 파일
- **Depends on**: Task 5.2

### Task 5.4 엣지 케이스 회귀 & 최종 UX 폴리시 ← **[GAP-1/GAP-4 반영 수정]**
- **Description**: 저장 실패·손상 데이터·직접 진입·대용량 데이터·**스트릭 갱신·플랫폼 보관 파급** 시나리오를 실제 앱에서 종단 검증하고 잔여 UX를 다듬는다.
- **DoD**:
  - `gigledger.entries.v1`에 `"{{broken"`을 넣고 앱 시작 → Toast `"일부 저장 데이터를 불러오지 못했어요"` 1회 노출, 홈이 빈 상태로 정상 렌더, `console.error` 0건.
  - `localStorage.setItem`을 `QuotaExceededError`로 모킹한 상태에서 (a) 수입 저장 (b) 플랫폼 추가 (c) 목표 저장 3개 동작 각각 → Toast `"저장 공간이 부족해요. 오래된 기록을 삭제해주세요"` 노출, 화면 크래시 0건, 직전 상태 유지.
  - **[신규] GAP-1 종단 회귀 (F6-AC4)**: 초기 `bestStreak:2` + 기록 `08-29`,`08-30` 상태로 앱 시작 → 홈 진입(스트릭 `"2일 연속"`) → `/entry`에서 `08-31` 저장 → 홈 복귀 시 **재시작 없이** `"3일 연속 기록 중"` · `"최고 3일"` 표시 및 `gigledger.settings.v1.bestStreak === 3`. 이어서 `08-31` 기록 삭제 → 현재 스트릭은 0/2로 줄되 `bestStreak`는 `3` 유지. 이 시나리오 전체에서 settings 키 `setItem` 호출 횟수 ≤ 2, 렌더 루프(동일 프레임 5회 이상 리렌더) 0건.
  - **[신규] GAP-4 보관 파급 종단 회귀 (F2-AC4)**: `대리운전`에 기록 5건이 있는 상태에서 `/platforms` → 보관 처리 후 아래 4개를 순서대로 확인한다.
    1. `/entry` 신규 모드 Chip 목록에 `"대리운전"` 0건, Chip 수 = 활성 플랫폼 수.
    2. 홈 최근 기록 리스트에 해당 5건이 그대로 표시되고 플랫폼명이 `"대리운전"`(삭제된 플랫폼 아님).
    3. `/wage` 해당 기간 카드에 `대리운전`이 `"보관됨"` Chip과 함께 표시되고 시급 값이 보관 전과 동일.
    4. `/report` 해금된 월의 플랫폼 순위·MiniBar 합계가 보관 전후 동일(`net` 총액 불변).
    - 그리고 `gigledger.entries.v1` 길이가 보관 전후 불변이며, 해당 5건 중 하나를 탭해 수정 모드 진입 시 `"대리운전"` Chip이 `"보관됨"` 표기로 선택된 상태로 렌더되고 금액만 수정해 저장하면 `platformId`가 유지된다.
  - 5,000건 시드 후 홈 진입 → 초기 렌더 1.5초 이내 완료, ListRow DOM ≤100, 스크롤 시 프레임 드랍으로 인한 흰 화면 0건.
  - `/report`, `/share`, `/entry`, `/wage`를 각각 state 없이 새로고침 → 4개 모두 안전 기본값으로 렌더되고 크래시 0건.
  - `AC-G5` 재확인: 빌드 산출물(`dist/assets/*.js`)에 `Object.groupBy`, `.toSorted(`, `(?<=` 문자열 0건.
  - `/settings` 하단 `"기록은 이 기기에만 저장돼요"` 문구가 실제 화면에 노출되고, 목표 저장 후에도 `bestStreak` 값이 보존된다.
  - 전 화면 순회 후 `npm run build` 에러 0, 경고성 React key/act 경고 0건.
- **Covers**: [AC-G9(E2E 재확인), AC-G10(E2E 재확인), AC-G5(빌드 산출물 검증), F6-AC4(E2E 재확인), F2-AC4(E2E 재확인), F8-AC5(직접 진입 회귀)]
- **Files**: `scripts/audit.sh`(엣지 시나리오 체크리스트 추가), 회귀 발견 시 해당 소스 파일
- **Depends on**: Task 5.3

---

## AC Coverage

- **Total ACs in SPEC: 72**
  - 공통(CP-4) 10 · F1 8 · F2 7 · F3 8 · F4 9 · F5 7 · F6 7 · F7 8 · F8 7 · API 1

- **Covered by tasks: 72** (v2에서 변경된 매핑은 **굵게**)

| AC | Task |
|---|---|
| AC-G1 | 5.3 |
| AC-G2 | 5.3 |
| AC-G3 | 5.3 |
| AC-G4 | 5.3 (+3.1, 4.2, 4.9 grep) |
| AC-G5 | 2.1, 5.4 |
| AC-G6 | 5.3 |
| AC-G7 | 5.3 |
| AC-G8 | 5.3 (+**4.2 색상 Chip 44px**) |
| AC-G9 | 2.3, 2.5, 5.4 |
| AC-G10 | 2.3, 2.5, 5.4 |
| F1-AC1 | 2.3 |
| F1-AC2 | 2.3 |
| F1-AC3 | 2.4 |
| F1-AC4 | 2.4 |
| F1-AC5 | 2.4 |
| F1-AC6 | 2.2 |
| F1-AC7 | 2.3 |
| F1-AC8 | 2.5 |
| F2-AC1 | 4.2 (+**3.1 ColorDot**) |
| F2-AC2 | 2.2, 4.2 |
| F2-AC3 | 2.2, 4.2 |
| F2-AC4 | 4.2, **2.2(참조 규칙)**, **2.3(저장 불변)**, **4.3(입력 제외)**, **4.5(기록 유지)**, **5.4(종단)** |
| F2-AC5 | 4.2 |
| F2-AC6 | 4.2 |
| F2-AC7 | 4.2, **3.1** |
| F3-AC1 | 4.3 |
| F3-AC2 | 4.3 |
| F3-AC3 | 4.3 |
| F3-AC4 | 2.2, 4.3 |
| F3-AC5 | 2.2, 4.3 |
| F3-AC6 | 4.3 |
| F3-AC7 | 4.3 |
| F3-AC8 | 3.2, 4.3 |
| F4-AC1 | 4.4 |
| F4-AC2 | 4.4 |
| F4-AC3 | 3.1, 4.4 |
| F4-AC4 | 4.5 |
| F4-AC5 | 4.4 |
| F4-AC6 | 3.2, 4.4 |
| F4-AC7 | 4.5 |
| F4-AC8 | 4.5 |
| F4-AC9 | 5.2 |
| F5-AC1 | 4.6 |
| F5-AC2 | 4.6 |
| F5-AC3 | 4.6 |
| F5-AC4 | 4.6 |
| F5-AC5 | 2.4, 4.6 |
| F5-AC6 | 4.6 |
| F5-AC7 | 4.6 |
| F6-AC1 | 4.4 |
| F6-AC2 | 4.4 |
| F6-AC3 | 4.1 |
| F6-AC4 | **2.5(갱신 시점: entries 파생)**, **4.4(표시 + 저장→복귀 회귀)**, **5.4(E2E)** |
| F6-AC5 | 4.4 |
| F6-AC6 | 2.2, 4.1 |
| F6-AC7 | 4.4 |
| F7-AC1 | 4.7 |
| F7-AC2 | 4.7 |
| F7-AC3 | 4.8 |
| F7-AC4 | 4.7 |
| F7-AC5 | 4.7 |
| F7-AC6 | 4.7 |
| F7-AC7 | 4.8, 5.1 |
| F7-AC8 | 4.8, 5.2 |
| F8-AC1 | 4.9 |
| F8-AC2 | 4.9 |
| F8-AC3 | 4.9 |
| F8-AC4 | 4.9 |
| F8-AC5 | 4.9, 5.4 |
| F8-AC6 | 4.9 |
| F8-AC7 | 4.9 |
| AC-API-1 | 5.3 |

- **Uncovered: 0**

---

## 파일 소유권 (충돌 점검)

| 파일 | 태스크 | 순서 보장 |
|---|---|---|
| `src/main.tsx` | 2.5(Provider 삽입) → 5.1(Router 배선) | 2.5 → 4.x → 5.1 의존 체인으로 순차 ✓ |
| `src/pages/HomePage.tsx` | 4.4(요약) → 4.5(리스트 삽입) → 5.2(AdSlot) | 4.4 → 4.5 → 5.1 → 5.2 ✓ |
| `src/pages/ReportPage.tsx` | 4.7(게이트) → 4.8(본문 연결) | 4.7 → 4.8 ✓ |
| `src/pages/report/ReportBody.tsx` | 4.8(본문) → 5.2(AdSlot) | 4.8 → 5.1 → 5.2 ✓ |
| `scripts/audit.sh` | 5.3(생성) → 5.4(시나리오 추가) | 5.3 → 5.4 ✓ |
| `src/components/ColorDot.tsx` | 3.1 단독 소유 (4.2·4.3·4.5는 사용만) | ✓ |
| `src/lib/*` | 각 파일 단일 태스크 소유 | ✓ |

그 외 모든 파일은 단일 소유. **동시 편집 충돌 0건.**
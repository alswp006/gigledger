# Shared Context (auto-generated — do NOT modify)


## 패킷 간 계약 (src/lib/contract.ts — 자동 생성, 수정 금지)
여기 선언된 이름·인자·반환 타입은 확정이다. 기반 패킷은 이대로 구현하고,
화면 패킷은 이대로 호출하라. 다르게 만들지 마라.

```typescript
/**
 * 패킷 간 인터페이스 계약 — 자동 생성. **수정하지 마라.**
 *
 * 기반 패킷은 여기 선언된 모양 그대로 구현하고, 화면 패킷은 여기 적힌 이름·인자·반환
 * 타입을 그대로 가정해도 된다. 추측이 어긋나 병합에서 무너지는 것을 막기 위한 파일이다.
 */

/** 수입 기록 엔티티 (구현: 패킷 0001) */
export type Entry = { id: string; platformId: string; amountKrw: number; date: string; hoursWorked?: number; memo?: string; createdAt: string };

/** 플랫폼 정의 (구현: 패킷 0001) */
export type Platform = { id: string; name: string; color: string; isActive: boolean; hourlyRate?: number; createdAt: string };

/** 앱 설정 (구현: 패킷 0001) */
export type Settings = { theme: "light" | "dark"; dailyGoalKrw: number; currencyDisplay: "KRW" | "USD"; adConsent: boolean; version: number };

/** 라우팅 상태 (구현: 패킷 0001) */
export type RouteState = { route: "home" | "entry" | "platforms" | "wage" | "report" | "settings" | "share"; entryId?: string; month?: string };

/** 전체 장부 상태 (구현: 패킷 0001) */
export type LedgerState = { entries: Entry[]; platforms: Platform[]; settings: Settings; isLoading: boolean };

/** localStorage 키 상수 (구현: 패킷 0002) */
export type STORAGE_KEYS = { entries: "app:entries"; platforms: "app:platforms"; settings: "app:settings" };

/** 색상 토큰 (구현: 패킷 0002) */
export type COLOR_TOKENS = { primary: string; success: string; warning: string; danger: string; neutral: string };

/** 앱 한계값 (구현: 패킷 0002) */
export type LIMITS = { maxMemoLength: 200; maxPlatforms: 20; adReportGap: 3 };

/** 금액 포맷팅 (KRW, USD, compact 옵션) (구현: 패킷 0003) */
export type formatAmountFn = (amount: number, opts?: { currency?: string; compact?: boolean }) => string;

/** 날짜 포맷팅 (구현: 패킷 0003) */
export type formatDateFn = (date: string, fmt?: "short" | "long" | "time") => string;

/** KRW 금액 파싱 (숫자로 변환) (구현: 패킷 0003) */
export type parseKrwAmountFn = (input: string) => number | null;

/** 고유 ID 생성 (구현: 패킷 0003) */
export type generateIdFn = () => string;

/** Entry 엔티티 검증 (구현: 패킷 0004) */
export type isValidEntryFn = (data: Partial<Entry>) => { valid: boolean; errors?: string[] };

/** Platform 엔티티 검증 (구현: 패킷 0004) */
export type isValidPlatformFn = (data: Partial<Platform>) => { valid: boolean; errors?: string[] };

/** 날짜별 금액 합계 (구현: 패킷 0006) */
export type sumAmountByDateFn = (entries: Entry[], dateStr: string) => number;

/** 월별 금액 합계 (구현: 패킷 0006) */
export type sumAmountByMonthFn = (entries: Entry[], monthStr: string) => number;

/** 시급 계산 (구현: 패킷 0006) */
export type calculateHourlyRateFn = (amount: number, hours: number) => number;

/** 연속 기록일 계산 (구현: 패킷 0006) */
export type getDayStreakFn = (entries: Entry[]) => number;

/** 장부 상태 관리 훅 (공개 API) (구현: 패킷 0007) */
export type useLedgerFn = () => { state: LedgerState; add: (entry: Entry) => void; update: (id: string, entry: Partial<Entry>) => void; delete: (id: string) => void; setPlatforms: (platforms: Platform[]) => void; getEntries: (opts?: { platformId?: string; startDate?: string; endDate?: string }) => Entry[] };

```

## Shared Types Contract (IMPORT these, do NOT redefine)
```typescript
// 엔티티 타입 + RouteState 계약 정의 (패킷 0001)
// 런타임 코드 없음 — export type/interface 선언만.

export type PlatformCategory = "delivery" | "driving" | "logistics" | "freelance" | "etc";

export type ColorToken = "blue" | "green" | "orange" | "purple" | "red" | "grey";

export interface Platform {
  id: string;
  name: string;
  category: PlatformCategory;
  colorToken: ColorToken;
  archived: boolean;
  createdAt: string;
}

export interface IncomeEntry {
  id: string;
  platformId: string;
  date: string;
  amount: number;
  expense: number;
  minutes: number;
  memo: string;
  createdAt: string;
  updatedAt: string;
}

export interface Settings {
  monthlyGoal: number;
  bestStreak: number;
  noticeSeenAt: string | null;
}

export type ReportUnlockMap = Record<string, string>;

// 기간 합산 결과 (calcPeriodSummary)
export interface PeriodSummary {
  totalAmount: number;
  totalExpense: number;
  netAmount: number;
  totalMinutes: number;
}

// 연속 기록 스트릭 결과 (calcStreak)
export interface StreakResult {
  current: number;
  lastDate: string | null;
}

// 플랫폼별 실질 시급 행 (/wage)
export interface WageRow {
  platformId: string;
  platformName: string;
  colorToken: ColorToken;
  netAmount: number;
  totalMinutes: number;
  entryCount: number;
  hourlyWage: number | null;
}

// 월간 소득 리포트 (/report)
export interface MonthlyReport {
  month: string;
  totalAmount: number;
  totalExpense: number;
  netAmount: number;
  averageHourlyWage: number | null;
  platformRanking: WageRow[];
  previousMonthDeltaPercent: number | null;
  bestDay: { date: string; amount: number } | null;
}

export type SaveResult<T> = { ok: true; data: T } | { ok: false; error: string };

export type RouteState = {
  "/": null;
  "/entry": { date: string } | { entryId: string } | null;
  "/platforms": null;
  "/wage": null;
  "/report": { month: string } | null;
  "/share": { month: string } | null;
  "/settings": null;
};

// 타입은 TS 컴파일 시 소거되어 모듈 런타임 객체에 키로 남지 않는다(export interface/type 자체는
// value space가 아니므로). 아래는 그 사실과 무관하게 "타입이 export됐는지"를 런타임에서도
// 확인하려는 소비 코드(및 packet-0001.test.ts)를 위한 존재 마커일 뿐, 어떤 로직도 갖지 않는다.
export const PlatformCategory = {} as const;
export const ColorToken = {} as const;
export const Platform = {} as const;
export const IncomeEntry = {} as const;
export const Settings = {} as const;
export const ReportUnlockMap = {} as const;
export const PeriodSummary = {} as const;
export const StreakResult = {} as const;
export const WageRow = {} as const;
export const MonthlyReport = {} as const;
export const SaveResult = {} as const;
export const RouteState = {} as const;

```

## Existing Codebase (import and use these — do NOT recreate)
### File Tree (src/)
  App.tsx
  components/
    AdSlot.tsx
    Amount.tsx
    BottomCTA.tsx
    Card.tsx
    CountUp.tsx
    FloatingTabBar.tsx
    MiniBar.tsx
    PageShell.tsx
    ScreenScaffold.tsx
    Sparkline.tsx
    StateView.tsx
    SummaryHero.tsx
    TossPurchase.tsx
    TossRewardAd.tsx
  hooks/
  lib/
    constants.ts
    contract.ts
    date.ts
    format.ts
    id.ts
    storage.ts
    types.ts
    utils.ts
  main.tsx
  pages/
    Home.tsx
    __TdsGallery.tsx
  styles/
    globals.css
    reward-ad.css
  types/
  vite-env.d.ts

### Exports (src/lib/)
- constants.ts: export const STORAGE_KEYS =; export const MIN_WAGE_2026 = 10320; export const MAX_ENTRIES = 5000; export const MAX_PLATFORMS = 20; export const MAX_AMOUNT = 10000000; export const MAX_MINUTES = 1440; export const MAX_MEMO = 50; export const MAX_PLATFORM_NAME = 12
- contract.ts: export type Entry =; export type Platform =; export type Settings =; export type RouteState =; export type LedgerState =; export type STORAGE_KEYS =; export type COLOR_TOKENS =; export type LIMITS =
- date.ts: export function toDateKey(date: Date): string; export function toMonthKey(dateStr: string): string; export function startOfWeek(dateStr: string): string; export function addMonthKey(monthStr: string, delta: number): string; export function formatDate(date: string, fmt: "short" | "long" | "time" = "short"): string
- format.ts: export function formatKRW(amount: number): string; export function formatMinutes(minutes: number): string; export function formatWage(amount: number | null): string; export function formatDelta(current: number, previous: number): string; export function formatAmount(amount: number, opts?:; export function parseKrwAmount(input: string): number | null
- id.ts: export function genId(): string; export function generateId(): string
- storage.ts: export function getItem<T>(key: string): T | null; export function setItem<T>(key: string, value: T): void; export function removeItem(key: string): void
- types.ts: export type PlatformCategory = "delivery" | "driving" | "logistics" | "freelance" | "etc"; export type ColorToken = "blue" | "green" | "orange" | "purple" | "red" | "grey"; export interface Platform; export interface IncomeEntry; export interface Settings; export type ReportUnlockMap = Record<string, string>; export interface PeriodSummary; export interface StreakResult
- utils.ts: export function cn(...classes: (string | boolean | undefined | null)[]): string; export function formatNumber(n: number): string; export function formatCurrency(n: number, currency = 'KRW'): string

### Components (src/components/)
- AdSlot.tsx: AdSlot
- Amount.tsx: Amount
- BottomCTA.tsx: SubmitFooter, ButtonStack
- Card.tsx: Card
- CountUp.tsx: CountUp
- FloatingTabBar.tsx: FloatingTabBar
- MiniBar.tsx: MiniBar
- PageShell.tsx: PageShell
- ScreenScaffold.tsx: ScreenScaffold
- Sparkline.tsx: Sparkline
- StateView.tsx: EmptyState, LoadingState
- SummaryHero.tsx: SummaryHero
- TossPurchase.tsx: TossPurchase
- TossRewardAd.tsx: TossRewardAd

### Module Dependencies (import graph)
  lib/constants.ts → imports: lib/types
CRITICAL: Before creating any new function, type, or component, check the list above. If something similar exists, import and use it.

## Already Implemented (do NOT duplicate or overwrite)
- 0001: 엔티티 타입 + RouteState 계약 정의 (files: src/lib/types.ts)
- 0002: 상수 모듈 (STORAGE_KEYS / 한계값 / 색상 토큰) (files: src/lib/constants.ts)
- 0003: 포맷/날짜/ID 유틸 (순수 함수) (files: src/lib/format.ts, src/lib/date.ts, src/lib/id.ts)
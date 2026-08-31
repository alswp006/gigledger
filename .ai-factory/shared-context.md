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

/** 핵심 도메인 데이터 구조, 모든 페이지가 의존 (구현: 패킷 0001) */
export type Ledger = { id: string; entries: Entry[]; platforms: Platform[]; created: string; updated: string };

/** 수입 기록 엔티티 (구현: 패킷 0001) */
export type Entry = { id: string; platformId: string; amountKrw: number; earnedAt: string; memo?: string };

/** 플랫폼 정의 (구현: 패킷 0001) */
export type Platform = { id: string; name: string; color: string; active: boolean; createdAt: string };

/** 라우팅 상태, 0019가 사용 (구현: 패킷 0001) */
export type RouteState = { tab: 'home' | 'platforms' | 'entry' | 'wage' | 'report' | 'share'; params?: Record<string, string> };

/** 검증 에러 타입 (구현: 패킷 0001) */
export type ValidationError = { field: string; message: string };

/** localStorage 키 상수 (구현: 패킷 0002) */
export type STORAGE_KEYS = { readonly ledger: string; readonly onboardingDone: string; readonly adConsent: string };

/** 시각화 색상 토큰, 0008에서 사용 (구현: 패킷 0002) */
export type COLOR_PALETTE = { success: string; warning: string; danger: string; info: string };

/** 입력 한계값, 0004/0012에서 사용 (구현: 패킷 0002) */
export type LIMITS = { maxEntryMemo: number; maxPlatformName: number; maxMonthlyDisplay: number };

/** 금액 포맷, 모든 시각화 컴포넌트에서 사용 (구현: 패킷 0003) */
export type formatAmountFn = (amount: number, opts?: { currency?: string; decimals?: number }) => string;

/** 날짜 포맷, 0013/0017에서 사용 (구현: 패킷 0003) */
export type formatDateFn = (date: string | Date, format?: 'short' | 'long') => string;

/** 날짜 파싱, 0012에서 사용 (구현: 패킷 0003) */
export type parseDateFn = (dateStr: string) => Date | null;

/** UUID 생성, 0012에서 엔티티 생성 (구현: 패킷 0003) */
export type generateIdFn = () => string;

/** 금액 검증, 0012에서 사용 (구현: 패킷 0004) */
export type validateAmountFn = (amount: number) => ValidationError | null;

/** 플랫폼명 검증, 0011에서 사용 (구현: 패킷 0004) */
export type validatePlatformNameFn = (name: string) => ValidationError | null;

/** localStorage에 저장, 0007이 호출 (구현: 패킷 0005) */
export type saveLedgerFn = (ledger: Ledger) => Promise<void>;

/** localStorage에서 로드, 0007이 호출 (구현: 패킷 0005) */
export type loadLedgerFn = () => Promise<Ledger | null>;

/** 연속 입력일 계산, 0013에서 사용 (구현: 패킷 0006) */
export type calculateStreakFn = (entries: Entry[]) => number;

/** 월 합계 계산, 0015/0017에서 사용 (구현: 패킷 0006) */
export type calculateMonthlyTotalFn = (entries: Entry[], year: number, month: number) => number;

/** 상태 관리 훅, 모든 페이지에서 의존 (구현: 패킷 0007) */
export type useLedgerFn = () => { ledger: Ledger | null; addEntry: (entry: Entry) => Promise<void>; updatePlatform: (platform: Platform) => Promise<void>; isLoading: boolean; error: string | null };

/** 토스트 알림 훅, 0012/0011에서 사용 (구현: 패킷 0020) */
export type useAppToastFn = () => { toast: (message: string, type?: 'success' | 'error' | 'info') => void };

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
    AdSection.tsx
    AdSlot.tsx
    Amount.tsx
    BottomCTA.tsx
    Card.tsx
    ColorDot.tsx
    CountUp.tsx
    EmptyState.tsx
    FloatingTabBar.tsx
    MiniBar.tsx
    PageShell.tsx
    RecentEntryList.tsx
    ReportBody.tsx
    ScreenScaffold.tsx
    SkeletonBlock.tsx
    Sparkline.tsx
    StateView.tsx
    SubmitFooter.tsx
    SummaryHero.tsx
    TossPurchase.tsx
    TossRewardAd.tsx
  hooks/
    useAppToast.ts
    useLedger.ts
    useOnboardingNotice.ts
  lib/
    calc.ts
    constants.ts
    contract.ts
    date.ts
    format.ts
    id.ts
    storage.ts
    types.ts
    utils.ts
    validate.ts
  main.tsx
  pages/
    Entry.tsx
    Home.tsx
    Platforms.tsx
    Report.tsx
    Settings.tsx
    Share.tsx
    Wage.tsx
    __TdsGallery.tsx
  styles/
    globals.css
    reward-ad.css
  types/
  vite-env.d.ts

### Exports (src/lib/)
- calc.ts: export function calcHourlyWage( entries: Array<Pick<IncomeEntry, "amount" | "expense" | "minutes">> ): number | null; export function calcStreak( entries: Array<Pick<IncomeEntry, "date">>, referenceDate: string ): StreakResult; export function calcPeriodSummary( entries: Array<Pick<IncomeEntry, "amount" | "expense" | "minutes">> ): PeriodSummary; export function calcGoalRate(current: number, monthlyGoal: number): number | null; export function calcPlatformWages(entries: IncomeEntry[], platforms: Platform[]): WageRow[]; export function calcTrend14( entries: Array<Pick<IncomeEntry, "date" | "amount" | "expense">>, referenceDate: string ): ; export function calcMonthlyReport( entries: IncomeEntry[], platforms: Platform[], month: string ): MonthlyReport; export function sumAmountByDate(entries: Entry[], dateStr: string): number
- constants.ts: export const STORAGE_KEYS =; export const MIN_WAGE_2026 = 10320; export const MAX_ENTRIES = 5000; export const MAX_PLATFORMS = 20; export const MAX_AMOUNT = 10000000; export const MAX_MINUTES = 1440; export const MAX_MEMO = 50; export const MAX_PLATFORM_NAME = 12
- contract.ts: export type Entry =; export type Platform =; export type Settings =; export type RouteState =; export type LedgerState =; export type STORAGE_KEYS =; export type COLOR_TOKENS =; export type LIMITS =
- date.ts: export function toDateKey(date: Date): string; export function toMonthKey(dateStr: string): string; export function startOfWeek(dateStr: string): string; export function addMonthKey(monthStr: string, delta: number): string; export function formatDate(date: string, fmt: "short" | "long" | "time" = "short"): string
- format.ts: export function formatKRW(amount: number): string; export function formatMinutes(minutes: number): string; export function formatWage(amount: number | null): string; export function formatDelta(current: number, previous: number): string; export function formatAmount(amount: number, opts?:; export function parseKrwAmount(input: string): number | null
- id.ts: export function genId(): string; export function generateId(): string
- storage.ts: export function getItem<T>(key: string): T | null; export function setItem<T>(key: string, value: T): void; export function removeItem(key: string): void; export function getPlatforms(): Platform[]; export function savePlatforms(platforms: Platform[]): WriteResult; export function getEntries():; export interface SaveEntryResult; export function saveEntry(input: SaveEntryInput): SaveEntryResult
- types.ts: export type PlatformCategory = "delivery" | "driving" | "logistics" | "freelance" | "etc"; export type ColorToken = "blue" | "green" | "orange" | "purple" | "red" | "grey"; export interface Platform; export interface IncomeEntry; export interface Settings; export type ReportUnlockMap = Record<string, string>; export interface PeriodSummary; export interface StreakResult
- utils.ts: export function cn(...classes: (string | boolean | undefined | null)[]): string; export function formatNumber(n: number): string; export function formatCurrency(n: number, currency = 'KRW'): string
- validate.ts: export type ValidationResult = |; export function validateEntry(input: EntryInput): ValidationResult; export function validatePlatformName( name: string, existingPlatforms: Array<; export function isValidEntry(data: Partial<Entry>):; export function isValidPlatform(data: Partial<Platform>):; export function validateGoal(goal: number): ValidationResult

### Components (src/components/)
- AdSection.tsx: AdSection
- AdSlot.tsx: AdSlot
- Amount.tsx: Amount
- BottomCTA.tsx: SubmitFooter, ButtonStack
- Card.tsx: Card
- ColorDot.tsx: ColorDot
- CountUp.tsx: CountUp
- EmptyState.tsx: EmptyState
- FloatingTabBar.tsx: FloatingTabBar
- MiniBar.tsx: MiniBar
- PageShell.tsx: PageShell
- RecentEntryList.tsx: RecentEntryList
- ReportBody.tsx: ReportBody
- ScreenScaffold.tsx: ScreenScaffold
- SkeletonBlock.tsx: SkeletonBlock
- Sparkline.tsx: Sparkline
- StateView.tsx: EmptyGlyph, EmptyState, LoadingState
- Subm...
CRITICAL: Before creating any new function, type, or component, check the list above. If something similar exists, import and use it.

## Already Implemented (do NOT duplicate or overwrite)
- 0001: 엔티티 타입 + RouteState 계약 정의 (files: src/lib/types.ts)
- 0002: 상수 모듈 (STORAGE_KEYS / 한계값 / 색상 토큰) (files: src/lib/constants.ts)
- 0003: 포맷/날짜/ID 유틸 (순수 함수) (files: src/lib/format.ts, src/lib/date.ts, src/lib/id.ts)
- 0004: 검증 모듈 validate.ts (고정 에러 문구) (files: src/lib/validate.ts)
- 0005: localStorage 리포지토리 storage.ts (files: src/lib/storage.ts)
- 0006: 계산 순수 함수 calc.ts (files: src/lib/calc.ts)
- 0007: 상태 관리 훅 useLedger (files: src/hooks/useLedger.ts)
- 0008: 시각화 공용 컴포넌트 (SummaryHero / Sparkline / MiniBar / ColorDot) (files: src/components/SummaryHero.tsx, src/components/Sparkline.tsx, src/components/MiniBar.tsx, src/components/ColorDot.tsx)
- 0009: 레이아웃/상태 공용 컴포넌트 (SubmitFooter / EmptyState / SkeletonBlock) (files: src/components/SubmitFooter.tsx, src/components/EmptyState.tsx, src/components/SkeletonBlock.tsx)
- 0010: /settings 설정 화면 (files: src/pages/Settings.tsx)
- 0011: /platforms 플랫폼 관리 화면 (files: src/pages/Platforms.tsx)
- 0012: /entry 수입 입력/수정 화면 (files: src/pages/Entry.tsx)
- 0014: / 홈 — 최근 기록 리스트 + 무한 스크롤 (files: src/components/RecentEntryList.tsx)
- 0015: /wage 실질 시급 화면 (files: src/pages/Wage.tsx)
- 0017: /report 본문 지표 컴포넌트 + 공유 이동 (files: src/components/ReportBody.tsx)
- 0019: 라우팅 배선 + FloatingTabBar + 전역 Provider (files: src/App.tsx, src/components/FloatingTabBar.tsx)
- 0013: / 홈 — 요약 섹션 (Tab/Hero/스트릭/목표/차트) (files: src/pages/Home.tsx)

## Available exports from existing files
// src/App.tsx
export default function App() {

// src/components/AdSection.tsx
export function AdSection({ testId = "ad-section" }: { testId?: string }) {

// src/components/AdSlot.tsx
export function AdSlot({ adGroupId, className, variant, theme }: AdSlotProps) {

// src/components/Amount.tsx
export function Amount({

// src/components/BottomCTA.tsx
export function SubmitFooter({
export function ButtonStack({

// src/components/Card.tsx
export function Card({

// src/components/ColorDot.tsx
export function ColorDot({ colorToken }: { colorToken: ColorToken }) {

// src/components/CountUp.tsx
export function CountUp({

// src/components/EmptyState.tsx
export function EmptyState({

// src/components/FloatingTabBar.tsx
export type TabItem = {
export const MAIN_TABS: TabItem[] = [
export function FloatingTabBar({ items = MAIN_TABS }: { items?: TabItem[] }) {

// src/components/MiniBar.tsx
export interface MiniBarItem {
export function MiniBar({ items }: { items: MiniBarItem[] }) {

// src/components/PageShell.tsx
export function PageShell({ children, style }: { children: ReactNode; style?: CSSProperties }) {

// src/components/RecentEntryList.tsx
export function RecentEntryList({ entries, platforms }: RecentEntryListProps) {

// src/components/ReportBody.tsx
export function ReportBody({ entries, platforms, month }: ReportBodyProps) {

// src/components/ScreenScaffold.tsx
export function ScreenScaffold({

// src/components/SkeletonBlock.tsx
export function SkeletonBlock({

// src/components/Sparkline.tsx
export function Sparkline({ points, testId }: { points: number[]; testId?: string }) {

// src/components/StateView.tsx
export function EmptyGlyph({ label = "빈 상태" }: { label?: string }) {
export function EmptyState({
export function LoadingState({

// src/components/SubmitFooter.tsx
export function SubmitFooter({

// src/components/SummaryHero.tsx
export function SummaryHero({

// src/components/TossPurchase.tsx
export interface TossPurchaseResult {
export function Tos

## Memory Index (자동 학습 — 힌트로만 사용, 실제 코드 확인 필수)

Available topics: deploy(1), general(9), testing(1)

Key lessons (verify against actual code before applying):
- [general] 외부에서 들어온 모든 값(라우터 state, 로컬 저장소, 부분 입력 폼)은 사용 직전에 배열·객체 기본값으로 정규화하고, 테이블/맵 조회 결과는 존재 확인 후에만 하위 속성이나 length에 접근하라. (60% · 타 앱 1회 — 맹신 금지)
- [general] 의존 그래프 최하층의 타입·계약 파일은 런타임 코드 0줄의 순수 선언으로 가장 먼저 단독 타입체크를 통과시키고, 파일 생성은 셸 명령이 아닌 허용된 편집 도구로만 하게 강제하라. (60% · 타 앱 1회 — 맹신 금지)
- [general] 영속 저장소에서 읽은 값은 항상 스키마 기본값으로 정규화해 배열·객체 타입을 보장한 뒤 반환하고, 화면은 빈/손상/부분 데이터에서도 렌더되도록 방어하라. (60% · 타 앱 1회 — 맹신 금지)
- [general] 정책·기능 제거형 리팩터링은 화면과 도메인 로직 레이어에서만 수행하고, package.json의 플랫폼 필수 의존성(디자인 시스템·플랫폼 SDK·프레임워크 코어)은 어떤 경우에도 삭제하지 말 것 — 필수 패키지 화이트리스트를 빌드 전 가드로 검증하라. (60% · 타 앱 1회 — 맹신 금지)
- [general] 공용 기반 모듈(상수·저장소·계산 유틸)이 실제로 머지되기 전에는 이를 import하는 화면·훅 패킷을 머지하지 말고, 모든 머지 게이트에 타입체크와 프로덕션 빌드 통과(미해결 import 0건)를 필수로 걸어라. (60% · 타 앱 1회 — 맹신 금지)
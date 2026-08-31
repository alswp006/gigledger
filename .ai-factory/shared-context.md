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
// Domain types — add your app-specific types here
export {};

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
- storage.ts: export function getItem<T>(key: string): T | null; export function setItem<T>(key: string, value: T): void; export function removeItem(key: string): void
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
CRITICAL: Before creating any new function, type, or component, check the list above. If something similar exists, import and use it.

## Available exports from existing files
// src/App.tsx
export default function App() {

// src/components/AdSlot.tsx
export function AdSlot({ adGroupId, className, variant, theme }: AdSlotProps) {

// src/components/Amount.tsx
export function Amount({

// src/components/BottomCTA.tsx
export function SubmitFooter({
export function ButtonStack({

// src/components/Card.tsx
export function Card({

// src/components/CountUp.tsx
export function CountUp({

// src/components/FloatingTabBar.tsx
export type TabItem = {
export function FloatingTabBar({ items }: { items: TabItem[] }) {

// src/components/MiniBar.tsx
export function MiniBar({

// src/components/PageShell.tsx
export function PageShell({ children, style }: { children: ReactNode; style?: CSSProperties }) {

// src/components/ScreenScaffold.tsx
export function ScreenScaffold({

// src/components/Sparkline.tsx
export function Sparkline({

// src/components/StateView.tsx
export function EmptyState({
export function LoadingState({

// src/components/SummaryHero.tsx
export function SummaryHero({

// src/components/TossPurchase.tsx
export interface TossPurchaseResult {
export function TossPurchase({

// src/components/TossRewardAd.tsx
export function TossRewardAd({

// src/lib/contract.ts
export type Entry = { id: string; platformId: string; amountKrw: number; date: string; hoursWorked?: number; memo?: string; createdAt: string };
export type Platform = { id: string; name: string; color: string; isActive: boolean; hourlyRate?: number; createdAt: string };
export type Settings = { theme: "light" | "dark"; dailyGoalKrw: number; currencyDisplay: "KRW" | "USD"; adConsent: boolean; version: number };
export type RouteState = { route: "home" | "entry" | "platforms" | "wage" | "report" | "settings" | "share"; entryId?: string; month?: string };
export type LedgerState = { entries: Entry[]; platforms: Platform[]; settings: Settings; isLoading: boolean };
export type STORAGE_KEYS = { entries: "app:entries"; platforms: "app:platforms"; settings: "app:settings" };
expor

## Memory Index (자동 학습 — 힌트로만 사용, 실제 코드 확인 필수)

Available topics: deploy(1), general(9), testing(1)

Key lessons (verify against actual code before applying):
- [testing] 공유 상태·저장소·계산 엔진 같은 기반 계층은 화면 패킷보다 먼저 완전한 export 계약으로 머지하고, 모든 화면은 에러 경계와 state-없는 진입 폴백을 갖춰 한 화면의 예외가 전체 라우트 스모크를 무너뜨리지 않게 한다. (60% · 타 앱 1회 — 맹신 금지)
- [general] 외부에서 들어온 모든 값(라우터 state, 로컬 저장소, 부분 입력 폼)은 사용 직전에 배열·객체 기본값으로 정규화하고, 테이블/맵 조회 결과는 존재 확인 후에만 하위 속성이나 length에 접근하라. (60% · 타 앱 1회 — 맹신 금지)
- [general] 의존 그래프 최하층의 타입·계약 파일은 런타임 코드 0줄의 순수 선언으로 가장 먼저 단독 타입체크를 통과시키고, 파일 생성은 셸 명령이 아닌 허용된 편집 도구로만 하게 강제하라. (60% · 타 앱 1회 — 맹신 금지)
- [general] 영속 저장소에서 읽은 값은 항상 스키마 기본값으로 정규화해 배열·객체 타입을 보장한 뒤 반환하고, 화면은 빈/손상/부분 데이터에서도 렌더되도록 방어하라. (60% · 타 앱 1회 — 맹신 금지)
- [general] 정책·기능 제거형 리팩터링은 화면과 도메인 로직 레이어에서만 수행하고, package.json의 플랫폼 필수 의존성(디자인 시스템·플랫폼 SDK·프레임워크 코어)은 어떤 경우에도 삭제하지 말 것 — 필수 패키지 화이트리스트를 빌드 전 가드로 검증하라. (60% · 타 앱 1회 — 맹신 금지)
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

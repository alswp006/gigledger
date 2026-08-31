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

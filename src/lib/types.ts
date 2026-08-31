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

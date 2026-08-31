// 계산 순수 함수: 기간 합산·실질 시급·스트릭·목표 달성률·플랫폼별 시급 랭킹·
// 월간 리포트·14일 추이. 부수효과 없음(React import 0건). UI는 이 계산을 재구현하지 않는다.

import type {
  IncomeEntry,
  Platform,
  PeriodSummary,
  StreakResult,
  WageRow,
  MonthlyReport,
} from "@/lib/types";
import type { Entry } from "@/lib/contract";
import { toDateKey } from "@/lib/date";

function shiftDateStr(dateStr: string, deltaDays: number): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  date.setDate(date.getDate() + deltaDays);
  const yy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${yy}-${mm}-${dd}`;
}

/** 순수입(amount-expense)을 총 근무시간(분→시)으로 나눈 실질 시급. 분 합계가 0이면 null. */
export function calcHourlyWage(
  entries: Array<Pick<IncomeEntry, "amount" | "expense" | "minutes">>
): number | null {
  let netAmount = 0;
  let totalMinutes = 0;
  for (const e of entries) {
    netAmount += e.amount - e.expense;
    totalMinutes += e.minutes;
  }
  if (totalMinutes <= 0) return null;
  return Math.round(netAmount / (totalMinutes / 60));
}

/** referenceDate부터 거슬러 끊기지 않은 연속 기록일 수. 주 시작 요일과 무관(달력일 기준). */
export function calcStreak(
  entries: Array<Pick<IncomeEntry, "date">>,
  referenceDate: string
): StreakResult {
  const dateSet = new Set(entries.map((e) => e.date));
  if (dateSet.size === 0) {
    return { current: 0, lastDate: null };
  }

  let lastDate = entries[0].date;
  for (const d of dateSet) {
    if (d > lastDate) lastDate = d;
  }

  if (!dateSet.has(referenceDate)) {
    return { current: 0, lastDate };
  }

  let current = 0;
  let cursor = referenceDate;
  while (dateSet.has(cursor)) {
    current += 1;
    cursor = shiftDateStr(cursor, -1);
  }
  return { current, lastDate };
}

/** 기간(호출부가 미리 필터링한 entries)의 합산 — 주/월/전체 구분은 필터링 책임인 호출부에 있다. */
export function calcPeriodSummary(
  entries: Array<Pick<IncomeEntry, "amount" | "expense" | "minutes">>
): PeriodSummary {
  let totalAmount = 0;
  let totalExpense = 0;
  let totalMinutes = 0;
  for (const e of entries) {
    totalAmount += e.amount;
    totalExpense += e.expense;
    totalMinutes += e.minutes;
  }
  return {
    totalAmount,
    totalExpense,
    netAmount: totalAmount - totalExpense,
    totalMinutes,
  };
}

/** 월 목표 달성률(정수 %). monthlyGoal이 0 이하면 null. */
export function calcGoalRate(current: number, monthlyGoal: number): number | null {
  if (monthlyGoal <= 0) return null;
  return Math.round((current / monthlyGoal) * 100);
}

/** 플랫폼별 실질 시급 랭킹 — 시급 내림차순, minutes 합 0(hourlyWage:null)인 행은 항상 최하단. */
export function calcPlatformWages(entries: IncomeEntry[], platforms: Platform[]): WageRow[] {
  const platformMap = new Map(platforms.map((p) => [p.id, p]));
  const grouped = new Map<string, { netAmount: number; totalMinutes: number; entryCount: number }>();

  for (const e of entries) {
    const g = grouped.get(e.platformId) ?? { netAmount: 0, totalMinutes: 0, entryCount: 0 };
    g.netAmount += e.amount - e.expense;
    g.totalMinutes += e.minutes;
    g.entryCount += 1;
    grouped.set(e.platformId, g);
  }

  const rows: WageRow[] = [];
  for (const [platformId, agg] of grouped) {
    const platform = platformMap.get(platformId);
    if (!platform) continue;
    rows.push({
      platformId,
      platformName: platform.name,
      colorToken: platform.colorToken,
      netAmount: agg.netAmount,
      totalMinutes: agg.totalMinutes,
      entryCount: agg.entryCount,
      hourlyWage: agg.totalMinutes > 0 ? Math.round(agg.netAmount / (agg.totalMinutes / 60)) : null,
    });
  }

  rows.sort((a, b) => {
    if (a.hourlyWage === null && b.hourlyWage === null) return 0;
    if (a.hourlyWage === null) return 1;
    if (b.hourlyWage === null) return -1;
    return b.hourlyWage - a.hourlyWage;
  });

  return rows;
}

/** referenceDate를 포함한 최근 14일의 일별 순수입(amount-expense) 추이. 기록 없는 날은 0. */
export function calcTrend14(
  entries: Array<Pick<IncomeEntry, "date" | "amount" | "expense">>,
  referenceDate: string
): number[] {
  const byDate = new Map<string, number>();
  for (const e of entries) {
    byDate.set(e.date, (byDate.get(e.date) ?? 0) + (e.amount - e.expense));
  }

  const points: number[] = [];
  for (let i = 13; i >= 0; i -= 1) {
    const day = shiftDateStr(referenceDate, -i);
    points.push(byDate.get(day) ?? 0);
  }
  return points;
}

/** 월간 리포트 지표 — 합산·평균 시급·플랫폼 랭킹·전월 대비 증감률·최고 수입일. */
export function calcMonthlyReport(
  entries: IncomeEntry[],
  platforms: Platform[],
  month: string
): MonthlyReport {
  const monthEntries = entries.filter((e) => e.date.startsWith(month));
  const summary = calcPeriodSummary(monthEntries);
  const averageHourlyWage = calcHourlyWage(monthEntries);
  const platformRanking = calcPlatformWages(monthEntries, platforms);

  const [y, m] = month.split("-").map(Number);
  const prevMonth = `${m === 1 ? y - 1 : y}-${String(m === 1 ? 12 : m - 1).padStart(2, "0")}`;
  const prevMonthEntries = entries.filter((e) => e.date.startsWith(prevMonth));
  const prevNet = calcPeriodSummary(prevMonthEntries).netAmount;

  const previousMonthDeltaPercent =
    prevMonthEntries.length > 0 && prevNet !== 0
      ? Math.round(((summary.netAmount - prevNet) / Math.abs(prevNet)) * 100)
      : null;

  let bestDay: { date: string; amount: number } | null = null;
  const amountByDate = new Map<string, number>();
  for (const e of monthEntries) {
    amountByDate.set(e.date, (amountByDate.get(e.date) ?? 0) + e.amount);
  }
  for (const [date, amount] of amountByDate) {
    if (!bestDay || amount > bestDay.amount) {
      bestDay = { date, amount };
    }
  }

  return {
    month,
    totalAmount: summary.totalAmount,
    totalExpense: summary.totalExpense,
    netAmount: summary.netAmount,
    averageHourlyWage,
    platformRanking,
    previousMonthDeltaPercent,
    bestDay,
  };
}

// sumAmountByDate/sumAmountByMonth/calculateHourlyRate/getDayStreak: src/lib/contract.ts가
// 선언한 Entry 계약 형태(amountKrw, hoursWorked) 기반 진입점. 화면 계층은 IncomeEntry(@/lib/types)
// 기반 calcPeriodSummary/calcHourlyWage/calcStreak를 쓴다 — 이 넷은 contract.ts 계약을
// 만족시키기 위한 별도 진입점이다(validate.ts의 isValidEntry/isValidPlatform과 동일 패턴).

/** dateStr('YYYY-MM-DD')과 날짜가 일치하는 기록들의 amountKrw 합계. */
export function sumAmountByDate(entries: Entry[], dateStr: string): number {
  let total = 0;
  for (const e of entries) {
    if (e.date === dateStr) total += e.amountKrw;
  }
  return total;
}

/** monthStr('YYYY-MM')으로 시작하는 날짜를 가진 기록들의 amountKrw 합계. */
export function sumAmountByMonth(entries: Entry[], monthStr: string): number {
  let total = 0;
  for (const e of entries) {
    if (e.date.startsWith(monthStr)) total += e.amountKrw;
  }
  return total;
}

/** amount를 hours로 나눈 시급. hours가 0 이하면 0(예외 없음). */
export function calculateHourlyRate(amount: number, hours: number): number {
  if (hours <= 0) return 0;
  return Math.round(amount / hours);
}

/** 오늘부터 거슬러 끊기지 않은 연속 기록일 수 (기준일: 로컬 오늘). */
export function getDayStreak(entries: Entry[]): number {
  const dateSet = new Set(entries.map((e) => e.date));
  const today = toDateKey(new Date());
  if (!dateSet.has(today)) return 0;

  let current = 0;
  let cursor = today;
  while (dateSet.has(cursor)) {
    current += 1;
    const [y, m, d] = cursor.split("-").map(Number);
    const date = new Date(y, m - 1, d);
    date.setDate(date.getDate() - 1);
    cursor = toDateKey(date);
  }
  return current;
}

import { describe, it, expect } from "vitest";
import {
  calcHourlyWage,
  calcStreak,
  calcPeriodSummary,
  calcGoalRate,
} from "@/lib/calc";
import type { IncomeEntry, StreakResult, PeriodSummary } from "@/lib/types";

describe("계산 순수 함수 calc.ts", () => {
  // AC-1[P0]: calcHourlyWage(entries) - 기본 시급 계산
  describe("AC-1: calcHourlyWage() 기본 시급 계산", () => {
    it("should calculate hourly wage from entries: (amount - expense) / (minutes / 60)", () => {
      const entries: Partial<IncomeEntry>[] = [
        { amount: 128000, expense: 18000, minutes: 330 },
        { amount: 60000, expense: 0, minutes: 120 },
      ];

      const result = calcHourlyWage(entries as IncomeEntry[]);

      // (128000 + 60000 - 18000) / ((330 + 120) / 60)
      // = 170000 / 7.5
      // = 22666.666...
      // Math.round = 22667
      expect(result).toBe(22667);
    });

    it("should handle single entry with positive minutes", () => {
      const entries: Partial<IncomeEntry>[] = [
        { amount: 60000, expense: 10000, minutes: 120 },
      ];

      const result = calcHourlyWage(entries as IncomeEntry[]);

      // (60000 - 10000) / (120 / 60) = 50000 / 2 = 25000
      expect(result).toBe(25000);
    });

    it("should calculate with zero expense", () => {
      const entries: Partial<IncomeEntry>[] = [
        { amount: 50000, expense: 0, minutes: 60 },
      ];

      const result = calcHourlyWage(entries as IncomeEntry[]);

      // 50000 / (60 / 60) = 50000 / 1 = 50000
      expect(result).toBe(50000);
    });

    it("should round to nearest integer", () => {
      const entries: Partial<IncomeEntry>[] = [
        { amount: 50000, expense: 5000, minutes: 60 },
      ];

      const result = calcHourlyWage(entries as IncomeEntry[]);

      // (50000 - 5000) / (60 / 60) = 45000 / 1 = 45000
      expect(result).toBe(45000);
      expect(Number.isInteger(result)).toBe(true);
    });
  });

  // AC-2[P0]: calcHourlyWage() - 분이 0일 때 null 반환
  describe("AC-2: calcHourlyWage() — minutes=0 시 null 반환 (예외 없음)", () => {
    it("should return null when total minutes is 0", () => {
      const entries: Partial<IncomeEntry>[] = [
        { amount: 50000, expense: 0, minutes: 0 },
      ];

      const result = calcHourlyWage(entries as IncomeEntry[]);

      expect(result).toBeNull();
    });

    it("should return null when all entries have 0 minutes", () => {
      const entries: Partial<IncomeEntry>[] = [
        { amount: 50000, expense: 5000, minutes: 0 },
        { amount: 30000, expense: 3000, minutes: 0 },
      ];

      const result = calcHourlyWage(entries as IncomeEntry[]);

      expect(result).toBeNull();
    });

    it("should return null for empty array", () => {
      const entries: Partial<IncomeEntry>[] = [];

      const result = calcHourlyWage(entries as IncomeEntry[]);

      expect(result).toBeNull();
    });

    it("should not throw when minutes is 0", () => {
      const entries: Partial<IncomeEntry>[] = [
        { amount: 50000, expense: 0, minutes: 0 },
      ];

      expect(() => calcHourlyWage(entries as IncomeEntry[])).not.toThrow();
    });
  });

  // AC-3[P1]: calcStreak(entries, referenceDate) - 연속 기록 스트릭
  describe("AC-3: calcStreak() 연속 기록 스트릭 계산", () => {
    it("should calculate current streak from consecutive dates up to referenceDate", () => {
      const entries: Partial<IncomeEntry>[] = [
        { date: "2026-08-31" },
        { date: "2026-08-30" },
        { date: "2026-08-29" },
        { date: "2026-08-27" },
      ];

      const result: StreakResult = calcStreak(entries as IncomeEntry[], "2026-08-31");

      // 2026-08-31, 2026-08-30, 2026-08-29는 연속 (3일)
      // 2026-08-27은 2일 간격이므로 끊김
      expect(result.current).toBe(3);
      expect(result.lastDate).toBe("2026-08-31");
    });

    it("should return 0 streak when referenceDate has no entry", () => {
      const entries: Partial<IncomeEntry>[] = [{ date: "2026-08-29" }];

      const result: StreakResult = calcStreak(entries as IncomeEntry[], "2026-08-31");

      // referenceDate(2026-08-31)에 entry가 없으므로 current=0
      expect(result.current).toBe(0);
      expect(result.lastDate).toBe("2026-08-29");
    });

    it("should handle single entry matching referenceDate", () => {
      const entries: Partial<IncomeEntry>[] = [{ date: "2026-08-31" }];

      const result: StreakResult = calcStreak(entries as IncomeEntry[], "2026-08-31");

      expect(result.current).toBe(1);
      expect(result.lastDate).toBe("2026-08-31");
    });

    it("should handle empty entries array", () => {
      const entries: Partial<IncomeEntry>[] = [];

      const result: StreakResult = calcStreak(entries as IncomeEntry[], "2026-08-31");

      expect(result.current).toBe(0);
      expect(result.lastDate).toBeNull();
    });

    it("should ignore duplicate dates on same day", () => {
      const entries: Partial<IncomeEntry>[] = [
        { date: "2026-08-31" },
        { date: "2026-08-31" },
        { date: "2026-08-30" },
      ];

      const result: StreakResult = calcStreak(entries as IncomeEntry[], "2026-08-31");

      // 2026-08-31과 2026-08-30 = 2일 연속
      expect(result.current).toBe(2);
      expect(result.lastDate).toBe("2026-08-31");
    });
  });

  // AC-4[P1]: calcPeriodSummary(entries) - 기간 합산
  describe("AC-4: calcPeriodSummary() 기간 합산 (income, expense, net, minutes, wage)", () => {
    it("should sum amount, expense, and minutes; calculate net = amount - expense", () => {
      const entries: Partial<IncomeEntry>[] = [
        { amount: 128000, expense: 18000, minutes: 330 },
        { amount: 60000, expense: 0, minutes: 120 },
      ];

      const result: PeriodSummary = calcPeriodSummary(entries as IncomeEntry[]);

      expect(result.totalAmount).toBe(188000);
      expect(result.totalExpense).toBe(18000);
      expect(result.netAmount).toBe(170000);
      expect(result.totalMinutes).toBe(450);
    });

    it("should calculate hourlyWage correctly (using calcHourlyWage logic)", () => {
      const entries: Partial<IncomeEntry>[] = [
        { amount: 50000, expense: 5000, minutes: 120 },
      ];

      const result: PeriodSummary = calcPeriodSummary(entries as IncomeEntry[]);

      // 45000 / (120 / 60) = 45000 / 2 = 22500
      expect(result.totalAmount).toBe(50000);
      expect(result.totalExpense).toBe(5000);
      expect(result.netAmount).toBe(45000);
      expect(result.totalMinutes).toBe(120);
    });

    it("should return all zeros and null wage for empty array", () => {
      const entries: Partial<IncomeEntry>[] = [];

      const result: PeriodSummary = calcPeriodSummary(entries as IncomeEntry[]);

      expect(result.totalAmount).toBe(0);
      expect(result.totalExpense).toBe(0);
      expect(result.netAmount).toBe(0);
      expect(result.totalMinutes).toBe(0);
    });

    it("should handle entries with 0 minutes (no wage calculation)", () => {
      const entries: Partial<IncomeEntry>[] = [
        { amount: 50000, expense: 5000, minutes: 0 },
      ];

      const result: PeriodSummary = calcPeriodSummary(entries as IncomeEntry[]);

      expect(result.totalAmount).toBe(50000);
      expect(result.totalExpense).toBe(5000);
      expect(result.netAmount).toBe(45000);
      expect(result.totalMinutes).toBe(0);
    });

    it("should sum multiple entries correctly", () => {
      const entries: Partial<IncomeEntry>[] = [
        { amount: 100000, expense: 10000, minutes: 200 },
        { amount: 50000, expense: 5000, minutes: 100 },
        { amount: 30000, expense: 0, minutes: 60 },
      ];

      const result: PeriodSummary = calcPeriodSummary(entries as IncomeEntry[]);

      expect(result.totalAmount).toBe(180000);
      expect(result.totalExpense).toBe(15000);
      expect(result.netAmount).toBe(165000);
      expect(result.totalMinutes).toBe(360);
    });
  });

  // AC-5[P1]: calcGoalRate(current, monthlyGoal) - 목표 달성률
  describe("AC-5: calcGoalRate() 목표 달성률 (정수 %)", () => {
    it("should calculate achievement rate as integer percentage: (current / goal) * 100", () => {
      const result = calcGoalRate(1200000, 3000000);

      // (1200000 / 3000000) * 100 = 40%
      expect(result).toBe(40);
      expect(Number.isInteger(result)).toBe(true);
    });

    it("should round to nearest integer", () => {
      const result = calcGoalRate(1234567, 3000000);

      // (1234567 / 3000000) * 100 = 41.152%
      // Math.round = 41
      expect(result).toBe(41);
    });

    it("should return null when monthlyGoal is 0", () => {
      const result = calcGoalRate(1200000, 0);

      expect(result).toBeNull();
    });

    it("should return null when monthlyGoal is negative", () => {
      const result = calcGoalRate(1200000, -1);

      expect(result).toBeNull();
    });

    it("should return 0 when current is 0", () => {
      const result = calcGoalRate(0, 3000000);

      expect(result).toBe(0);
    });

    it("should return 100 or more when current >= goal", () => {
      const result = calcGoalRate(3000000, 3000000);

      expect(result).toBe(100);
    });

    it("should return > 100 when current exceeds goal", () => {
      const result = calcGoalRate(4500000, 3000000);

      // (4500000 / 3000000) * 100 = 150%
      expect(result).toBe(150);
    });
  });
});

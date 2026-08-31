import { describe, it, expect, beforeEach } from "vitest";
import "@testing-library/jest-dom/vitest";
import React from "react";
import { screen, within } from "@testing-library/react";
import { mockAll, mockNavigate } from "@/__tests__/__helpers__/mocks";
import { renderWithRouter } from "@/__tests__/__helpers__/test-utils";
import type { IncomeEntry, Platform } from "@/lib/types";

mockAll();

const platforms: Platform[] = [
  {
    id: "p1",
    name: "배달",
    category: "delivery",
    colorToken: "blue",
    archived: false,
    createdAt: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "p2",
    name: "대리운전",
    category: "driving",
    colorToken: "green",
    archived: false,
    createdAt: "2026-01-01T00:00:00.000Z",
  },
];

function makeEntry(overrides: Partial<IncomeEntry> & Pick<IncomeEntry, "id" | "platformId" | "date">): IncomeEntry {
  return {
    amount: 0,
    expense: 0,
    minutes: 0,
    memo: "",
    createdAt: "2026-08-01T00:00:00.000Z",
    updatedAt: "2026-08-01T00:00:00.000Z",
    ...overrides,
  };
}

// AC-1/AC-4 공용 베이스라인: 총수입 1,250,000 · 경비 50,000 · 순수입 1,200,000 ·
// 근무시간 330분(5시간 30분) · 플랫폼별 순수입 900,000(75%)/300,000(25%)
const baselineEntries: IncomeEntry[] = [
  makeEntry({ id: "e1", platformId: "p1", date: "2026-08-01", amount: 950000, expense: 50000, minutes: 200 }),
  makeEntry({ id: "e2", platformId: "p2", date: "2026-08-15", amount: 300000, expense: 0, minutes: 130 }),
];

describe("/report 본문 지표 컴포넌트 + 공유 이동", () => {
  beforeEach(() => {
    mockNavigate.mockClear();
  });

  describe("AC-1: 핵심 지표가 CP-2 표기 규칙으로 렌더된다", () => {
    it("AC-1[P0]: 총수입/경비/순수입/근무시간/실질시급이 정확한 문자열로 표시된다", async () => {
      const { ReportBody } = await import("@/components/ReportBody");
      renderWithRouter(
        React.createElement(ReportBody, { entries: baselineEntries, platforms, month: "2026-08" }),
      );

      // 총수입 1,250,000원 · 경비 50,000원 · 순수입 1,200,000원
      expect(screen.getByText("1,250,000원")).toBeInTheDocument();
      expect(screen.getByText("50,000원")).toBeInTheDocument();
      expect(screen.getByText("1,200,000원")).toBeInTheDocument();
      // 근무시간 330분 = 5시간 30분
      expect(screen.getByText("5시간 30분")).toBeInTheDocument();
      // 실질시급 = round(1,200,000 / (330/60)) = 218,182원
      expect(screen.getByText("218,182원")).toBeInTheDocument();
    });

    it("AC-1[P0]: 값이 바뀌면 렌더된 문자열도 그에 맞게 바뀐다(하드코딩 아님)", async () => {
      const { ReportBody } = await import("@/components/ReportBody");
      const otherEntries: IncomeEntry[] = [
        makeEntry({ id: "e3", platformId: "p1", date: "2026-08-02", amount: 400000, expense: 20000, minutes: 120 }),
      ];
      renderWithRouter(
        React.createElement(ReportBody, { entries: otherEntries, platforms, month: "2026-08" }),
      );

      expect(screen.getByText("400,000원")).toBeInTheDocument();
      expect(screen.getByText("20,000원")).toBeInTheDocument();
      expect(screen.getByText("380,000원")).toBeInTheDocument();
      expect(screen.getByText("2시간 0분")).toBeInTheDocument();
      expect(screen.queryByText("1,250,000원")).not.toBeInTheDocument();
    });
  });

  describe("AC-2: 전월 대비 증감률이 표시된다", () => {
    it("AC-2[P0]: 순수입이 전월 대비 +20%면 '+20%'가 표시된다", async () => {
      const { ReportBody } = await import("@/components/ReportBody");
      const entries: IncomeEntry[] = [
        makeEntry({ id: "cur", platformId: "p1", date: "2026-08-05", amount: 1200000, expense: 0, minutes: 60 }),
        makeEntry({ id: "prev", platformId: "p1", date: "2026-07-05", amount: 1000000, expense: 0, minutes: 60 }),
      ];
      renderWithRouter(React.createElement(ReportBody, { entries, platforms, month: "2026-08" }));

      expect(screen.getByText("+20%")).toBeInTheDocument();
    });

    it("AC-2[P0]: 전월 기록이 없으면(전월 순수입 0) '—'가 표시된다", async () => {
      const { ReportBody } = await import("@/components/ReportBody");
      const entries: IncomeEntry[] = [
        makeEntry({ id: "cur", platformId: "p1", date: "2026-08-10", amount: 500000, expense: 0, minutes: 60 }),
      ];
      renderWithRouter(React.createElement(ReportBody, { entries, platforms, month: "2026-08" }));

      expect(screen.getAllByText("—").length).toBeGreaterThan(0);
    });
  });

  describe("AC-3: 근무시간 합이 0이면 실질시급이 '—'로 표시되고 NaN이 없다", () => {
    it("AC-3[P0]: minutes 합계 0인 달은 실질시급이 '—'이고 문서 어디에도 'NaN'이 없다", async () => {
      const { ReportBody } = await import("@/components/ReportBody");
      const entries: IncomeEntry[] = [
        makeEntry({ id: "e1", platformId: "p1", date: "2026-08-01", amount: 100000, expense: 0, minutes: 0 }),
      ];
      const { container } = renderWithRouter(
        React.createElement(ReportBody, { entries, platforms, month: "2026-08" }),
      );

      expect(screen.getAllByText("—").length).toBeGreaterThan(0);
      expect(container.textContent).not.toMatch(/NaN/);
    });
  });

  describe("AC-4: 플랫폼별 비중이 MiniBar로 표시되고 합이 100%를 넘지 않는다", () => {
    it("AC-4[P0]: 플랫폼별 비중이 MiniBar(data-testid='platform-minibar')로 렌더되고 각 항목 라벨이 보인다", async () => {
      const { ReportBody } = await import("@/components/ReportBody");
      renderWithRouter(
        React.createElement(ReportBody, { entries: baselineEntries, platforms, month: "2026-08" }),
      );

      const miniBar = screen.getByTestId("platform-minibar");
      expect(miniBar).toBeInTheDocument();
      expect(within(miniBar).getByText("배달")).toBeInTheDocument();
      expect(within(miniBar).getByText("대리운전")).toBeInTheDocument();
    });

    it("AC-4[P0]: 플랫폼별 비중 막대 너비 합이 100%를 넘지 않는다", async () => {
      const { ReportBody } = await import("@/components/ReportBody");
      renderWithRouter(
        React.createElement(ReportBody, { entries: baselineEntries, platforms, month: "2026-08" }),
      );

      const miniBar = screen.getByTestId("platform-minibar");
      const bars = Array.from(miniBar.querySelectorAll<HTMLElement>("[style*='width']"));
      expect(bars.length).toBeGreaterThanOrEqual(2);
      const total = bars.reduce((sum, el) => sum + (parseFloat(el.style.width) || 0), 0);
      expect(total).toBeLessThanOrEqual(100);
    });
  });

  describe("AC-5: '공유 카드 만들기' 버튼 탭 시 /share로 이동한다", () => {
    it("AC-5[P0]: 버튼 클릭 시 navigate('/share', { state: { month } })가 호출된다", async () => {
      const { ReportBody } = await import("@/components/ReportBody");
      renderWithRouter(
        React.createElement(ReportBody, { entries: baselineEntries, platforms, month: "2026-08" }),
      );

      const button = screen.getByRole("button", { name: /공유 카드 만들기/ });
      button.click();

      expect(mockNavigate).toHaveBeenCalledTimes(1);
      expect(mockNavigate).toHaveBeenCalledWith("/share", { state: { month: "2026-08" } });
    });
  });
});

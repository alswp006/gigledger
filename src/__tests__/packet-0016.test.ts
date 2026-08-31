import { describe, it, expect, beforeEach } from "vitest";
import "@testing-library/jest-dom/vitest";
import React from "react";
import { screen, waitFor, fireEvent } from "@testing-library/react";
import { mockTds, mockAppsInToss, mockRouter } from "@/__tests__/__helpers__/mocks";
import { renderWithRouter } from "@/__tests__/__helpers__/test-utils";
import { STORAGE_KEYS, REPORT_MONTH_RANGE } from "@/lib/constants";
import { toDateKey, toMonthKey, addMonthKey } from "@/lib/date";
import type { Platform, IncomeEntry, ReportUnlockMap } from "@/lib/types";

// NOTE: mockAll()이 아니라 개별 목만 쓴다 — @/components/TossRewardAd를 목킹하지 않고
// 실제 컴포넌트를 렌더해 "잠금 게이트가 실제로 본문을 가리는지"를 검증하기 위함.
// 실제 TossRewardAd는 @apps-in-toss/web-framework의 loadFullScreenAd/showFullScreenAd를
// 쓰므로 mockAppsInToss()의 자동 onEvent 발화(setTimeout 0)로 광고 시청 흐름을 재현한다.
mockTds();
mockAppsInToss();
mockRouter();

const thisMonth = toMonthKey(toDateKey(new Date()));
const lastMonth = addMonthKey(thisMonth, -1);
const oldestMonth = addMonthKey(thisMonth, -REPORT_MONTH_RANGE);
const beforeOldestMonth = addMonthKey(thisMonth, -(REPORT_MONTH_RANGE + 1));

const platforms: Platform[] = [
  {
    id: "p1",
    name: "배달",
    category: "delivery",
    colorToken: "blue",
    archived: false,
    createdAt: "2026-01-01T00:00:00.000Z",
  },
];

function makeEntry(overrides: Partial<IncomeEntry> & Pick<IncomeEntry, "id" | "date">): IncomeEntry {
  return {
    platformId: "p1",
    amount: 128000,
    expense: 18000,
    minutes: 200,
    memo: "",
    createdAt: `${overrides.date}T09:00:00.000Z`,
    updatedAt: `${overrides.date}T09:00:00.000Z`,
    ...overrides,
  };
}

function seedPlatforms(list: Platform[] = platforms) {
  localStorage.setItem(STORAGE_KEYS.platforms, JSON.stringify(list));
}
function seedEntries(list: IncomeEntry[]) {
  localStorage.setItem(STORAGE_KEYS.entries, JSON.stringify(list));
}
function seedUnlocks(map: ReportUnlockMap) {
  localStorage.setItem(STORAGE_KEYS.reportUnlocks, JSON.stringify(map));
}

async function renderReport(initialState: { month: string } | null = null) {
  const { default: Report } = await import("@/pages/Report");
  return renderWithRouter(React.createElement(Report), {
    initialEntries: [{ pathname: "/report", state: initialState }],
  });
}

describe("/report 월 네비게이션 + 리워드 광고 게이트", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe("AC-1[P0]: 초기 진입 월 결정", () => {
    it("AC-1[P0]: location.state 없이 진입하면 현재 월이 선택된다", async () => {
      seedPlatforms();
      seedEntries([makeEntry({ id: "e1", date: `${thisMonth}-05` })]);
      seedUnlocks({ [thisMonth]: "2026-01-01T00:00:00.000Z" });

      await renderReport(null);
      await waitFor(() => expect(screen.queryByTestId("report-skeleton")).not.toBeInTheDocument());

      const [y, m] = thisMonth.split("-");
      expect(screen.getByText(`${y}년 ${Number(m)}월`)).toBeInTheDocument();
    });

    it("AC-1[P0]: location.state.month이 있으면 해당 월로 진입한다", async () => {
      seedPlatforms();
      seedEntries([makeEntry({ id: "e1", date: `${lastMonth}-10` })]);
      seedUnlocks({ [lastMonth]: "2026-01-01T00:00:00.000Z" });

      await renderReport({ month: lastMonth });
      await waitFor(() => expect(screen.queryByTestId("report-skeleton")).not.toBeInTheDocument());

      const [y, m] = lastMonth.split("-");
      expect(screen.getByText(`${y}년 ${Number(m)}월`)).toBeInTheDocument();
      expect(screen.queryByText(new RegExp(`${thisMonth.split("-")[0]}년 ${Number(thisMonth.split("-")[1])}월$`))).not.toBeInTheDocument();
    });
  });

  describe("AC-2[P0]: 12개월 범위 이전/다음 이동 + 경계 disabled", () => {
    it("AC-2[P0]: 현재 월에서는 '다음 달' 버튼이 비활성화된다", async () => {
      seedPlatforms();
      seedEntries([makeEntry({ id: "e1", date: `${thisMonth}-05` })]);
      seedUnlocks({ [thisMonth]: "2026-01-01T00:00:00.000Z" });

      await renderReport(null);
      await waitFor(() => expect(screen.queryByTestId("report-skeleton")).not.toBeInTheDocument());

      const nextButton = screen.getByRole("button", { name: /다음 달/ });
      const prevButton = screen.getByRole("button", { name: /이전 달/ });
      expect(nextButton).toBeDisabled();
      expect(prevButton).not.toBeDisabled();
    });

    it("AC-2[P0]: 최대 범위(oldestMonth)에 도달하면 '이전 달' 버튼이 비활성화되고 그 이상 못 간다", async () => {
      seedPlatforms();
      seedEntries([
        makeEntry({ id: "e1", date: `${oldestMonth}-05` }),
        makeEntry({ id: "e2", date: `${beforeOldestMonth}-05` }),
      ]);
      seedUnlocks({ [oldestMonth]: "2026-01-01T00:00:00.000Z", [beforeOldestMonth]: "2026-01-01T00:00:00.000Z" });

      await renderReport({ month: oldestMonth });
      await waitFor(() => expect(screen.queryByTestId("report-skeleton")).not.toBeInTheDocument());

      const prevButton = screen.getByRole("button", { name: /이전 달/ });
      expect(prevButton).toBeDisabled();

      const [y, m] = beforeOldestMonth.split("-");
      expect(screen.queryByText(`${y}년 ${Number(m)}월`)).not.toBeInTheDocument();
    });
  });

  describe("AC-3[P0]: 잠긴 월은 광고 게이트로 본문을 가린다", () => {
    it("AC-3[P0]: reportUnlocks에 없는 월은 지표 숫자 없이 잠금 안내(TossRewardAd 게이트)만 보인다", async () => {
      seedPlatforms();
      seedEntries([makeEntry({ id: "e1", date: `${lastMonth}-05`, amount: 999000, expense: 0, minutes: 60 })]);
      seedUnlocks({}); // 해당 월 미해금

      await renderReport({ month: lastMonth });
      await waitFor(() => expect(screen.queryByTestId("report-skeleton")).not.toBeInTheDocument());

      // 광고 시청 버튼(잠금 게이트)이 보이고, 순수입 등 실제 지표 텍스트는 아직 없다
      expect(screen.getByRole("button", { name: /광고/ })).toBeInTheDocument();
      expect(screen.queryByText(/999,000/)).not.toBeInTheDocument();
    });

    it("AC-5[P0]: 다음 달(미래)로는 이동할 수 없고 현재 월이 최대값이다", async () => {
      seedPlatforms();
      seedEntries([makeEntry({ id: "e1", date: `${thisMonth}-05` })]);
      seedUnlocks({ [thisMonth]: "2026-01-01T00:00:00.000Z" });

      await renderReport(null);
      await waitFor(() => expect(screen.queryByTestId("report-skeleton")).not.toBeInTheDocument());

      const nextButton = screen.getByRole("button", { name: /다음 달/ });
      expect(nextButton).toBeDisabled();

      fireEvent.click(nextButton);
      const [y, m] = thisMonth.split("-");
      expect(screen.getByText(`${y}년 ${Number(m)}월`)).toBeInTheDocument();
    });
  });

  describe("AC-4[P0]: 광고 시청 완료 시 reportUnlocks 저장 + 재방문 시 즉시 노출", () => {
    it("AC-4[P0]: 광고 시청 완료 후 reportUnlocks에 'YYYY-MM' 키가 ISO 시각으로 저장된다", async () => {
      seedPlatforms();
      seedEntries([makeEntry({ id: "e1", date: `${lastMonth}-05`, amount: 500000, expense: 0, minutes: 60 })]);
      seedUnlocks({});

      await renderReport({ month: lastMonth });
      await waitFor(() => expect(screen.queryByTestId("report-skeleton")).not.toBeInTheDocument());

      const watchButton = await screen.findByRole("button", { name: /광고/ });
      await waitFor(() => expect(watchButton).not.toBeDisabled());
      fireEvent.click(watchButton);

      await waitFor(() => {
        const stored: ReportUnlockMap = JSON.parse(localStorage.getItem(STORAGE_KEYS.reportUnlocks) ?? "{}");
        expect(stored[lastMonth]).toBeDefined();
        expect(typeof stored[lastMonth]).toBe("string");
        expect(Number.isNaN(new Date(stored[lastMonth]).getTime())).toBe(false);
      });
    });

    it("AC-4[P0]: 이미 해금된 월은 재진입 시 광고 없이 본문이 바로 표시된다", async () => {
      seedPlatforms();
      // 단일 기록만 있으면 총수입=최다 수입일 금액이 항상 같은 값이라 getByText가
      // "여러 요소 일치"로 실패한다 — 두 번째(더 작은) 기록을 더해 총수입/실질시급이
      // 500,000과 갈라지게 하고, 최다 수입일 행에서만 500,000이 보이게 한다.
      seedEntries([
        makeEntry({ id: "e1", date: `${lastMonth}-05`, amount: 500000, expense: 0, minutes: 60 }),
        makeEntry({ id: "e2", date: `${lastMonth}-10`, amount: 50000, expense: 0, minutes: 30 }),
      ]);
      seedUnlocks({ [lastMonth]: "2026-01-01T00:00:00.000Z" });

      await renderReport({ month: lastMonth });
      await waitFor(() => expect(screen.queryByTestId("report-skeleton")).not.toBeInTheDocument());

      expect(screen.queryByRole("button", { name: /광고/ })).not.toBeInTheDocument();
      expect(screen.getByText(/500,000/)).toBeInTheDocument();
    });
  });
});

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import "@testing-library/jest-dom/vitest";
import React from "react";
import { screen, within, fireEvent } from "@testing-library/react";
import { mockAll } from "@/__tests__/__helpers__/mocks";
import { renderWithRouter } from "@/__tests__/__helpers__/test-utils";
import { STORAGE_KEYS } from "@/lib/constants";
import type { IncomeEntry, Platform } from "@/lib/types";

mockAll();

function seedPlatforms(platforms: Platform[]) {
  localStorage.setItem(STORAGE_KEYS.platforms, JSON.stringify(platforms));
}

function seedEntries(entries: IncomeEntry[]) {
  localStorage.setItem(STORAGE_KEYS.entries, JSON.stringify(entries));
}

function makePlatform(overrides: Partial<Platform> = {}): Platform {
  return {
    id: "p1",
    name: "쿠팡플렉스",
    category: "delivery",
    colorToken: "blue",
    archived: false,
    createdAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

function makeEntry(overrides: Partial<IncomeEntry> = {}): IncomeEntry {
  return {
    id: "e1",
    platformId: "p1",
    date: "2026-08-31",
    amount: 30000,
    expense: 0,
    minutes: 60,
    memo: "",
    createdAt: "2026-08-31T09:00:00.000Z",
    updatedAt: "2026-08-31T09:00:00.000Z",
    ...overrides,
  };
}

// 오늘(고정) = 2026-08-31(월). startOfWeek(오늘) === 오늘이므로 "주간"은 이 날짜 하나만 포함한다.
const PLATFORMS: Platform[] = [
  makePlatform({ id: "p1", name: "쿠팡플렉스", colorToken: "blue" }),
  makePlatform({ id: "p2", name: "배민커넥트", colorToken: "green" }),
  makePlatform({ id: "p3", name: "카카오T대리", colorToken: "purple", category: "driving" }),
  makePlatform({ id: "p4", name: "카카오T퀵", colorToken: "orange" }),
];

const ENTRIES: IncomeEntry[] = [
  // p1: 주간+월간 — 이번 주 단독 시급 30000원
  makeEntry({ id: "e1", platformId: "p1", date: "2026-08-31", amount: 30000, expense: 0, minutes: 60 }),
  // p1: 월간에만 포함(지난 달 초) — 합산 시 월간 시급이 11818원으로 낮아짐
  makeEntry({ id: "e2", platformId: "p1", date: "2026-08-05", amount: 100000, expense: 0, minutes: 600 }),
  // p2: 월간에만 포함 — 월간 1위(시급 30000원), 주간에는 등장하지 않음
  makeEntry({ id: "e3", platformId: "p2", date: "2026-08-10", amount: 90000, expense: 0, minutes: 180 }),
  // p3: 주간+월간, 근무시간 0분 — 시급 '—' 처리 대상
  makeEntry({ id: "e4", platformId: "p3", date: "2026-08-31", amount: 20000, expense: 0, minutes: 0 }),
  // p4: 주간+월간, 최저임금(10320원) 미만(6000원)
  makeEntry({ id: "e5", platformId: "p4", date: "2026-08-31", amount: 6000, expense: 0, minutes: 60 }),
];

async function renderWage(routerOptions?: Parameters<typeof renderWithRouter>[1]) {
  const { default: Wage } = await import("@/pages/Wage");
  return renderWithRouter(React.createElement(Wage), routerOptions);
}

describe("/wage 실질 시급 화면", () => {
  beforeEach(() => {
    // setTimeout까지 fake로 돌리면 findBy*/waitFor 폴링이 멈춘다 — Date만 고정.
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date(2026, 7, 31, 12, 0, 0));
    seedPlatforms(PLATFORMS);
    seedEntries(ENTRIES);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("AC-1[P0]: 기간 Tab 전환 시 calcWageRows가 재계산되어 시급 내림차순으로 재정렬된다", async () => {
    await renderWage();

    // 기본(주간): p2는 이번 주 기록이 없어 등장하지 않는다 → p1, p3, p4 3행
    const weekRows = screen.getAllByTestId("wage-row");
    expect(weekRows).toHaveLength(3);
    expect(within(weekRows[0]).getByText("쿠팡플렉스")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("tab", { name: "월간" }));

    // 월간: p2(30000원)가 1위, p1(11818원)이 2위로 순서가 뒤바뀐다
    const monthRows = screen.getAllByTestId("wage-row");
    expect(monthRows).toHaveLength(4);
    expect(within(monthRows[0]).getByText("배민커넥트")).toBeInTheDocument();
    expect(within(monthRows[1]).getByText("쿠팡플렉스")).toBeInTheDocument();
  });

  it("AC-2[P0]: 근무시간 0분 플랫폼은 시급 '—'로 표시되고 최하단에 위치하며 NaN/Infinity가 렌더되지 않는다", async () => {
    await renderWage();

    const rows = screen.getAllByTestId("wage-row");
    const lastRow = rows[rows.length - 1];
    expect(within(lastRow).getByText("카카오T대리")).toBeInTheDocument();
    expect(within(lastRow).getByText("—")).toBeInTheDocument();
    expect(screen.queryByText(/NaN/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Infinity/)).not.toBeInTheDocument();
  });

  it("AC-3[P0]: 시급이 10320원 미만인 행에만 '최저임금 미만' Chip이 표시된다", async () => {
    await renderWage();

    const rows = screen.getAllByTestId("wage-row");
    const lowWageRow = rows.find((r) => within(r).queryByText("카카오T퀵"));
    const highWageRow = rows.find((r) => within(r).queryByText("쿠팡플렉스"));
    expect(lowWageRow).toBeDefined();
    expect(highWageRow).toBeDefined();
    expect(within(lowWageRow!).getByText("최저임금 미만")).toBeInTheDocument();
    expect(within(highWageRow!).queryByText("최저임금 미만")).not.toBeInTheDocument();
  });

  it("AC-4: location.state가 {period:'month'}이면 월간 탭이 선택된 상태로 진입한다", async () => {
    await renderWage({ initialEntries: [{ pathname: "/wage", state: { period: "month" } }] });

    expect(screen.getByRole("tab", { name: "월간" })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("tab", { name: "주간" })).toHaveAttribute("aria-selected", "false");
    expect(screen.getAllByTestId("wage-row")).toHaveLength(4);
  });

  it("AC-4: location.state가 null이면 주간이 기본값으로 선택된다", async () => {
    await renderWage({ initialEntries: ["/wage"] });

    expect(screen.getByRole("tab", { name: "주간" })).toHaveAttribute("aria-selected", "true");
    expect(screen.getAllByTestId("wage-row")).toHaveLength(3);
  });

  it("AC-5: 해당 기간 기록이 0건이면 EmptyState('아직 계산할 기록이 없어요')가 렌더된다", async () => {
    seedEntries([]);
    await renderWage();

    expect(screen.getByText("아직 계산할 기록이 없어요")).toBeInTheDocument();
    expect(screen.queryAllByTestId("wage-row")).toHaveLength(0);
  });
});

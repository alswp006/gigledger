import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import "@testing-library/jest-dom/vitest";
import React from "react";
import { screen, fireEvent, within } from "@testing-library/react";
import { mockAll, mockNavigate } from "@/__tests__/__helpers__/mocks";
import { renderWithRouter } from "@/__tests__/__helpers__/test-utils";
import { generateHapticFeedback } from "@apps-in-toss/web-framework";
import { STORAGE_KEYS } from "@/lib/constants";
import type { Platform, IncomeEntry, Settings } from "@/lib/types";

mockAll();

// RecentEntryList(Home)이 무한 스크롤 sentinel에 쓰는 IntersectionObserver는 jsdom에 없다
// (packet-0012/0014와 동일 패턴으로 최소 스텁 제공).
class MockIntersectionObserver {
  observe = () => {};
  unobserve = () => {};
  disconnect = () => {};
  constructor(_callback: IntersectionObserverCallback) {}
}
beforeEach(() => {
  (globalThis as any).IntersectionObserver = MockIntersectionObserver;
  // 오늘 = 2026-08-31 (월요일) 고정 — 이번 주 시작(startOfWeek, 월요일)이 오늘과 같아
  // '이번 주'와 '이번 달' 필터 범위 차이를 명확한 데이터로 검증할 수 있다.
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date(2026, 7, 31, 12, 0, 0));
});
afterEach(() => {
  vi.useRealTimers();
});

function makePlatform(overrides: Partial<Platform> = {}): Platform {
  return {
    id: "p1",
    name: "배달",
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
    amount: 128000,
    expense: 18000,
    minutes: 330,
    memo: "",
    createdAt: "2026-08-31T09:00:00.000Z",
    updatedAt: "2026-08-31T09:00:00.000Z",
    ...overrides,
  };
}

function seedPlatforms(platforms: Platform[]) {
  localStorage.setItem(STORAGE_KEYS.platforms, JSON.stringify(platforms));
}
function seedEntries(entries: IncomeEntry[]) {
  localStorage.setItem(STORAGE_KEYS.entries, JSON.stringify(entries));
}
function seedSettings(overrides: Partial<Settings> = {}) {
  const settings: Settings = { monthlyGoal: 0, bestStreak: 0, noticeSeenAt: null, ...overrides };
  localStorage.setItem(STORAGE_KEYS.settings, JSON.stringify(settings));
}

async function renderHome() {
  const { default: Home } = await import("@/pages/Home");
  return renderWithRouter(React.createElement(Home));
}

describe("/ 홈 — 요약 섹션 (Tab/Hero/스트릭/목표/차트)", () => {
  beforeEach(() => {
    mockNavigate.mockClear();
  });

  describe("AC-1: 주간/월간 Tab 전환", () => {
    it("AC-1[P0]: 기본 탭(월간)에서 주간 탭으로 전환하면 label·값이 갱신되고 tickWeak 햅틱이 호출된다", async () => {
      seedPlatforms([makePlatform()]);
      // 이번 주(오늘, 8/31)에만 있는 기록과, 이번 달이지만 지난주(8/24)인 기록
      seedEntries([
        makeEntry({ id: "e-this-week", date: "2026-08-31", amount: 100000, expense: 10000, minutes: 200 }),
        makeEntry({ id: "e-last-week", date: "2026-08-24", amount: 50000, expense: 0, minutes: 60 }),
      ]);
      seedSettings();

      await renderHome();

      // 기본은 월간: 순수입 90,000 + 50,000 = 140,000원
      expect(await screen.findByText("이번 달 순수입")).toBeInTheDocument();
      expect(screen.getByText("140,000원")).toBeInTheDocument();

      fireEvent.click(screen.getByRole("tab", { name: "주간" }));

      expect(screen.getByText("이번 주 순수입")).toBeInTheDocument();
      // 주간: 이번 주 기록만 합산 → 순수입 90,000원
      expect(screen.getByText("90,000원")).toBeInTheDocument();
      expect(screen.queryByText("140,000원")).not.toBeInTheDocument();
      expect(generateHapticFeedback).toHaveBeenCalledWith({ type: "tickWeak" });
    });
  });

  describe("AC-2: 캡션 표기 규칙", () => {
    it("AC-2[P0]: 캡션이 '총수입 188,000원 · 경비 23,000원 · 근무 7시간 30분' 형식으로 렌더된다", async () => {
      seedPlatforms([makePlatform()]);
      seedEntries([
        makeEntry({ id: "e1", date: "2026-08-31", amount: 128000, expense: 18000, minutes: 330 }),
        makeEntry({ id: "e2", date: "2026-08-30", amount: 60000, expense: 5000, minutes: 120 }),
      ]);
      seedSettings();

      await renderHome();

      const hero = await screen.findByTestId("summary-hero");
      expect(within(hero).getByText("총수입 188,000원 · 경비 23,000원 · 근무 7시간 30분")).toBeInTheDocument();
      expect(within(hero).getByText("165,000원")).toBeInTheDocument();
    });
  });

  describe("AC-3: 목표 미설정 시 CTA", () => {
    it("AC-3[P1]: monthlyGoal===0이면 목표 카드에 안내 문구+'목표 설정' 버튼이 뜨고 탭 시 /settings로 이동한다", async () => {
      seedPlatforms([makePlatform()]);
      seedEntries([makeEntry()]);
      seedSettings({ monthlyGoal: 0 });

      await renderHome();

      const goalCard = await screen.findByTestId("goal-card");
      expect(within(goalCard).getByText("이번 달 목표를 정해보세요")).toBeInTheDocument();
      const settingButton = within(goalCard).getByRole("button", { name: "목표 설정" });

      fireEvent.click(settingButton);

      expect(mockNavigate).toHaveBeenCalledWith("/settings");
    });
  });

  describe("AC-4: 기록 0건 빈 상태", () => {
    it("AC-4[P0]: 기록이 없으면 EmptyState가 렌더되고 Hero/차트는 렌더되지 않는다", async () => {
      seedPlatforms([makePlatform()]);
      seedEntries([]);
      seedSettings();

      await renderHome();

      expect(await screen.findByText("아직 기록이 없어요")).toBeInTheDocument();
      expect(screen.getByText("오늘 번 돈을 기록해보세요")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "수입 기록하기" })).toBeInTheDocument();

      expect(screen.queryByTestId("summary-hero")).not.toBeInTheDocument();
      expect(screen.queryByTestId("trend-sparkline")).not.toBeInTheDocument();
    });
  });

  describe("AC-5: 로딩 상태", () => {
    it("AC-5[P0]: 로딩 중에는 home-skeleton이 렌더되고 SummaryHero는 렌더되지 않는다", async () => {
      seedPlatforms([makePlatform()]);
      seedEntries([makeEntry()]);
      seedSettings();

      const { default: Home } = await import("@/pages/Home");
      renderWithRouter(React.createElement(Home));

      // useLedger의 로딩은 Promise.all 마이크로태스크 이후 완료된다 — render() 직후
      // (await 없이) 동기적으로 확인하면 아직 loading:true 인 첫 렌더를 포착한다.
      expect(screen.getByTestId("home-skeleton")).toBeInTheDocument();
      expect(screen.queryByTestId("summary-hero")).not.toBeInTheDocument();
    });
  });
});

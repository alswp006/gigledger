import { describe, it, expect, vi, beforeEach } from "vitest";
import "@testing-library/jest-dom/vitest";
import React from "react";
import { render, screen, act } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { mockTds, mockNavigate, mockRouter } from "@/__tests__/__helpers__/mocks";
import type { IncomeEntry, Platform } from "@/lib/types";

mockTds();
mockRouter();

// ── IntersectionObserver mock (jsdom has no native implementation) ──
// Captures the callback passed by the component so tests can manually fire
// an intersection event to simulate the sentinel entering the viewport.
class MockIntersectionObserver {
  static instances: MockIntersectionObserver[] = [];
  callback: IntersectionObserverCallback;
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
  constructor(callback: IntersectionObserverCallback) {
    this.callback = callback;
    MockIntersectionObserver.instances.push(this);
  }
  trigger(isIntersecting: boolean) {
    this.callback(
      [{ isIntersecting } as IntersectionObserverEntry],
      this as unknown as IntersectionObserver,
    );
  }
}

beforeEach(() => {
  MockIntersectionObserver.instances = [];
  (globalThis as any).IntersectionObserver = MockIntersectionObserver;
});

function makePlatform(overrides: Partial<Platform> = {}): Platform {
  return {
    id: "platform-delivery",
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
    id: "entry-1",
    platformId: "platform-delivery",
    date: "2026-08-31",
    amount: 120000,
    expense: 10000,
    minutes: 330,
    memo: "",
    createdAt: "2026-08-31T09:00:00.000Z",
    updatedAt: "2026-08-31T09:00:00.000Z",
    ...overrides,
  };
}

// Generates N entries dated N days apart (entry-0 = 2026-01-01 ... entry-(N-1) = latest),
// returned in a deliberately unsorted (interleaved) order so the component's own
// date-descending sort is actually exercised rather than relying on input order.
function makeManyEntries(count: number, platformId = "platform-delivery"): IncomeEntry[] {
  const list: IncomeEntry[] = [];
  for (let i = 0; i < count; i++) {
    const d = new Date(2026, 0, 1 + i);
    const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    list.push(
      makeEntry({
        id: `entry-${i}`,
        date: dateStr,
        platformId,
        amount: 10000 + i,
      }),
    );
  }
  const evens = list.filter((_, i) => i % 2 === 0);
  const odds = list.filter((_, i) => i % 2 === 1);
  return [...odds, ...evens];
}

async function renderList(entries: IncomeEntry[], platforms: Platform[]) {
  const { RecentEntryList } = await import("@/components/RecentEntryList");
  return render(
    React.createElement(
      MemoryRouter,
      null,
      React.createElement(RecentEntryList, { entries, platforms }),
    ),
  );
}

describe("/ 홈 — 최근 기록 리스트 + 무한 스크롤 (RecentEntryList)", () => {
  it("AC-1[P0]: 기록이 date 내림차순으로 정렬되어 초기 30건 이하로 렌더된다", async () => {
    const entries = makeManyEntries(50);
    await renderList(entries, [makePlatform()]);

    const rows = screen.getAllByTestId("recent-entry-row");
    expect(rows.length).toBe(30);

    // 가장 최신 날짜(entry-49, 2026-02-19)가 첫 행에 와야 한다
    expect(rows[0].textContent).toContain("2월 19일");
    // 오래된 항목(entry-0, 2026-01-01)은 초기 30건 안에 없어야 한다
    expect(screen.queryByText(/1월 1일/)).not.toBeInTheDocument();
  });

  it("AC-1[P0]: 기록이 10건뿐이면 10건 모두 렌더된다(30건 미만인 경우)", async () => {
    const entries = makeManyEntries(10);
    await renderList(entries, [makePlatform()]);

    const rows = screen.getAllByTestId("recent-entry-row");
    expect(rows.length).toBe(10);
    expect(rows[0].textContent).toContain("1월 10일");
  });

  it("AC-2[P0]: sentinel이 뷰포트에 진입하면 30건씩 추가 렌더되고, DOM ListRow 개수가 항상 100 이하로 유지된다", async () => {
    const entries = makeManyEntries(250);
    await renderList(entries, [makePlatform()]);

    expect(screen.getAllByTestId("recent-entry-row").length).toBe(30);

    const observer = MockIntersectionObserver.instances[MockIntersectionObserver.instances.length - 1];
    expect(observer.observe).toHaveBeenCalledTimes(1);

    act(() => observer.trigger(true));
    expect(screen.getAllByTestId("recent-entry-row").length).toBe(60);

    act(() => observer.trigger(true));
    expect(screen.getAllByTestId("recent-entry-row").length).toBe(90);

    act(() => observer.trigger(true));
    expect(screen.getAllByTestId("recent-entry-row").length).toBe(100);

    // 추가로 여러 번 더 진입해도 DOM 개수가 100을 절대 넘지 않는다
    act(() => observer.trigger(true));
    act(() => observer.trigger(true));
    expect(screen.getAllByTestId("recent-entry-row").length).toBe(100);
  });

  it("AC-2: sentinel이 뷰포트를 벗어난 상태(isIntersecting=false)에서는 추가 로드가 일어나지 않는다", async () => {
    const entries = makeManyEntries(80);
    await renderList(entries, [makePlatform()]);

    expect(screen.getAllByTestId("recent-entry-row").length).toBe(30);

    const observer = MockIntersectionObserver.instances[MockIntersectionObserver.instances.length - 1];
    act(() => observer.trigger(false));
    expect(screen.getAllByTestId("recent-entry-row").length).toBe(30);
  });

  it("AC-3[P0]: 각 행은 플랫폼 Chip·날짜/플랫폼·근무시간·순수입을 표시하고 탭 시 /entry로 이동한다", async () => {
    const platform = makePlatform({ id: "platform-1", name: "배달" });
    const entry = makeEntry({
      id: "entry-abc",
      platformId: "platform-1",
      date: "2026-08-31",
      amount: 120000,
      expense: 10000,
      minutes: 330,
    });
    await renderList([entry], [platform]);

    const row = screen.getByTestId("recent-entry-row");
    expect(row.textContent).toContain("배달");
    expect(row.textContent).toContain("8월 31일");
    expect(row.textContent).toContain("근무 5시간 30분");
    expect(row.textContent).toContain("110,000원");

    row.click();
    expect(mockNavigate).toHaveBeenCalledWith("/entry", { state: { entryId: "entry-abc" } });
  });

  it("AC-4[P0]: platformId가 저장소(전달된 platforms)에 없으면 '삭제된 플랫폼'으로 표시되고 크래시하지 않는다", async () => {
    const entry = makeEntry({ id: "entry-orphan", platformId: "does-not-exist" });

    await renderList([entry], [makePlatform()]);

    const rows = screen.getAllByTestId("recent-entry-row");
    expect(rows.length).toBe(1);
    expect(rows[0].textContent).toContain("삭제된 플랫폼");
  });

  it("AC-5: 기록이 0건이면 아무것도 렌더하지 않는다", async () => {
    const { container } = await renderList([], [makePlatform()]);
    expect(screen.queryAllByTestId("recent-entry-row").length).toBe(0);
    expect(container.textContent).toBe("");
  });
});

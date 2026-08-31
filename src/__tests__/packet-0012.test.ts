import { describe, it, expect, beforeEach } from "vitest";
import "@testing-library/jest-dom/vitest";
import React from "react";
import { screen, fireEvent, waitFor, within } from "@testing-library/react";
import { mockAll, mockNavigate } from "@/__tests__/__helpers__/mocks";
import { renderWithRouter } from "@/__tests__/__helpers__/test-utils";
import { STORAGE_KEYS } from "@/lib/constants";
import { getEntries } from "@/lib/storage";
import { toDateKey } from "@/lib/date";
import type { Platform, IncomeEntry } from "@/lib/types";

mockAll();

// RecentEntryList(Home)이 무한 스크롤 sentinel에 쓰는 IntersectionObserver는 jsdom에 없다 —
// AC-5의 홈 렌더 확인 단계에서 컴포넌트가 죽지 않도록 최소 스텁을 제공한다(packet-0014와 동일 패턴).
class MockIntersectionObserver {
  observe = () => {};
  unobserve = () => {};
  disconnect = () => {};
  constructor(_callback: IntersectionObserverCallback) {}
}
beforeEach(() => {
  (globalThis as any).IntersectionObserver = MockIntersectionObserver;
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
    date: "2026-08-20",
    amount: 128000,
    expense: 20000,
    minutes: 330,
    memo: "피크타임",
    createdAt: "2026-08-20T09:00:00.000Z",
    updatedAt: "2026-08-20T09:00:00.000Z",
    ...overrides,
  };
}

function seedPlatforms(platforms: Platform[]) {
  localStorage.setItem(STORAGE_KEYS.platforms, JSON.stringify(platforms));
}

function seedEntries(entries: IncomeEntry[]) {
  localStorage.setItem(STORAGE_KEYS.entries, JSON.stringify(entries));
}

async function renderEntry(state: { date: string } | { entryId: string } | null) {
  const { default: Entry } = await import("@/pages/Entry");
  return renderWithRouter(React.createElement(Entry), {
    initialEntries: [{ pathname: "/entry", state }],
  });
}

describe("/entry 수입 입력/수정 화면", () => {
  beforeEach(() => {
    mockNavigate.mockClear();
  });

  describe("AC-1: entryId 유무로 신규/수정 모드가 갈린다", () => {
    it("AC-1[P0]: entryId가 있으면 기존 기록 값이 각 필드에 채워지고 Top에 '삭제' 버튼이 렌더된다", async () => {
      seedPlatforms([makePlatform({ id: "p1", name: "배달" })]);
      seedEntries([makeEntry({ id: "e1", platformId: "p1" })]);

      await renderEntry({ entryId: "e1" });

      expect(await screen.findByLabelText("수입")).toHaveValue("128000");
      expect(screen.getByLabelText("경비")).toHaveValue("20000");
      expect(screen.getByLabelText("일한 시간")).toHaveValue("330");
      expect(screen.getByLabelText("메모")).toHaveValue("피크타임");
      expect(screen.getByLabelText("일자")).toHaveValue("2026-08-20");
      expect(screen.getByRole("button", { name: /삭제/ })).toBeInTheDocument();
    });

    it("AC-1[P0]: state가 null이면 오늘 날짜의 신규 모드로 열리고 삭제 버튼이 없다", async () => {
      seedPlatforms([makePlatform({ id: "p1", name: "배달" })]);

      await renderEntry(null);

      const todayKey = toDateKey(new Date());
      expect(await screen.findByLabelText("일자")).toHaveValue(todayKey);
      expect(screen.getByLabelText("수입")).toHaveValue("");
      expect(screen.queryByRole("button", { name: /삭제/ })).not.toBeInTheDocument();
    });
  });

  describe("AC-2: 플랫폼 Chip은 활성 플랫폼만 노출하되 수정 중인 보관 플랫폼은 예외로 표시한다", () => {
    it("AC-2[P0]: 신규 모드에서 archived===true 플랫폼은 Chip으로 표시되지 않는다", async () => {
      seedPlatforms([
        makePlatform({ id: "p1", name: "배달", archived: false }),
        makePlatform({ id: "p2", name: "심부름", colorToken: "purple", archived: true }),
      ]);

      await renderEntry(null);

      expect(await screen.findByRole("button", { name: "배달" })).toBeInTheDocument();
      expect(screen.queryByRole("button", { name: "심부름" })).not.toBeInTheDocument();
    });

    it("AC-2: 수정 중인 기록이 보관 플랫폼을 참조하면 그 Chip이 표시되고 선택 상태로 시작한다", async () => {
      seedPlatforms([
        makePlatform({ id: "p1", name: "배달", archived: false }),
        makePlatform({ id: "p2", name: "심부름", colorToken: "purple", archived: true }),
      ]);
      seedEntries([makeEntry({ id: "e1", platformId: "p2", amount: 50000, expense: 0, minutes: 0 })]);

      await renderEntry({ entryId: "e1" });

      const archivedChip = await screen.findByRole("button", { name: "심부름" });
      expect(archivedChip.getAttribute("aria-pressed")).toBe("true");
      expect(screen.getByRole("button", { name: "배달" })).toBeInTheDocument();
    });
  });

  describe("AC-3: 금액 빈 값 저장은 인라인 에러를 띄우고 저장을 막는다", () => {
    it("AC-3[P0]: 총수입을 비운 채 저장하면 '금액을 입력해주세요' 에러가 뜨고 기록이 저장되지 않는다", async () => {
      seedPlatforms([makePlatform({ id: "p1", name: "배달" })]);

      await renderEntry(null);
      fireEvent.click(await screen.findByRole("button", { name: /기록 저장/ }));

      const errorTexts = await screen.findAllByText("금액을 입력해주세요");
      expect(errorTexts.length).toBeGreaterThan(0);
      expect(getEntries().entries.length).toBe(0);
    });
  });

  describe("AC-4: 경비가 수입보다 크면 저장을 막는다", () => {
    it("AC-4[P0]: 경비 200000 / 총수입 128000으로 저장하면 '경비는 수입보다 클 수 없어요' 에러가 뜨고 저장되지 않는다", async () => {
      seedPlatforms([makePlatform({ id: "p1", name: "배달" })]);

      await renderEntry(null);
      fireEvent.change(await screen.findByLabelText("수입"), { target: { value: "128000" } });
      fireEvent.change(screen.getByLabelText("경비"), { target: { value: "200000" } });
      fireEvent.click(screen.getByRole("button", { name: /기록 저장/ }));

      const errorTexts = await screen.findAllByText("경비는 수입보다 클 수 없어요");
      expect(errorTexts.length).toBeGreaterThan(0);
      expect(getEntries().entries.length).toBe(0);
    });
  });

  describe("AC-5: 저장 성공 시 햅틱 + 홈 이동 + 홈 최근 기록 반영", () => {
    it("AC-5[P0]: 유효한 값으로 저장하면 success 햅틱 후 '/'로 이동하고 홈 최근 기록에 나타난다", async () => {
      seedPlatforms([makePlatform({ id: "p1", name: "배달" })]);

      await renderEntry(null);
      fireEvent.change(await screen.findByLabelText("수입"), { target: { value: "128000" } });
      fireEvent.click(screen.getByRole("button", { name: /기록 저장/ }));

      await waitFor(() => expect(mockNavigate).toHaveBeenCalled());
      const { generateHapticFeedback } = await import("@apps-in-toss/web-framework");
      expect(generateHapticFeedback).toHaveBeenCalledWith({ type: "success" });
      expect(mockNavigate.mock.calls[0][0]).toBe("/");

      const { entries } = getEntries();
      expect(entries.length).toBe(1);
      expect(entries[0].amount).toBe(128000);

      const { default: Home } = await import("@/pages/Home");
      renderWithRouter(React.createElement(Home));
      expect(await screen.findAllByTestId("recent-entry-row")).toHaveLength(1);
    });
  });

  describe("AC-6: 삭제 버튼은 확인 다이얼로그 후 기록을 제거하고 홈으로 이동한다", () => {
    it("AC-6[P0]: 삭제 → AlertDialog 확인 시 기록이 제거되고 '/'로 이동한다", async () => {
      seedPlatforms([makePlatform({ id: "p1", name: "배달" })]);
      seedEntries([makeEntry({ id: "e1", platformId: "p1" })]);

      await renderEntry({ entryId: "e1" });
      fireEvent.click(await screen.findByRole("button", { name: /삭제/ }));

      const dialog = await screen.findByRole("alertdialog");
      fireEvent.click(within(dialog).getByRole("button", { name: "삭제" }));

      await waitFor(() => expect(mockNavigate).toHaveBeenCalled());
      expect(getEntries().entries.length).toBe(0);
      expect(mockNavigate.mock.calls[0][0]).toBe("/");
    });
  });
});

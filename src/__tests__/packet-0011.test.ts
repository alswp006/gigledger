import { describe, it, expect, vi, beforeEach } from "vitest";
import "@testing-library/jest-dom/vitest";
import React from "react";
import { screen, fireEvent } from "@testing-library/react";
import { mockAll, mockNavigate } from "@/__tests__/__helpers__/mocks";
import { renderWithRouter } from "@/__tests__/__helpers__/test-utils";
import { STORAGE_KEYS, MAX_PLATFORMS } from "@/lib/constants";
import { getPlatforms } from "@/lib/storage";
import type { Platform, IncomeEntry } from "@/lib/types";

mockAll();

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
    amount: 100000,
    expense: 0,
    minutes: 60,
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

async function renderPlatforms() {
  const { default: Platforms } = await import("@/pages/Platforms");
  return renderWithRouter(React.createElement(Platforms));
}

const COLOR_LABEL_PATTERN = /^(파랑|초록|주황|보라|빨강|회색)$/;

describe("/platforms 플랫폼 관리 화면", () => {
  beforeEach(() => {
    mockNavigate.mockClear();
  });

  describe("AC-1: 기본 플랫폼 목록이 ListRow + ColorDot으로 표시된다", () => {
    it("AC-1[P0]: 최초 진입 시 기본 3개 플랫폼(배달/대리운전/쿠팡플렉스)이 ListRow로 표시되고 각 행에 ColorDot이 렌더된다", async () => {
      await renderPlatforms();

      const rows = await screen.findAllByRole("listitem");
      expect(rows.length).toBe(3);
      expect(screen.getByText("배달")).toBeInTheDocument();
      expect(screen.getByText("대리운전")).toBeInTheDocument();
      expect(screen.getByText("쿠팡플렉스")).toBeInTheDocument();
      expect(screen.getAllByTestId("color-dot").length).toBe(3);
    });

    it("AC-1[P0]: 보관된 플랫폼에는 '보관됨' 배지가, 활성 플랫폼에는 배지가 없다", async () => {
      seedPlatforms([
        makePlatform({ id: "p1", name: "배달", archived: false }),
        makePlatform({ id: "p2", name: "대리운전", colorToken: "green", archived: true }),
      ]);
      await renderPlatforms();

      const rows = await screen.findAllByRole("listitem");
      expect(rows.length).toBe(2);
      expect(screen.getByText("보관됨")).toBeInTheDocument();
      // 활성 플랫폼(배달)이 있는 행에는 '보관됨' 배지가 없어야 하므로 전체 배지 개수는 1개뿐이다
      expect(screen.getAllByText("보관됨").length).toBe(1);
    });
  });

  describe("AC-2: 추가 BottomSheet의 색상 Chip 6종 중 선택된 것만 filled로 표시된다", () => {
    it("AC-2[P0]: '플랫폼 추가' 탭 시 색상 Chip 6종(파랑/초록/주황/보라/빨강/회색)이 렌더되고 정확히 1개만 variant='filled'다", async () => {
      await renderPlatforms();

      fireEvent.click(screen.getByRole("button", { name: /플랫폼 추가/ }));

      const colorChips = await screen.findAllByRole("button", { name: COLOR_LABEL_PATTERN });
      expect(colorChips.length).toBe(6);

      const filledChips = colorChips.filter((chip) => chip.getAttribute("data-variant") === "filled");
      expect(filledChips.length).toBe(1);
      expect(filledChips[0].getAttribute("aria-pressed")).toBe("true");
    });

    it("AC-2: 다른 색상 Chip을 탭하면 그 Chip만 filled로 바뀌고 이전 선택은 filled가 해제된다", async () => {
      await renderPlatforms();
      fireEvent.click(screen.getByRole("button", { name: /플랫폼 추가/ }));

      const colorChips = await screen.findAllByRole("button", { name: COLOR_LABEL_PATTERN });
      const initiallyFilled = colorChips.find((chip) => chip.getAttribute("data-variant") === "filled")!;
      const target = colorChips.find((chip) => chip !== initiallyFilled)!;

      fireEvent.click(target);

      expect(target.getAttribute("data-variant")).toBe("filled");
      expect(initiallyFilled.getAttribute("data-variant")).not.toBe("filled");
    });
  });

  describe("AC-3: 이미 등록된 이름은 저장을 막고 인라인 에러를 보여준다", () => {
    it("AC-3[P0]: 앞뒤 공백을 포함한 ' 배달 '을 입력해 저장하면 '이미 등록된 플랫폼이에요' help가 표시되고 목록 길이가 그대로다", async () => {
      await renderPlatforms();
      fireEvent.click(screen.getByRole("button", { name: /플랫폼 추가/ }));

      const nameInput = await screen.findByTestId("platform-name-input");
      fireEvent.change(nameInput, { target: { value: " 배달 " } });
      fireEvent.click(screen.getByRole("button", { name: /저장/ }));

      expect(await screen.findByText("이미 등록된 플랫폼이에요")).toBeInTheDocument();
      expect(getPlatforms().length).toBe(3);
      expect(getPlatforms().filter((p) => p.name === "배달").length).toBe(1);
    });
  });

  describe("AC-4: Switch로 보관 토글 시 과거 기록은 유지된다", () => {
    it("AC-4[P0]: 배달 플랫폼의 Switch를 토글하면 archived가 true가 되고 '보관됨' 배지가 붙으며 그 플랫폼의 기록 건수는 그대로다", async () => {
      seedPlatforms([
        makePlatform({ id: "p1", name: "배달", archived: false }),
        makePlatform({ id: "p2", name: "대리운전", colorToken: "green", archived: false }),
      ]);
      seedEntries([
        makeEntry({ id: "e1", platformId: "p1" }),
        makeEntry({ id: "e2", platformId: "p1", date: "2026-08-30" }),
      ]);
      await renderPlatforms();

      expect(screen.queryByText("보관됨")).not.toBeInTheDocument();

      const switches = await screen.findAllByRole("switch");
      fireEvent.click(switches[0]);

      expect(await screen.findByText("보관됨")).toBeInTheDocument();
      const updated = getPlatforms().find((p) => p.id === "p1");
      expect(updated?.archived).toBe(true);

      // localStorage entries는 storage.ts를 거치지 않고 직접 시드했으므로 archive 토글과
      // 무관하게 그대로 남아 있어야 한다 — '보관해도 과거 기록은 유지된다'는 계약을 검증
      const rawEntries = JSON.parse(localStorage.getItem(STORAGE_KEYS.entries) ?? "[]") as IncomeEntry[];
      expect(rawEntries.filter((e) => e.platformId === "p1").length).toBe(2);
    });
  });

  describe("AC-5: 플랫폼 20개 도달 시 추가를 막고 Toast로 안내한다", () => {
    it("AC-5[P0]: 플랫폼이 20개일 때 '플랫폼 추가' 탭 시 Toast '플랫폼은 최대 20개까지 추가할 수 있어요'가 뜨고 BottomSheet는 열리지 않는다", async () => {
      const twenty: Platform[] = Array.from({ length: MAX_PLATFORMS }, (_, i) =>
        makePlatform({ id: `p${i}`, name: `플랫폼${i}`, createdAt: `2026-01-${String((i % 28) + 1).padStart(2, "0")}T00:00:00.000Z` }),
      );
      expect(twenty.length).toBe(20);
      seedPlatforms(twenty);
      await renderPlatforms();

      fireEvent.click(screen.getByRole("button", { name: /플랫폼 추가/ }));

      expect(await screen.findByText("플랫폼은 최대 20개까지 추가할 수 있어요")).toBeInTheDocument();
      expect(screen.queryByTestId("platform-name-input")).not.toBeInTheDocument();
      expect(getPlatforms().length).toBe(20);
    });
  });
});

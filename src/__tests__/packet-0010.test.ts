import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import "@testing-library/jest-dom/vitest";
import React from "react";
import { screen, fireEvent } from "@testing-library/react";
import { mockAll, mockNavigate } from "@/__tests__/__helpers__/mocks";
import { renderWithRouter } from "@/__tests__/__helpers__/test-utils";
import { STORAGE_KEYS } from "@/lib/constants";
import { getSettings, getEntries } from "@/lib/storage";
import type { IncomeEntry, Settings } from "@/lib/types";

mockAll();

function seedEntries(entries: IncomeEntry[]) {
  localStorage.setItem(STORAGE_KEYS.entries, JSON.stringify(entries));
}

function seedSettings(settings: Settings) {
  localStorage.setItem(STORAGE_KEYS.settings, JSON.stringify(settings));
}

function makeEntry(overrides: Partial<IncomeEntry> = {}): IncomeEntry {
  return {
    id: "entry-1",
    platformId: "platform-1",
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

async function renderSettings() {
  const { default: Settings } = await import("@/pages/Settings");
  return renderWithRouter(React.createElement(Settings));
}

describe("/settings 설정 화면", () => {
  beforeEach(() => {
    mockNavigate.mockClear();
    // Date만 고정 — setTimeout까지 fake로 돌리면 findBy*/waitFor의 실 폴링이 멈춘다.
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date(2026, 7, 31, 12, 0, 0));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("AC-1: 목표 금액이 최소값 미만이면 저장하지 않고 에러를 표시한다", () => {
    it("AC-1[P0]: 5000 입력 후 저장 시 '목표는 10,000원 이상으로 설정해주세요' help가 뜨고 값이 저장되지 않는다", async () => {
      seedSettings({ monthlyGoal: 0, bestStreak: 0, noticeSeenAt: null });
      await renderSettings();

      const input = await screen.findByTestId("goal-input");
      fireEvent.change(input, { target: { value: "5000" } });

      const saveButton = screen.getByRole("button", { name: /저장/ });
      saveButton.click();

      const help = await screen.findByText("목표는 10,000원 이상으로 설정해주세요");
      expect(help).toBeInTheDocument();
      expect(getSettings().monthlyGoal).toBe(0);
      expect(screen.queryByText("목표를 저장했어요")).not.toBeInTheDocument();
    });
  });

  describe("AC-2: 목표 저장 성공 시 Toast가 뜨고 값이 유지된다", () => {
    it("AC-2[P0]: 3000000 입력 후 저장 시 '목표를 저장했어요' Toast가 뜨고 localStorage에 저장된다", async () => {
      seedSettings({ monthlyGoal: 0, bestStreak: 0, noticeSeenAt: null });
      await renderSettings();

      const input = await screen.findByTestId("goal-input");
      fireEvent.change(input, { target: { value: "3000000" } });

      const saveButton = screen.getByRole("button", { name: /저장/ });
      saveButton.click();

      expect(await screen.findByText("목표를 저장했어요")).toBeInTheDocument();
      expect(getSettings().monthlyGoal).toBe(3000000);
    });

    it("AC-2: 저장 후 화면을 새로 마운트해도 저장된 목표 금액이 그대로 표시된다", async () => {
      seedSettings({ monthlyGoal: 3000000, bestStreak: 0, noticeSeenAt: null });
      await renderSettings();

      const input = (await screen.findByTestId("goal-input")) as HTMLInputElement;
      expect(input.value.replace(/,/g, "")).toBe("3000000");
      expect(getSettings().monthlyGoal).toBe(3000000);
    });
  });

  describe("AC-3: 기록 전체 삭제는 AlertDialog 확인을 거친다", () => {
    it("AC-3[P0]: '기록 전체 삭제' 탭 시 AlertDialog가 열리고 왼쪽 버튼 라벨이 '닫기'다", async () => {
      seedEntries([makeEntry()]);
      await renderSettings();

      const deleteRow = await screen.findByText("기록 전체 삭제");
      deleteRow.click();

      const dialog = await screen.findByRole("alertdialog");
      expect(dialog).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "닫기" })).toBeInTheDocument();
    });

    it("AC-3[P0]: 확인 버튼 탭 시 entries가 0건이 된다", async () => {
      seedEntries([makeEntry({ id: "e1" }), makeEntry({ id: "e2", date: "2026-08-30" })]);
      await renderSettings();

      const deleteRow = await screen.findByText("기록 전체 삭제");
      deleteRow.click();

      const dialog = await screen.findByRole("alertdialog");
      const buttons = Array.from(dialog.querySelectorAll("button"));
      const confirmButton = buttons.find((b) => b.textContent !== "닫기");
      expect(confirmButton).toBeDefined();
      confirmButton!.click();

      expect(getEntries().entries.length).toBe(0);
      expect(JSON.parse(localStorage.getItem(STORAGE_KEYS.entries) ?? "[]")).toEqual([]);
    });
  });

  describe("AC-4: 현재 스트릭과 최고 스트릭이 ListRow로 표시된다", () => {
    it("AC-4[P0]: 기록이 없으면 현재 스트릭과 최고 스트릭이 각각 '0일'로 표시된다", async () => {
      seedEntries([]);
      seedSettings({ monthlyGoal: 0, bestStreak: 0, noticeSeenAt: null });
      await renderSettings();

      await screen.findByText("현재 스트릭");
      expect(screen.getByText("최고 스트릭")).toBeInTheDocument();
      expect(screen.getAllByText("0일").length).toBeGreaterThanOrEqual(2);
    });

    it("AC-4: 오늘 기록이 있고 bestStreak가 5면 현재 스트릭 '1일', 최고 스트릭 '5일'이 표시된다", async () => {
      seedEntries([makeEntry({ id: "today", date: "2026-08-31" })]);
      seedSettings({ monthlyGoal: 0, bestStreak: 5, noticeSeenAt: null });
      await renderSettings();

      await screen.findByText("현재 스트릭");
      expect(screen.getByText("1일")).toBeInTheDocument();
      expect(screen.getByText("5일")).toBeInTheDocument();
    });
  });

  describe("AC-5: 저장 버튼 탭 시 success 햅틱을 준다", () => {
    it("AC-5[P0]: 저장 버튼 탭 시 generateHapticFeedback({type:'success'})가 호출된다", async () => {
      const { generateHapticFeedback } = await import("@apps-in-toss/web-framework");
      seedSettings({ monthlyGoal: 0, bestStreak: 0, noticeSeenAt: null });
      await renderSettings();

      const input = await screen.findByTestId("goal-input");
      fireEvent.change(input, { target: { value: "3000000" } });

      const saveButton = screen.getByRole("button", { name: /저장/ });
      saveButton.click();

      expect(generateHapticFeedback).toHaveBeenCalledWith({ type: "success" });
    });
  });
});

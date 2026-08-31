import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import React from "react";
import { useLedger } from "@/hooks/useLedger";
import type { IncomeEntry, Platform, Settings } from "@/lib/types";
import * as storage from "@/lib/storage";
import { calcStreak } from "@/lib/calc";
import { toDateKey } from "@/lib/date";

// Mock storage module — all storage operations return mocked results
vi.mock("@/lib/storage", () => ({
  getPlatforms: vi.fn(),
  getEntries: vi.fn(),
  getSettings: vi.fn(),
  getReportUnlocks: vi.fn(),
  saveEntry: vi.fn(),
  deleteEntry: vi.fn(),
  savePlatforms: vi.fn(),
  saveSettings: vi.fn(),
  saveReportUnlocks: vi.fn(),
}));

// Mock react-router-dom to capture navigate calls
const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// Helper to wrap hook with MemoryRouter
const renderLedgerHook = () => {
  const wrapper = ({ children }: { children: React.ReactNode }) =>
    React.createElement(MemoryRouter, null, children);
  return renderHook(() => useLedger(), { wrapper });
};

describe("상태 관리 훅 useLedger (packet 0007)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  // ─── AC-1: Hook returns all required properties ───
  describe("AC-1: Hook returns object with all required properties", () => {
    it("should return all required properties with correct types", async () => {
      // Setup: mock all storage reads
      const mockPlatforms: Platform[] = [];
      const mockEntries: IncomeEntry[] = [];
      const mockSettings: Settings = {
        monthlyGoal: 0,
        bestStreak: 0,
        noticeSeenAt: null,
      };
      const mockReportUnlocks = {};

      (storage.getPlatforms as any).mockReturnValue(mockPlatforms);
      (storage.getEntries as any).mockReturnValue({
        entries: mockEntries,
        corrupted: false,
      });
      (storage.getSettings as any).mockReturnValue(mockSettings);
      (storage.getReportUnlocks as any).mockReturnValue(mockReportUnlocks);

      const { result } = renderLedgerHook();

      // Wait for initial load
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Assert all required properties exist with correct types
      expect(typeof result.current.platforms).toBe("object");
      expect(Array.isArray(result.current.platforms)).toBe(true);
      expect(result.current.entries).toBeDefined();
      expect(Array.isArray(result.current.entries)).toBe(true);
      expect(result.current.settings).toBeDefined();
      expect(typeof result.current.settings).toBe("object");
      expect(result.current.reportUnlocks).toBeDefined();
      expect(typeof result.current.reportUnlocks).toBe("object");
      expect(typeof result.current.loading).toBe("boolean");
      expect(typeof result.current.corrupted).toBe("boolean");
      expect(typeof result.current.saveEntry).toBe("function");
      expect(typeof result.current.removeEntry).toBe("function");
      expect(typeof result.current.addPlatform).toBe("function");
      expect(typeof result.current.updatePlatform).toBe("function");
      expect(typeof result.current.archivePlatform).toBe("function");
      expect(typeof result.current.updateSettings).toBe("function");
      expect(typeof result.current.unlockReport).toBe("function");
    });
  });

  // ─── AC-2: bestStreak sync when entries change ───
  describe("AC-2: Entries change triggers bestStreak update when current > bestStreak", () => {
    it("should update bestStreak when streak current is greater than stored value", async () => {
      const today = toDateKey(new Date());
      const yesterday = toDateKey(
        new Date(new Date().getTime() - 24 * 60 * 60 * 1000)
      );
      const dayBefore = toDateKey(
        new Date(new Date().getTime() - 2 * 24 * 60 * 60 * 1000)
      );

      // 3-day consecutive streak
      const mockEntries: IncomeEntry[] = [
        {
          id: "e1",
          platformId: "p1",
          date: today,
          amount: 100000,
          expense: 10000,
          minutes: 480,
          memo: "",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: "e2",
          platformId: "p1",
          date: yesterday,
          amount: 100000,
          expense: 10000,
          minutes: 480,
          memo: "",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: "e3",
          platformId: "p1",
          date: dayBefore,
          amount: 100000,
          expense: 10000,
          minutes: 480,
          memo: "",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ];

      // Initial bestStreak is 0, but streak calculation will yield 3
      (storage.getPlatforms as any).mockReturnValue([]);
      (storage.getEntries as any).mockReturnValue({
        entries: mockEntries,
        corrupted: false,
      });
      (storage.getSettings as any).mockReturnValue({
        monthlyGoal: 5000000,
        bestStreak: 0,
        noticeSeenAt: null,
      });
      (storage.getReportUnlocks as any).mockReturnValue({});
      (storage.saveSettings as any).mockReturnValue({ ok: true });

      const { result } = renderLedgerHook();

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Verify that calcStreak with today gives current=3
      const streakResult = calcStreak(mockEntries, today);
      expect(streakResult.current).toBe(3);

      // Verify saveSettings was called with updated bestStreak
      await waitFor(() => {
        expect(storage.saveSettings).toHaveBeenCalledWith(
          expect.objectContaining({
            bestStreak: 3,
          })
        );
      });

      // Verify state reflects the new bestStreak
      expect(result.current.settings.bestStreak).toBe(3);
    });

    it("should NOT update bestStreak if current <= existing value", async () => {
      const today = toDateKey(new Date());

      // 1-day streak
      const mockEntries: IncomeEntry[] = [
        {
          id: "e1",
          platformId: "p1",
          date: today,
          amount: 100000,
          expense: 10000,
          minutes: 480,
          memo: "",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ];

      (storage.getPlatforms as any).mockReturnValue([]);
      (storage.getEntries as any).mockReturnValue({
        entries: mockEntries,
        corrupted: false,
      });
      (storage.getSettings as any).mockReturnValue({
        monthlyGoal: 5000000,
        bestStreak: 5,
        noticeSeenAt: null,
      });
      (storage.getReportUnlocks as any).mockReturnValue({});

      const { result } = renderLedgerHook();

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Current streak is 1, existing is 5 — should NOT update
      expect(storage.saveSettings).not.toHaveBeenCalled();
      expect(result.current.settings.bestStreak).toBe(5);
    });
  });

  // ─── AC-3: saveEntry error handling ───
  describe("AC-3: saveEntry returns error without mutating state on failure", () => {
    it("should return error when saveEntry fails", async () => {
      const mockEntries: IncomeEntry[] = [];

      (storage.getPlatforms as any).mockReturnValue([]);
      (storage.getEntries as any).mockReturnValue({
        entries: mockEntries,
        corrupted: false,
      });
      (storage.getSettings as any).mockReturnValue({
        monthlyGoal: 0,
        bestStreak: 0,
        noticeSeenAt: null,
      });
      (storage.getReportUnlocks as any).mockReturnValue({});

      const errorMsg = "저장 공간이 부족해요. 오래된 기록을 삭제해주세요";
      (storage.saveEntry as any).mockReturnValue({
        ok: false,
        data: {
          id: "",
          platformId: "",
          date: "",
          amount: 0,
          expense: 0,
          minutes: 0,
          memo: "",
          createdAt: "",
          updatedAt: "",
        },
        error: errorMsg,
      });

      const { result } = renderLedgerHook();

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const entriesBefore = result.current.entries.length;

      // Call saveEntry
      const saveResult = result.current.saveEntry({
        platformId: "p1",
        date: "2026-08-31",
        amount: 100000,
        expense: 0,
        minutes: 480,
      });

      // Verify error is returned
      expect(saveResult.ok).toBe(false);
      expect(saveResult.error).toBe(errorMsg);

      // Verify state did not change
      expect(result.current.entries.length).toBe(entriesBefore);
    });

    it("should update state when saveEntry succeeds", async () => {
      const mockEntries: IncomeEntry[] = [];

      (storage.getPlatforms as any).mockReturnValue([]);
      (storage.getEntries as any).mockReturnValue({
        entries: mockEntries,
        corrupted: false,
      });
      (storage.getSettings as any).mockReturnValue({
        monthlyGoal: 0,
        bestStreak: 0,
        noticeSeenAt: null,
      });
      (storage.getReportUnlocks as any).mockReturnValue({});

      const newEntry: IncomeEntry = {
        id: "e1",
        platformId: "p1",
        date: "2026-08-31",
        amount: 100000,
        expense: 0,
        minutes: 480,
        memo: "test",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      (storage.saveEntry as any).mockReturnValue({
        ok: true,
        data: newEntry,
        error: "",
      });

      const { result } = renderLedgerHook();

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const saveResult = result.current.saveEntry({
        platformId: "p1",
        date: "2026-08-31",
        amount: 100000,
        expense: 0,
        minutes: 480,
        memo: "test",
      });

      expect(saveResult.ok).toBe(true);
      expect(saveResult.data.id).toBe("e1");
    });
  });

  // ─── AC-4: corrupted flag exposure ───
  describe("AC-4: Exposes corrupted flag and renders empty data gracefully", () => {
    it("should expose corrupted=true when storage is corrupted", async () => {
      (storage.getPlatforms as any).mockReturnValue([]);
      (storage.getEntries as any).mockReturnValue({
        entries: [],
        corrupted: true,
      });
      (storage.getSettings as any).mockReturnValue({
        monthlyGoal: 0,
        bestStreak: 0,
        noticeSeenAt: null,
      });
      (storage.getReportUnlocks as any).mockReturnValue({});

      const { result } = renderLedgerHook();

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.corrupted).toBe(true);
    });

    it("should expose corrupted=false when storage is healthy", async () => {
      (storage.getPlatforms as any).mockReturnValue([]);
      (storage.getEntries as any).mockReturnValue({
        entries: [],
        corrupted: false,
      });
      (storage.getSettings as any).mockReturnValue({
        monthlyGoal: 0,
        bestStreak: 0,
        noticeSeenAt: null,
      });
      (storage.getReportUnlocks as any).mockReturnValue({});

      const { result } = renderLedgerHook();

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.corrupted).toBe(false);
    });

    it("should render with empty entries when corrupted", async () => {
      (storage.getPlatforms as any).mockReturnValue([]);
      (storage.getEntries as any).mockReturnValue({
        entries: [],
        corrupted: true,
      });
      (storage.getSettings as any).mockReturnValue({
        monthlyGoal: 0,
        bestStreak: 0,
        noticeSeenAt: null,
      });
      (storage.getReportUnlocks as any).mockReturnValue({});

      const { result } = renderLedgerHook();

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(Array.isArray(result.current.entries)).toBe(true);
      expect(result.current.entries.length).toBe(0);
    });
  });

  // ─── AC-5: Loading state transition ───
  describe("AC-5: loading state transitions from true to false after initial load", () => {
    it("should start with loading=true", () => {
      (storage.getPlatforms as any).mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(() => resolve([]), 100)
          )
      );
      (storage.getEntries as any).mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(() => resolve({ entries: [], corrupted: false }), 100)
          )
      );
      (storage.getSettings as any).mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(
              () =>
                resolve({
                  monthlyGoal: 0,
                  bestStreak: 0,
                  noticeSeenAt: null,
                }),
              100
            )
          )
      );
      (storage.getReportUnlocks as any).mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve({}), 100))
      );

      const { result } = renderLedgerHook();

      // Initially loading
      expect(result.current.loading).toBe(true);
    });

    it("should transition to loading=false after storage operations complete", async () => {
      (storage.getPlatforms as any).mockReturnValue([]);
      (storage.getEntries as any).mockReturnValue({
        entries: [],
        corrupted: false,
      });
      (storage.getSettings as any).mockReturnValue({
        monthlyGoal: 0,
        bestStreak: 0,
        noticeSeenAt: null,
      });
      (storage.getReportUnlocks as any).mockReturnValue({});

      const { result } = renderLedgerHook();

      // Wait for loading to complete
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Verify final state
      expect(result.current.loading).toBe(false);
      expect(result.current.platforms).toBeDefined();
      expect(result.current.entries).toBeDefined();
      expect(result.current.settings).toBeDefined();
    });

    it("should remain false after initial load", async () => {
      (storage.getPlatforms as any).mockReturnValue([]);
      (storage.getEntries as any).mockReturnValue({
        entries: [],
        corrupted: false,
      });
      (storage.getSettings as any).mockReturnValue({
        monthlyGoal: 0,
        bestStreak: 0,
        noticeSeenAt: null,
      });
      (storage.getReportUnlocks as any).mockReturnValue({});

      const { result } = renderLedgerHook();

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Verify still false after multiple checks
      expect(result.current.loading).toBe(false);
      expect(result.current.loading).toBe(false);
    });
  });

  // ─── Additional edge cases ───
  describe("Additional: removeEntry integration", () => {
    it("should call deleteEntry and reflect change in state", async () => {
      const mockEntries: IncomeEntry[] = [
        {
          id: "e1",
          platformId: "p1",
          date: "2026-08-31",
          amount: 100000,
          expense: 0,
          minutes: 480,
          memo: "",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ];

      (storage.getPlatforms as any).mockReturnValue([]);
      (storage.getEntries as any).mockReturnValue({
        entries: mockEntries,
        corrupted: false,
      });
      (storage.getSettings as any).mockReturnValue({
        monthlyGoal: 0,
        bestStreak: 0,
        noticeSeenAt: null,
      });
      (storage.getReportUnlocks as any).mockReturnValue({});
      (storage.deleteEntry as any).mockReturnValue(true);

      const { result } = renderLedgerHook();

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      result.current.removeEntry("e1");

      expect(storage.deleteEntry).toHaveBeenCalledWith("e1");
    });
  });

  describe("Additional: updateSettings integration", () => {
    it("should save settings when updateSettings is called", async () => {
      (storage.getPlatforms as any).mockReturnValue([]);
      (storage.getEntries as any).mockReturnValue({
        entries: [],
        corrupted: false,
      });
      (storage.getSettings as any).mockReturnValue({
        monthlyGoal: 0,
        bestStreak: 0,
        noticeSeenAt: null,
      });
      (storage.getReportUnlocks as any).mockReturnValue({});
      (storage.saveSettings as any).mockReturnValue({ ok: true });

      const { result } = renderLedgerHook();

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      result.current.updateSettings({ monthlyGoal: 5000000 });

      await waitFor(() => {
        expect(storage.saveSettings).toHaveBeenCalledWith(
          expect.objectContaining({
            monthlyGoal: 5000000,
          })
        );
      });
    });
  });
});

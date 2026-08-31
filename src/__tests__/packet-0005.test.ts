import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  getPlatforms,
  saveEntry,
  deleteEntry,
  getEntries,
} from "@/lib/storage";

describe("localStorage 리포지토리 storage.ts", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  // AC-1: getPlatforms() should create 3 seed platforms on first call
  describe("AC-1: getPlatforms() 초기 시드 데이터", () => {
    it("should create 3 seed platforms (배달, 대리운전, 쿠팡플렉스) with id, archived:false, ISO8601 createdAt", () => {
      const platforms = getPlatforms();

      expect(platforms).toHaveLength(3);
      expect(platforms[0]).toMatchObject({
        id: expect.any(String),
        name: "배달",
        archived: false,
        createdAt: expect.stringMatching(
          /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/
        ),
      });
      expect(platforms[1]).toMatchObject({
        name: "대리운전",
        archived: false,
      });
      expect(platforms[2]).toMatchObject({
        name: "쿠팡플렉스",
        archived: false,
      });
      // each platform should have unique id
      const ids = platforms.map((p) => p.id);
      expect(new Set(ids).size).toBe(3);
    });

    it("should not recreate platforms on second call — persists to localStorage", () => {
      const first = getPlatforms();
      const firstIds = first.map((p) => p.id);

      const second = getPlatforms();
      const secondIds = second.map((p) => p.id);

      expect(secondIds).toEqual(firstIds);
      expect(second[0].createdAt).toBe(first[0].createdAt);
    });
  });

  // AC-2: saveEntry() should save new entry with id, createdAt, updatedAt
  describe("AC-2: saveEntry() 새 항목 저장 및 기존 항목 갱신", () => {
    it("should save new entry with generated id, createdAt, updatedAt and return {ok:true}", () => {
      const result = saveEntry({
        platformId: "p1",
        date: "2026-08-31",
        amount: 128000,
        expense: 18000,
        minutes: 330,
        memo: "피크타임",
      });

      expect(result.ok).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data).toMatchObject({
        id: expect.any(String),
        platformId: "p1",
        date: "2026-08-31",
        amount: 128000,
        expense: 18000,
        minutes: 330,
        memo: "피크타임",
        createdAt: expect.stringMatching(
          /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/
        ),
        updatedAt: expect.stringMatching(
          /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/
        ),
      });
    });

    it("should increment entries count by 1 for new entry", () => {
      const before = getEntries().entries.length;

      saveEntry({
        platformId: "p1",
        date: "2026-08-31",
        amount: 100000,
        expense: 10000,
        minutes: 300,
      });

      const after = getEntries().entries.length;
      expect(after).toBe(before + 1);
    });

    it("should update existing entry (by id) without changing entries count", () => {
      const entry1 = saveEntry({
        platformId: "p1",
        date: "2026-08-31",
        amount: 100000,
        expense: 10000,
        minutes: 300,
      });

      expect(entry1.ok).toBe(true);
      const lengthAfterCreate = getEntries().entries.length;

      const entry2 = saveEntry({
        id: entry1.data.id,
        platformId: "p1",
        date: "2026-09-01",
        amount: 150000,
        expense: 15000,
        minutes: 330,
        memo: "업데이트됨",
      });

      expect(entry2.ok).toBe(true);
      const lengthAfterUpdate = getEntries().entries.length;

      expect(lengthAfterCreate).toBe(lengthAfterUpdate);
      expect(entry2.data.id).toBe(entry1.data.id);
      expect(entry2.data.date).toBe("2026-09-01");
      expect(entry2.data.amount).toBe(150000);
      expect(entry2.data.memo).toBe("업데이트됨");
      // updatedAt should be newer than createdAt
      expect(
        new Date(entry2.data.updatedAt) >= new Date(entry2.data.createdAt)
      ).toBe(true);
    });
  });

  // AC-3: deleteEntry() should remove entry from storage
  describe("AC-3: deleteEntry() 항목 삭제", () => {
    it("should delete entry and return true, entry should not exist in getEntries()", () => {
      const entry = saveEntry({
        platformId: "p1",
        date: "2026-08-31",
        amount: 100000,
        expense: 10000,
        minutes: 300,
      });

      expect(entry.ok).toBe(true);
      const entriesBefore = getEntries().entries.length;

      const deleted = deleteEntry(entry.data.id);

      expect(deleted).toBe(true);
      const entriesAfter = getEntries().entries.length;
      expect(entriesAfter).toBe(entriesBefore - 1);

      const found = getEntries().entries.find((e) => e.id === entry.data.id);
      expect(found).toBeUndefined();
    });

    it("should return false when deleting non-existent entry", () => {
      const deleted = deleteEntry("non-existent-id");
      expect(deleted).toBe(false);
    });
  });

  // AC-4: MAX_ENTRIES = 5000 제한
  describe("AC-4: MAX_ENTRIES 한계값 5000 처리", () => {
    it("should reject saveEntry when entries reach 5000 limit", () => {
      // Create 5000 entries
      for (let i = 0; i < 5000; i++) {
        const result = saveEntry({
          platformId: `p${i % 5}`,
          date: "2026-08-31",
          amount: 100000 + i,
          expense: 10000,
          minutes: 300 + (i % 60),
        });
        if (!result.ok) break; // stop if any fails before 5000
      }

      const currentEntries = getEntries().entries.length;
      expect(currentEntries).toBe(5000);

      // Try to add one more
      const result = saveEntry({
        platformId: "p1",
        date: "2026-08-31",
        amount: 200000,
        expense: 20000,
        minutes: 330,
      });

      expect(result.ok).toBe(false);
      expect(result.error).toBe("기록은 최대 5,000건까지 저장할 수 있어요");
      expect(getEntries().entries).toHaveLength(5000);
    });
  });

  // AC-5: QuotaExceededError + 손상된 JSON
  describe("AC-5: QuotaExceededError 처리 및 손상된 JSON 복구", () => {
    it("should handle QuotaExceededError by returning error message without throwing", () => {
      const mockSetItem = vi.fn(() => {
        const error = new Error("QuotaExceededError");
        error.name = "QuotaExceededError";
        throw error;
      });
      vi.spyOn(Storage.prototype, "setItem").mockImplementation(mockSetItem);

      const result = saveEntry({
        platformId: "p1",
        date: "2026-08-31",
        amount: 100000,
        expense: 10000,
        minutes: 300,
      });

      expect(result.ok).toBe(false);
      expect(result.error).toBe(
        "저장 공간이 부족해요. 오래된 기록을 삭제해주세요"
      );

      vi.restoreAllMocks();
    });

    it("should detect corrupted JSON in localStorage and return empty array with corrupted:true", () => {
      localStorage.setItem("gigledger.entries.v1", "{{broken");

      const result = getEntries();

      expect(result.entries).toEqual([]);
      expect(result.corrupted).toBe(true);
    });

    it("should recover from corrupted data by saving clean slate", () => {
      localStorage.setItem("gigledger.entries.v1", "{{broken");

      const first = getEntries();
      expect(first.corrupted).toBe(true);

      // After detection, saveEntry should work normally
      const saveResult = saveEntry({
        platformId: "p1",
        date: "2026-08-31",
        amount: 100000,
        expense: 10000,
        minutes: 300,
      });

      expect(saveResult.ok).toBe(true);

      const second = getEntries();
      expect(second.entries).toHaveLength(1);
      expect(second.corrupted).toBe(false);
    });
  });
});

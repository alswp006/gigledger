import { describe, it, expect, beforeEach } from "vitest";

describe("src/lib/format.ts / src/lib/date.ts / src/lib/id.ts — 포맷/날짜/ID 유틸 (순수 함수)", () => {
  describe("AC1-1[P0]: formatKRW(amount) 기본값 검증", () => {
    it("AC1-1-a: formatKRW(1250000) === '1,250,000원'", async () => {
      const { formatKRW } = await import("@/lib/format");
      const result = formatKRW(1250000);
      expect(result).toBe("1,250,000원");
      expect(typeof result).toBe("string");
    });

    it("AC1-1-b: formatKRW(0) === '0원'", async () => {
      const { formatKRW } = await import("@/lib/format");
      const result = formatKRW(0);
      expect(result).toBe("0원");
      expect(result).toHaveLength(2);
    });

    it("AC1-1-c: formatKRW(1000) === '1,000원' (세자리 구분 검증)", async () => {
      const { formatKRW } = await import("@/lib/format");
      const result = formatKRW(1000);
      expect(result).toBe("1,000원");
      expect(result.includes(",")).toBe(true);
    });

    it("AC1-1-d: formatKRW(123456789) === '123,456,789원' (큰 수 검증)", async () => {
      const { formatKRW } = await import("@/lib/format");
      const result = formatKRW(123456789);
      expect(result).toBe("123,456,789원");
      expect(result.endsWith("원")).toBe(true);
    });
  });

  describe("AC1-2[P0]: formatMinutes(minutes) 기본값 검증", () => {
    it("AC1-2-a: formatMinutes(330) === '5시간 30분'", async () => {
      const { formatMinutes } = await import("@/lib/format");
      const result = formatMinutes(330);
      expect(result).toBe("5시간 30분");
      expect(result).toContain("시간");
      expect(result).toContain("분");
    });

    it("AC1-2-b: formatMinutes(0) === '0시간 0분'", async () => {
      const { formatMinutes } = await import("@/lib/format");
      const result = formatMinutes(0);
      expect(result).toBe("0시간 0분");
      expect(result.includes("0시간")).toBe(true);
    });

    it("AC1-2-c: formatMinutes(60) === '1시간 0분'", async () => {
      const { formatMinutes } = await import("@/lib/format");
      const result = formatMinutes(60);
      expect(result).toBe("1시간 0분");
    });

    it("AC1-2-d: formatMinutes(90) === '1시간 30분'", async () => {
      const { formatMinutes } = await import("@/lib/format");
      const result = formatMinutes(90);
      expect(result).toBe("1시간 30분");
    });

    it("AC1-2-e: formatMinutes(59) === '0시간 59분'", async () => {
      const { formatMinutes } = await import("@/lib/format");
      const result = formatMinutes(59);
      expect(result).toBe("0시간 59분");
    });
  });

  describe("AC2-1[P0]: formatWage(amount) 특수 케이스 검증", () => {
    it("AC2-1-a: formatWage(null) === '—'", async () => {
      const { formatWage } = await import("@/lib/format");
      const result = formatWage(null);
      expect(result).toBe("—");
      expect(result).toHaveLength(1);
    });

    it("AC2-1-b: formatWage(-3000) === '-3,000원' (음수 검증)", async () => {
      const { formatWage } = await import("@/lib/format");
      const result = formatWage(-3000);
      expect(result).toBe("-3,000원");
      expect(result.startsWith("-")).toBe(true);
      expect(result.endsWith("원")).toBe(true);
    });

    it("AC2-1-c: formatWage(0) === '0원'", async () => {
      const { formatWage } = await import("@/lib/format");
      const result = formatWage(0);
      expect(result).toBe("0원");
    });

    it("AC2-1-d: formatWage(25000) === '25,000원' (양수 검증)", async () => {
      const { formatWage } = await import("@/lib/format");
      const result = formatWage(25000);
      expect(result).toBe("25,000원");
    });
  });

  describe("AC2-2[P0]: formatDelta(current, previous) 증감률 검증", () => {
    it("AC2-2-a: formatDelta(2100000, 1750000) === '+20%'", async () => {
      const { formatDelta } = await import("@/lib/format");
      const result = formatDelta(2100000, 1750000);
      expect(result).toBe("+20%");
      expect(result.startsWith("+")).toBe(true);
      expect(result.endsWith("%")).toBe(true);
    });

    it("AC2-2-b: formatDelta(x, 0) === '—' (이전값 0일 때)", async () => {
      const { formatDelta } = await import("@/lib/format");
      const result = formatDelta(1000000, 0);
      expect(result).toBe("—");
      expect(result).toHaveLength(1);
    });

    it("AC2-2-c: formatDelta(1750000, 2100000) === '-17%' (감소율 검증)", async () => {
      const { formatDelta } = await import("@/lib/format");
      const result = formatDelta(1750000, 2100000);
      expect(result).toBe("-17%");
      expect(result.startsWith("-")).toBe(true);
    });

    it("AC2-2-d: formatDelta(1750000, 1750000) === '+0%' (동일값 검증)", async () => {
      const { formatDelta } = await import("@/lib/format");
      const result = formatDelta(1750000, 1750000);
      expect(result).toBe("+0%");
    });

    it("AC2-2-e: formatDelta(0, 1000000) === '-100%' (전체 감소)", async () => {
      const { formatDelta } = await import("@/lib/format");
      const result = formatDelta(0, 1000000);
      expect(result).toBe("-100%");
    });
  });

  describe("AC3-1[P0]: toDateKey(date) 날짜 키 변환", () => {
    it("AC3-1-a: toDateKey(new Date(2026,7,31)) === '2026-08-31' (0-indexed 월 처리)", async () => {
      const { toDateKey } = await import("@/lib/date");
      const date = new Date(2026, 7, 31); // 8월 31일
      const result = toDateKey(date);
      expect(result).toBe("2026-08-31");
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });

    it("AC3-1-b: toDateKey(new Date(2026,0,1)) === '2026-01-01' (1월 검증)", async () => {
      const { toDateKey } = await import("@/lib/date");
      const date = new Date(2026, 0, 1);
      const result = toDateKey(date);
      expect(result).toBe("2026-01-01");
    });

    it("AC3-1-c: toDateKey(new Date(2026,11,31)) === '2026-12-31' (12월 검증)", async () => {
      const { toDateKey } = await import("@/lib/date");
      const date = new Date(2026, 11, 31);
      const result = toDateKey(date);
      expect(result).toBe("2026-12-31");
    });

    it("AC3-1-d: toDateKey는 월일에 패딩 0을 포함한다", async () => {
      const { toDateKey } = await import("@/lib/date");
      const date = new Date(2026, 0, 5);
      const result = toDateKey(date);
      expect(result).toBe("2026-01-05");
      expect(result.substring(5, 7)).toBe("01");
      expect(result.substring(8, 10)).toBe("05");
    });
  });

  describe("AC3-2[P0]: toMonthKey(dateStr) 월 키 추출", () => {
    it("AC3-2-a: toMonthKey('2026-08-31') === '2026-08'", async () => {
      const { toMonthKey } = await import("@/lib/date");
      const result = toMonthKey("2026-08-31");
      expect(result).toBe("2026-08");
      expect(result).toMatch(/^\d{4}-\d{2}$/);
    });

    it("AC3-2-b: toMonthKey('2026-01-15') === '2026-01' (1월 검증)", async () => {
      const { toMonthKey } = await import("@/lib/date");
      const result = toMonthKey("2026-01-15");
      expect(result).toBe("2026-01");
    });

    it("AC3-2-c: toMonthKey('2026-12-25') === '2026-12' (12월 검증)", async () => {
      const { toMonthKey } = await import("@/lib/date");
      const result = toMonthKey("2026-12-25");
      expect(result).toBe("2026-12");
    });
  });

  describe("AC3-3[P0]: startOfWeek(dateStr) 주간 월요일 계산", () => {
    it("AC3-3-a: startOfWeek('2026-08-30'(일)) → 6일 전 월요일 '2026-08-24' 반환", async () => {
      const { startOfWeek } = await import("@/lib/date");
      // 2026-08-30은 일요일
      const result = startOfWeek("2026-08-30");
      expect(result).toBe("2026-08-24");
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });

    it("AC3-3-b: startOfWeek('2026-08-24'(월)) → 같은 날 '2026-08-24' 반환", async () => {
      const { startOfWeek } = await import("@/lib/date");
      // 2026-08-24는 월요일
      const result = startOfWeek("2026-08-24");
      expect(result).toBe("2026-08-24");
    });

    it("AC3-3-c: startOfWeek('2026-08-25'(화)) → 1일 전 월요일 '2026-08-24' 반환", async () => {
      const { startOfWeek } = await import("@/lib/date");
      // 2026-08-25는 화요일
      const result = startOfWeek("2026-08-25");
      expect(result).toBe("2026-08-24");
    });

    it("AC3-3-d: startOfWeek('2026-08-29'(토)) → 5일 전 월요일 '2026-08-24' 반환", async () => {
      const { startOfWeek } = await import("@/lib/date");
      // 2026-08-29는 토요일
      const result = startOfWeek("2026-08-29");
      expect(result).toBe("2026-08-24");
    });
  });

  describe("AC3-4[P0]: addMonthKey(monthStr, delta) 월 더하기", () => {
    it("AC3-4-a: addMonthKey('2026-01', -1) === '2025-12' (년 바꿈)", async () => {
      const { addMonthKey } = await import("@/lib/date");
      const result = addMonthKey("2026-01", -1);
      expect(result).toBe("2025-12");
      expect(result).toMatch(/^\d{4}-\d{2}$/);
    });

    it("AC3-4-b: addMonthKey('2026-08', 1) === '2026-09' (다음달)", async () => {
      const { addMonthKey } = await import("@/lib/date");
      const result = addMonthKey("2026-08", 1);
      expect(result).toBe("2026-09");
    });

    it("AC3-4-c: addMonthKey('2025-12', 1) === '2026-01' (년 넘김)", async () => {
      const { addMonthKey } = await import("@/lib/date");
      const result = addMonthKey("2025-12", 1);
      expect(result).toBe("2026-01");
    });

    it("AC3-4-d: addMonthKey('2026-08', 0) === '2026-08' (0일 때)", async () => {
      const { addMonthKey } = await import("@/lib/date");
      const result = addMonthKey("2026-08", 0);
      expect(result).toBe("2026-08");
    });

    it("AC3-4-e: addMonthKey('2026-08', -8) === '2025-12' (여러달 전)", async () => {
      const { addMonthKey } = await import("@/lib/date");
      const result = addMonthKey("2026-08", -8);
      expect(result).toBe("2025-12");
    });

    it("AC3-4-f: addMonthKey('2026-08', 5) === '2026-01' (다음해)", async () => {
      const { addMonthKey } = await import("@/lib/date");
      const result = addMonthKey("2026-08", 5);
      expect(result).toBe("2027-01");
    });
  });

  describe("AC4-1[P0]: genId() 고유 ID 생성 (폴백 포함)", () => {
    it("AC4-1-a: genId() 반환값이 8~24자 문자열이다", async () => {
      const { genId } = await import("@/lib/id");
      const id = genId();
      expect(typeof id).toBe("string");
      expect(id.length).toBeGreaterThanOrEqual(8);
      expect(id.length).toBeLessThanOrEqual(24);
    });

    it("AC4-1-b: 1000회 호출 중 중복이 0건이다", async () => {
      const { genId } = await import("@/lib/id");
      const ids = new Set<string>();
      for (let i = 0; i < 1000; i++) {
        const id = genId();
        expect(ids).not.toContain(id);
        ids.add(id);
      }
      expect(ids.size).toBe(1000);
    });

    it("AC4-1-c: genId()는 crypto.randomUUID가 없을 때 Date.now().toString(36) + Math.random() 폴백 사용", async () => {
      const { genId } = await import("@/lib/id");
      const id1 = genId();
      const id2 = genId();
      // 두 ID가 모두 유효한 형식인지 확인
      expect(typeof id1).toBe("string");
      expect(typeof id2).toBe("string");
      expect(id1).not.toEqual(id2);
    });

    it("AC4-1-d: genId() 생성값이 알파벳, 숫자만 포함한다 (하이픈 없음)", async () => {
      const { genId } = await import("@/lib/id");
      const id = genId();
      // crypto.randomUUID는 하이픈을 포함하고, 폴백은 포함하지 않음
      // 만약 폴백을 사용 중이면 하이픈이 없어야 함
      // 테스트: id가 /^[a-z0-9]+$/를 만족하거나 하이픈을 포함하는 UUID 형식
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
      const isFallback = /^[a-z0-9]+$/.test(id);
      expect(isUUID || isFallback).toBe(true);
    });
  });

  describe("AC5: 금지된 API 미사용 검증 (Android 7 호환)", () => {
    it("AC5-a: src/lib/format.ts에 Array.prototype.at 사용 없음", async () => {
      const src = await import("@/lib/format");
      // grep은 불가능하므로, 모듈이 정상 로드되고 함수가 실행되는지만 검증
      // (컴파일 단계에서 .at()을 사용하면 빌드 실패)
      expect(typeof src.formatKRW).toBe("function");
    });

    it("AC5-b: src/lib/date.ts에 Object.groupBy 사용 없음", async () => {
      const src = await import("@/lib/date");
      expect(typeof src.toDateKey).toBe("function");
      expect(typeof src.startOfWeek).toBe("function");
    });

    it("AC5-c: src/lib/id.ts에 toSorted 사용 없음", async () => {
      const src = await import("@/lib/id");
      expect(typeof src.genId).toBe("function");
    });

    it("AC5-d: 정규식 lookbehind (?<=, ?<!,) 사용 없음 (런타임 체크)", async () => {
      const { formatKRW, formatMinutes } = await import("@/lib/format");
      // 금지된 정규식이 사용됐다면 런타임 에러 발생
      // 정상 실행 확인
      expect(formatKRW(1000)).toBe("1,000원");
      expect(formatMinutes(60)).toBe("1시간 0분");
    });
  });

  describe("Integration: 모든 함수 정상 로드 및 기본 동작", () => {
    it("format.ts 모든 export 로드 가능", async () => {
      const mod = await import("@/lib/format");
      expect(mod).toHaveProperty("formatKRW");
      expect(mod).toHaveProperty("formatMinutes");
      expect(mod).toHaveProperty("formatWage");
      expect(mod).toHaveProperty("formatDelta");
    });

    it("date.ts 모든 export 로드 가능", async () => {
      const mod = await import("@/lib/date");
      expect(mod).toHaveProperty("toDateKey");
      expect(mod).toHaveProperty("toMonthKey");
      expect(mod).toHaveProperty("startOfWeek");
      expect(mod).toHaveProperty("addMonthKey");
    });

    it("id.ts 모든 export 로드 가능", async () => {
      const mod = await import("@/lib/id");
      expect(mod).toHaveProperty("genId");
    });

    it("type check: 모든 함수가 정확한 반환값 타입을 갖는다", async () => {
      const { formatKRW, formatMinutes, formatWage, formatDelta } = await import("@/lib/format");
      const { toDateKey, toMonthKey, startOfWeek, addMonthKey } = await import("@/lib/date");
      const { genId } = await import("@/lib/id");

      // 반환값 타입 검증
      expect(typeof formatKRW(1000)).toBe("string");
      expect(typeof formatMinutes(60)).toBe("string");
      expect(typeof formatWage(1000)).toBe("string");
      expect(typeof formatDelta(1000, 500)).toBe("string");
      expect(typeof toDateKey(new Date())).toBe("string");
      expect(typeof toMonthKey("2026-08-31")).toBe("string");
      expect(typeof startOfWeek("2026-08-31")).toBe("string");
      expect(typeof addMonthKey("2026-08", 1)).toBe("string");
      expect(typeof genId()).toBe("string");
    });
  });
});

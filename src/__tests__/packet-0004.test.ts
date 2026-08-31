import { describe, it, expect } from "vitest";

describe("src/lib/validate.ts — 검증 모듈 (고정 에러 문구)", () => {
  describe("AC-1[P0]: validateEntry 기본 검증 (금액·경비·날짜)", () => {
    it("AC-1-a: validateEntry({amount:0}) → {ok:false,error:'금액을 입력해주세요'}", async () => {
      const { validateEntry } = await import("@/lib/validate");
      const result = validateEntry({
        amount: 0,
        expense: 0,
        minutes: 60,
        date: "2026-08-31",
        platformId: "p1",
      });
      expect(result).toEqual({ ok: false, error: "금액을 입력해주세요" });
      expect(result.ok).toBe(false);
      expect(result.error).toBe("금액을 입력해주세요");
    });

    it("AC-1-b: validateEntry({amount:128000, expense:200000}) → {ok:false,error:'경비는 수입보다 클 수 없어요'}", async () => {
      const { validateEntry } = await import("@/lib/validate");
      const result = validateEntry({
        amount: 128000,
        expense: 200000,
        minutes: 60,
        date: "2026-08-31",
        platformId: "p1",
      });
      expect(result).toEqual({
        ok: false,
        error: "경비는 수입보다 클 수 없어요",
      });
      expect(result.ok).toBe(false);
      expect(result.error).toBe("경비는 수입보다 클 수 없어요");
    });

    it("AC-1-c: validateEntry({date:'2099-01-01'}) → {ok:false,error:'미래 날짜는 기록할 수 없어요'}", async () => {
      const { validateEntry } = await import("@/lib/validate");
      const result = validateEntry({
        amount: 50000,
        expense: 0,
        minutes: 60,
        date: "2099-01-01",
        platformId: "p1",
      });
      expect(result).toEqual({
        ok: false,
        error: "미래 날짜는 기록할 수 없어요",
      });
      expect(result.ok).toBe(false);
      expect(result.error).toBe("미래 날짜는 기록할 수 없어요");
    });

    it("AC-1-d: validateEntry 유효한 입력 → {ok:true}", async () => {
      const { validateEntry } = await import("@/lib/validate");
      const result = validateEntry({
        amount: 50000,
        expense: 5000,
        minutes: 60,
        date: "2026-08-31",
        platformId: "p1",
      });
      expect(result).toEqual({ ok: true });
      expect(result.ok).toBe(true);
    });
  });

  describe("AC-2[P0]: validateEntry 상한값 검증 (금액·시간·플랫폼ID)", () => {
    it("AC-2-a: validateEntry({amount:10000001}) → {ok:false,error:'금액은 1,000만원까지 입력할 수 있어요'}", async () => {
      const { validateEntry } = await import("@/lib/validate");
      const result = validateEntry({
        amount: 10000001,
        expense: 0,
        minutes: 60,
        date: "2026-08-31",
        platformId: "p1",
      });
      expect(result).toEqual({
        ok: false,
        error: "금액은 1,000만원까지 입력할 수 있어요",
      });
      expect(result.error).toBe("금액은 1,000만원까지 입력할 수 있어요");
    });

    it("AC-2-b: validateEntry({amount:10000000}) 최대값 허용 → {ok:true}", async () => {
      const { validateEntry } = await import("@/lib/validate");
      const result = validateEntry({
        amount: 10000000,
        expense: 0,
        minutes: 60,
        date: "2026-08-31",
        platformId: "p1",
      });
      expect(result).toEqual({ ok: true });
      expect(result.ok).toBe(true);
    });

    it("AC-2-c: validateEntry({minutes:1441}) → {ok:false,error:'근무 시간은 24시간을 넘을 수 없어요'}", async () => {
      const { validateEntry } = await import("@/lib/validate");
      const result = validateEntry({
        amount: 50000,
        expense: 0,
        minutes: 1441,
        date: "2026-08-31",
        platformId: "p1",
      });
      expect(result).toEqual({
        ok: false,
        error: "근무 시간은 24시간을 넘을 수 없어요",
      });
      expect(result.error).toBe("근무 시간은 24시간을 넘을 수 없어요");
    });

    it("AC-2-d: validateEntry({minutes:1440}) 최대값 허용 → {ok:true}", async () => {
      const { validateEntry } = await import("@/lib/validate");
      const result = validateEntry({
        amount: 50000,
        expense: 0,
        minutes: 1440,
        date: "2026-08-31",
        platformId: "p1",
      });
      expect(result).toEqual({ ok: true });
      expect(result.ok).toBe(true);
    });

    it("AC-2-e: validateEntry({platformId:''}) → {ok:false,error:'플랫폼을 선택해주세요'}", async () => {
      const { validateEntry } = await import("@/lib/validate");
      const result = validateEntry({
        amount: 50000,
        expense: 0,
        minutes: 60,
        date: "2026-08-31",
        platformId: "",
      });
      expect(result).toEqual({
        ok: false,
        error: "플랫폼을 선택해주세요",
      });
      expect(result.error).toBe("플랫폼을 선택해주세요");
    });

    it("AC-2-f: validateEntry({platformId:' '}) 공백만 입력 → {ok:false,error:'플랫폼을 선택해주세요'}", async () => {
      const { validateEntry } = await import("@/lib/validate");
      const result = validateEntry({
        amount: 50000,
        expense: 0,
        minutes: 60,
        date: "2026-08-31",
        platformId: "   ",
      });
      expect(result).toEqual({
        ok: false,
        error: "플랫폼을 선택해주세요",
      });
      expect(result.error).toBe("플랫폼을 선택해주세요");
    });
  });

  describe("AC-3[P0]: validateEntry 보관·삭제된 플랫폼ID 참조 허용", () => {
    it("AC-3-a: validateEntry는 platformId의 존재 여부를 검사하지 않는다 (deleted-x 참조) → {ok:true}", async () => {
      const { validateEntry } = await import("@/lib/validate");
      const result = validateEntry({
        amount: 50000,
        expense: 0,
        minutes: 60,
        date: "2026-08-31",
        platformId: "deleted-x",
      });
      expect(result).toEqual({ ok: true });
      expect(result.ok).toBe(true);
    });

    it("AC-3-b: validateEntry는 archived 상태를 검사하지 않는다 (보관된 p2 참조 후 수정) → {ok:true}", async () => {
      const { validateEntry } = await import("@/lib/validate");
      const result = validateEntry({
        amount: 128000,
        expense: 18000,
        minutes: 330,
        date: "2026-08-31",
        platformId: "p2",
      });
      expect(result).toEqual({ ok: true });
      expect(result.ok).toBe(true);
    });

    it("AC-3-c: validateEntry 보관된 플랫폼 경비까지 유효한 경우 → {ok:true}", async () => {
      const { validateEntry } = await import("@/lib/validate");
      const result = validateEntry({
        amount: 100000,
        expense: 50000,
        minutes: 240,
        date: "2026-08-15",
        platformId: "archived-platform-id",
      });
      expect(result).toEqual({ ok: true });
      expect(result.ok).toBe(true);
      expect(result.error).toBeUndefined();
    });
  });

  describe("AC-4[P0]: validatePlatformName 플랫폼명 검증", () => {
    it("AC-4-a: validatePlatformName('', []) → {ok:false,error:'플랫폼 이름을 입력해주세요'}", async () => {
      const { validatePlatformName } = await import("@/lib/validate");
      const result = validatePlatformName("", []);
      expect(result).toEqual({
        ok: false,
        error: "플랫폼 이름을 입력해주세요",
      });
      expect(result.ok).toBe(false);
      expect(result.error).toBe("플랫폼 이름을 입력해주세요");
    });

    it("AC-4-b: validatePlatformName('   ', []) 공백만 입력 → {ok:false,error:'플랫폼 이름을 입력해주세요'}", async () => {
      const { validatePlatformName } = await import("@/lib/validate");
      const result = validatePlatformName("   ", []);
      expect(result).toEqual({
        ok: false,
        error: "플랫폼 이름을 입력해주세요",
      });
      expect(result.error).toBe("플랫폼 이름을 입력해주세요");
    });

    it("AC-4-c: validatePlatformName(' 배달 ', [{name:'배달'}]) 대소문자 무시 중복 검사 → {ok:false,error:'이미 등록된 플랫폼이에요'}", async () => {
      const { validatePlatformName } = await import("@/lib/validate");
      const existingPlatforms = [{ id: "p1", name: "배달", archived: false }];
      const result = validatePlatformName(" 배달 ", existingPlatforms);
      expect(result).toEqual({
        ok: false,
        error: "이미 등록된 플랫폼이에요",
      });
      expect(result.ok).toBe(false);
    });

    it("AC-4-d: validatePlatformName('DELIVERY', [{name:'delivery',archived:true}]) archived와 무관 중복 검사 → {ok:false,error:'이미 등록된 플랫폼이에요'}", async () => {
      const { validatePlatformName } = await import("@/lib/validate");
      const existingPlatforms = [
        { id: "p1", name: "delivery", archived: true },
      ];
      const result = validatePlatformName("DELIVERY", existingPlatforms);
      expect(result).toEqual({
        ok: false,
        error: "이미 등록된 플랫폼이에요",
      });
      expect(result.error).toBe("이미 등록된 플랫폼이에요");
    });

    it("AC-4-e: validatePlatformName('1234567890123') 13자 이상 → {ok:false,error:'12자까지 입력할 수 있어요'}", async () => {
      const { validatePlatformName } = await import("@/lib/validate");
      const result = validatePlatformName("1234567890123", []);
      expect(result).toEqual({
        ok: false,
        error: "12자까지 입력할 수 있어요",
      });
      expect(result.error).toBe("12자까지 입력할 수 있어요");
    });

    it("AC-4-f: validatePlatformName('123456789012') 12자 정확히 허용 → {ok:true}", async () => {
      const { validatePlatformName } = await import("@/lib/validate");
      const result = validatePlatformName("123456789012", []);
      expect(result).toEqual({ ok: true });
      expect(result.ok).toBe(true);
    });

    it("AC-4-g: validatePlatformName(' 새 플랫폼 ') trim 후 중복 없음 → {ok:true}", async () => {
      const { validatePlatformName } = await import("@/lib/validate");
      const existingPlatforms = [{ id: "p1", name: "배달", archived: false }];
      const result = validatePlatformName(" 새 플랫폼 ", existingPlatforms);
      expect(result).toEqual({ ok: true });
      expect(result.ok).toBe(true);
    });

    it("AC-4-h: validatePlatformName는 trim 후 길이 검사 → ' 12charslong ' (13자) → {ok:false,error:'12자까지 입력할 수 있어요'}", async () => {
      const { validatePlatformName } = await import("@/lib/validate");
      const result = validatePlatformName(" 12charslong ", []);
      expect(result).toEqual({
        ok: false,
        error: "12자까지 입력할 수 있어요",
      });
      expect(result.error).toBe("12자까지 입력할 수 있어요");
    });
  });

  describe("AC-5[P0]: validateGoal 목표 금액 검증", () => {
    it("AC-5-a: validateGoal(5000) → {ok:false,error:'목표는 10,000원 이상으로 설정해주세요'}", async () => {
      const { validateGoal } = await import("@/lib/validate");
      const result = validateGoal(5000);
      expect(result).toEqual({
        ok: false,
        error: "목표는 10,000원 이상으로 설정해주세요",
      });
      expect(result.ok).toBe(false);
      expect(result.error).toBe("목표는 10,000원 이상으로 설정해주세요");
    });

    it("AC-5-b: validateGoal(10000) 최소값 허용 → {ok:true}", async () => {
      const { validateGoal } = await import("@/lib/validate");
      const result = validateGoal(10000);
      expect(result).toEqual({ ok: true });
      expect(result.ok).toBe(true);
    });

    it("AC-5-c: validateGoal(100000000) → {ok:false,error:'목표는 5,000만원까지 설정할 수 있어요'}", async () => {
      const { validateGoal } = await import("@/lib/validate");
      const result = validateGoal(100000000);
      expect(result).toEqual({
        ok: false,
        error: "목표는 5,000만원까지 설정할 수 있어요",
      });
      expect(result.ok).toBe(false);
      expect(result.error).toBe("목표는 5,000만원까지 설정할 수 있어요");
    });

    it("AC-5-d: validateGoal(50000000) 최대값 허용 → {ok:true}", async () => {
      const { validateGoal } = await import("@/lib/validate");
      const result = validateGoal(50000000);
      expect(result).toEqual({ ok: true });
      expect(result.ok).toBe(true);
    });

    it("AC-5-e: validateGoal(0) 미설정 허용 → {ok:true}", async () => {
      const { validateGoal } = await import("@/lib/validate");
      const result = validateGoal(0);
      expect(result).toEqual({ ok: true });
      expect(result.ok).toBe(true);
    });

    it("AC-5-f: validateGoal(3000000) 유효한 범위 중간값 → {ok:true}", async () => {
      const { validateGoal } = await import("@/lib/validate");
      const result = validateGoal(3000000);
      expect(result).toEqual({ ok: true });
      expect(result.ok).toBe(true);
    });

    it("AC-5-g: validateGoal(9999) 최소값 미만 → {ok:false,error:'목표는 10,000원 이상으로 설정해주세요'}", async () => {
      const { validateGoal } = await import("@/lib/validate");
      const result = validateGoal(9999);
      expect(result).toEqual({
        ok: false,
        error: "목표는 10,000원 이상으로 설정해주세요",
      });
      expect(result.error).toBe("목표는 10,000원 이상으로 설정해주세요");
    });

    it("AC-5-h: validateGoal(50000001) 최대값 초과 → {ok:false,error:'목표는 5,000만원까지 설정할 수 있어요'}", async () => {
      const { validateGoal } = await import("@/lib/validate");
      const result = validateGoal(50000001);
      expect(result).toEqual({
        ok: false,
        error: "목표는 5,000만원까지 설정할 수 있어요",
      });
      expect(result.error).toBe("목표는 5,000만원까지 설정할 수 있어요");
    });
  });

  describe("Integration: 모든 함수 정상 로드 및 반환 타입 검증", () => {
    it("validate.ts 모든 export 로드 가능", async () => {
      const mod = await import("@/lib/validate");
      expect(mod).toHaveProperty("validateEntry");
      expect(mod).toHaveProperty("validatePlatformName");
      expect(mod).toHaveProperty("validateGoal");
    });

    it("validateEntry 반환값이 { ok: boolean } 또는 { ok: false, error: string } 타입", async () => {
      const { validateEntry } = await import("@/lib/validate");
      const successResult = validateEntry({
        amount: 50000,
        expense: 0,
        minutes: 60,
        date: "2026-08-31",
        platformId: "p1",
      });
      const failResult = validateEntry({
        amount: 0,
        expense: 0,
        minutes: 60,
        date: "2026-08-31",
        platformId: "p1",
      });
      expect(successResult).toHaveProperty("ok");
      expect(failResult).toHaveProperty("ok");
      expect(typeof failResult.ok).toBe("boolean");
      if (!failResult.ok) {
        expect(typeof failResult.error).toBe("string");
      }
    });

    it("validatePlatformName 반환값이 { ok: boolean } 또는 { ok: false, error: string } 타입", async () => {
      const { validatePlatformName } = await import("@/lib/validate");
      const successResult = validatePlatformName("새 플랫폼", []);
      const failResult = validatePlatformName("", []);
      expect(successResult).toHaveProperty("ok");
      expect(failResult).toHaveProperty("ok");
      if (!failResult.ok) {
        expect(typeof failResult.error).toBe("string");
      }
    });

    it("validateGoal 반환값이 { ok: boolean } 또는 { ok: false, error: string } 타입", async () => {
      const { validateGoal } = await import("@/lib/validate");
      const successResult = validateGoal(3000000);
      const failResult = validateGoal(5000);
      expect(successResult).toHaveProperty("ok");
      expect(failResult).toHaveProperty("ok");
      if (!failResult.ok) {
        expect(typeof failResult.error).toBe("string");
      }
    });

    it("type check: 모든 함수가 정확한 반환값 타입을 갖는다", async () => {
      const { validateEntry, validatePlatformName, validateGoal } =
        await import("@/lib/validate");

      const entryResult = validateEntry({
        amount: 50000,
        expense: 0,
        minutes: 60,
        date: "2026-08-31",
        platformId: "p1",
      });
      const platformResult = validatePlatformName("테스트", []);
      const goalResult = validateGoal(3000000);

      expect(typeof entryResult === "object" && entryResult !== null).toBe(
        true
      );
      expect(typeof platformResult === "object" && platformResult !== null).toBe(
        true
      );
      expect(typeof goalResult === "object" && goalResult !== null).toBe(true);
    });
  });

  describe("Error message consistency: 모든 에러 메시지가 고정값과 일치", () => {
    it("에러 메시지: '금액을 입력해주세요' 정확 일치", async () => {
      const { validateEntry } = await import("@/lib/validate");
      const result = validateEntry({
        amount: 0,
        expense: 0,
        minutes: 60,
        date: "2026-08-31",
        platformId: "p1",
      });
      expect(result.error).toBe("금액을 입력해주세요");
      expect(result.error).not.toBe("금액을 입력해 주세요");
      expect(result.error).not.toBe("금액을 입력해주세요.");
    });

    it("에러 메시지: '경비는 수입보다 클 수 없어요' 정확 일치", async () => {
      const { validateEntry } = await import("@/lib/validate");
      const result = validateEntry({
        amount: 100000,
        expense: 200000,
        minutes: 60,
        date: "2026-08-31",
        platformId: "p1",
      });
      expect(result.error).toBe("경비는 수입보다 클 수 없어요");
    });

    it("에러 메시지: '플랫폼을 선택해주세요' 정확 일치", async () => {
      const { validateEntry } = await import("@/lib/validate");
      const result = validateEntry({
        amount: 50000,
        expense: 0,
        minutes: 60,
        date: "2026-08-31",
        platformId: "",
      });
      expect(result.error).toBe("플랫폼을 선택해주세요");
    });

    it("에러 메시지: '12자까지 입력할 수 있어요' 정확 일치", async () => {
      const { validatePlatformName } = await import("@/lib/validate");
      const result = validatePlatformName(
        "this is a very long string over 12 chars",
        []
      );
      expect(result.error).toBe("12자까지 입력할 수 있어요");
    });

    it("에러 메시지: '목표는 10,000원 이상으로 설정해주세요' 정확 일치", async () => {
      const { validateGoal } = await import("@/lib/validate");
      const result = validateGoal(5000);
      expect(result.error).toBe("목표는 10,000원 이상으로 설정해주세요");
    });
  });
});

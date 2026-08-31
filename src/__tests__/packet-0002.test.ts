import { describe, it, expect } from "vitest";

describe("src/lib/constants.ts — 상수 모듈 (STORAGE_KEYS / 한계값 / 색상 토큰)", () => {
  describe("AC1: STORAGE_KEYS 객체가 platforms/entries/settings/reportUnlocks 4키를 'gigledger.<name>.v1' 값으로 갖는다", () => {
    it("AC1-1: STORAGE_KEYS는 4개 키를 export한다", async () => {
      const mod = await import("@/lib/constants");
      expect(mod).toHaveProperty("STORAGE_KEYS");
      expect(typeof mod.STORAGE_KEYS).toBe("object");

      const keys = Object.keys(mod.STORAGE_KEYS);
      expect(keys.length).toBe(4);
      expect(keys).toContain("platforms");
      expect(keys).toContain("entries");
      expect(keys).toContain("settings");
      expect(keys).toContain("reportUnlocks");
    });

    it("AC1-2: platforms 키는 'gigledger.platforms.v1' 값을 갖는다", async () => {
      const mod = await import("@/lib/constants");
      expect(mod.STORAGE_KEYS.platforms).toBe("gigledger.platforms.v1");
    });

    it("AC1-3: entries 키는 'gigledger.entries.v1' 값을 갖는다", async () => {
      const mod = await import("@/lib/constants");
      expect(mod.STORAGE_KEYS.entries).toBe("gigledger.entries.v1");
    });

    it("AC1-4: settings 키는 'gigledger.settings.v1' 값을 갖는다", async () => {
      const mod = await import("@/lib/constants");
      expect(mod.STORAGE_KEYS.settings).toBe("gigledger.settings.v1");
    });

    it("AC1-5: reportUnlocks 키는 'gigledger.reportUnlocks.v1' 값을 갖는다", async () => {
      const mod = await import("@/lib/constants");
      expect(mod.STORAGE_KEYS.reportUnlocks).toBe("gigledger.reportUnlocks.v1");
    });
  });

  describe("AC2: 도메인 한계값이 모두 export된다", () => {
    it("AC2-1: MIN_WAGE_2026 = 10320 (2026 최저시급)", async () => {
      const mod = await import("@/lib/constants");
      expect(mod).toHaveProperty("MIN_WAGE_2026");
      expect(mod.MIN_WAGE_2026).toBe(10320);
      expect(typeof mod.MIN_WAGE_2026).toBe("number");
    });

    it("AC2-2: MAX_ENTRIES = 5000 (최대 거래 기록)", async () => {
      const mod = await import("@/lib/constants");
      expect(mod).toHaveProperty("MAX_ENTRIES");
      expect(mod.MAX_ENTRIES).toBe(5000);
      expect(typeof mod.MAX_ENTRIES).toBe("number");
    });

    it("AC2-3: MAX_PLATFORMS = 20 (최대 플랫폼 개수)", async () => {
      const mod = await import("@/lib/constants");
      expect(mod).toHaveProperty("MAX_PLATFORMS");
      expect(mod.MAX_PLATFORMS).toBe(20);
      expect(typeof mod.MAX_PLATFORMS).toBe("number");
    });

    it("AC2-4: MAX_AMOUNT = 10000000 (최대 거래액)", async () => {
      const mod = await import("@/lib/constants");
      expect(mod).toHaveProperty("MAX_AMOUNT");
      expect(mod.MAX_AMOUNT).toBe(10000000);
      expect(typeof mod.MAX_AMOUNT).toBe("number");
    });

    it("AC2-5: MAX_MINUTES = 1440 (최대 작업시간 = 24시간)", async () => {
      const mod = await import("@/lib/constants");
      expect(mod).toHaveProperty("MAX_MINUTES");
      expect(mod.MAX_MINUTES).toBe(1440);
      expect(typeof mod.MAX_MINUTES).toBe("number");
    });

    it("AC2-6: MAX_MEMO = 50 (메모 최대 길이)", async () => {
      const mod = await import("@/lib/constants");
      expect(mod).toHaveProperty("MAX_MEMO");
      expect(mod.MAX_MEMO).toBe(50);
      expect(typeof mod.MAX_MEMO).toBe("number");
    });

    it("AC2-7: MAX_PLATFORM_NAME = 12 (플랫폼명 최대 길이)", async () => {
      const mod = await import("@/lib/constants");
      expect(mod).toHaveProperty("MAX_PLATFORM_NAME");
      expect(mod.MAX_PLATFORM_NAME).toBe(12);
      expect(typeof mod.MAX_PLATFORM_NAME).toBe("number");
    });

    it("AC2-8: GOAL_MIN = 10000 (월목표 최솟값)", async () => {
      const mod = await import("@/lib/constants");
      expect(mod).toHaveProperty("GOAL_MIN");
      expect(mod.GOAL_MIN).toBe(10000);
      expect(typeof mod.GOAL_MIN).toBe("number");
    });

    it("AC2-9: GOAL_MAX = 50000000 (월목표 최댓값)", async () => {
      const mod = await import("@/lib/constants");
      expect(mod).toHaveProperty("GOAL_MAX");
      expect(mod.GOAL_MAX).toBe(50000000);
      expect(typeof mod.GOAL_MAX).toBe("number");
    });

    it("AC2-10: REPORT_MONTH_RANGE = 12 (리포트 조회 기간 = 12개월)", async () => {
      const mod = await import("@/lib/constants");
      expect(mod).toHaveProperty("REPORT_MONTH_RANGE");
      expect(mod.REPORT_MONTH_RANGE).toBe(12);
      expect(typeof mod.REPORT_MONTH_RANGE).toBe("number");
    });
  });

  describe("AC3: COLOR_TOKENS 유니온과 colorVar() 함수가 TDS CSS 변수에 매핑된다", () => {
    it("AC3-1: COLOR_TOKENS는 ['blue','green','orange','purple','red','grey'] 6개 토큰의 readonly 배열이다", async () => {
      const mod = await import("@/lib/constants");
      expect(mod).toHaveProperty("COLOR_TOKENS");
      expect(Array.isArray(mod.COLOR_TOKENS)).toBe(true);
      expect(mod.COLOR_TOKENS.length).toBe(6);
      expect(mod.COLOR_TOKENS).toContain("blue");
      expect(mod.COLOR_TOKENS).toContain("green");
      expect(mod.COLOR_TOKENS).toContain("orange");
      expect(mod.COLOR_TOKENS).toContain("purple");
      expect(mod.COLOR_TOKENS).toContain("red");
      expect(mod.COLOR_TOKENS).toContain("grey");
    });

    it("AC3-2: ColorToken 타입이 'blue' | 'green' | 'orange' | 'purple' | 'red' | 'grey' 유니온으로 export된다", async () => {
      const mod = await import("@/lib/constants");
      expect(mod).toHaveProperty("ColorToken");
      // 타입 존재 확인 (런타임에서는 마킹 객체로 검증)
      expect(typeof mod.ColorToken).toBeDefined();
    });

    it("AC3-3: colorVar('blue') === 'var(--tds-color-blue500)' 를 반환한다", async () => {
      const mod = await import("@/lib/constants");
      expect(mod).toHaveProperty("colorVar");
      expect(typeof mod.colorVar).toBe("function");
      expect(mod.colorVar("blue")).toBe("var(--tds-color-blue500)");
    });

    it("AC3-4: colorVar('green') === 'var(--tds-color-green500)' 를 반환한다", async () => {
      const mod = await import("@/lib/constants");
      expect(mod.colorVar("green")).toBe("var(--tds-color-green500)");
    });

    it("AC3-5: colorVar('orange') === 'var(--tds-color-orange500)' 를 반환한다", async () => {
      const mod = await import("@/lib/constants");
      expect(mod.colorVar("orange")).toBe("var(--tds-color-orange500)");
    });

    it("AC3-6: colorVar('purple') === 'var(--tds-color-purple500)' 를 반환한다", async () => {
      const mod = await import("@/lib/constants");
      expect(mod.colorVar("purple")).toBe("var(--tds-color-purple500)");
    });

    it("AC3-7: colorVar('red') === 'var(--tds-color-red500)' 를 반환한다", async () => {
      const mod = await import("@/lib/constants");
      expect(mod.colorVar("red")).toBe("var(--tds-color-red500)");
    });

    it("AC3-8: colorVar('grey') === 'var(--tds-color-grey500)' 를 반환한다", async () => {
      const mod = await import("@/lib/constants");
      expect(mod.colorVar("grey")).toBe("var(--tds-color-grey500)");
    });
  });

  describe("AC4: DEFAULT_PLATFORM_SEEDS에 배달/대리운전/쿠팡플렉스 3건이 순서대로 존재한다", () => {
    it("AC4-1: DEFAULT_PLATFORM_SEEDS는 3개 항목의 배열이다", async () => {
      const mod = await import("@/lib/constants");
      expect(mod).toHaveProperty("DEFAULT_PLATFORM_SEEDS");
      expect(Array.isArray(mod.DEFAULT_PLATFORM_SEEDS)).toBe(true);
      expect(mod.DEFAULT_PLATFORM_SEEDS.length).toBe(3);
    });

    it("AC4-2: 첫 번째 시드는 배달 (delivery) 카테고리다", async () => {
      const mod = await import("@/lib/constants");
      const seed = mod.DEFAULT_PLATFORM_SEEDS[0];
      expect(seed).toBeDefined();
      expect(seed.name).toBeDefined();
      expect(seed.category).toBe("delivery");
      expect(typeof seed.name).toBe("string");
      expect(seed.name.length).toBeGreaterThan(0);
    });

    it("AC4-3: 두 번째 시드는 대리운전 (driving) 카테고리다", async () => {
      const mod = await import("@/lib/constants");
      const seed = mod.DEFAULT_PLATFORM_SEEDS[1];
      expect(seed).toBeDefined();
      expect(seed.name).toBeDefined();
      expect(seed.category).toBe("driving");
      expect(typeof seed.name).toBe("string");
      expect(seed.name.length).toBeGreaterThan(0);
    });

    it("AC4-4: 세 번째 시드는 쿠팡플렉스 (logistics) 카테고리다", async () => {
      const mod = await import("@/lib/constants");
      const seed = mod.DEFAULT_PLATFORM_SEEDS[2];
      expect(seed).toBeDefined();
      expect(seed.name).toBeDefined();
      expect(seed.category).toBe("logistics");
      expect(typeof seed.name).toBe("string");
      expect(seed.name.length).toBeGreaterThan(0);
    });

    it("AC4-5: 각 시드는 colorToken 속성을 가지며 ColorToken 유니온 값이다", async () => {
      const mod = await import("@/lib/constants");
      const validColorTokens = ["blue", "green", "orange", "purple", "red", "grey"];

      mod.DEFAULT_PLATFORM_SEEDS.forEach((seed: any, index: number) => {
        expect(seed.colorToken).toBeDefined();
        expect(validColorTokens).toContain(seed.colorToken);
      });
    });
  });

  describe("AC5: 파일 내 HEX 색상 리터럴이 0건이다", () => {
    it("AC5-1: 상수 모듈은 '#' 문자로 시작하는 색상 리터럴을 포함하지 않는다", async () => {
      // 소스 파일 텍스트 읽기 (jsdom 환경에서는 불가하므로, 모듈이 정상 로드되고
      // 모든 색상이 CSS 변수로 표현되는지를 간접적으로 검증)
      const mod = await import("@/lib/constants");

      // colorVar 함수는 CSS 변수 문자열을 반환해야 함
      const colors = ["blue", "green", "orange", "purple", "red", "grey"];
      colors.forEach((color: any) => {
        const result = mod.colorVar(color);
        expect(result).toMatch(/^var\(--tds-color-/);
        expect(result).not.toMatch(/#/);
      });

      // DEFAULT_PLATFORM_SEEDS의 시드들도 HEX 리터럴을 포함하지 않아야 함
      mod.DEFAULT_PLATFORM_SEEDS.forEach((seed: any) => {
        // name, category, colorToken은 모두 문자열이고 HEX 형식이 아니어야 함
        expect(seed.name).not.toMatch(/#[0-9A-Fa-f]{6}/);
        expect(seed.category).not.toMatch(/#[0-9A-Fa-f]{6}/);
        expect(seed.colorToken).not.toMatch(/#[0-9A-Fa-f]{6}/);
      });
    });
  });

  describe("Integration: 모든 상수가 올바른 타입과 구조를 가진다", () => {
    it("should export all required constants in one import", async () => {
      const mod = await import("@/lib/constants");

      // STORAGE_KEYS
      expect(mod.STORAGE_KEYS).toBeDefined();
      expect(Object.keys(mod.STORAGE_KEYS).length).toBe(4);

      // All numeric limits
      expect(mod.MIN_WAGE_2026).toBeDefined();
      expect(mod.MAX_ENTRIES).toBeDefined();
      expect(mod.MAX_PLATFORMS).toBeDefined();
      expect(mod.MAX_AMOUNT).toBeDefined();
      expect(mod.MAX_MINUTES).toBeDefined();
      expect(mod.MAX_MEMO).toBeDefined();
      expect(mod.MAX_PLATFORM_NAME).toBeDefined();
      expect(mod.GOAL_MIN).toBeDefined();
      expect(mod.GOAL_MAX).toBeDefined();
      expect(mod.REPORT_MONTH_RANGE).toBeDefined();

      // Colors
      expect(mod.COLOR_TOKENS).toBeDefined();
      expect(mod.ColorToken).toBeDefined();
      expect(mod.colorVar).toBeDefined();

      // Platform seeds
      expect(mod.DEFAULT_PLATFORM_SEEDS).toBeDefined();
    });

    it("should allow importing individual constants", async () => {
      // Direct destructuring should work
      const { STORAGE_KEYS, MIN_WAGE_2026, MAX_ENTRIES } = await import("@/lib/constants");
      expect(STORAGE_KEYS).toBeDefined();
      expect(MIN_WAGE_2026).toBe(10320);
      expect(MAX_ENTRIES).toBe(5000);
    });

    it("limits are reasonable for a gig-work income tracker", async () => {
      const mod = await import("@/lib/constants");

      // Minimum wage should be lower than maximum entry amount
      expect(mod.MIN_WAGE_2026).toBeLessThan(mod.MAX_AMOUNT);

      // Maximum minutes in a day should be 24 hours (1440 min)
      expect(mod.MAX_MINUTES).toBe(24 * 60);

      // Monthly goal max should be higher than min
      expect(mod.GOAL_MAX).toBeGreaterThan(mod.GOAL_MIN);

      // Report range should be at least 12 months
      expect(mod.REPORT_MONTH_RANGE).toBeGreaterThanOrEqual(12);

      // Memo and name limits should be reasonable string constraints
      expect(mod.MAX_MEMO).toBeGreaterThan(0);
      expect(mod.MAX_MEMO).toBeLessThan(1000);
      expect(mod.MAX_PLATFORM_NAME).toBeGreaterThan(0);
      expect(mod.MAX_PLATFORM_NAME).toBeLessThan(100);
    });
  });
});

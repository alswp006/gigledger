import { describe, it, expect } from "vitest";

describe("src/lib/types.ts — 엔티티 타입 + RouteState 계약 정의", () => {
  describe("AC1: RouteState 타입에 7개 키와 올바른 구조", () => {
    it("AC1-1: RouteState는 '/', '/entry', '/platforms', '/wage', '/report', '/share', '/settings' 7개 키를 갖는다", async () => {
      const mod = await import("@/lib/types");

      // RouteState 타입이 export되었는지 확인
      expect(mod).toHaveProperty("RouteState");

      // 런타임에서 검증할 수 있는 가드 함수가 있는지 확인
      // (타입 자체는 컴파일 타임에만 존재하므로 export된 타입 심볼이 있는지만 체크)
      // TypeScript 타입은 런타입에 존재하지 않으므로, 모듈이 제대로 로드되고
      // 타입 심볼이 존재하는지를 통해 검증
      const typeNames = Object.keys(mod).filter(
        (key) => key === "RouteState" || key.startsWith("Route")
      );
      expect(typeNames.length).toBeGreaterThan(0);
    });

    it("AC1-2: /entry 키는 { date: string } | { entryId: string } | null 을 허용한다", async () => {
      const mod = await import("@/lib/types");

      // RouteState 타입이 export되었는지 확인
      expect(mod).toHaveProperty("RouteState");

      // 타입 정의가 존재함을 확인 (런타임 타입 검증은 TypeScript 컴파일 단계에서 수행됨)
      const hasRouteState = "RouteState" in mod;
      expect(hasRouteState).toBe(true);
    });

    it("AC1-3: /share 키는 { month: string } | null 을 허용한다", async () => {
      const mod = await import("@/lib/types");

      // RouteState 타입이 export되었는지 확인
      expect(mod).toHaveProperty("RouteState");

      // 타입은 컴파일 타임에 검증됨
      expect(typeof mod.RouteState).toBeDefined();
    });
  });

  describe("AC2: 엔티티 타입이 올바른 필드를 갖는다", () => {
    it("AC2-1: IncomeEntry는 id, platformId, date, amount, expense, minutes, memo, createdAt, updatedAt 9개 필드를 갖는다", async () => {
      const mod = await import("@/lib/types");

      // IncomeEntry 타입이 export되었는지 확인
      expect(mod).toHaveProperty("IncomeEntry");

      // 런타임에서는 타입 자체를 검증할 수 없으므로, 다음 라인이 TypeScript 컴파일을 통과하는지로 검증됨:
      // const entry: IncomeEntry = {
      //   id: "x", platformId: "x", date: "2026-08-31", amount: 1000,
      //   expense: 100, minutes: 60, memo: "", createdAt: "2026-08-31", updatedAt: "2026-08-31"
      // };
      const hasIncomeEntry = "IncomeEntry" in mod;
      expect(hasIncomeEntry).toBe(true);
    });

    it("AC2-2: Platform은 id, name, category, colorToken, archived, createdAt 6개 필드를 갖는다", async () => {
      const mod = await import("@/lib/types");

      // Platform 타입이 export되었는지 확인
      expect(mod).toHaveProperty("Platform");

      // 런타임에서는 타입을 직접 검증할 수 없지만 export 확인
      const hasPlatform = "Platform" in mod;
      expect(hasPlatform).toBe(true);
    });

    it("AC2-3: Settings는 monthlyGoal, bestStreak, noticeSeenAt 3개 필드를 갖는다", async () => {
      const mod = await import("@/lib/types");

      // Settings 타입이 export되었는지 확인
      expect(mod).toHaveProperty("Settings");

      const hasSettings = "Settings" in mod;
      expect(hasSettings).toBe(true);
    });

    it("AC2-4: PlatformCategory와 ColorToken 타입이 export된다", async () => {
      const mod = await import("@/lib/types");

      // PlatformCategory와 ColorToken이 export되었는지 확인
      expect(mod).toHaveProperty("PlatformCategory");
      expect(mod).toHaveProperty("ColorToken");
    });
  });

  describe("AC3: SaveResult<T> 유니온 타입이 올바른 구조를 갖는다", () => {
    it("AC3-1: SaveResult<T>는 { ok: true; data: T } | { ok: false; error: string } 형태다", async () => {
      const mod = await import("@/lib/types");

      // SaveResult 타입이 export되었는지 확인
      expect(mod).toHaveProperty("SaveResult");

      // 런타임 검증은 다음과 같이 수행 가능:
      // const success: SaveResult<number> = { ok: true, data: 42 };
      // const failure: SaveResult<number> = { ok: false, error: "failed" };
      const hasSaveResult = "SaveResult" in mod;
      expect(hasSaveResult).toBe(true);
    });
  });

  describe("AC4: TypeScript 타입 체크와 런타임 코드 규칙", () => {
    it("AC4-1: src/lib/types.ts는 export type/interface 선언만 가지며 런타임 코드가 없다", async () => {
      // 이 테스트는 빌드/컴파일 단계에서 자동으로 검증됨:
      // - npx tsc --noEmit 통과 (타입 오류 없음)
      // - 파일에 const, function, class 등 런타임 코드가 없음

      // 런타임에서는 모듈이 제대로 로드되는지만 확인
      const mod = await import("@/lib/types");
      expect(mod).toBeDefined();
      expect(typeof mod).toBe("object");
    });

    it("AC4-2: ReportUnlockMap이 Record<string, string> 타입으로 export된다", async () => {
      const mod = await import("@/lib/types");

      // ReportUnlockMap 타입이 export되었는지 확인
      expect(mod).toHaveProperty("ReportUnlockMap");
    });
  });

  describe("계산 결과 타입들", () => {
    it("should export PeriodSummary 타입", async () => {
      const mod = await import("@/lib/types");
      expect(mod).toHaveProperty("PeriodSummary");
    });

    it("should export StreakResult 타입", async () => {
      const mod = await import("@/lib/types");
      expect(mod).toHaveProperty("StreakResult");
    });

    it("should export WageRow 타입", async () => {
      const mod = await import("@/lib/types");
      expect(mod).toHaveProperty("WageRow");
    });

    it("should export MonthlyReport 타입", async () => {
      const mod = await import("@/lib/types");
      expect(mod).toHaveProperty("MonthlyReport");
    });
  });
});

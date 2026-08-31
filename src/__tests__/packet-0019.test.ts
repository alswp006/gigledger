import { describe, it, expect, vi, afterEach } from "vitest";
import "@testing-library/jest-dom/vitest";
import fs from "node:fs";
import path from "node:path";
import React from "react";
import { screen, cleanup } from "@testing-library/react";
import { mockAll } from "@/__tests__/__helpers__/mocks";
import { renderWithRouter } from "@/__tests__/__helpers__/test-utils";

mockAll();

const SRC_DIR = path.resolve(__dirname, "..");
const PAGES_DIR = path.join(SRC_DIR, "pages");

const ALL_ROUTES = ["/", "/entry", "/platforms", "/wage", "/report", "/share", "/settings"];

describe("라우팅 배선 + FloatingTabBar + 전역 Provider", () => {
  afterEach(() => {
    cleanup();
  });

  describe("AC-1[P0]: 7개 Route가 모두 등록되어 렌더되고 콘솔 에러 0건이다", () => {
    it("AC-1[P0]: 7개 경로 모두 크래시 없이 렌더되고 console.error가 호출되지 않는다", async () => {
      const { default: App } = await import("@/App");
      const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      for (const path of ALL_ROUTES) {
        const { unmount } = renderWithRouter(React.createElement(App), {
          initialEntries: [path],
        });
        expect(document.body.textContent).not.toBe("");
        unmount();
      }

      expect(errorSpy).not.toHaveBeenCalled();
      errorSpy.mockRestore();
    });

    it("AC-1: '/' 경로는 홈 화면(GigLedger 타이틀)을 렌더한다", async () => {
      const { default: App } = await import("@/App");
      renderWithRouter(React.createElement(App), { initialEntries: ["/"] });
      expect(screen.getAllByText("GigLedger").length).toBeGreaterThan(0);
    });

    it("AC-1: '/wage'와 '/settings' 경로는 각각 고유 타이틀을 렌더한다", async () => {
      const { default: App } = await import("@/App");

      renderWithRouter(React.createElement(App), { initialEntries: ["/wage"] });
      expect(screen.getByText("실질 시급")).toBeInTheDocument();
      cleanup();

      renderWithRouter(React.createElement(App), { initialEntries: ["/settings"] });
      expect(screen.getByText("설정")).toBeInTheDocument();
    });
  });

  describe("AC-2: 알 수 없는 경로는 홈으로 리다이렉트된다", () => {
    it("AC-2: '/foo' 진입 시 '/'로 리다이렉트되어 홈 화면이 렌더된다", async () => {
      const { default: App } = await import("@/App");
      renderWithRouter(React.createElement(App), { initialEntries: ["/foo"] });
      expect(screen.getAllByText("GigLedger").length).toBeGreaterThan(0);
    });

    it("AC-2: 존재하지 않는 중첩 경로('/foo/bar')도 홈으로 리다이렉트된다", async () => {
      const { default: App } = await import("@/App");
      renderWithRouter(React.createElement(App), { initialEntries: ["/foo/bar"] });
      expect(screen.getAllByText("GigLedger").length).toBeGreaterThan(0);
    });
  });

  describe("AC-3: FloatingTabBar가 홈/시급/리포트/설정 4탭으로 렌더되고 현재 경로만 활성이다", () => {
    it("AC-3[P0]: 4탭이 렌더되고 현재 경로 탭만 aria-selected=true, 나머지는 false다", async () => {
      const { FloatingTabBar } = await import("@/components/FloatingTabBar");
      const items = [
        { label: "홈", path: "/" },
        { label: "시급", path: "/wage" },
        { label: "리포트", path: "/report" },
        { label: "설정", path: "/settings" },
      ];

      renderWithRouter(React.createElement(FloatingTabBar, { items }), {
        initialEntries: ["/wage"],
      });

      const tabs = screen.getAllByRole("tab");
      expect(tabs).toHaveLength(4);

      expect(screen.getByRole("tab", { name: "시급" })).toHaveAttribute("aria-selected", "true");
      expect(screen.getByRole("tab", { name: "홈" })).toHaveAttribute("aria-selected", "false");
      expect(screen.getByRole("tab", { name: "리포트" })).toHaveAttribute("aria-selected", "false");
      expect(screen.getByRole("tab", { name: "설정" })).toHaveAttribute("aria-selected", "false");
    });

    it("AC-3: 각 탭의 터치 타깃 min-height가 44px 이상이다", async () => {
      const { FloatingTabBar } = await import("@/components/FloatingTabBar");
      const items = [
        { label: "홈", path: "/" },
        { label: "시급", path: "/wage" },
        { label: "리포트", path: "/report" },
        { label: "설정", path: "/settings" },
      ];

      renderWithRouter(React.createElement(FloatingTabBar, { items }), {
        initialEntries: ["/"],
      });

      const tabs = screen.getAllByRole("tab");
      for (const tab of tabs) {
        const minHeight = parseInt((tab as HTMLElement).style.minHeight || "0", 10);
        expect(minHeight).toBeGreaterThanOrEqual(44);
      }
    });
  });

  describe("AC-4[P0]: /share, /report는 location.state 없이 직접 진입해도 현재 월로 폴백해 정상 렌더된다", () => {
    it("AC-4[P0]: '/share'에 state 없이 진입해도 크래시하지 않고 화면이 렌더된다", async () => {
      const { default: App } = await import("@/App");
      const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      expect(() =>
        renderWithRouter(React.createElement(App), { initialEntries: ["/share"] }),
      ).not.toThrow();
      expect(document.body.textContent).not.toBe("");
      expect(errorSpy).not.toHaveBeenCalled();
      errorSpy.mockRestore();
    });

    it("AC-4[P0]: '/report'에 state 없이 진입해도 크래시하지 않고 화면이 렌더된다", async () => {
      const { default: App } = await import("@/App");
      const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      expect(() =>
        renderWithRouter(React.createElement(App), { initialEntries: ["/report"] }),
      ).not.toThrow();
      expect(document.body.textContent).not.toBe("");
      expect(errorSpy).not.toHaveBeenCalled();
      errorSpy.mockRestore();
    });
  });

  describe("AC-5: main.tsx는 수정되지 않고, App.tsx는 자체 Router를 중복 설정하지 않는다", () => {
    it("AC-5: main.tsx가 @AI:ANCHOR와 TDSMobileAITProvider + BrowserRouter 계약을 그대로 유지한다", () => {
      const mainSource = fs.readFileSync(path.join(SRC_DIR, "main.tsx"), "utf-8");
      expect(mainSource).toContain("@AI:ANCHOR");
      expect(mainSource).toContain("TDSMobileAITProvider");
      expect(mainSource).toContain("BrowserRouter");
    });

    it("AC-5: App.tsx는 BrowserRouter를 다시 열지 않는다(중복 라우터 방지)", () => {
      const appSource = fs.readFileSync(path.join(SRC_DIR, "App.tsx"), "utf-8");
      expect(appSource).not.toMatch(/<BrowserRouter/);
    });
  });

  describe("통합: navigate() 호출 대상이 App.tsx의 7개 Route와 모두 일치한다", () => {
    it("통합: src/pages/*.tsx의 모든 navigate('/path') 호출 대상이 정의된 Route 안에 있다", () => {
      const files = fs
        .readdirSync(PAGES_DIR)
        .filter((f) => f.endsWith(".tsx") && !f.startsWith("__"));

      const navigateTargets = new Set<string>();
      for (const file of files) {
        const source = fs.readFileSync(path.join(PAGES_DIR, file), "utf-8");
        for (const m of source.matchAll(/navigate\(\s*["'`](\/[a-z]*)["'`]/g)) {
          navigateTargets.add(m[1]);
        }
      }

      expect(navigateTargets.size).toBeGreaterThan(0);
      for (const target of navigateTargets) {
        expect(ALL_ROUTES).toContain(target);
      }
    });
  });
});

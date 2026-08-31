import { describe, it, expect } from "vitest";
import "@testing-library/jest-dom/vitest";
import fs from "node:fs";
import path from "node:path";
import React from "react";
import { render, screen } from "@testing-library/react";
import { mockTds } from "@/__tests__/__helpers__/mocks";

mockTds();

const COMPONENTS_DIR = path.resolve(__dirname, "../components");

describe("시각화 공용 컴포넌트 (SummaryHero / Sparkline / MiniBar / ColorDot)", () => {
  describe("AC-1: SummaryHero가 label/value/caption을 렌더하고 testid를 갖는다", () => {
    it("AC-1[P0]: label/value/caption 텍스트를 렌더하고 data-testid='summary-hero'를 갖는다", async () => {
      const { SummaryHero } = await import("@/components/SummaryHero");
      render(
        React.createElement(SummaryHero, {
          label: "이번 달 순수익",
          value: "1,280,000원",
          caption: "12건 기록",
        }),
      );

      const hero = screen.getByTestId("summary-hero");
      expect(hero).toBeInTheDocument();
      expect(screen.getByText("이번 달 순수익")).toBeInTheDocument();
      expect(screen.getByText("12건 기록")).toBeInTheDocument();
    });

    it("AC-1[P0]: caption 없이도 크래시 없이 렌더된다", async () => {
      const { SummaryHero } = await import("@/components/SummaryHero");
      render(React.createElement(SummaryHero, { label: "총 소득", value: "500,000원" }));

      expect(screen.getByTestId("summary-hero")).toBeInTheDocument();
      expect(screen.getByText("총 소득")).toBeInTheDocument();
    });
  });

  describe("AC-2: Sparkline이 points로 polyline을 그리고 빈 배열이면 안내 텍스트를 렌더한다", () => {
    it("AC-2: points가 있으면 SVG를 렌더하고 크래시하지 않는다", async () => {
      const { Sparkline } = await import("@/components/Sparkline");
      const { container } = render(
        React.createElement(Sparkline, { points: [1, 5, 3, 8, 2, 6, 4] }),
      );

      const svg = container.querySelector("svg");
      expect(svg).toBeInTheDocument();
      expect(container.querySelector("polyline")).toBeInTheDocument();
    });

    it("AC-2: points가 빈 배열이면 '데이터가 없어요'를 렌더하고 크래시하지 않는다", async () => {
      const { Sparkline } = await import("@/components/Sparkline");
      const { container } = render(React.createElement(Sparkline, { points: [] }));

      expect(screen.getByText("데이터가 없어요")).toBeInTheDocument();
      expect(container.querySelector("polyline")).not.toBeInTheDocument();
    });
  });

  describe("AC-3: MiniBar가 items를 percent 너비 막대로 렌더하고 testid를 갖는다", () => {
    it("AC-3[P0]: 각 항목이 percent%만큼의 너비 스타일로 렌더된다", async () => {
      const { MiniBar } = await import("@/components/MiniBar");
      const { container } = render(
        React.createElement(MiniBar, {
          items: [
            { label: "배달", percent: 60, colorToken: "blue" },
            { label: "대리운전", percent: 40, colorToken: "green" },
          ],
        }),
      );

      expect(screen.getByTestId("platform-minibar")).toBeInTheDocument();
      expect(screen.getByText("배달")).toBeInTheDocument();
      expect(screen.getByText("대리운전")).toBeInTheDocument();

      const bars = Array.from(container.querySelectorAll<HTMLElement>("[style*='width']"));
      const widths = bars.map((el) => el.style.width);
      expect(widths).toContain("60%");
      expect(widths).toContain("40%");
    });

    it("AC-3: items가 빈 배열이어도 크래시 없이 렌더된다", async () => {
      const { MiniBar } = await import("@/components/MiniBar");
      render(React.createElement(MiniBar, { items: [] }));

      expect(screen.getByTestId("platform-minibar")).toBeInTheDocument();
    });
  });

  describe("AC-4: ColorDot이 colorToken을 colorVar 배경색으로 적용한다", () => {
    it("AC-4[P0]: 6종 colorToken 모두 colorVar(token) 배경색으로 렌더된다", async () => {
      const { ColorDot } = await import("@/components/ColorDot");
      const { colorVar } = await import("@/lib/constants");
      const tokens = ["blue", "green", "orange", "purple", "red", "grey"] as const;

      for (const token of tokens) {
        const { container, unmount } = render(React.createElement(ColorDot, { colorToken: token }));
        const dot = container.querySelector<HTMLElement>("[data-testid='color-dot']");
        expect(dot).toBeInTheDocument();
        expect(dot!.style.backgroundColor).toBe(colorVar(token));
        unmount();
      }
    });
  });

  describe("AC-5: 신규 컴포넌트 파일에 HEX 리터럴/Tailwind 여백 클래스가 없다", () => {
    it("AC-5: SummaryHero/Sparkline/MiniBar/ColorDot 소스에 '#RRGGBB' 리터럴이 0건이다", () => {
      const files = ["SummaryHero.tsx", "Sparkline.tsx", "MiniBar.tsx", "ColorDot.tsx"];
      for (const file of files) {
        const filePath = path.join(COMPONENTS_DIR, file);
        const source = fs.readFileSync(filePath, "utf-8");
        expect(source).not.toMatch(/#[0-9A-Fa-f]{6}\b/);
        expect(source).not.toMatch(/#[0-9A-Fa-f]{3}\b/);
      }
    });

    it("AC-5: SummaryHero/Sparkline/MiniBar/ColorDot 소스에 Tailwind 여백 클래스가 0건이다", () => {
      const files = ["SummaryHero.tsx", "Sparkline.tsx", "MiniBar.tsx", "ColorDot.tsx"];
      const tailwindSpacingClass = /\b(?:p|m)[trblxy]?-\d+\b/;
      for (const file of files) {
        const filePath = path.join(COMPONENTS_DIR, file);
        const source = fs.readFileSync(filePath, "utf-8");
        expect(source).not.toMatch(tailwindSpacingClass);
      }
    });
  });
});

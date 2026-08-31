import { describe, it, expect, vi } from "vitest";
import "@testing-library/jest-dom/vitest";
import fs from "node:fs";
import path from "node:path";
import React from "react";
import { render, screen } from "@testing-library/react";
import { mockTds } from "@/__tests__/__helpers__/mocks";

mockTds();

const COMPONENTS_DIR = path.resolve(__dirname, "../components");

describe("레이아웃/상태 공용 컴포넌트 (SubmitFooter / EmptyState / SkeletonBlock)", () => {
  describe("AC-1: SubmitFooter가 하단 고정 + safe-area padding + 44px 이상 버튼 높이로 렌더된다", () => {
    it("AC-1[P0]: position:fixed와 paddingBottom: 'calc(16px + env(safe-area-inset-bottom))'을 적용한다", async () => {
      const { SubmitFooter } = await import("@/components/SubmitFooter");
      const onClick = vi.fn();
      render(
        React.createElement(SubmitFooter, {
          label: "저장하기",
          onClick,
          testId: "submit-footer",
        }),
      );

      const footer = screen.getByTestId("submit-footer");
      expect(footer.style.position).toBe("fixed");
      expect(footer.style.paddingBottom).toBe("calc(16px + env(safe-area-inset-bottom))");
    });

    it("AC-1[P0]: 버튼 높이가 44px 이상이고 클릭 시 onClick이 호출된다", async () => {
      const { SubmitFooter } = await import("@/components/SubmitFooter");
      const onClick = vi.fn();
      render(
        React.createElement(SubmitFooter, {
          label: "저장하기",
          onClick,
          testId: "submit-footer",
        }),
      );

      const button = screen.getByRole("button", { name: "저장하기" });
      const heightPx = parseInt(button.style.height || button.style.minHeight || "0", 10);
      expect(heightPx).toBeGreaterThanOrEqual(44);

      button.click();
      expect(onClick).toHaveBeenCalledTimes(1);
    });
  });

  describe("AC-2: EmptyState가 title/description/action을 렌더하고 이모지를 사용하지 않는다", () => {
    it("AC-2[P0]: Asset.ContentIcon + title + description + weak/block Button을 렌더한다", async () => {
      const { EmptyState } = await import("@/components/EmptyState");
      render(
        React.createElement(EmptyState, {
          title: "아직 기록이 없어요",
          description: "첫 소득을 기록해 보세요",
          action: React.createElement(
            "button",
            { variant: "weak", display: "block", onClick: vi.fn() } as any,
            "기록 시작하기",
          ),
        }),
      );

      expect(screen.getByText("아직 기록이 없어요")).toBeInTheDocument();
      expect(screen.getByText("첫 소득을 기록해 보세요")).toBeInTheDocument();
      expect(screen.getByRole("img")).toBeInTheDocument();

      const actionButton = screen.getByRole("button", { name: "기록 시작하기" });
      expect(actionButton.getAttribute("variant")).toBe("weak");
      expect(actionButton.getAttribute("display")).toBe("block");
    });

    it("AC-2: 렌더된 텍스트에 이모지가 포함되지 않는다", async () => {
      const { EmptyState } = await import("@/components/EmptyState");
      const { container } = render(
        React.createElement(EmptyState, {
          title: "아직 기록이 없어요",
          description: "첫 소득을 기록해 보세요",
        }),
      );

      const emojiPattern = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u;
      expect(container.textContent ?? "").not.toMatch(emojiPattern);
      expect(container.textContent).toContain("아직 기록이 없어요");
    });
  });

  describe("AC-3: SkeletonBlock이 height prop과 grey50 배경, data-testid를 렌더한다", () => {
    it("AC-3[P0]: height를 px 인라인 스타일로, 배경을 var(--tds-color-grey50)로 렌더한다", async () => {
      const { SkeletonBlock } = await import("@/components/SkeletonBlock");
      render(React.createElement(SkeletonBlock, { height: 120, testId: "skeleton-1" }));

      const block = screen.getByTestId("skeleton-1");
      expect(block.style.height).toBe("120px");
      expect(block.style.backgroundColor).toBe("var(--tds-color-grey50)");
    });

    it("AC-3: 다른 height/testId 값으로도 동일하게 동작한다", async () => {
      const { SkeletonBlock } = await import("@/components/SkeletonBlock");
      render(React.createElement(SkeletonBlock, { height: 56, testId: "skeleton-row" }));

      const block = screen.getByTestId("skeleton-row");
      expect(block.style.height).toBe("56px");
      expect(block.style.backgroundColor).toBe("var(--tds-color-grey50)");
    });
  });

  describe("AC-4: 신규 컴포넌트 파일에 HEX 리터럴/Tailwind 여백 클래스가 없다", () => {
    it("AC-4: SubmitFooter/EmptyState/SkeletonBlock 소스에 '#RRGGBB' 리터럴이 0건이다", () => {
      const files = ["SubmitFooter.tsx", "EmptyState.tsx", "SkeletonBlock.tsx"];
      for (const file of files) {
        const filePath = path.join(COMPONENTS_DIR, file);
        const source = fs.readFileSync(filePath, "utf-8");
        expect(source).not.toMatch(/#[0-9A-Fa-f]{6}\b/);
        expect(source).not.toMatch(/#[0-9A-Fa-f]{3}\b/);
      }
    });

    it("AC-4: SubmitFooter/EmptyState/SkeletonBlock 소스에 Tailwind 여백 클래스가 0건이다", () => {
      const files = ["SubmitFooter.tsx", "EmptyState.tsx", "SkeletonBlock.tsx"];
      const tailwindSpacingClass = /\b(?:p|m)[trblxy]?-\d+\b/;
      for (const file of files) {
        const filePath = path.join(COMPONENTS_DIR, file);
        const source = fs.readFileSync(filePath, "utf-8");
        expect(source).not.toMatch(tailwindSpacingClass);
      }
    });
  });
});

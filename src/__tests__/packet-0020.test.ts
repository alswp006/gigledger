import { describe, it, expect, afterEach } from "vitest";
import "@testing-library/jest-dom/vitest";
import fs from "node:fs";
import path from "node:path";
import React from "react";
import { render, cleanup, screen, act, renderHook } from "@testing-library/react";
import { vi } from "vitest";
import { mockAll } from "@/__tests__/__helpers__/mocks";

mockAll();

const SRC_DIR = path.resolve(__dirname, "..");

describe("광고 배치 훅 + 검수 정적 게이트 & UX 폴리시", () => {
  afterEach(() => {
    cleanup();
  });

  describe("AC-1[P0]: AdSection이 AdSlot을 콘텐츠 사이에 렌더하고 광고 실패 시 레이아웃이 깨지지 않는다", () => {
    it("AC-1[P0]: AdSection이 import.meta.env.VITE_TOSS_AD_GROUP_ID를 adGroupId로 AdSlot에 전달한다", async () => {
      vi.doMock("@/components/AdSlot", () => ({
        AdSlot: (props: { adGroupId: string; className?: string }) =>
          React.createElement("div", { "data-testid": "ad-slot-mock", "data-ad-group-id": props.adGroupId }),
      }));

      const { AdSection } = await import("@/components/AdSection");
      render(React.createElement(AdSection));

      const slot = screen.getByTestId("ad-slot-mock");
      expect(slot).toHaveAttribute("data-ad-group-id", import.meta.env.VITE_TOSS_AD_GROUP_ID ?? "");
      expect(screen.getByTestId("ad-section")).toContainElement(slot);

      vi.doUnmock("@/components/AdSlot");
    });

    it("AC-1[P0]: 광고 로드 실패로 AdSlot이 빈 영역을 렌더해도 AdSection 컨테이너에 고정 높이가 없어 레이아웃이 접힌다", async () => {
      vi.doMock("@/components/AdSlot", () => ({
        // 실패 시 AdSlot 자체 구현(가드됨)은 빈 div를 렌더한다 — 여기서도 동일하게 재현
        AdSlot: () => React.createElement("div", { "data-testid": "ad-slot-mock" }),
      }));

      const { AdSection } = await import("@/components/AdSection");
      render(React.createElement(AdSection));

      const container = screen.getByTestId("ad-section");
      expect(container.style.height).toBe("");
      expect(container.style.minHeight).toBe("");

      vi.doUnmock("@/components/AdSlot");
    });
  });

  describe("AC-2[P0]: useOnboardingNotice는 noticeSeenAt이 null일 때만 안내를 표시하고 확인 시 ISO 시각을 남긴다", () => {
    it("AC-2[P0]: noticeSeenAt이 null이면 안내 AlertDialog가 열려 있고 닫기 클릭 시 ISO 시각으로 닫힌다", async () => {
      const { useOnboardingNotice } = await import("@/hooks/useOnboardingNotice");
      const onSeen = vi.fn();

      const { result } = renderHook(() => useOnboardingNotice(null, onSeen));

      expect(result.current.open).toBe(true);

      act(() => {
        result.current.dismiss();
      });

      expect(result.current.open).toBe(false);
      expect(onSeen).toHaveBeenCalledTimes(1);
      const isoArg = onSeen.mock.calls[0][0] as string;
      expect(isoArg).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
    });

    it("AC-2: noticeSeenAt이 이미 채워져 있으면 안내가 열리지 않는다(재방문 시 미표시)", async () => {
      const { useOnboardingNotice } = await import("@/hooks/useOnboardingNotice");
      const onSeen = vi.fn();

      const { result } = renderHook(() =>
        useOnboardingNotice("2026-08-01T00:00:00.000Z", onSeen),
      );

      expect(result.current.open).toBe(false);
      expect(onSeen).not.toHaveBeenCalled();
    });
  });

  describe("AC-3[P0]: useAppToast는 저장 실패/손상 데이터 문구를 표준 텍스트로 반환한다", () => {
    it("AC-3[P0]: showSaveFailure 호출 시 저장 공간 부족 문구를 toast.text로 연다", async () => {
      const { useAppToast } = await import("@/hooks/useAppToast");
      const { result } = renderHook(() => useAppToast());

      expect(result.current.toast.open).toBe(false);

      act(() => {
        result.current.showSaveFailure();
      });

      expect(result.current.toast.open).toBe(true);
      expect(result.current.toast.text).toBe("저장 공간이 부족해요. 오래된 기록을 삭제해주세요");
    });

    it("AC-3[P0]: showCorruptedData 호출 시 손상 데이터 문구를 toast.text로 연다", async () => {
      const { useAppToast } = await import("@/hooks/useAppToast");
      const { result } = renderHook(() => useAppToast());

      act(() => {
        result.current.showCorruptedData();
      });

      expect(result.current.toast.open).toBe(true);
      expect(result.current.toast.text).toBe("일부 저장 데이터를 불러오지 못했어요");
    });

    it("AC-3: dismiss 호출 시 toast.open이 false로 닫힌다", async () => {
      const { useAppToast } = await import("@/hooks/useAppToast");
      const { result } = renderHook(() => useAppToast());

      act(() => {
        result.current.showSaveFailure();
      });
      expect(result.current.toast.open).toBe(true);

      act(() => {
        result.current.dismiss();
      });
      expect(result.current.toast.open).toBe(false);
    });
  });

  describe("AC-4: 검수 금지 패턴 정적 게이트 — 외부 이탈/하드코딩 색상/설치 유도 문구 0건", () => {
    const APP_SRC_DIRS = ["components", "hooks", "lib", "pages"];
    const APP_SRC_FILES = ["App.tsx"];

    function collectFiles(): string[] {
      const files: string[] = [];
      for (const rel of APP_SRC_FILES) {
        const full = path.join(SRC_DIR, rel);
        if (fs.existsSync(full)) files.push(full);
      }
      for (const dir of APP_SRC_DIRS) {
        const full = path.join(SRC_DIR, dir);
        if (!fs.existsSync(full)) continue;
        for (const entry of fs.readdirSync(full, { withFileTypes: true })) {
          if (!entry.isFile()) continue;
          if (!/\.(tsx?|ts)$/.test(entry.name)) continue;
          files.push(path.join(full, entry.name));
        }
      }
      return files;
    }

    it("AC-4: window.open / location.href 사용이 0건이다(외부 도메인 이탈 금지)", () => {
      const files = collectFiles();
      expect(files.length).toBeGreaterThan(0);

      const offenders: string[] = [];
      for (const file of files) {
        const source = fs.readFileSync(file, "utf-8");
        if (/window\.open\(|location\.href\s*=/.test(source)) {
          offenders.push(path.relative(SRC_DIR, file));
        }
      }

      expect(offenders).toEqual([]);
    });

    it("AC-4: 하드코딩 HEX 색상(#fff, #3182F6 등)이 0건이다(TDS 토큰/CSS 변수만 허용)", () => {
      const files = collectFiles();
      const offenders: string[] = [];
      for (const file of files) {
        const source = fs.readFileSync(file, "utf-8");
        if (/#[0-9a-fA-F]{3,6}\b/.test(source)) {
          offenders.push(path.relative(SRC_DIR, file));
        }
      }

      expect(offenders).toEqual([]);
    });

    it("AC-4: '설치'/'다운로드'/'앱스토어' 앱 설치 유도 문구가 0건이다", () => {
      const files = collectFiles();
      const offenders: string[] = [];
      for (const file of files) {
        const source = fs.readFileSync(file, "utf-8");
        if (/설치|다운로드|앱스토어/.test(source)) {
          offenders.push(path.relative(SRC_DIR, file));
        }
      }

      expect(offenders).toEqual([]);
    });
  });

  describe("AC-5: package.json에 금지 SDK 의존성이 없고 프로덕션 빌드가 통과한다", () => {
    it("AC-5: dependencies/devDependencies에 stripe/iamport/admob/firebase/gtag/amplitude/sentry가 없다", () => {
      const pkgRaw = fs.readFileSync(path.resolve(SRC_DIR, "..", "package.json"), "utf-8");
      const pkg = JSON.parse(pkgRaw) as {
        dependencies?: Record<string, string>;
        devDependencies?: Record<string, string>;
      };
      const allDeps = { ...(pkg.dependencies ?? {}), ...(pkg.devDependencies ?? {}) };
      const forbidden = ["stripe", "iamport", "admob", "firebase", "gtag", "amplitude", "sentry"];

      const offenders = Object.keys(allDeps).filter((name) =>
        forbidden.some((f) => name.toLowerCase().includes(f)),
      );

      expect(offenders).toEqual([]);
      expect(Object.keys(allDeps).length).toBeGreaterThan(0);
    });
  });
});

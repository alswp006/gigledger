import type { ColorToken as ColorTokenType, PlatformCategory } from "@/lib/types";

export const STORAGE_KEYS = {
  platforms: "gigledger.platforms.v1",
  entries: "gigledger.entries.v1",
  settings: "gigledger.settings.v1",
  reportUnlocks: "gigledger.reportUnlocks.v1",
} as const;

export const MIN_WAGE_2026 = 10320;
export const MAX_ENTRIES = 5000;
export const MAX_PLATFORMS = 20;
export const MAX_AMOUNT = 10000000;
export const MAX_MINUTES = 1440;
export const MAX_MEMO = 50;
export const MAX_PLATFORM_NAME = 12;
export const GOAL_MIN = 10000;
export const GOAL_MAX = 50000000;
export const REPORT_MONTH_RANGE = 12;

export const COLOR_TOKENS = ["blue", "green", "orange", "purple", "red", "grey"] as const satisfies readonly ColorTokenType[];

export type ColorToken = ColorTokenType;
// 타입은 컴파일 시 소거된다 — 소비 코드(및 테스트)가 런타임에서도 "export됐는지" 확인할 수
// 있도록 존재 표식만 남긴다 (src/lib/types.ts와 동일한 패턴).
export const ColorToken = {} as const;

const COLOR_VAR_MAP: Record<ColorTokenType, string> = {
  blue: "var(--tds-color-blue500)",
  green: "var(--tds-color-green500)",
  orange: "var(--tds-color-orange500)",
  purple: "var(--tds-color-purple500)",
  red: "var(--tds-color-red500)",
  grey: "var(--tds-color-grey500)",
};

export function colorVar(token: ColorTokenType): string {
  return COLOR_VAR_MAP[token];
}

export const DEFAULT_PLATFORM_SEEDS: ReadonlyArray<{
  name: string;
  category: PlatformCategory;
  colorToken: ColorTokenType;
}> = [
  { name: "배달", category: "delivery", colorToken: "blue" },
  { name: "대리운전", category: "driving", colorToken: "green" },
  { name: "쿠팡플렉스", category: "logistics", colorToken: "orange" },
];

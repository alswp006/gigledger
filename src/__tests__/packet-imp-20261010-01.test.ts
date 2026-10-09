import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const read = (p: string) => readFileSync(resolve(process.cwd(), p), "utf8");
const TDS_COLOR_VAR = /var\(--tds-color-/g;
const CAST = /\bas any\b|as unknown as/;

describe("[개선] TDS 컴포넌트 6곳을 벤더 모양대로 고치기", () => {
  it("AC-1/2/4: constants.ts에 var(--tds-color-*)가 0건이고 --adaptive* 변수를 쓴다", async () => {
    const src = read("src/lib/constants.ts");
    expect(src.match(TDS_COLOR_VAR) ?? []).toHaveLength(0);
    expect(src).toContain("var(--adaptiveBlue500)");
    expect(src).toContain("var(--adaptiveGrey500)");
  });

  it("AC-5/6/8: reward-ad.css에 var(--tds-color-*)가 0건이다", () => {
    const css = read("src/styles/reward-ad.css");
    expect(css.match(TDS_COLOR_VAR) ?? []).toHaveLength(0);
    expect(css).toContain("var(--adaptiveBlue500");
    expect(css).toContain("var(--adaptiveGrey300");
  });

  it("AC-9/10/12: Home.tsx에 var(--tds-color-*)가 0건이다", () => {
    const src = read("src/pages/Home.tsx");
    expect(src.match(TDS_COLOR_VAR) ?? []).toHaveLength(0);
    expect(src).toContain("var(--adaptiveGrey100)");
    expect(src).toContain("var(--adaptiveBlue500)");
  });

  it("AC-13/14/16: Platforms ListRow는 children 없이 슬롯만 쓴다", () => {
    const src = read("src/pages/Platforms.tsx");
    const m = src.match(/<ListRow\b[\s\S]*?<\/ListRow>/);
    expect(m).not.toBeNull();
    // 여는 태그(">" 로 끝나는 props 구간) 뒤에 본문이 없어야 한다 → 자기닫힘 또는 빈 children
    expect(m![0]).not.toMatch(/right=\{switchArea\}\s*>\s*<div/);
    expect(src).toContain("right={switchArea}");
    expect(src).toContain("contents={");
  });

  it("AC-17/18/20: Wage의 Chip은 ChipItem을 감싸고 목도 ChipItem을 제공한다", () => {
    const wage = read("src/pages/Wage.tsx");
    expect(wage).toMatch(/<Chip\b[^>]*>\s*<ChipItem/);
    expect(wage).not.toMatch(/<Chip variant="weak"/);
    const mocks = read("src/__tests__/__helpers__/mocks.ts");
    expect(mocks).toMatch(/ChipItem/);
  });

  it("AC-21/22: EmptyState의 color는 CSS 색 문자열이다", () => {
    const src = read("src/components/EmptyState.tsx");
    expect(src).not.toMatch(/color="(primary|secondary|tertiary)"/);
    expect(src).toContain('color="var(--adaptiveGrey600)"');
  });

  it("AC-3/7/11/15/19/23: 수정 대상 파일에 as any / as unknown as 캐스트가 없다", () => {
    const files = [
      "src/lib/constants.ts",
      "src/pages/Home.tsx",
      "src/pages/Platforms.tsx",
      "src/pages/Wage.tsx",
      "src/components/EmptyState.tsx",
    ];
    for (const f of files) expect(read(f)).not.toMatch(CAST);
    expect(files).toHaveLength(5);
  });
});

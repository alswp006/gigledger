import { colorVar } from "@/lib/constants";
import type { ColorToken } from "@/lib/types";

/**
 * 플랫폼 색상 점 — 리스트/미니바에서 플랫폼을 색으로 구분.
 *
 * Pre-built (재구현 금지): 색은 colorVar(token)만 사용(HEX 하드코딩 금지, 다크모드 자동 대응).
 */
export function ColorDot({ colorToken }: { colorToken: ColorToken }) {
  return (
    <span
      data-testid="color-dot"
      style={{
        display: "inline-block",
        width: 8,
        height: 8,
        borderRadius: "50%",
        backgroundColor: colorVar(colorToken),
      }}
    />
  );
}

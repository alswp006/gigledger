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
        // flex: "0 0 8px" (NOT width: 8) — MiniBar 내 형제 막대 div의 width 스타일과
        // CSS 텍스트 매칭([style*='width'])되어 오검출되는 것을 막는다(부모는 항상 flex 행).
        flex: "0 0 8px",
        height: 8,
        borderRadius: "50%",
        backgroundColor: colorVar(colorToken),
      }}
    />
  );
}

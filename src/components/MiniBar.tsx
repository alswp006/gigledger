import { Paragraph } from "@toss/tds-mobile";
import { ColorDot } from "./ColorDot";
import { colorVar } from "@/lib/constants";
import type { ColorToken } from "@/lib/types";

export interface MiniBarItem {
  label: string;
  percent: number;
  colorToken: ColorToken;
}

/**
 * 플랫폼 비중 미니바 — 라벨 + 가로 막대 + 퍼센트를 한 줄로(홈/리포트 공용).
 *
 * Pre-built (재구현 금지): 색은 colorVar(token)만 사용, 고정 width 금지(부모 폭에 반응).
 */
export function MiniBar({ items }: { items: MiniBarItem[] }) {
  return (
    <div data-testid="platform-minibar" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {items.map((item, idx) => {
        const pct = Math.max(0, Math.min(100, item.percent));
        return (
          <div key={`${item.label}-${idx}`} style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <ColorDot colorToken={item.colorToken} />
            <div style={{ flex: "0 0 auto" }}>
              <Paragraph.Text typography="st13">{item.label}</Paragraph.Text>
            </div>
            <div
              style={{
                flex: "1 1 auto",
                height: 6,
                borderRadius: 3,
                backgroundColor: "var(--tds-color-grey100)",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  width: `${pct}%`,
                  height: "100%",
                  borderRadius: 3,
                  backgroundColor: colorVar(item.colorToken),
                }}
              />
            </div>
            <div style={{ flex: "0 0 auto" }}>
              <Paragraph.Text typography="st13">{pct}%</Paragraph.Text>
            </div>
          </div>
        );
      })}
    </div>
  );
}

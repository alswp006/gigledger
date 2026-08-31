import type { ReactNode } from "react";
import { Paragraph, Spacing } from "@toss/tds-mobile";
import { Card } from "./Card";

/**
 * 요약 히어로 카드 — 탭 홈/대시보드의 시각적 앵커.
 *
 * Pre-built (재구현 금지): 화면이 휑해 보이는 가장 큰 원인은 '핵심 숫자 앵커 부재'다.
 * 홈/결과 화면 최상단에 핵심 숫자 하나를 크게(t1) 박아 위계를 만든다.
 *
 *   <SummaryHero label="이번 달 순수익" value="1,280,000원" caption="12건 기록" />
 */
export function SummaryHero({
  label,
  value,
  caption,
}: {
  label: ReactNode;
  value: ReactNode;
  caption?: ReactNode;
}) {
  return (
    <Card testId="summary-hero">
      <Paragraph.Text typography="st13" color="var(--adaptiveGrey600)">
        {label}
      </Paragraph.Text>
      <Spacing size={4} />
      <Paragraph.Text typography="t1">{value}</Paragraph.Text>
      {caption ? (
        <>
          <Spacing size={4} />
          <Paragraph.Text typography="st13" color="var(--adaptiveGrey500)">
            {caption}
          </Paragraph.Text>
        </>
      ) : null}
    </Card>
  );
}

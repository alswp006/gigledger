import type { ReactNode } from "react";
import { Asset, Paragraph, Spacing } from "@toss/tds-mobile";

/**
 * 빈 상태 — TDS Asset.ContentIcon + 제목 + 설명 + 보조(weak) CTA.
 *
 * Pre-built (재구현 금지): 목록/결과가 비었을 때 맨텍스트("데이터 없음") 대신 사용.
 * ⚠️ action은 보조 액션이다. 하단 고정 1차 CTA와 같은 라벨·액션을 중복 노출하지 마라.
 */
export function EmptyState({
  title,
  description,
  action,
  testId,
}: {
  title: ReactNode;
  description?: ReactNode;
  /** 보조 액션 — variant="weak" display="block" 권장. 1차 CTA와 중복 금지. */
  action?: ReactNode;
  testId?: string;
}) {
  return (
    <div
      data-testid={testId}
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        textAlign: "center",
        padding: "48px 24px",
      }}
    >
      <Asset.ContentIcon name="iconInboxRegular" alt="빈 상태" />
      <Spacing size={12} />
      <Paragraph.Text typography="t5">{title}</Paragraph.Text>
      {description ? (
        <>
          <Spacing size={4} />
          <Paragraph.Text typography="st13" color="secondary">
            {description}
          </Paragraph.Text>
        </>
      ) : null}
      {action ? (
        <>
          <Spacing size={16} />
          {action}
        </>
      ) : null}
    </div>
  );
}

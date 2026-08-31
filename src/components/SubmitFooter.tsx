import type { ReactNode } from "react";
import { Button } from "@toss/tds-mobile";

/**
 * 하단 고정 1차 CTA. safe-area 대응(paddingBottom: env(safe-area-inset-bottom)) +
 * 44px 이상 터치 타겟을 명시적으로 보장한다.
 *
 * Pre-built (재구현 금지): 폼 제출/다음 단계 등 화면의 단일 1차 액션에 사용.
 */
export function SubmitFooter({
  label,
  onClick,
  disabled,
  testId,
}: {
  label: ReactNode;
  onClick: () => void;
  disabled?: boolean;
  testId?: string;
}) {
  return (
    <div
      data-testid={testId}
      style={{
        position: "fixed",
        left: 0,
        right: 0,
        bottom: 0,
        display: "flex",
        paddingLeft: 16,
        paddingRight: 16,
        paddingTop: 12,
        paddingBottom: "calc(16px + env(safe-area-inset-bottom))",
        backgroundColor: "var(--tds-color-background)",
      }}
    >
      <Button
        variant="fill"
        display="block"
        size="large"
        disabled={disabled}
        onClick={onClick}
        style={{ height: 48 }}
      >
        {label}
      </Button>
    </div>
  );
}

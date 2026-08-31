import type { ReactNode } from "react";
import { Paragraph, Spacing, Skeleton } from "@toss/tds-mobile";

/**
 * 빈 상태 글리프 — 인라인 SVG.
 *
 * ⚠️ `Asset.ContentIcon name="..."`을 쓰지 마라. TDS는 이름을
 * `https://static.toss.im/icons/svg/icn-<name>.svg`로 fetch하고, 이름이 틀리면 403 →
 * `throw new Error("Wrong URL")` → 에러 바운더리가 화면을 통째로 날린다(콘솔 에러도 남는다).
 * 실측(2026-08-31): `iconInboxRegular`가 그렇게 /wage·/report를 흰 화면으로 만들었다.
 * 이름 카탈로그가 .ai-factory에 없어 검증이 불가능하므로, 빈 상태는 이 로컬 글리프를 쓴다.
 */
export function EmptyGlyph({ label = "빈 상태" }: { label?: string }) {
  return (
    <svg
      width={48}
      height={48}
      viewBox="0 0 24 24"
      fill="none"
      stroke="var(--adaptiveGrey400)"
      strokeWidth={1.4}
      strokeLinecap="round"
      strokeLinejoin="round"
      role="img"
      aria-label={label}
    >
      <path d="M3 8.5 5.5 4h13L21 8.5V19a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V8.5Z" />
      <path d="M3 8.5h5l1 3h6l1-3h5" />
    </svg>
  );
}

/**
 * 빈 상태 — 아이콘(선택) + 제목 + 설명 + 보조(weak) CTA.
 *
 * Pre-built (재구현 금지): 목록/결과가 비었을 때 맨텍스트("데이터 없음") 대신 사용.
 * ⚠️ action은 '보조 액션'이다(variant="weak"). 하단 고정 1차 CTA(SubmitFooter/
 *   FixedBottomCTA)와 같은 라벨·액션을 중복 노출하지 마라(비활성 버튼 중복 = 군더더기).
 */
export function EmptyState({
  icon = <EmptyGlyph />,
  title,
  description,
  action,
  testId,
}: {
  /** 아이콘(선택). 기본값은 로컬 EmptyGlyph — 원격 아이콘 이름은 쓰지 마라(위 주석 참조). */
  icon?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  /** 보조 액션 — <Button variant="weak" .../> 권장. 1차 CTA와 중복 금지. */
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
      {icon}
      {icon ? <Spacing size={12} /> : null}
      <Paragraph.Text typography="t4">{title}</Paragraph.Text>
      {description ? (
        <>
          <Spacing size={4} />
          <Paragraph.Text typography="t6">{description}</Paragraph.Text>
        </>
      ) : null}
      {action ? (
        <>
          <Spacing size={20} />
          {action}
        </>
      ) : null}
    </div>
  );
}

/**
 * 로딩 상태 — TDS Skeleton n줄. 맨텍스트 "불러오는 중" 금지.
 *
 * Pre-built (재구현 금지): 데이터 패칭 중 표시 → 도착 시 실제 컴포넌트로 교체.
 */
export function LoadingState({
  rows = 3,
  testId,
}: {
  rows?: number;
  testId?: string;
}) {
  return (
    <div
      data-testid={testId}
      aria-busy="true"
      style={{ display: "flex", flexDirection: "column", gap: 12, padding: "8px 0" }}
    >
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} style={{ height: 56 }}>
          <Skeleton />
        </div>
      ))}
    </div>
  );
}

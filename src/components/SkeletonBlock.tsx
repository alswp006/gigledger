/**
 * 로딩 회색 박스 — 도착 데이터의 자리를 잡아둔다.
 *
 * Pre-built (재구현 금지): 데이터 패칭 중 표시 → 도착 시 실제 콘텐츠로 교체.
 */
export function SkeletonBlock({
  height,
  testId,
}: {
  height: number;
  testId?: string;
}) {
  return (
    <div
      data-testid={testId}
      style={{
        width: "100%",
        height: `${height}px`,
        borderRadius: 12,
        backgroundColor: "var(--tds-color-grey50)",
      }}
    />
  );
}

import { EmptyState } from "./StateView";

/**
 * 스파크라인 — 최근 추이(예: 14일 소득)를 얇은 인라인 SVG 라인으로.
 *
 * Pre-built (재구현 금지): D3/Three.js 등 무거운 차트 라이브러리는 번들 제한상 금지 —
 * 의존성 0인 이 컴포넌트로 대체한다. 색은 var(--tds-color-*)만 사용.
 */
export function Sparkline({ points, testId }: { points: number[]; testId?: string }) {
  if (points.length === 0) {
    // 빈 상태는 EmptyState(StateView)로 — 맨텍스트 금지
    return <EmptyState title="데이터가 없어요" testId={testId} />;
  }

  const width = 320;
  const height = 56;
  const min = Math.min(...points);
  const max = Math.max(...points);
  const span = max - min || 1;
  const stepX = points.length > 1 ? width / (points.length - 1) : 0;
  const coords = points
    .map((v, i) => {
      const x = i * stepX;
      const y = height - ((v - min) / span) * height;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");

  return (
    <svg
      data-testid={testId}
      width="100%"
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
      role="img"
      aria-label="추이 그래프"
    >
      <polyline
        points={coords}
        fill="none"
        stroke="var(--tds-color-blue500)"
        strokeWidth={2}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  );
}

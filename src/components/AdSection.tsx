import { Spacing } from "@toss/tds-mobile";
import { AdSlot } from "@/components/AdSlot";

/**
 * 콘텐츠 사이에 끼우는 배너 광고 구획.
 *
 * 배치 규칙: 화면 상단 고정·전면 노출 금지. 홈은 비중 막대와 최근 기록 리스트 사이,
 * /wage는 랭킹 리스트 아래처럼 "핵심 정보를 다 보여준 뒤"에만 넣는다.
 *
 * 레이아웃 계약: 컨테이너에 고정 높이(height/minHeight)를 주지 않는다.
 * WebView 밖이거나 광고가 로드되지 않으면 AdSlot이 빈 div를 렌더하는데,
 * 고정 높이가 있으면 그만큼 빈 구멍이 남는다 — 높이가 없어야 영역이 접힌다.
 */
export function AdSection({ testId = "ad-section" }: { testId?: string }) {
  const adGroupId = import.meta.env.VITE_TOSS_AD_GROUP_ID ?? "";

  return (
    <div data-testid={testId}>
      <Spacing size={16} />
      <AdSlot adGroupId={adGroupId} />
      <Spacing size={16} />
    </div>
  );
}

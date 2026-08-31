import { useState } from "react";
import { useLocation } from "react-router-dom";
import { Button, Paragraph, Spacing, Top } from "@toss/tds-mobile";
import { ScreenScaffold } from "@/components/ScreenScaffold";
import { FloatingTabBar } from "@/components/FloatingTabBar";
import { EmptyState, LoadingState } from "@/components/StateView";
import { ReportBody } from "@/components/ReportBody";
import { AdSlot } from "@/components/AdSlot";
import { TossRewardAd } from "@/components/TossRewardAd";
import { useLedger } from "@/hooks/useLedger";
import { addMonthKey, toDateKey, toMonthKey } from "@/lib/date";

const MONTH_PATTERN = /^\d{4}-(0[1-9]|1[0-2])$/;
/** 열람 가능 범위 — 이번 달부터 11개월 전까지 총 12개월. */
const MONTH_RANGE = 11;

/** location.state는 직접 URL 진입·새로고침에서 null이다. 형식이 어긋나도 현재 달로 폴백한다. */
function readMonth(state: unknown): string {
  const fallback = toMonthKey(toDateKey(new Date()));
  if (!state || typeof state !== "object") return fallback;
  const raw = (state as { month?: unknown }).month;
  return typeof raw === "string" && MONTH_PATTERN.test(raw) ? raw : fallback;
}

function monthLabel(month: string): string {
  const [year, m] = month.split("-");
  return `${year}년 ${Number(m)}월`;
}

export default function Report() {
  const location = useLocation();
  const { entries, platforms, reportUnlocks, loading, unlockReport } = useLedger();

  const thisMonth = toMonthKey(toDateKey(new Date()));
  const [month, setMonth] = useState(() => readMonth(location.state));

  const oldestMonth = addMonthKey(thisMonth, -MONTH_RANGE);
  const atNewest = month >= thisMonth;
  const atOldest = month <= oldestMonth;

  const monthEntries = entries.filter((e) => e.date.startsWith(month));
  const unlocked = Boolean(reportUnlocks[month]);

  const header = <Top title={<Top.TitleParagraph>월간 리포트</Top.TitleParagraph>} />;

  const monthNav = (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
      <Button
        variant="weak"
        size="small"
        disabled={atOldest}
        onClick={() => setMonth(addMonthKey(month, -1))}
      >
        이전 달
      </Button>
      <Paragraph.Text typography="t6">{monthLabel(month)}</Paragraph.Text>
      <Button
        variant="weak"
        size="small"
        disabled={atNewest}
        onClick={() => setMonth(addMonthKey(month, 1))}
      >
        다음 달
      </Button>
    </div>
  );

  return (
    <ScreenScaffold top={header} bottom={<FloatingTabBar />}>
      {monthNav}
      <Spacing size={16} />

      {loading ? (
        <LoadingState rows={4} testId="report-skeleton" />
      ) : monthEntries.length === 0 ? (
        // 기록이 없는 달은 광고로 막지 않는다 — 보여줄 게 없는 화면에 광고를 태우지 않는다.
        <EmptyState
          title="이 달에는 기록이 없어요"
          description="다른 달을 골라보거나, 이번 달 수입을 기록해 보세요."
          testId="report-empty"
        />
      ) : unlocked ? (
        <>
          <ReportBody entries={entries} platforms={platforms} month={month} />
          <Spacing size={16} />
          <AdSlot adGroupId={import.meta.env.VITE_TOSS_AD_GROUP_ID} />
        </>
      ) : (
        <TossRewardAd
          slotId={`report-${month}`}
          description={`${monthLabel(month)} 순수입·실질 시급·플랫폼 순위를 정리했어요.`}
          buttonText="광고 보고 리포트 확인"
          onRewarded={() => unlockReport(month)}
        >
          <ReportBody entries={entries} platforms={platforms} month={month} />
          <Spacing size={16} />
          <AdSlot adGroupId={import.meta.env.VITE_TOSS_AD_GROUP_ID} />
        </TossRewardAd>
      )}

      <Spacing size={24} />
    </ScreenScaffold>
  );
}

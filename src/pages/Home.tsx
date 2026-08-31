import { useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Button, ConfirmDialog, Paragraph, Spacing, Toast, Top } from "@toss/tds-mobile";
import { ScreenScaffold } from "@/components/ScreenScaffold";
import { SummaryHero } from "@/components/SummaryHero";
import { CountUp } from "@/components/CountUp";
import { Card } from "@/components/Card";
import { MiniBar, type MiniBarItem } from "@/components/MiniBar";
import { Sparkline } from "@/components/Sparkline";
import { AdSection } from "@/components/AdSection";
import { RecentEntryList } from "@/components/RecentEntryList";
import { FloatingTabBar } from "@/components/FloatingTabBar";
import { EmptyState, LoadingState } from "@/components/StateView";
import { useLedger } from "@/hooks/useLedger";
import { useAppToast } from "@/hooks/useAppToast";
import {
  ONBOARDING_NOTICE_CLOSE_LABEL,
  ONBOARDING_NOTICE_CONFIRM_LABEL,
  ONBOARDING_NOTICE_DESCRIPTION,
  ONBOARDING_NOTICE_TITLE,
  useOnboardingNotice,
} from "@/hooks/useOnboardingNotice";
import { calcGoalRate, calcPeriodSummary, calcPlatformWages, calcStreak, calcTrend14 } from "@/lib/calc";
import { formatKRW, formatMinutes } from "@/lib/format";
import { toDateKey, toMonthKey } from "@/lib/date";

/**
 * / 홈 — 이번 달 순수입 앵커 + 목표 진행률 + 플랫폼 비중 + 최근 기록.
 *
 * 배치 순서는 "핵심 지표 → 비중 막대 → 광고 → 최근 기록"이다. 광고(AdSection)는
 * 콘텐츠 사이에만 넣고 상단 고정/전면 노출하지 않는다.
 */
export default function Home() {
  const navigate = useNavigate();
  const { entries, platforms, settings, loading, corrupted, updateSettings } = useLedger();
  const { toast, showCorruptedData, dismiss: dismissToast } = useAppToast();

  const notice = useOnboardingNotice(settings.noticeSeenAt, (seenAtIso) => {
    updateSettings({ noticeSeenAt: seenAtIso });
  });

  const today = toDateKey(new Date());
  const month = toMonthKey(today);

  const monthEntries = useMemo(
    () => entries.filter((entry) => toMonthKey(entry.date) === month),
    [entries, month],
  );
  const summary = useMemo(() => calcPeriodSummary(monthEntries), [monthEntries]);
  const streak = useMemo(() => calcStreak(entries, today), [entries, today]);
  const trend = useMemo(() => calcTrend14(entries, today), [entries, today]);
  const goalRate = calcGoalRate(summary.netAmount, settings.monthlyGoal);

  const wageRows = useMemo(
    () => calcPlatformWages(monthEntries, platforms),
    [monthEntries, platforms],
  );
  const totalNet = wageRows.reduce((sum, row) => sum + Math.max(0, row.netAmount), 0);
  const shareItems: MiniBarItem[] = wageRows.map((row) => ({
    label: row.platformName,
    percent: totalNet > 0 ? Math.floor((Math.max(0, row.netAmount) / totalNet) * 100) : 0,
    colorToken: row.colorToken,
  }));

  // 저장 데이터가 일부 깨졌으면 조용히 넘기지 않고 표준 문구로 알린다(로드 완료 후 1회).
  useEffect(() => {
    if (corrupted) showCorruptedData();
  }, [corrupted, showCorruptedData]);

  const goToEntry = () => navigate("/entry", { state: { date: today } });

  return (
    <ScreenScaffold
      top={<Top title={<Top.TitleParagraph>GigLedger</Top.TitleParagraph>} />}
      bottom={<FloatingTabBar />}
    >
      {loading ? (
        <LoadingState rows={4} />
      ) : (
        <>
          <SummaryHero
            label={`${Number(month.split("-")[1])}월 순수입`}
            value={<CountUp value={summary.netAmount} unit="원" typography="t1" />}
            caption={`${monthEntries.length}건 기록 · 근무 ${formatMinutes(summary.totalMinutes)}`}
          />

          <Spacing size={12} />

          <Button variant="fill" display="block" onClick={goToEntry}>
            오늘 수입 기록하기
          </Button>

          <Spacing size={16} />

          <Card testId="home-status">
            <Paragraph.Text typography="st13" color="var(--adaptiveGrey600)">
              {settings.monthlyGoal > 0 && goalRate !== null
                ? `이번 달 목표 ${formatKRW(settings.monthlyGoal)} 중 ${goalRate}% 달성`
                : "목표 금액을 정하면 달성률을 알려드려요"}
            </Paragraph.Text>
            <Spacing size={4} />
            <Paragraph.Text typography="t6">
              {streak.current > 0 ? `${streak.current}일 연속 기록 중` : "오늘 기록으로 연속 기록을 시작해요"}
            </Paragraph.Text>
            <Spacing size={12} />
            <Sparkline points={trend} testId="home-trend" />
          </Card>

          {shareItems.length > 0 ? (
            <>
              <Spacing size={16} />
              <Card testId="home-share">
                <Paragraph.Text typography="t5">플랫폼 비중</Paragraph.Text>
                <Spacing size={12} />
                <MiniBar items={shareItems} />
              </Card>
            </>
          ) : null}

          {/* 콘텐츠 사이 배너 — 지표를 다 보여준 뒤, 최근 기록 리스트 앞에 */}
          <AdSection />

          {entries.length === 0 ? (
            <EmptyState
              testId="home-empty"
              title="아직 기록이 없어요"
              description="오늘 번 금액을 넣으면 실질 시급까지 계산해드려요"
              action={
                <Button variant="weak" display="block" onClick={() => navigate("/platforms")}>
                  플랫폼 먼저 등록하기
                </Button>
              }
            />
          ) : (
            <RecentEntryList entries={entries} platforms={platforms} />
          )}

          <Spacing size={24} />
        </>
      )}

      {/* 최초 1회 로컬 저장 고지 — 왼쪽 '닫기', 오른쪽 '확인'(둘 다 본 것으로 처리) */}
      <ConfirmDialog
        open={notice.open}
        title={ONBOARDING_NOTICE_TITLE}
        description={ONBOARDING_NOTICE_DESCRIPTION}
        onClose={notice.dismiss}
        cancelButton={
          <ConfirmDialog.CancelButton onClick={notice.dismiss}>
            {ONBOARDING_NOTICE_CLOSE_LABEL}
          </ConfirmDialog.CancelButton>
        }
        confirmButton={
          <ConfirmDialog.ConfirmButton onClick={notice.dismiss}>
            {ONBOARDING_NOTICE_CONFIRM_LABEL}
          </ConfirmDialog.ConfirmButton>
        }
      />

      <Toast open={toast.open} text={toast.text} position="bottom" onClose={dismissToast} />
    </ScreenScaffold>
  );
}

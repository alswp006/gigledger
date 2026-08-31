import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button, ConfirmDialog, Paragraph, Spacing, Tab, TextButton, Toast, Top } from "@toss/tds-mobile";
import { generateHapticFeedback } from "@apps-in-toss/web-framework";
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
import { startOfWeek, toDateKey, toMonthKey } from "@/lib/date";
import type { IncomeEntry } from "@/lib/types";

type Period = "week" | "month";

const PERIOD_TABS: Array<{ key: Period; label: string }> = [
  { key: "week", label: "주간" },
  { key: "month", label: "월간" },
];

function fireHaptic() {
  try {
    Promise.resolve(generateHapticFeedback({ type: "tickWeak" })).catch(() => {});
  } catch {
    /* WebView 밖(브라우저/검수자 PC/jsdom)에서는 throw — 무시 */
  }
}

function filterByPeriod(entries: IncomeEntry[], period: Period, today: string): IncomeEntry[] {
  if (period === "week") {
    const weekStart = startOfWeek(today);
    return entries.filter((e) => e.date >= weekStart && e.date <= today);
  }
  const month = toMonthKey(today);
  return entries.filter((e) => toMonthKey(e.date) === month);
}

/**
 * / 홈 — 요약 섹션(주간/월간 Tab + SummaryHero + 스트릭/목표 카드 + 14일 추이 + 플랫폼 비중)
 * + (월간 탭) 최근 기록 리스트. 모든 합산은 calc.ts 호출로만 하고 화면에서 재구현하지 않는다.
 *
 * 최근 기록 리스트는 월간 탭에서만 보인다 — 주간 탭은 이번 주 숫자만 빠르게 확인하는
 * 용도라 개별 기록과 겹치는 금액이 나오기 쉽다(예: 이번 주 기록이 1건이면 히어로 순수입과
 * 그 기록의 순수입이 같은 숫자로 중복 표시된다). 히스토리는 월간 탭에 모아 보여준다.
 */
export default function Home() {
  const navigate = useNavigate();
  const { entries, platforms, settings, loading, corrupted, updateSettings } = useLedger();
  const { toast, showCorruptedData, dismiss: dismissToast } = useAppToast();
  const [period, setPeriod] = useState<Period>("month");

  const notice = useOnboardingNotice(settings.noticeSeenAt, (seenAtIso) => {
    updateSettings({ noticeSeenAt: seenAtIso });
  });

  const today = toDateKey(new Date());
  const month = toMonthKey(today);

  const periodEntries = useMemo(
    () => filterByPeriod(entries, period, today),
    [entries, period, today],
  );
  const periodSummary = useMemo(() => calcPeriodSummary(periodEntries), [periodEntries]);

  const monthEntries = useMemo(
    () => entries.filter((entry) => toMonthKey(entry.date) === month),
    [entries, month],
  );
  const monthSummary = useMemo(() => calcPeriodSummary(monthEntries), [monthEntries]);
  const goalRate = calcGoalRate(monthSummary.netAmount, settings.monthlyGoal);

  const streak = useMemo(() => calcStreak(entries, today), [entries, today]);
  const trend = useMemo(() => calcTrend14(entries, today), [entries, today]);

  const wageRows = useMemo(
    () => calcPlatformWages(periodEntries, platforms),
    [periodEntries, platforms],
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

  function selectPeriod(next: Period) {
    if (next === period) return;
    fireHaptic();
    setPeriod(next);
  }

  return (
    <ScreenScaffold
      top={<Top title={<Top.TitleParagraph>GigLedger</Top.TitleParagraph>} />}
      bottom={<FloatingTabBar />}
    >
      {loading ? (
        <LoadingState testId="home-skeleton" rows={3} />
      ) : entries.length === 0 ? (
        <EmptyState
          testId="home-empty"
          title="아직 기록이 없어요"
          description="오늘 번 돈을 기록해보세요"
          action={
            <Button variant="weak" display="block" onClick={goToEntry}>
              수입 기록하기
            </Button>
          }
        />
      ) : (
        <>
          <Tab onChange={(index) => selectPeriod(PERIOD_TABS[index].key)}>
            {PERIOD_TABS.map((tab) => (
              <Tab.Item key={tab.key} selected={period === tab.key} onClick={() => selectPeriod(tab.key)}>
                {tab.label}
              </Tab.Item>
            ))}
          </Tab>

          <Spacing size={16} />

          <SummaryHero
            label={period === "week" ? "이번 주 순수입" : "이번 달 순수입"}
            value={<CountUp value={periodSummary.netAmount} unit="원" typography="t1" />}
            caption={`총수입 ${formatKRW(periodSummary.totalAmount)} · 경비 ${formatKRW(periodSummary.totalExpense)} · 근무 ${formatMinutes(periodSummary.totalMinutes)}`}
          />

          <Spacing size={12} />

          <Button variant="fill" display="block" onClick={goToEntry}>
            오늘 수입 기록하기
          </Button>

          <Spacing size={16} />

          <div style={{ display: "flex", gap: 12 }}>
            <Card testId="streak-card" style={{ flex: 1 }}>
              <Paragraph.Text typography="t4">
                {streak.current > 0 ? `${streak.current}일 연속 기록 중` : "오늘 기록으로 연속 기록을 시작해요"}
              </Paragraph.Text>
              <Spacing size={4} />
              <Paragraph.Text typography="st13" color="var(--adaptiveGrey500)">
                최고 {settings.bestStreak}일
              </Paragraph.Text>
            </Card>

            <Card testId="goal-card" style={{ flex: 1 }}>
              {settings.monthlyGoal > 0 && goalRate !== null ? (
                <>
                  <Paragraph.Text typography="t3">{goalRate}%</Paragraph.Text>
                  <Spacing size={4} />
                  <Paragraph.Text typography="st13" color="var(--adaptiveGrey600)">
                    {formatKRW(monthSummary.netAmount)} / {formatKRW(settings.monthlyGoal)}
                  </Paragraph.Text>
                  <Spacing size={8} />
                  <div
                    style={{
                      height: 6,
                      borderRadius: 3,
                      backgroundColor: "var(--tds-color-grey100)",
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        width: `${Math.max(0, Math.min(100, goalRate))}%`,
                        height: "100%",
                        borderRadius: 3,
                        backgroundColor: "var(--tds-color-blue500)",
                      }}
                    />
                  </div>
                </>
              ) : (
                <>
                  <Paragraph.Text typography="t6">이번 달 목표를 정해보세요</Paragraph.Text>
                  <Spacing size={12} />
                  <Button variant="weak" display="block" onClick={() => navigate("/settings")}>
                    목표 설정
                  </Button>
                </>
              )}
            </Card>
          </div>

          <Spacing size={16} />

          <Paragraph.Text typography="t5">최근 14일 추이</Paragraph.Text>
          <Spacing size={8} />
          <Sparkline points={trend} testId="trend-sparkline" />

          <Spacing size={16} />

          {shareItems.length > 0 ? (
            <Card>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <Paragraph.Text typography="t5">플랫폼 비중</Paragraph.Text>
                <TextButton size="small" onClick={() => navigate("/wage")}>더보기</TextButton>
              </div>
              <Spacing size={12} />
              <MiniBar items={shareItems} />
            </Card>
          ) : null}

          {period === "month" ? (
            <>
              {/* 콘텐츠 사이 배너 — 핵심 지표를 다 보여준 뒤에만 */}
              <AdSection />
              <RecentEntryList entries={entries} platforms={platforms} />
            </>
          ) : null}

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

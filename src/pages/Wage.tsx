import { useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button, Chip, ListRow, Paragraph, Spacing, Tab, Top } from "@toss/tds-mobile";
import { generateHapticFeedback } from "@apps-in-toss/web-framework";
import { ScreenScaffold } from "@/components/ScreenScaffold";
import { FloatingTabBar } from "@/components/FloatingTabBar";
import { SummaryHero } from "@/components/SummaryHero";
import { Card } from "@/components/Card";
import { ColorDot } from "@/components/ColorDot";
import { MiniBar, type MiniBarItem } from "@/components/MiniBar";
import { AdSection } from "@/components/AdSection";
import { EmptyState } from "@/components/StateView";
import { getEntries, getPlatforms } from "@/lib/storage";
import { calcHourlyWage, calcPeriodSummary, calcPlatformWages } from "@/lib/calc";
import { formatKRW, formatMinutes, formatWage } from "@/lib/format";
import { startOfWeek, toDateKey, toMonthKey } from "@/lib/date";
import { MIN_WAGE_2026 } from "@/lib/constants";
import type { IncomeEntry } from "@/lib/types";

type Period = "week" | "month" | "all";

const PERIOD_TABS: Array<{ key: Period; label: string }> = [
  { key: "week", label: "주간" },
  { key: "month", label: "월간" },
  { key: "all", label: "전체" },
];

function fireHaptic() {
  try {
    Promise.resolve(generateHapticFeedback({ type: "tickWeak" })).catch(() => {});
  } catch {
    /* WebView 밖(브라우저/검수자 PC/jsdom)에서는 throw — 무시 */
  }
}

function filterByPeriod(entries: IncomeEntry[], period: Period, today: string): IncomeEntry[] {
  if (period === "all") return entries;
  if (period === "month") {
    const month = toMonthKey(today);
    return entries.filter((e) => toMonthKey(e.date) === month);
  }
  const weekStart = startOfWeek(today);
  return entries.filter((e) => e.date >= weekStart && e.date <= today);
}

/**
 * /wage — 플랫폼별 실질 시급 랭킹.
 *
 * ⚠️ RouteState['/wage']는 계약상 null이지만, 이 화면은 홈 등에서 { period } 형태로
 * 진입시킬 수 있어야 한다(AC-4) — 공유 계약을 벗어나는 로컬 전용 형태이므로 별도로 좁혀 읽는다.
 */
export default function Wage() {
  const navigate = useNavigate();
  const location = useLocation();
  const incomingPeriod = (location.state as { period?: Period } | null)?.period;

  const [period, setPeriod] = useState<Period>(incomingPeriod === "month" ? "month" : "week");
  const [platforms] = useState(() => getPlatforms());
  const [entries] = useState(() => getEntries().entries);

  const today = toDateKey(new Date());
  const periodEntries = useMemo(
    () => filterByPeriod(entries, period, today),
    [entries, period, today],
  );
  const rows = useMemo(() => calcPlatformWages(periodEntries, platforms), [periodEntries, platforms]);
  const summary = useMemo(() => calcPeriodSummary(periodEntries), [periodEntries]);
  const averageWage = useMemo(() => calcHourlyWage(periodEntries), [periodEntries]);

  const totalNet = rows.reduce((sum, row) => sum + Math.max(0, row.netAmount), 0);
  const miniBarItems: MiniBarItem[] = rows.map((row) => ({
    label: row.platformName,
    percent: totalNet > 0 ? Math.floor((Math.max(0, row.netAmount) / totalNet) * 100) : 0,
    colorToken: row.colorToken,
  }));

  function selectPeriod(next: Period) {
    if (next === period) return;
    fireHaptic();
    setPeriod(next);
  }

  return (
    <ScreenScaffold
      top={<Top title={<Top.TitleParagraph>실질 시급</Top.TitleParagraph>} />}
      bottom={
        <FloatingTabBar />
      }
    >
      <Tab onChange={(index) => selectPeriod(PERIOD_TABS[index].key)}>
        {PERIOD_TABS.map((tab) => (
          <Tab.Item key={tab.key} selected={period === tab.key} onClick={() => selectPeriod(tab.key)}>
            {tab.label}
          </Tab.Item>
        ))}
      </Tab>

      <Spacing size={16} />

      {rows.length === 0 ? (
        <EmptyState
          testId="wage-empty"
          title="아직 계산할 기록이 없어요"
          description="수입을 기록하면 시급을 계산해드려요"
          action={
            <Button
              variant="weak"
              display="block"
              onClick={() => navigate("/entry", { state: { date: today } })}
            >
              수입 기록하기
            </Button>
          }
        />
      ) : (
        <>
          <SummaryHero
            label="전체 평균 실질 시급"
            value={formatWage(averageWage)}
            caption={`순수입 ${formatKRW(summary.netAmount)} · 근무 ${formatMinutes(summary.totalMinutes)}`}
          />

          <Spacing size={16} />

          <MiniBar items={miniBarItems} />

          <Spacing size={16} />

          <Card>
            {rows.map((row) => {
              const isLowWage = row.hourlyWage !== null && row.hourlyWage < MIN_WAGE_2026;
              return (
                // ⚠️ ListRow는 children을 렌더하지 않는다 — 콘텐츠는 left/contents/right 슬롯에.
                <ListRow
                  key={row.platformId}
                  data-testid="wage-row"
                  left={<ColorDot colorToken={row.colorToken} />}
                  contents={
                    <ListRow.Texts
                      type="2RowTypeA"
                      top={row.platformName}
                      bottom={`순수입 ${formatKRW(row.netAmount)} · ${formatMinutes(row.totalMinutes)}`}
                    />
                  }
                  right={
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "flex-end",
                        gap: 4,
                      }}
                    >
                      <Paragraph.Text typography="t6">{formatWage(row.hourlyWage)}</Paragraph.Text>
                      {isLowWage ? (
                        <Chip variant="weak" size="small">
                          최저임금 미만
                        </Chip>
                      ) : null}
                    </div>
                  }
                />
              );
            })}
          </Card>

          {/* 랭킹을 다 보여준 뒤 콘텐츠 하단 배너 — 상단 고정/전면 노출 금지 */}
          <AdSection />
        </>
      )}

      <Spacing size={24} />
    </ScreenScaffold>
  );
}

import type { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { Button, ListRow, Paragraph, Spacing } from "@toss/tds-mobile";
import { generateHapticFeedback } from "@apps-in-toss/web-framework";
import type { IncomeEntry, Platform } from "@/lib/types";
import { calcMonthlyReport, calcPeriodSummary } from "@/lib/calc";
import { formatKRW, formatMinutes, formatWage, formatDelta } from "@/lib/format";
import { formatDate } from "@/lib/date";
import { Card } from "@/components/Card";
import { SummaryHero } from "@/components/SummaryHero";
import { Amount } from "@/components/Amount";
import { MiniBar, type MiniBarItem } from "@/components/MiniBar";

interface ReportBodyProps {
  entries: IncomeEntry[];
  platforms: Platform[];
  month: string;
}

function fireHaptic() {
  try {
    Promise.resolve(generateHapticFeedback({ type: "success" })).catch(() => {});
  } catch {
    /* WebView 밖(브라우저/검수자 PC/jsdom)에서는 throw — 무시 */
  }
}

function prevMonthOf(month: string): string {
  const [y, m] = month.split("-").map(Number);
  return `${m === 1 ? y - 1 : y}-${String(m === 1 ? 12 : m - 1).padStart(2, "0")}`;
}

// ⚠️ TDS ListRow는 children을 렌더하지 않는다 — 지표는 contents/right 슬롯에 넣는다.
function MetricRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <ListRow
      contents={
        <Paragraph.Text typography="st13" color="var(--adaptiveGrey600)">
          {label}
        </Paragraph.Text>
      }
      right={children}
    />
  );
}

/**
 * 월간 리포트 본문 지표 — 순수입 히어로 + 총수입/경비/근무시간/실질시급 + 플랫폼별 비중 +
 * 최다 수입일 + 공유 카드 이동 CTA. 계산은 calc.ts만 사용(전월 대비 증감률은 format.ts formatDelta).
 */
export function ReportBody({ entries, platforms, month }: ReportBodyProps) {
  const navigate = useNavigate();

  const report = calcMonthlyReport(entries, platforms, month);
  const prevReport = calcMonthlyReport(entries, platforms, prevMonthOf(month));
  const monthEntries = entries.filter((e) => e.date.startsWith(month));
  const { totalMinutes } = calcPeriodSummary(monthEntries);

  const deltaText = formatDelta(report.netAmount, prevReport.netAmount);
  const wageText = formatWage(report.averageHourlyWage);

  const totalNet = report.platformRanking.reduce((sum, row) => sum + row.netAmount, 0);
  const miniBarItems: MiniBarItem[] = report.platformRanking.map((row) => ({
    label: row.platformName,
    percent: totalNet > 0 ? Math.floor((row.netAmount / totalNet) * 100) : 0,
    colorToken: row.colorToken,
  }));

  const monthLabel = `${Number(month.split("-")[1])}월`;

  const handleShare = () => {
    fireHaptic();
    navigate("/share", { state: { month } });
  };

  return (
    <div>
      <SummaryHero
        label={`${monthLabel} 순수입`}
        value={<Amount value={report.netAmount} typography="t1" />}
        caption={
          <>
            지난달 대비 <span>{deltaText}</span>
          </>
        }
      />
      <Spacing size={16} />
      <Card>
        <MetricRow label="총수입">
          <Amount value={report.totalAmount} typography="t6" />
        </MetricRow>
        <MetricRow label="경비">
          <Amount value={report.totalExpense} typography="t6" />
        </MetricRow>
        <MetricRow label="근무시간">
          <Paragraph.Text typography="t6">{formatMinutes(totalMinutes)}</Paragraph.Text>
        </MetricRow>
        <MetricRow label="실질시급">
          <Paragraph.Text typography="t6">{wageText}</Paragraph.Text>
        </MetricRow>
      </Card>
      <Spacing size={16} />
      <Paragraph.Text typography="t5">플랫폼별 비중</Paragraph.Text>
      <Spacing size={8} />
      {miniBarItems.length > 0 ? (
        <MiniBar items={miniBarItems} />
      ) : (
        <Paragraph.Text typography="st13" color="var(--adaptiveGrey500)">
          이번 달 기록이 없어요
        </Paragraph.Text>
      )}
      {report.bestDay ? (
        <>
          <Spacing size={16} />
          <ListRow
            contents={
              <Paragraph.Text typography="st13" color="var(--adaptiveGrey600)">
                최다 수입일
              </Paragraph.Text>
            }
            right={
              <Paragraph.Text typography="t6">
                {`${formatDate(report.bestDay.date)} · ${formatKRW(report.bestDay.amount)}`}
              </Paragraph.Text>
            }
          />
        </>
      ) : null}
      <Spacing size={24} />
      <Button variant="fill" display="block" size="large" onClick={handleShare}>
        공유 카드 만들기
      </Button>
    </div>
  );
}

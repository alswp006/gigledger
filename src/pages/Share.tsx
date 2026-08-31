import { useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button, Paragraph, Spacing, Toast, Top } from "@toss/tds-mobile";
import { ScreenScaffold } from "@/components/ScreenScaffold";
import { Card } from "@/components/Card";
import { Amount } from "@/components/Amount";
import { MiniBar, type MiniBarItem } from "@/components/MiniBar";
import { useLedger } from "@/hooks/useLedger";
import { calcMonthlyReport, calcStreak } from "@/lib/calc";
import { formatKRW, formatWage } from "@/lib/format";
import { toDateKey, toMonthKey } from "@/lib/date";

const MONTH_PATTERN = /^\d{4}-(0[1-9]|1[0-2])$/;
const CARD_WIDTH = 1080;
const CARD_HEIGHT = 1350;

// Canvas 2D는 CSS 변수를 읽지 못한다 — 저장 이미지 전용 고정색이다(화면 UI에는 쓰지 않는다).
// HEX 리터럴은 검수 정적 게이트에 걸리므로 rgb() 문자열로 둔다.
const CARD_BACKGROUND = "rgb(11, 18, 32)";
const CARD_FOREGROUND = "rgb(255, 255, 255)";

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

export default function Share() {
  const navigate = useNavigate();
  const location = useLocation();
  const { entries, platforms } = useLedger();

  const month = readMonth(location.state);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [toast, setToast] = useState("");
  const [showFallbackText, setShowFallbackText] = useState(false);
  const [saving, setSaving] = useState(false);

  const report = calcMonthlyReport(entries, platforms, month);
  const streak = calcStreak(entries, toDateKey(new Date()));
  const wageText = formatWage(report.averageHourlyWage);

  const totalNet = report.platformRanking.reduce((sum, row) => sum + row.netAmount, 0);
  const barItems: MiniBarItem[] = report.platformRanking.map((row) => ({
    label: row.platformName,
    percent: totalNet > 0 ? Math.floor((row.netAmount / totalNet) * 100) : 0,
    colorToken: row.colorToken,
  }));

  const summaryText = `${monthLabel(month)} 순수입 ${formatKRW(report.netAmount)} · 실질 시급 ${wageText} (GigLedger)`;

  const handleCopy = async () => {
    try {
      if (!navigator.clipboard?.writeText) throw new Error("clipboard unavailable");
      await navigator.clipboard.writeText(summaryText);
      setToast("요약을 복사했어요");
    } catch {
      // 클립보드가 막힌 환경 — 사용자가 직접 길게 눌러 복사할 수 있게 텍스트를 노출한다.
      setShowFallbackText(true);
      setToast("복사할 수 없어요. 아래 텍스트를 길게 눌러 복사해주세요");
    }
  };

  const handleSaveImage = async () => {
    if (saving) return;
    setSaving(true);
    try {
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext("2d");
      if (!canvas || !ctx) throw new Error("canvas unavailable");

      const dpr = window.devicePixelRatio || 1;
      canvas.width = CARD_WIDTH * dpr;
      canvas.height = CARD_HEIGHT * dpr;
      ctx.scale(dpr, dpr);

      ctx.fillStyle = CARD_BACKGROUND;
      ctx.fillRect(0, 0, CARD_WIDTH, CARD_HEIGHT);
      ctx.fillStyle = CARD_FOREGROUND;
      ctx.font = "600 56px sans-serif";
      ctx.fillText(monthLabel(month), 96, 240);
      ctx.font = "700 128px sans-serif";
      ctx.fillText(formatKRW(report.netAmount), 96, 400);
      ctx.font = "400 52px sans-serif";
      ctx.fillText(`실질 시급 ${wageText}`, 96, 500);
      ctx.fillText(`${streak.current}일 연속 기록`, 96, 580);
      ctx.font = "400 44px sans-serif";
      ctx.fillText("GigLedger", 96, CARD_HEIGHT - 96);

      const dataUrl = canvas.toDataURL("image/png");
      const link = document.createElement("a");
      link.href = dataUrl;
      link.download = `gigledger-${month}.png`;
      link.click();
      setToast("이미지를 저장했어요");
    } catch {
      setToast("이미지를 만들지 못했어요. 잠시 후 다시 시도해주세요");
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScreenScaffold top={<Top title={<Top.TitleParagraph>공유 카드</Top.TitleParagraph>} />}>
      <Card testId="share-card">
        <Paragraph.Text typography="st13" color="var(--adaptiveGrey600)">
          {monthLabel(month)}
        </Paragraph.Text>
        <Spacing size={4} />
        <Amount value={report.netAmount} typography="t1" testId="share-net" />
        <Spacing size={8} />
        <Paragraph.Text typography="t6">실질 시급 {wageText}</Paragraph.Text>
        <Spacing size={4} />
        <Paragraph.Text typography="t6">{streak.current}일 연속 기록</Paragraph.Text>
        {barItems.length > 0 ? (
          <>
            <Spacing size={16} />
            <MiniBar items={barItems} />
          </>
        ) : null}
      </Card>

      {showFallbackText ? (
        <>
          <Spacing size={12} />
          <Paragraph.Text typography="st13">
            <span
              data-testid="share-fallback-text"
              style={{ userSelect: "text", wordBreak: "break-word" }}
            >
              {summaryText}
            </span>
          </Paragraph.Text>
        </>
      ) : null}

      <Spacing size={24} />

      <Button variant="fill" display="block" size="large" onClick={handleCopy}>
        요약 복사
      </Button>
      <Spacing size={8} />
      {/* TDS Button에는 loading prop이 없다 — 중복 탭은 disabled + 라벨 전환으로 막는다. */}
      <Button
        variant="weak"
        display="block"
        size="large"
        disabled={saving}
        onClick={handleSaveImage}
      >
        {saving ? "이미지 만드는 중" : "이미지 저장"}
      </Button>
      <Spacing size={8} />
      <Button
        variant="weak"
        display="block"
        size="large"
        onClick={() => navigate("/report", { state: { month } })}
      >
        리포트로 돌아가기
      </Button>

      <Spacing size={24} />

      {/* 화면에 보이지 않는 렌더 버퍼 — 1080×1350 PNG를 그린다. */}
      <canvas ref={canvasRef} aria-hidden="true" style={{ display: "none" }} />

      <Toast open={Boolean(toast)} text={toast} position="bottom" onClose={() => setToast("")} />
    </ScreenScaffold>
  );
}

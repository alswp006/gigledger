// 표기 규칙: 금액/시간/시급/증감률 포맷팅 (순수 함수, Android 7 호환)

export function formatKRW(amount: number): string {
  return `${amount.toLocaleString("ko-KR")}원`;
}

export function formatMinutes(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours}시간 ${mins}분`;
}

export function formatWage(amount: number | null): string {
  if (amount === null) return "—";
  return `${amount.toLocaleString("ko-KR")}원`;
}

export function formatDelta(current: number, previous: number): string {
  if (previous === 0) return "—";
  const percent = Math.round(((current - previous) / previous) * 100);
  const sign = percent >= 0 ? "+" : "";
  return `${sign}${percent}%`;
}

function formatCompactKRW(amount: number): string {
  const sign = amount < 0 ? "-" : "";
  const abs = Math.abs(amount);
  if (abs >= 100000000) {
    return `${sign}${(abs / 100000000).toLocaleString("ko-KR", { maximumFractionDigits: 1 })}억`;
  }
  if (abs >= 10000) {
    return `${sign}${(abs / 10000).toLocaleString("ko-KR", { maximumFractionDigits: 1 })}만`;
  }
  return `${sign}${abs.toLocaleString("ko-KR")}`;
}

function formatCompactUSD(amount: number): string {
  const sign = amount < 0 ? "-" : "";
  const abs = Math.abs(amount);
  if (abs >= 1000000000) return `${sign}${(abs / 1000000000).toFixed(1)}B`;
  if (abs >= 1000000) return `${sign}${(abs / 1000000).toFixed(1)}M`;
  if (abs >= 1000) return `${sign}${(abs / 1000).toFixed(1)}K`;
  return `${sign}${abs.toLocaleString("en-US")}`;
}

/** 금액 포맷팅 (KRW/USD, compact 옵션) */
export function formatAmount(amount: number, opts?: { currency?: string; compact?: boolean }): string {
  const currency = opts?.currency ?? "KRW";
  const compact = opts?.compact ?? false;

  if (currency === "USD") {
    return `$${compact ? formatCompactUSD(amount) : amount.toLocaleString("en-US")}`;
  }
  return `${compact ? formatCompactKRW(amount) : amount.toLocaleString("ko-KR")}원`;
}

/** KRW 금액 문자열 파싱 — 쉼표/원/공백 제거 후 숫자 변환, 실패 시 null */
export function parseKrwAmount(input: string): number | null {
  if (typeof input !== "string") return null;
  const trimmed = input.trim();
  if (trimmed === "") return null;
  const cleaned = trimmed.replace(/,/g, "").replace(/원/g, "").replace(/\s/g, "");
  if (!/^-?\d+(\.\d+)?$/.test(cleaned)) return null;
  const value = Number(cleaned);
  return Number.isFinite(value) ? value : null;
}

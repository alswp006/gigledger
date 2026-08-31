// 날짜 키 유틸: toDateKey/toMonthKey/startOfWeek(월요일 고정)/addMonthKey (순수 함수, Android 7 호환)

function pad2(n: number): string {
  return n < 10 ? `0${n}` : `${n}`;
}

export function toDateKey(date: Date): string {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
}

export function toMonthKey(dateStr: string): string {
  return dateStr.substring(0, 7);
}

export function startOfWeek(dateStr: string): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  const dayOfWeek = date.getDay(); // 0=일 ... 6=토
  const offset = (dayOfWeek + 6) % 7; // 월요일까지 거슬러 올라갈 일수
  date.setDate(date.getDate() - offset);
  return toDateKey(date);
}

export function addMonthKey(monthStr: string, delta: number): string {
  const [y, m] = monthStr.split("-").map(Number);
  const total = y * 12 + (m - 1) + delta;
  const newYear = Math.floor(total / 12);
  const newMonth = ((total % 12) + 12) % 12;
  return `${newYear}-${pad2(newMonth + 1)}`;
}

/** 날짜 문자열 포맷팅 (short: "8월 31일" / long: "2026년 8월 31일" / time: "14:05") */
export function formatDate(date: string, fmt: "short" | "long" | "time" = "short"): string {
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return "";

  if (fmt === "time") {
    return `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
  }

  const year = d.getFullYear();
  const month = d.getMonth() + 1;
  const day = d.getDate();
  if (fmt === "long") return `${year}년 ${month}월 ${day}일`;
  return `${month}월 ${day}일`;
}

// 검증 모듈: 엔트리/플랫폼명/목표 금액 (고정 에러 문구, localStorage 접근 없음)
// validateEntry는 platformId의 존재 여부와 archived 상태를 검사하지 않는다
// (보관 플랫폼 기록 수정 허용) — 활성 플랫폼 제한은 입력 UI에서만 수행한다.

import { toDateKey } from "@/lib/date";
import type { Entry, Platform } from "@/lib/contract";

export type ValidationResult =
  | { ok: true; error?: undefined }
  | { ok: false; error: string };

interface EntryInput {
  amount: number;
  expense: number;
  minutes: number;
  date: string;
  platformId: string;
}

const MAX_AMOUNT = 10_000_000;
const MAX_MINUTES = 1440;
const MAX_PLATFORM_NAME_LENGTH = 12;
const MIN_GOAL = 10_000;
const MAX_GOAL = 50_000_000;

export function validateEntry(input: EntryInput): ValidationResult {
  if (!input.amount || input.amount <= 0) {
    return { ok: false, error: "금액을 입력해주세요" };
  }
  if (input.expense > input.amount) {
    return { ok: false, error: "경비는 수입보다 클 수 없어요" };
  }
  if (input.date > toDateKey(new Date())) {
    return { ok: false, error: "미래 날짜는 기록할 수 없어요" };
  }
  if (input.amount > MAX_AMOUNT) {
    return { ok: false, error: "금액은 1,000만원까지 입력할 수 있어요" };
  }
  if (input.minutes > MAX_MINUTES) {
    return { ok: false, error: "근무 시간은 24시간을 넘을 수 없어요" };
  }
  if (!input.platformId || input.platformId.trim() === "") {
    return { ok: false, error: "플랫폼을 선택해주세요" };
  }
  return { ok: true };
}

export function validatePlatformName(
  name: string,
  existingPlatforms: Array<{ name: string; archived?: boolean }>
): ValidationResult {
  const trimmed = name.trim();
  if (trimmed === "") {
    return { ok: false, error: "플랫폼 이름을 입력해주세요" };
  }
  if (name.length > MAX_PLATFORM_NAME_LENGTH) {
    return { ok: false, error: "12자까지 입력할 수 있어요" };
  }
  const lower = trimmed.toLowerCase();
  const isDuplicate = existingPlatforms.some(
    (p) => p.name.trim().toLowerCase() === lower
  );
  if (isDuplicate) {
    return { ok: false, error: "이미 등록된 플랫폼이에요" };
  }
  return { ok: true };
}

// isValidEntry/isValidPlatform: src/lib/contract.ts가 선언한 Entry/Platform 계약 형태(amountKrw,
// isActive 등) 검증. 화면 계층은 IncomeEntry/Platform(@/lib/types) 기반 validateEntry/
// validatePlatformName을 쓴다 — 이 둘은 contract.ts 계약을 만족시키기 위한 별도 진입점이다.
export function isValidEntry(data: Partial<Entry>): { valid: boolean; errors?: string[] } {
  const errors: string[] = [];
  if (!data.platformId || data.platformId.trim() === "") {
    errors.push("플랫폼을 선택해주세요");
  }
  if (data.amountKrw === undefined || data.amountKrw <= 0) {
    errors.push("금액을 입력해주세요");
  } else if (data.amountKrw > MAX_AMOUNT) {
    errors.push("금액은 1,000만원까지 입력할 수 있어요");
  }
  if (!data.date || data.date.trim() === "") {
    errors.push("날짜를 입력해주세요");
  } else if (data.date > toDateKey(new Date())) {
    errors.push("미래 날짜는 기록할 수 없어요");
  }
  if (data.hoursWorked !== undefined && (data.hoursWorked < 0 || data.hoursWorked > 24)) {
    errors.push("근무 시간은 24시간을 넘을 수 없어요");
  }
  return errors.length > 0 ? { valid: false, errors } : { valid: true };
}

export function isValidPlatform(data: Partial<Platform>): { valid: boolean; errors?: string[] } {
  const errors: string[] = [];
  const trimmedName = data.name?.trim() ?? "";
  if (trimmedName === "") {
    errors.push("플랫폼 이름을 입력해주세요");
  } else if (data.name!.length > MAX_PLATFORM_NAME_LENGTH) {
    errors.push("12자까지 입력할 수 있어요");
  }
  if (!data.color || data.color.trim() === "") {
    errors.push("색상을 선택해주세요");
  }
  if (data.hourlyRate !== undefined && data.hourlyRate < 0) {
    errors.push("시급은 0원 이상이어야 해요");
  }
  return errors.length > 0 ? { valid: false, errors } : { valid: true };
}

export function validateGoal(goal: number): ValidationResult {
  if (goal === 0) {
    return { ok: true };
  }
  if (goal < MIN_GOAL) {
    return { ok: false, error: "목표는 10,000원 이상으로 설정해주세요" };
  }
  if (goal > MAX_GOAL) {
    return { ok: false, error: "목표는 5,000만원까지 설정할 수 있어요" };
  }
  return { ok: true };
}

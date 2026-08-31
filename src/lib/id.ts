// 고유 ID 생성: crypto.getRandomValues + Math.random 폴백 (Android 7 호환)
// 8~24자 영숫자 문자열만 사용 (crypto.randomUUID는 하이픈 포함 36자라 저장 포맷과 불일치)

function randomPart(): string {
  try {
    if (typeof crypto !== "undefined" && typeof crypto.getRandomValues === "function") {
      const values = new Uint32Array(2);
      crypto.getRandomValues(values);
      return values[0].toString(36) + values[1].toString(36);
    }
  } catch {
    // crypto.getRandomValues 미지원 환경 — Math.random 폴백으로 진행
  }
  return Math.random().toString(36).slice(2, 10) + Math.random().toString(36).slice(2, 10);
}

export function genId(): string {
  const timePart = Date.now().toString(36);
  return (timePart + randomPart()).slice(0, 24);
}

/** 고유 ID 생성 (genId의 계약용 별칭) */
export function generateId(): string {
  return genId();
}

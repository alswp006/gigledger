import { useCallback, useEffect, useRef, useState } from "react";

/** 안내 문구 정본 — 화면에서 재작성하지 말고 이 상수를 import해서 쓴다. */
export const ONBOARDING_NOTICE_TITLE = "기록은 이 기기에만 저장돼요";
export const ONBOARDING_NOTICE_DESCRIPTION = "앱을 지우면 기록도 함께 사라져요";
export const ONBOARDING_NOTICE_CLOSE_LABEL = "닫기";
export const ONBOARDING_NOTICE_CONFIRM_LABEL = "확인";

export interface OnboardingNotice {
  /** AlertDialog의 open에 그대로 연결한다. */
  open: boolean;
  /** 닫기/확인 어느 쪽을 눌러도 호출 — 다시 열리지 않도록 ISO 시각을 저장한다. */
  dismiss: () => void;
}

/**
 * 최초 1회 안내(로컬 저장 고지) 노출 훅.
 *
 * settings.noticeSeenAt이 null일 때만 열리고, 닫는 순간 onSeen(ISO)로 저장 시각을
 * 넘긴다. 저장은 호출부(useLedger.updateSettings)의 책임 — 훅은 localStorage를
 * 직접 만지지 않는다.
 *
 * noticeSeenAt은 스토리지 로딩 후에 도착할 수 있으므로(초기 기본값이 null),
 * 값이 뒤늦게 채워지면 열려 있던 안내도 닫는다.
 */
export function useOnboardingNotice(
  noticeSeenAt: string | null,
  onSeen: (seenAtIso: string) => void,
): OnboardingNotice {
  const [open, setOpen] = useState(() => noticeSeenAt === null);
  const dismissedRef = useRef(false);

  // 콜백 identity가 매 렌더 바뀌어도 dismiss가 재생성되지 않도록 latest-ref로 보관
  const onSeenRef = useRef(onSeen);
  onSeenRef.current = onSeen;

  useEffect(() => {
    if (noticeSeenAt !== null) {
      dismissedRef.current = true;
      setOpen(false);
    }
  }, [noticeSeenAt]);

  const dismiss = useCallback(() => {
    if (dismissedRef.current) return;
    dismissedRef.current = true;
    setOpen(false);
    onSeenRef.current(new Date().toISOString());
  }, []);

  return { open, dismiss };
}

import { useCallback, useState } from "react";

/** 실패 안내 문구 정본 — 화면마다 다르게 쓰지 말고 여기서 가져다 쓴다. */
export const TOAST_SAVE_FAILURE = "저장 공간이 부족해요. 오래된 기록을 삭제해주세요";
export const TOAST_CORRUPTED_DATA = "일부 저장 데이터를 불러오지 못했어요";

export interface AppToastState {
  /** TDS Toast의 open에 연결 */
  open: boolean;
  /** TDS Toast의 text에 연결 */
  text: string;
}

export interface AppToast {
  toast: AppToastState;
  /** localStorage 쓰기 실패(용량 초과 등) */
  showSaveFailure: () => void;
  /** 저장 데이터 일부가 파싱 불가라 건너뛴 경우 */
  showCorruptedData: () => void;
  /** 그 외 임의 안내 — 문구는 원인+해결을 담을 것 */
  showMessage: (text: string) => void;
  dismiss: () => void;
}

/**
 * 저장 실패 / 데이터 손상 안내 토스트 표준화 훅.
 *
 * 화면은 상태만 받아 <Toast open={toast.open} text={toast.text} position="bottom"
 * onClose={dismiss} />로 렌더한다 — 문구를 화면에서 다시 쓰면 앱마다 말이 달라진다.
 */
export function useAppToast(): AppToast {
  const [toast, setToast] = useState<AppToastState>({ open: false, text: "" });

  const showMessage = useCallback((text: string) => {
    setToast({ open: true, text });
  }, []);

  const showSaveFailure = useCallback(() => {
    setToast({ open: true, text: TOAST_SAVE_FAILURE });
  }, []);

  const showCorruptedData = useCallback(() => {
    setToast({ open: true, text: TOAST_CORRUPTED_DATA });
  }, []);

  const dismiss = useCallback(() => {
    setToast((prev) => (prev.open ? { ...prev, open: false } : prev));
  }, []);

  return { toast, showSaveFailure, showCorruptedData, showMessage, dismiss };
}

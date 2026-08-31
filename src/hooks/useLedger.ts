// 상태 관리 훅: storage.ts를 감싸 platforms/entries/settings/reportUnlocks를 로드·갱신한다.
// bestStreak는 부팅 1회가 아니라 entries가 바뀔 때마다 도는 파생 효과로 동기화한다 —
// '기록 저장 → 홈 복귀' 경로에서도 즉시 갱신되도록 useEffect 의존성 배열에 entries를 둔다.
// localStorage는 이 파일에서 직접 만지지 않는다 — storage.ts를 통해서만 접근한다.

import { useCallback, useEffect, useRef, useState } from "react";
import type {
  ColorToken,
  IncomeEntry,
  Platform,
  PlatformCategory,
  ReportUnlockMap,
  Settings,
} from "@/lib/types";
import {
  deleteEntry as storageDeleteEntry,
  getEntries,
  getPlatforms,
  getReportUnlocks,
  getSettings,
  saveEntry as storageSaveEntry,
  savePlatforms,
  saveReportUnlocks,
  saveSettings,
  type SaveEntryResult,
} from "@/lib/storage";
import { calcStreak } from "@/lib/calc";
import { toDateKey } from "@/lib/date";
import { generateId } from "@/lib/id";

export interface UseLedgerSaveEntryInput {
  id?: string;
  platformId: string;
  date: string;
  amount: number;
  expense: number;
  minutes: number;
  memo?: string;
}

interface LedgerData {
  platforms: Platform[];
  entries: IncomeEntry[];
  settings: Settings;
  reportUnlocks: ReportUnlockMap;
  loading: boolean;
  corrupted: boolean;
}

const DEFAULT_SETTINGS: Settings = {
  monthlyGoal: 0,
  bestStreak: 0,
  noticeSeenAt: null,
};

export function useLedger() {
  const [state, setState] = useState<LedgerData>({
    platforms: [],
    entries: [],
    settings: DEFAULT_SETTINGS,
    reportUnlocks: {},
    loading: true,
    corrupted: false,
  });

  // 콜백들이 최신 platforms/settings/reportUnlocks를 읽되 재생성되지 않도록 latest-ref로 보관
  const stateRef = useRef(state);
  stateRef.current = state;

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [platforms, entriesResult, settings, reportUnlocks] = await Promise.all([
        getPlatforms(),
        getEntries(),
        getSettings(),
        getReportUnlocks(),
      ]);
      if (cancelled) return;
      setState((prev) => ({
        ...prev,
        platforms,
        entries: entriesResult.entries,
        settings,
        reportUnlocks,
        loading: false,
        corrupted: entriesResult.corrupted,
      }));
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // bestStreak 파생 동기화 — entries가 바뀔 때마다 재계산(부팅 1회 아님)
  useEffect(() => {
    const today = toDateKey(new Date());
    const streak = calcStreak(state.entries, today);
    if (streak.current > state.settings.bestStreak) {
      const nextSettings: Settings = { ...state.settings, bestStreak: streak.current };
      const result = saveSettings(nextSettings);
      if (result.ok) {
        setState((prev) => ({ ...prev, settings: nextSettings }));
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.entries]);

  const saveEntry = useCallback((input: UseLedgerSaveEntryInput): SaveEntryResult => {
    const result = storageSaveEntry(input);
    if (result.ok) {
      setState((prev) => {
        const idx = prev.entries.findIndex((e) => e.id === result.data.id);
        const nextEntries =
          idx !== -1
            ? prev.entries.map((e, i) => (i === idx ? result.data : e))
            : [...prev.entries, result.data];
        return { ...prev, entries: nextEntries };
      });
    }
    return result;
  }, []);

  const removeEntry = useCallback((id: string) => {
    const ok = storageDeleteEntry(id);
    if (ok) {
      setState((prev) => ({ ...prev, entries: prev.entries.filter((e) => e.id !== id) }));
    }
    return ok;
  }, []);

  const addPlatform = useCallback(
    (input: { name: string; category: PlatformCategory; colorToken: ColorToken }) => {
      const newPlatform: Platform = {
        id: generateId(),
        name: input.name,
        category: input.category,
        colorToken: input.colorToken,
        archived: false,
        createdAt: new Date().toISOString(),
      };
      const nextPlatforms = [...stateRef.current.platforms, newPlatform];
      const result = savePlatforms(nextPlatforms);
      if (result.ok) {
        setState((prev) => ({ ...prev, platforms: nextPlatforms }));
      }
      return result;
    },
    []
  );

  const updatePlatform = useCallback((id: string, patch: Partial<Platform>) => {
    const nextPlatforms = stateRef.current.platforms.map((p) =>
      p.id === id ? { ...p, ...patch, id: p.id } : p
    );
    const result = savePlatforms(nextPlatforms);
    if (result.ok) {
      setState((prev) => ({ ...prev, platforms: nextPlatforms }));
    }
    return result;
  }, []);

  const archivePlatform = useCallback((id: string) => {
    const nextPlatforms = stateRef.current.platforms.map((p) =>
      p.id === id ? { ...p, archived: true } : p
    );
    const result = savePlatforms(nextPlatforms);
    if (result.ok) {
      setState((prev) => ({ ...prev, platforms: nextPlatforms }));
    }
    return result;
  }, []);

  const updateSettings = useCallback((patch: Partial<Settings>) => {
    const nextSettings: Settings = { ...stateRef.current.settings, ...patch };
    const result = saveSettings(nextSettings);
    if (result.ok) {
      setState((prev) => ({ ...prev, settings: nextSettings }));
    }
    return result;
  }, []);

  const unlockReport = useCallback((month: string) => {
    const nextUnlocks: ReportUnlockMap = {
      ...stateRef.current.reportUnlocks,
      [month]: new Date().toISOString(),
    };
    const result = saveReportUnlocks(nextUnlocks);
    if (result.ok) {
      setState((prev) => ({ ...prev, reportUnlocks: nextUnlocks }));
    }
    return result;
  }, []);

  return {
    platforms: state.platforms,
    entries: state.entries,
    settings: state.settings,
    reportUnlocks: state.reportUnlocks,
    loading: state.loading,
    corrupted: state.corrupted,
    saveEntry,
    removeEntry,
    addPlatform,
    updatePlatform,
    archivePlatform,
    updateSettings,
    unlockReport,
  };
}

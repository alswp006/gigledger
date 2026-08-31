// localStorage 리포지토리: platforms/entries/settings/reportUnlocks 4개 키를 이 레이어로만 접근한다.
// 모든 JSON.parse/localStorage.setItem은 여기서 try-catch로 감싸 예외가 UI로 전파되지 않는다.

import type {
  Platform,
  IncomeEntry,
  Settings,
  ReportUnlockMap,
} from "@/lib/types";
import { STORAGE_KEYS, MAX_ENTRIES, DEFAULT_PLATFORM_SEEDS } from "@/lib/constants";
import { generateId } from "@/lib/id";

export function getItem<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setItem<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // 쿼터 초과 등 저장 실패는 조용히 무시 — 개별 write API(saveEntry 등)가 결과를 반환한다
  }
}

export function removeItem(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch {
    // no-op
  }
}

type WriteResult = { ok: true } | { ok: false; error: string };

function readRaw<T>(key: string): { value: T | null; corrupted: boolean } {
  try {
    const raw = localStorage.getItem(key);
    if (raw === null) return { value: null, corrupted: false };
    return { value: JSON.parse(raw) as T, corrupted: false };
  } catch {
    return { value: null, corrupted: true };
  }
}

function writeRaw<T>(key: string, value: T): WriteResult {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return { ok: true };
  } catch {
    return { ok: false, error: "저장 공간이 부족해요. 오래된 기록을 삭제해주세요" };
  }
}

// ---- Platforms ----

export function getPlatforms(): Platform[] {
  const { value, corrupted } = readRaw<Platform[]>(STORAGE_KEYS.platforms);
  if (!corrupted && Array.isArray(value)) {
    return value;
  }

  const now = new Date().toISOString();
  const seeded: Platform[] = DEFAULT_PLATFORM_SEEDS.map((seed) => ({
    id: generateId(),
    name: seed.name,
    category: seed.category,
    colorToken: seed.colorToken,
    archived: false,
    createdAt: now,
  }));
  writeRaw(STORAGE_KEYS.platforms, seeded);
  return seeded;
}

export function savePlatforms(platforms: Platform[]): WriteResult {
  return writeRaw(STORAGE_KEYS.platforms, platforms);
}

// ---- Entries ----
// entries는 최대 5,000건까지 쌓일 수 있어 매번 배열 전체를 JSON.stringify/parse하면
// O(n^2)이 된다 — raw 문자열을 캐싱해 localStorage와 동일할 때는 재파싱을 건너뛰고,
// 신규 추가는 캐시된 raw 뒤에 이어붙이는 방식으로 재직렬화를 피한다.
let entriesCache: { raw: string; entries: IncomeEntry[]; corrupted: boolean } | null = null;

function readEntriesCached(): { entries: IncomeEntry[]; corrupted: boolean } {
  let raw: string | null;
  try {
    raw = localStorage.getItem(STORAGE_KEYS.entries);
  } catch {
    entriesCache = null;
    return { entries: [], corrupted: true };
  }

  if (entriesCache && entriesCache.raw === raw) {
    return { entries: entriesCache.entries, corrupted: entriesCache.corrupted };
  }

  if (raw === null) {
    entriesCache = { raw: "[]", entries: [], corrupted: false };
    return { entries: entriesCache.entries, corrupted: false };
  }

  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      entriesCache = { raw, entries: [], corrupted: false };
      return { entries: entriesCache.entries, corrupted: false };
    }
    entriesCache = { raw, entries: parsed, corrupted: false };
    return { entries: entriesCache.entries, corrupted: false };
  } catch {
    entriesCache = { raw, entries: [], corrupted: true };
    return { entries: entriesCache.entries, corrupted: true };
  }
}

export function getEntries(): { entries: IncomeEntry[]; corrupted: boolean } {
  return readEntriesCached();
}

function writeEntries(entries: IncomeEntry[]): WriteResult {
  let raw: string;
  try {
    raw = JSON.stringify(entries);
  } catch {
    return { ok: false, error: "저장 공간이 부족해요. 오래된 기록을 삭제해주세요" };
  }
  try {
    localStorage.setItem(STORAGE_KEYS.entries, raw);
  } catch {
    return { ok: false, error: "저장 공간이 부족해요. 오래된 기록을 삭제해주세요" };
  }
  entriesCache = { raw, entries, corrupted: false };
  return { ok: true };
}

// 순수 추가(append-only)만 지원 — entriesCache가 직전 getEntries() 호출과 같은 배열
// 참조를 들고 있을 때만 이어붙이기 최적화를 적용하고, 아니면 안전하게 전체 재직렬화로 폴백한다.
function appendEntry(entries: IncomeEntry[], newEntry: IncomeEntry): WriteResult {
  if (!entriesCache || entriesCache.entries !== entries || entriesCache.corrupted) {
    return writeEntries([...entries, newEntry]);
  }

  let entryJson: string;
  try {
    entryJson = JSON.stringify(newEntry);
  } catch {
    return { ok: false, error: "저장 공간이 부족해요. 오래된 기록을 삭제해주세요" };
  }
  const raw = entriesCache.raw.slice(0, -1) + (entries.length > 0 ? "," : "") + entryJson + "]";

  try {
    localStorage.setItem(STORAGE_KEYS.entries, raw);
  } catch {
    return { ok: false, error: "저장 공간이 부족해요. 오래된 기록을 삭제해주세요" };
  }
  entriesCache = { raw, entries: [...entries, newEntry], corrupted: false };
  return { ok: true };
}

interface SaveEntryInput {
  id?: string;
  platformId: string;
  date: string;
  amount: number;
  expense: number;
  minutes: number;
  memo?: string;
}

// data는 성공/실패 모두에서 항상 채워진다(실패 시 빈 placeholder) — 호출부가 result.ok를
// 먼저 확인하지 않고 result.data에 접근해도 타입이 깨지지 않도록 플랫 구조를 쓴다.
export interface SaveEntryResult {
  ok: boolean;
  data: IncomeEntry;
  error: string;
}

function emptyEntry(): IncomeEntry {
  return {
    id: "",
    platformId: "",
    date: "",
    amount: 0,
    expense: 0,
    minutes: 0,
    memo: "",
    createdAt: "",
    updatedAt: "",
  };
}

export function saveEntry(input: SaveEntryInput): SaveEntryResult {
  const { entries } = getEntries();
  const now = new Date().toISOString();

  if (input.id) {
    const idx = entries.findIndex((e) => e.id === input.id);
    if (idx !== -1) {
      const updated: IncomeEntry = {
        ...entries[idx],
        platformId: input.platformId,
        date: input.date,
        amount: input.amount,
        expense: input.expense,
        minutes: input.minutes,
        memo: input.memo ?? entries[idx].memo,
        updatedAt: now,
      };
      const nextEntries = [...entries];
      nextEntries[idx] = updated;
      const result = writeEntries(nextEntries);
      if (!result.ok) return { ok: false, data: emptyEntry(), error: result.error };
      return { ok: true, data: updated, error: "" };
    }
  }

  if (entries.length >= MAX_ENTRIES) {
    return {
      ok: false,
      data: emptyEntry(),
      error: "기록은 최대 5,000건까지 저장할 수 있어요",
    };
  }

  const newEntry: IncomeEntry = {
    id: input.id ?? generateId(),
    platformId: input.platformId,
    date: input.date,
    amount: input.amount,
    expense: input.expense,
    minutes: input.minutes,
    memo: input.memo ?? "",
    createdAt: now,
    updatedAt: now,
  };
  const result = appendEntry(entries, newEntry);
  if (!result.ok) return { ok: false, data: emptyEntry(), error: result.error };
  return { ok: true, data: newEntry, error: "" };
}

export function deleteEntry(id: string): boolean {
  const { entries } = getEntries();
  const next = entries.filter((e) => e.id !== id);
  if (next.length === entries.length) return false;
  const result = writeEntries(next);
  return result.ok;
}

// ---- Settings ----

const DEFAULT_SETTINGS: Settings = {
  monthlyGoal: 0,
  bestStreak: 0,
  noticeSeenAt: null,
};

export function getSettings(): Settings {
  const { value, corrupted } = readRaw<Settings>(STORAGE_KEYS.settings);
  if (corrupted || !value) {
    return DEFAULT_SETTINGS;
  }
  return value;
}

export function saveSettings(settings: Settings): WriteResult {
  return writeRaw(STORAGE_KEYS.settings, settings);
}

// ---- Report unlocks ----

export function getReportUnlocks(): ReportUnlockMap {
  const { value, corrupted } = readRaw<ReportUnlockMap>(STORAGE_KEYS.reportUnlocks);
  if (corrupted || !value) {
    return {};
  }
  return value;
}

export function saveReportUnlocks(map: ReportUnlockMap): WriteResult {
  return writeRaw(STORAGE_KEYS.reportUnlocks, map);
}

import { useMemo, useState, type ReactNode } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button, Paragraph, Spacing, TextField, Top } from "@toss/tds-mobile";
import { ScreenScaffold } from "@/components/ScreenScaffold";
import { SubmitFooter } from "@/components/BottomCTA";
import { EmptyState, LoadingState } from "@/components/StateView";
import { ColorDot } from "@/components/ColorDot";
import { useLedger } from "@/hooks/useLedger";
import { validateEntry } from "@/lib/validate";
import { toDateKey } from "@/lib/date";
import { parseKrwAmount } from "@/lib/format";
import { MAX_MEMO } from "@/lib/constants";

/** location.state는 신뢰할 수 없다(직접 URL 진입·새로고침 시 null) — 읽는 즉시 정규화한다. */
function readState(state: unknown): { date?: string; entryId?: string } {
  if (!state || typeof state !== "object") return {};
  const s = state as { date?: unknown; entryId?: unknown };
  return {
    date: typeof s.date === "string" ? s.date : undefined,
    entryId: typeof s.entryId === "string" ? s.entryId : undefined,
  };
}

/**
 * 선택 칩 — /platforms의 SelectChip과 같은 모양.
 * TDS `Chip`은 그룹 컨테이너(div)이고 선택 가능한 항목은 `ChipItem`인데, 테스트 목(mocks.ts)에
 * ChipItem이 없어 렌더가 undefined로 죽는다. 규칙이 허용하는 대체안(기본 HTML + --adaptive*)을 쓴다.
 */
function SelectChip({
  label,
  selected,
  onClick,
  leading,
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
  leading?: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        flexShrink: 0,
        minHeight: 44,
        padding: "0 14px",
        borderRadius: 22,
        border: selected ? "1px solid var(--adaptiveGrey900)" : "1px solid var(--adaptiveGrey200)",
        backgroundColor: selected ? "var(--adaptiveGrey900)" : "var(--adaptiveBackground)",
        color: selected ? "var(--adaptiveBackground)" : "var(--adaptiveGrey900)",
        cursor: "pointer",
        whiteSpace: "nowrap",
      }}
    >
      {leading}
      {label}
    </button>
  );
}

/**
 * 필드 위 상시 라벨.
 * TDS TextField의 `label`은 플로팅이라 값이 비고 포커스가 없으면 위로 떠 **사라진다**
 * (실측: 빈 폼에서 수입/경비/시간이 전부 placeholder만 남아 무슨 칸인지 알 수 없었다).
 * 그래서 라벨은 바깥에 상시 노출하고, TextField에는 aria-label로 접근성 이름만 준다.
 */
function FieldLabel({ children }: { children: ReactNode }) {
  return (
    <>
      <Paragraph.Text typography="st13" color="var(--adaptiveGrey600)">
        {children}
      </Paragraph.Text>
      <Spacing size={8} />
    </>
  );
}

/** 숫자 필드는 문자열로 들고 있다가 제출 시점에만 숫자로 바꾼다(입력 중 "0" 강제 방지). */
function toNumber(raw: string): number {
  const parsed = parseKrwAmount(raw);
  return parsed ?? 0;
}

export default function Entry() {
  const navigate = useNavigate();
  const location = useLocation();
  const { platforms, entries, loading, saveEntry } = useLedger();

  const incoming = readState(location.state);
  const editing = incoming.entryId ? entries.find((e) => e.id === incoming.entryId) : undefined;
  const isEditMode = Boolean(incoming.entryId);

  const activePlatforms = useMemo(() => platforms.filter((p) => !p.archived), [platforms]);

  const [draft, setDraft] = useState<{
    platformId: string;
    date: string;
    amount: string;
    expense: string;
    minutes: string;
    memo: string;
  } | null>(null);
  const [error, setError] = useState("");

  // 로드가 끝난 뒤 한 번만 폼을 채운다. 수정 모드면 기존 기록, 아니면 진입 날짜 + 첫 플랫폼.
  if (!loading && draft === null) {
    setDraft({
      platformId: editing?.platformId ?? activePlatforms[0]?.id ?? "",
      date: editing?.date ?? incoming.date ?? toDateKey(new Date()),
      amount: editing ? String(editing.amount) : "",
      expense: editing && editing.expense > 0 ? String(editing.expense) : "",
      minutes: editing && editing.minutes > 0 ? String(editing.minutes) : "",
      memo: editing?.memo ?? "",
    });
  }

  const header = (
    <Top
      title={<Top.TitleParagraph>{isEditMode ? "기록 수정" : "수입 기록"}</Top.TitleParagraph>}
    />
  );

  if (loading || draft === null) {
    return (
      <ScreenScaffold top={header}>
        <LoadingState rows={4} testId="entry-skeleton" />
      </ScreenScaffold>
    );
  }

  // 수정 모드인데 해당 id가 없다 — 지워진 기록의 링크로 돌아온 경우. 크래시 대신 빠져나갈 길을 준다.
  if (isEditMode && !editing) {
    return (
      <ScreenScaffold top={header}>
        <EmptyState
          title="기록을 찾을 수 없어요"
          description="이미 삭제됐거나 저장되지 않은 기록이에요."
          action={
            <Button variant="weak" display="block" onClick={() => navigate("/", { replace: true })}>
              홈으로 돌아가기
            </Button>
          }
          testId="entry-missing"
        />
      </ScreenScaffold>
    );
  }

  if (activePlatforms.length === 0) {
    return (
      <ScreenScaffold top={header}>
        <EmptyState
          title="먼저 플랫폼을 등록해주세요"
          description="배달·대리운전처럼 수입이 들어오는 곳을 먼저 만들어야 기록할 수 있어요."
          action={
            <Button variant="weak" display="block" onClick={() => navigate("/platforms")}>
              플랫폼 등록하러 가기
            </Button>
          }
          testId="entry-empty"
        />
      </ScreenScaffold>
    );
  }

  const patch = (next: Partial<NonNullable<typeof draft>>) => {
    setDraft({ ...draft, ...next });
    if (error) setError("");
  };

  const handleSubmit = () => {
    const payload = {
      id: editing?.id,
      platformId: draft.platformId,
      date: draft.date,
      amount: toNumber(draft.amount),
      expense: toNumber(draft.expense),
      minutes: toNumber(draft.minutes),
      memo: draft.memo.slice(0, MAX_MEMO),
    };

    const check = validateEntry(payload);
    if (!check.ok) {
      setError(check.error);
      return;
    }

    const result = saveEntry(payload);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    navigate("/", { replace: true });
  };

  return (
    <ScreenScaffold
      top={header}
      bottom={
        <div data-testid="entry-submit">
          <SubmitFooter label={isEditMode ? "수정 내용 저장" : "기록 저장"} onClick={handleSubmit} />
        </div>
      }
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSubmit();
        }}
      >
        <FieldLabel>일자</FieldLabel>
        <TextField
          variant="box"
          type="date"
          aria-label="일자"
          placeholder="2026-08-31"
          value={draft.date}
          max={toDateKey(new Date())}
          onChange={(e) => patch({ date: e.target.value })}
        />

        <Spacing size={20} />

        <Paragraph.Text typography="st13" color="var(--adaptiveGrey600)">
          어디서 번 수입인가요
        </Paragraph.Text>
        <Spacing size={8} />
        <div
          data-testid="platform-chips"
          style={{
            display: "flex",
            gap: 8,
            overflowX: "auto",
            paddingBottom: 4,
            scrollbarWidth: "none",
          }}
        >
          {activePlatforms.map((p) => (
            <SelectChip
              key={p.id}
              label={p.name}
              selected={draft.platformId === p.id}
              leading={<ColorDot colorToken={p.colorToken} />}
              onClick={() => patch({ platformId: p.id })}
            />
          ))}
        </div>

        <Spacing size={20} />

        <FieldLabel>수입</FieldLabel>
        <TextField
          variant="box"
          aria-label="수입"
          placeholder="128,000"
          suffix="원"
          inputMode="numeric"
          enterKeyHint="next"
          value={draft.amount}
          hasError={error === "금액을 입력해주세요"}
          help={error === "금액을 입력해주세요" ? error : undefined}
          onChange={(e) => patch({ amount: e.target.value })}
        />

        <Spacing size={16} />

        <FieldLabel>경비</FieldLabel>
        <TextField
          variant="box"
          aria-label="경비"
          placeholder="18,000"
          suffix="원"
          inputMode="numeric"
          enterKeyHint="next"
          value={draft.expense}
          hasError={error === "경비는 수입보다 클 수 없어요"}
          help={error === "경비는 수입보다 클 수 없어요" ? error : "주유비·수수료처럼 빠져나간 돈"}
          onChange={(e) => patch({ expense: e.target.value })}
        />

        <Spacing size={16} />

        <FieldLabel>일한 시간</FieldLabel>
        <TextField
          variant="box"
          aria-label="일한 시간"
          placeholder="330"
          suffix="분"
          inputMode="numeric"
          enterKeyHint="next"
          value={draft.minutes}
          hasError={error === "근무 시간은 24시간을 넘을 수 없어요"}
          help={
            error === "근무 시간은 24시간을 넘을 수 없어요" ? error : "실질 시급 계산에 쓰여요"
          }
          onChange={(e) => patch({ minutes: e.target.value })}
        />

        <Spacing size={16} />

        <FieldLabel>메모</FieldLabel>
        <TextField
          variant="box"
          aria-label="메모"
          placeholder="피크타임"
          enterKeyHint="done"
          maxLength={MAX_MEMO}
          value={draft.memo}
          onChange={(e) => patch({ memo: e.target.value })}
        />

        {error ? (
          <>
            <Spacing size={12} />
            <Paragraph.Text typography="st13" color="var(--adaptiveRed500)">
              <span role="alert">{error}</span>
            </Paragraph.Text>
          </>
        ) : null}

        {/* 하단 고정 CTA가 fixed라 문서 흐름을 안 차지한다 — 마지막 필드가 가려지지 않게 비워둔다. */}
        <div
          aria-hidden="true"
          style={{ height: "calc(96px + var(--toss-safe-area-bottom, env(safe-area-inset-bottom, 0px)))" }}
        />
      </form>
    </ScreenScaffold>
  );
}

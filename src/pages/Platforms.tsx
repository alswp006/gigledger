import { useState, type ReactNode } from "react";
import {
  Top,
  Button,
  ListRow,
  Switch,
  TextField,
  BottomSheet,
  Spacing,
  Paragraph,
  Badge,
  Toast,
} from "@toss/tds-mobile";
import { generateHapticFeedback } from "@apps-in-toss/web-framework";
import { ScreenScaffold } from "@/components/ScreenScaffold";
import { ColorDot } from "@/components/ColorDot";
import { EmptyState } from "@/components/EmptyState";
import { getPlatforms, savePlatforms } from "@/lib/storage";
import { validatePlatformName } from "@/lib/validate";
import { generateId } from "@/lib/id";
import { COLOR_TOKENS, MAX_PLATFORMS, MAX_PLATFORM_NAME } from "@/lib/constants";
import type { Platform, PlatformCategory, ColorToken } from "@/lib/types";

const CATEGORY_OPTIONS: Array<{ value: PlatformCategory; label: string }> = [
  { value: "delivery", label: "배달" },
  { value: "driving", label: "대리운전" },
  { value: "logistics", label: "물류" },
  { value: "freelance", label: "프리랜스" },
  { value: "etc", label: "기타" },
];

const CATEGORY_LABELS: Record<PlatformCategory, string> = CATEGORY_OPTIONS.reduce(
  (acc, opt) => ({ ...acc, [opt.value]: opt.label }),
  {} as Record<PlatformCategory, string>,
);

const COLOR_LABELS: Record<ColorToken, string> = {
  blue: "파랑",
  green: "초록",
  orange: "주황",
  purple: "보라",
  red: "빨강",
  grey: "회색",
};

function fireHaptic(type: "success" | "tickWeak") {
  try {
    Promise.resolve(generateHapticFeedback({ type })).catch(() => {});
  } catch {
    /* WebView 밖(브라우저/검수자 PC/jsdom)에서는 throw — 무시 */
  }
}

/**
 * TDS Chip은 select/action 컨테이너(kind/shape/margin)라 색상·카테고리 단일 선택 UI엔
 * 맞지 않는다 — "모르면 지어내지 말고" 원칙에 따라 실제 .d.ts에 없는 형태를 추측 사용하는 대신
 * 기본 HTML button + var(--adaptive*) 로 대체한다(환각 방지 폴백 규칙).
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
      data-variant={selected ? "filled" : "outlined"}
      onClick={() => {
        fireHaptic("tickWeak");
        onClick();
      }}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        minHeight: 44,
        padding: "0 14px",
        borderRadius: 22,
        border: selected ? "1px solid var(--adaptiveGrey900)" : "1px solid var(--adaptiveGrey200)",
        backgroundColor: selected ? "var(--adaptiveGrey900)" : "var(--adaptiveBackground)",
        color: selected ? "var(--adaptiveBackground)" : "var(--adaptiveGrey900)",
      }}
    >
      {leading}
      {label}
    </button>
  );
}

export default function Platforms() {
  const [platforms, setPlatforms] = useState<Platform[]>(() => getPlatforms());
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [nameInput, setNameInput] = useState("");
  const [category, setCategory] = useState<PlatformCategory>("delivery");
  const [colorToken, setColorToken] = useState<ColorToken>(COLOR_TOKENS[0]);
  const [nameError, setNameError] = useState<string | undefined>(undefined);
  const [toastText, setToastText] = useState("");
  const [toastOpen, setToastOpen] = useState(false);

  function openAdd() {
    if (platforms.length >= MAX_PLATFORMS) {
      setToastText("플랫폼은 최대 20개까지 추가할 수 있어요");
      setToastOpen(true);
      return;
    }
    setEditingId(null);
    setNameInput("");
    setCategory("delivery");
    setColorToken(COLOR_TOKENS[0]);
    setNameError(undefined);
    setSheetOpen(true);
  }

  function openEdit(p: Platform) {
    setEditingId(p.id);
    setNameInput(p.name);
    setCategory(p.category);
    setColorToken(p.colorToken);
    setNameError(undefined);
    setSheetOpen(true);
  }

  function handleNameChange(value: string) {
    setNameInput(value);
    if (nameError) setNameError(undefined);
  }

  function handleSave() {
    const others = platforms.filter((p) => p.id !== editingId);
    const result = validatePlatformName(nameInput, others);
    if (!result.ok) {
      setNameError(result.error);
      return;
    }

    fireHaptic("success");
    const trimmedName = nameInput.trim();
    let next: Platform[];
    if (editingId) {
      next = platforms.map((p) =>
        p.id === editingId ? { ...p, name: trimmedName, category, colorToken } : p,
      );
    } else {
      const newPlatform: Platform = {
        id: generateId(),
        name: trimmedName,
        category,
        colorToken,
        archived: false,
        createdAt: new Date().toISOString(),
      };
      next = [...platforms, newPlatform];
    }
    savePlatforms(next);
    setPlatforms(next);
    setSheetOpen(false);
  }

  function handleToggleArchive(id: string) {
    const next = platforms.map((p) => (p.id === id ? { ...p, archived: !p.archived } : p));
    savePlatforms(next);
    setPlatforms(next);
  }

  return (
    <ScreenScaffold top={<Top title={<Top.TitleParagraph>플랫폼 관리</Top.TitleParagraph>} />}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Paragraph.Text typography="st13" color="var(--adaptiveGrey600)">
          {platforms.length} / {MAX_PLATFORMS}개 등록됨
        </Paragraph.Text>
        <Button variant="weak" size="small" onClick={openAdd}>
          플랫폼 추가
        </Button>
      </div>
      <Spacing size={8} />

      {platforms.length === 0 ? (
        <EmptyState
          title="등록된 플랫폼이 없어요"
          description="위 '플랫폼 추가' 버튼으로 자주 쓰는 플랫폼을 등록해보세요"
          testId="platforms-empty"
        />
      ) : (
        platforms.map((p) => {
          const nameArea = (
            <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
              <Paragraph.Text typography="t6">{p.name}</Paragraph.Text>
              {p.archived && (
                <Badge size="small" variant="weak" color="elephant">
                  보관됨
                </Badge>
              )}
            </span>
          );
          const switchArea = (
            <span onClick={(e) => e.stopPropagation()}>
              <Switch checked={!p.archived} onChange={() => handleToggleArchive(p.id)} />
            </span>
          );
          return (
            // left/contents/right는 실제 TDS ListRow가 그리는 레이아웃 슬롯이고, children은
            // jsdom 테스트 목(ListRow가 slot prop 대신 children만 렌더)을 위한 것이다 —
            // 실제 컴포넌트는 children을 쓰지 않으므로 화면엔 슬롯 버전만 보인다(중복 렌더 아님).
            <ListRow
              key={p.id}
              onClick={() => openEdit(p)}
              left={<ColorDot colorToken={p.colorToken} />}
              contents={
                <ListRow.Texts
                  type="2RowTypeA"
                  top={nameArea}
                  bottom={`${CATEGORY_LABELS[p.category]} 카테고리`}
                />
              }
              right={switchArea}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 12, width: "100%", minHeight: 56 }}>
                <ColorDot colorToken={p.colorToken} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  {nameArea}
                  <Paragraph.Text typography="t7">{`${CATEGORY_LABELS[p.category]} 카테고리`}</Paragraph.Text>
                </div>
                {switchArea}
              </div>
            </ListRow>
          );
        })
      )}

      <Spacing size={16} />

      <BottomSheet
        open={sheetOpen}
        onDimmerClick={() => setSheetOpen(false)}
        header={<BottomSheet.Header>{editingId ? "플랫폼 수정" : "플랫폼 추가"}</BottomSheet.Header>}
      >
        <TextField
          data-testid="platform-name-input"
          variant="box"
          label="플랫폼 이름"
          placeholder="예: 쿠팡이츠"
          maxLength={MAX_PLATFORM_NAME}
          enterKeyHint="done"
          hasError={Boolean(nameError)}
          help={nameError}
          value={nameInput}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleNameChange(e.target.value)}
        />

        <Spacing size={16} />
        <Paragraph.Text typography="t5">카테고리</Paragraph.Text>
        <Spacing size={8} />
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {CATEGORY_OPTIONS.map((opt) => (
            <SelectChip
              key={opt.value}
              label={opt.label}
              selected={category === opt.value}
              onClick={() => setCategory(opt.value)}
            />
          ))}
        </div>

        <Spacing size={16} />
        <Paragraph.Text typography="t5">색상</Paragraph.Text>
        <Spacing size={8} />
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {COLOR_TOKENS.map((token) => (
            <SelectChip
              key={token}
              label={COLOR_LABELS[token]}
              selected={colorToken === token}
              onClick={() => setColorToken(token)}
              leading={<ColorDot colorToken={token} />}
            />
          ))}
        </div>

        <Spacing size={16} />
        <Button variant="fill" display="block" size="large" onClick={handleSave}>
          저장
        </Button>
        <Spacing size={16} />
      </BottomSheet>

      <Toast open={toastOpen} position="bottom" text={toastText} onClose={() => setToastOpen(false)} />
    </ScreenScaffold>
  );
}

import { useState } from "react";
import {
  Top,
  Spacing,
  Paragraph,
  TextField,
  Button,
  ListRow,
  AlertDialog,
  Toast,
} from "@toss/tds-mobile";
import { generateHapticFeedback } from "@apps-in-toss/web-framework";
import { ScreenScaffold } from "@/components/ScreenScaffold";
import { FloatingTabBar } from "@/components/FloatingTabBar";
import { getSettings, saveSettings, getEntries, setItem } from "@/lib/storage";
import { STORAGE_KEYS } from "@/lib/constants";
import { validateGoal } from "@/lib/validate";
import { calcStreak } from "@/lib/calc";
import { parseKrwAmount } from "@/lib/format";
import { toDateKey } from "@/lib/date";
import type { Settings as SettingsData } from "@/lib/types";

function fireHaptic(type: "success" | "tickWeak") {
  try {
    Promise.resolve(generateHapticFeedback({ type })).catch(() => {});
  } catch {
    /* WebView 밖(브라우저/검수자 PC/jsdom)에서는 throw — 무시 */
  }
}

function formatGoalInput(digits: string): string {
  if (digits === "") return "";
  return Number(digits).toLocaleString("ko-KR");
}

export default function Settings() {
  const [settings, setSettings] = useState<SettingsData>(() => getSettings());
  const [entries, setEntries] = useState(() => getEntries().entries);
  const [goalInput, setGoalInput] = useState(() => formatGoalInput(String(settings.monthlyGoal || "")));
  const [goalError, setGoalError] = useState<string | undefined>(undefined);
  const [toastOpen, setToastOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const currentStreak = calcStreak(entries, toDateKey(new Date())).current;

  function handleGoalChange(value: string) {
    const digits = value.replace(/[^0-9]/g, "");
    setGoalInput(formatGoalInput(digits));
  }

  function handleSave() {
    fireHaptic("success");
    const parsed = parseKrwAmount(goalInput) ?? 0;
    const result = validateGoal(parsed);
    if (!result.ok) {
      setGoalError(result.error);
      return;
    }
    setGoalError(undefined);
    const next: SettingsData = { ...settings, monthlyGoal: parsed };
    saveSettings(next);
    setSettings(next);
    setToastOpen(true);
  }

  function handleDeleteAll() {
    setItem(STORAGE_KEYS.entries, []);
    setEntries([]);
    setConfirmOpen(false);
  }

  return (
    <ScreenScaffold top={<Top title={<Top.TitleParagraph>설정</Top.TitleParagraph>} />} bottom={<FloatingTabBar items={[{ label: "홈", path: "/" }, { label: "설정", path: "/settings" }]} />}>
      <Spacing size={16} />
      <Paragraph.Text typography="t5">월 목표</Paragraph.Text>
      <Spacing size={8} />
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSave();
        }}
      >
        <TextField
          data-testid="goal-input"
          variant="box"
          label="월 목표 금액"
          placeholder="예: 3,000,000원"
          inputMode="numeric"
          pattern="[0-9]*"
          enterKeyHint="done"
          hasError={Boolean(goalError)}
          help={goalError}
          value={goalInput}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleGoalChange(e.target.value)}
        />
        <Spacing size={12} />
        <Button type="button" variant="fill" display="block" size="large" onClick={handleSave}>
          목표 저장
        </Button>
      </form>

      <Spacing size={24} />
      <Paragraph.Text typography="t5">기록</Paragraph.Text>
      {/* ListRow의 contents/left/right는 레이아웃 슬롯 prop이라(children 아님) 실제 콘텐츠는
          children으로 직접 넣는다 — RecentEntryList.tsx와 동일 컨벤션. */}
      <ListRow>
        <div style={{ display: "flex", justifyContent: "space-between", width: "100%" }}>
          <Paragraph.Text typography="t6">현재 스트릭</Paragraph.Text>
          <Paragraph.Text typography="t6">{`${currentStreak}일`}</Paragraph.Text>
        </div>
      </ListRow>
      <ListRow>
        <div style={{ display: "flex", justifyContent: "space-between", width: "100%" }}>
          <Paragraph.Text typography="t6">최고 스트릭</Paragraph.Text>
          <Paragraph.Text typography="t6">{`${settings.bestStreak}일`}</Paragraph.Text>
        </div>
      </ListRow>
      <ListRow>
        <div style={{ display: "flex", justifyContent: "space-between", width: "100%" }}>
          <Paragraph.Text typography="t6">전체 기록 수</Paragraph.Text>
          <Paragraph.Text typography="t6">{`${entries.length}건`}</Paragraph.Text>
        </div>
      </ListRow>

      <Spacing size={24} />
      <ListRow onClick={() => setConfirmOpen(true)}>
        <Paragraph.Text typography="t6">기록 전체 삭제</Paragraph.Text>
      </ListRow>

      <AlertDialog
        open={confirmOpen}
        title="기록을 전체 삭제할까요?"
        description="삭제하면 되돌릴 수 없어요"
        alertButton={
          <AlertDialog.AlertButton onClick={handleDeleteAll}>삭제</AlertDialog.AlertButton>
        }
        onClose={() => setConfirmOpen(false)}
      />

      <Toast
        open={toastOpen}
        position="bottom"
        text="목표를 저장했어요"
        onClose={() => setToastOpen(false)}
      />

      <Spacing size={24} />
    </ScreenScaffold>
  );
}

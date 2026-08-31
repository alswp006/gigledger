import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Chip, ListRow, Paragraph, Spacing } from "@toss/tds-mobile";
import type { IncomeEntry, Platform } from "@/lib/types";
import { formatDate } from "@/lib/date";
import { formatMinutes } from "@/lib/format";
import { Amount } from "@/components/Amount";

const PAGE_SIZE = 30;
const MAX_VISIBLE = 100;

interface RecentEntryListProps {
  entries: IncomeEntry[];
  platforms: Platform[];
}

// ⚠️ TDS ListRow는 children을 렌더하지 않는다(ListRowProps에 children이 없다 — 실측으로
// 행이 통째로 빈 칸이 됐다). 콘텐츠는 반드시 left/contents/right 슬롯에 넣어라.
export function RecentEntryList({ entries, platforms }: RecentEntryListProps) {
  const navigate = useNavigate();
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  const sortedEntries = useMemo(
    () => [...entries].sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0)),
    [entries],
  );

  const totalRef = useRef(sortedEntries.length);
  totalRef.current = sortedEntries.length;

  const [visibleCount, setVisibleCount] = useState(() => Math.min(PAGE_SIZE, sortedEntries.length));

  useEffect(() => {
    const node = sentinelRef.current;
    if (!node) return;
    const observer = new IntersectionObserver((observedEntries) => {
      const [first] = observedEntries;
      if (!first?.isIntersecting) return;
      setVisibleCount((prev) => Math.min(prev + PAGE_SIZE, MAX_VISIBLE, totalRef.current));
    });
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  if (sortedEntries.length === 0) return null;

  const platformMap = new Map(platforms.map((p) => [p.id, p]));
  const visibleEntries = sortedEntries.slice(0, visibleCount);

  return (
    <div>
      <Paragraph.Text typography="t5">최근 기록</Paragraph.Text>
      <Spacing size={8} />
      {visibleEntries.map((entry) => {
        const platformLabel = platformMap.get(entry.platformId)?.name ?? "삭제된 플랫폼";
        const net = entry.amount - entry.expense;
        return (
          <ListRow
            key={entry.id}
            data-testid="recent-entry-row"
            onClick={() => navigate("/entry", { state: { entryId: entry.id } })}
            left={
              <Chip variant="weak" size="small">
                {platformLabel}
              </Chip>
            }
            contents={
              <ListRow.Texts
                type="2RowTypeA"
                top={formatDate(entry.date)}
                bottom={`근무 ${formatMinutes(entry.minutes)}`}
              />
            }
            right={<Amount value={net} typography="t6" />}
          />
        );
      })}
      <div ref={sentinelRef} style={{ height: 1 }} />
    </div>
  );
}

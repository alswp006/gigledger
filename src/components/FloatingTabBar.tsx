import type { ReactNode } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { generateHapticFeedback } from "@apps-in-toss/web-framework";

export type TabItem = {
  label: string;
  /** 아이콘(선택). currentColor를 쓰면 활성 틴트를 자동으로 따라간다. 없으면 라벨만 표시. */
  icon?: ReactNode;
  path: string;
};

/**
 * 탭 글리프 — 인라인 SVG(의존성 0, stroke=currentColor라 활성 틴트를 그대로 상속).
 *
 * Asset.ContentIcon을 쓰지 않는 이유: 아이콘은 CDN에서 이름으로 받아오는데
 * tds-reference.txt에 이름 카탈로그가 없다. 시급/리포트에 맞는 이름을 추측하면
 * 빌드는 통과하지만 실기기에서 404 → 빈 네모가 된다("모르면 지어내지 마라").
 * Sparkline/MiniBar도 같은 이유로 인라인 SVG다.
 */
function Glyph({ d }: { d: string }) {
  return (
    <svg
      width={22}
      height={22}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <path d={d} />
    </svg>
  );
}

/**
 * 앱의 메인 탭 4개 — 이 배열이 유일한 정본이다.
 * 화면마다 items를 따로 적으면 화면별로 탭 구성이 갈라진다(실제로 갈라졌었다).
 * 탭 루트 화면은 `<FloatingTabBar />`로 인자 없이 쓰고, 여기만 고쳐라.
 * /entry · /platforms · /share는 푸시된 하위 화면이라 탭바를 두지 않는다.
 */
export const MAIN_TABS: TabItem[] = [
  { label: "홈", path: "/", icon: <Glyph d="M3 10.5 12 3l9 7.5M5.5 9.5V20h13V9.5" /> },
  { label: "시급", path: "/wage", icon: <Glyph d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18ZM12 7v5l3.5 2" /> },
  { label: "리포트", path: "/report", icon: <Glyph d="M6 20V11M12 20V4M18 20v-6" /> },
  { label: "설정", path: "/settings", icon: <Glyph d="M4 7h16M4 12h16M4 17h16M9 7v0M15 12v0M7 17v0" /> },
];

/** 탭바가 fixed라 문서 흐름을 차지하지 않는다 — 마지막 콘텐츠가 가려지지 않게 같은 높이를 비워둔다. */
const BAR_HEIGHT = 56;

/**
 * 하단 탭 네비게이션 (App-in-Toss 미니앱용).
 *
 * Pre-built (재구현 금지): 메인 네비게이션이 2~5개 탭이면 직접 만들지 말고 이걸 써라.
 * ⚠️ 'TDS TabBar'는 존재하지 않는다(검증된 export 아님 — Tab은 상단 콘텐츠 전환용).
 * 직접 nav를 만들면 활성탭을 솔리드 버튼(파란 알약)으로 그리는 실수를 한다.
 * 이 컴포넌트는 네이티브 토스처럼 활성탭을 '아이콘+라벨 컬러 틴트'로만 표시한다
 * (배경 알약/Button variant=fill 금지). 활성 판정은 현재 경로(useLocation)로 자동.
 */
export function FloatingTabBar({ items = MAIN_TABS }: { items?: TabItem[] }) {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <>
      {/* fixed 탭바에 가려지는 만큼의 여백 */}
      <div
        aria-hidden="true"
        style={{
          height: `calc(${BAR_HEIGHT}px + var(--toss-safe-area-bottom, env(safe-area-inset-bottom, 0px)))`,
        }}
      />
      <nav
        role="tablist"
        aria-label="메인 네비게이션"
        style={{
          position: "fixed",
          left: 0,
          right: 0,
          bottom: 0,
          display: "flex",
          justifyContent: "space-around",
          alignItems: "stretch",
          // 고정 width 금지 — 좌우 0으로 늘리고 안전영역만 하단에 더한다.
          padding: "4px 8px calc(12px + var(--toss-safe-area-bottom, env(safe-area-inset-bottom, 0px)))",
          backgroundColor: "var(--adaptiveBackground)",
          borderTop: "1px solid var(--adaptiveGrey200)",
        }}
      >
        {items.map((item) => {
          const active = location.pathname === item.path;
          return (
            <button
              key={item.path}
              type="button"
              role="tab"
              aria-selected={active}
              aria-label={item.label}
              onClick={() => {
                if (active) return;
                try {
                  Promise.resolve(generateHapticFeedback({ type: "tickWeak" })).catch(() => {});
                } catch {
                  /* WebView 밖에서는 throw — 무시 */
                }
                navigate(item.path);
              }}
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 2,
                padding: "4px 0",
                minHeight: 48,
                border: "none",
                background: "none",
                cursor: "pointer",
                // 활성=브랜드 컬러 틴트, 비활성=중간 회색. 솔리드 배경/알약 없음.
                color: active ? "var(--adaptiveBlue500)" : "var(--adaptiveGrey600)",
                fontSize: 11,
                fontWeight: active ? 700 : 500,
              }}
            >
              {item.icon}
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>
    </>
  );
}

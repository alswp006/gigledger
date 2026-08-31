# Sprint Contract — 광고 배치 훅 + 검수 정적 게이트

## 만들 항목
- **src/components/HomeAdSection.tsx** — AdSlot 배치 컴포넌트(하단 콘텐츠 사이), try/catch SDK 가드, responsive 폭(360px 무조건)
- **src/hooks/useOnboardingNotice.ts** — 온보딩 안내 1회 노출(Settings.noticeSeenAt), AlertDialog 반환
- **src/hooks/useAppToast.ts** — 저장 실패·데이터 손상 Toast 표준화(error, success, message 메서드 3종)
- **정적 게이트** — `npx tsc --noEmit` & `npx vitest run` 0 에러, no external outlinks (window.location.href/window.open 금지), console.error 0개, main.tsx/App.tsx 수정 금지

## 타입 사용
- `Settings` (noticeSeenAt: string | null)
- `PeriodSummary`, `StreakResult`, `WageRow` (필요 시) — types.ts에서 import

## 검증 방법
1. `npx tsc --noEmit` 통과 (import 오류 0)
2. `npx vitest run` 통과 (테스트 있으면 green)
3. `npm run test:visual` e2e/__shots__ 확인 — 빈 입력칸/버튼 중첩/흰 화면 없음
4. AdSection 360px 모바일폭 겹침 없음, 외부 링크 0개
5. HomeAdSection + useOnboardingNotice 페이지에서 수동 테스트 (Home.tsx, Wage.tsx)

## 절대 금지
- ❌ App.tsx, main.tsx 수정
- ❌ window.location.href/window.open 사용
- ❌ SDK 호출 try/catch 누락 (흰 화면 유발)
- ❌ localStorage.setItem 직접 호출 (useAppStore/AppStore 통해서만)
- ❌ console.error 발생

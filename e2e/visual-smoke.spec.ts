import { test, expect, type Page } from "@playwright/test";

/**
 * 제네릭 구조 스모크 — 이 앱 지식 없이도 jsdom이 못 보는 렌더 버그를 잡는다:
 *  · 흰 화면(#root 비어있음)        · <button> 안에 <button>(무효 HTML, 예: FixedBottomCTA 안에 Button)
 *  · 빈 입력칸(placeholder 없음)     · 콘솔 에러
 * 픽셀 베이스라인 없음(OS 안정). 각 화면 스크린샷을 e2e/__shots__/에 저장 → 끝내기 전 직접 열어 자가 리뷰.
 *
 * ▶ 이 앱에 맞게 customize:
 *   1) ROUTES에 핵심 화면을 추가(폼/결과/목록/설정 등)
 *   2) 데이터가 필요한 화면은 seed()에서 localStorage를 채워라
 */
const ROUTES: { path: string; name: string }[] = [
  { path: "/", name: "home" },
  { path: "/entry", name: "entry" },
  { path: "/platforms", name: "platforms" },
  { path: "/wage", name: "wage" },
  { path: "/report", name: "report" },
  { path: "/share", name: "share" },
  { path: "/settings", name: "settings" },
];

/** 데이터가 필요한 화면용 localStorage 시드(앱에 맞게 채워라). 앱 스크립트보다 먼저 실행된다. */
async function seed(page: Page): Promise<void> {
  await page.addInitScript(() => {
    // 실제 사용자 상태를 재현해야 지표·리스트·비중 막대가 실제로 그려진 화면을 찍는다.
    // (빈 상태만 찍히면 '휑함'/겹침 같은 데이터 화면의 깨짐을 스모크가 못 본다.)
    const today = new Date();
    const dayKey = (offset: number) => {
      const d = new Date(today);
      d.setDate(d.getDate() - offset);
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    };
    const nowIso = today.toISOString();

    const platforms = [
      { id: "pf-1", name: "배민커넥트", category: "delivery", colorToken: "blue", archived: false, createdAt: nowIso },
      { id: "pf-2", name: "쿠팡플렉스", category: "logistics", colorToken: "green", archived: false, createdAt: nowIso },
      { id: "pf-3", name: "카카오대리", category: "driving", colorToken: "orange", archived: false, createdAt: nowIso },
    ];

    const entries = [0, 1, 2, 3, 5, 8].map((offset, idx) => ({
      id: `en-${idx}`,
      platformId: platforms[idx % platforms.length].id,
      date: dayKey(offset),
      amount: 74000 + idx * 9000,
      expense: 6000 + idx * 500,
      minutes: 240 + idx * 15,
      memo: idx % 2 === 0 ? "저녁 피크" : "",
      createdAt: nowIso,
      updatedAt: nowIso,
    }));

    window.localStorage.setItem("gigledger.platforms.v1", JSON.stringify(platforms));
    window.localStorage.setItem("gigledger.entries.v1", JSON.stringify(entries));
    window.localStorage.setItem(
      "gigledger.settings.v1",
      JSON.stringify({ monthlyGoal: 3000000, bestStreak: 4, noticeSeenAt: nowIso }),
    );
  });
}

// 토스 WebView 밖(일반 브라우저)에서만 나는 알려진 dev 에러 — 무시(실기기 WebView엔 안 남)
const IGNORED_CONSOLE = [/SafeAreaInsets/i, /getSafeAreaInsets/i];

for (const route of ROUTES) {
  test(`visual smoke: ${route.name} (${route.path})`, async ({ page }) => {
    const errors: string[] = [];
    page.on("console", (m) => {
      if (m.type() === "error" && !IGNORED_CONSOLE.some((re) => re.test(m.text()))) errors.push(m.text());
    });
    page.on("pageerror", (e) => errors.push(e.message));

    await seed(page);
    await page.goto(route.path);
    await page.waitForTimeout(1000); // React 렌더 + effect 정착

    // 1) 흰 화면 방지 — #root에 실제 콘텐츠가 있어야(SDK 가드 누락 시 트리 언마운트 → 흰 화면)
    const rootText = (await page.locator("#root").innerText().catch(() => "")).trim();
    expect(rootText.length, `${route.name}: #root가 비어있음 → 흰 화면`).toBeGreaterThan(0);

    // 2) <button> 안에 <button> 금지 — 무효 HTML. FixedBottomCTA/BottomCTA/CTAButton은 자체가 button이니
    //    안에 Button을 넣지 마라(SubmitFooter는 올바르게 처리됨).
    expect(
      await page.locator("button button").count(),
      `${route.name}: <button> 안에 <button>(무효 HTML — CTA류 안에 Button 중첩)`,
    ).toBe(0);

    // 3) 입력칸은 placeholder가 보여야 — box/line variant는 빈 칸+비포커스에서 라벨이 떠 숨어 빈 회색 박스가 됨
    const inputs = page.getByRole("textbox");
    const n = await inputs.count();
    for (let i = 0; i < n; i++) {
      const ph = (await inputs.nth(i).getAttribute("placeholder")) ?? "";
      expect(ph.trim().length, `${route.name}: 입력칸 #${i}에 placeholder 없음 → 빈 회색 박스`).toBeGreaterThan(0);
    }

    // 4) 콘솔 에러 0 (알려진 dev 에러 제외) — 토스 검수는 console.error 0개 요구
    expect(errors, `${route.name}: 콘솔 에러`).toEqual([]);

    // 5) 스크린샷 저장 → 끝내기 전 직접 열어 자가 리뷰(휑함/솔리드 알약 탭/부유 CTA/앵커 없음)
    await page.screenshot({ path: `e2e/__shots__/${route.name}.png`, fullPage: true });
  });
}

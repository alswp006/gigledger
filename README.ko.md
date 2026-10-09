🇰🇷 [English](./README.md)

# GigLedger (긱렛저) — 여러 플랫폼의 긱 수입을 한곳에서 관리

긱렛저는 배달, 대리운전, 물류 앱 등 여러 긱 플랫폼의 일별 수입을 기록하고, 대시보드 한 곳에서 합산해 보여주는 App-in-Toss 미니앱입니다. 수입에서 비용을 빼고 근무 시간으로 나눠 플랫폼별 실질 시급도 계산합니다. 여러 플랫폼에서 일하며 이번 달 총수입과 실제 시급을 알고 싶은 20~40대 긱 워커와 투잡러를 위해 만들었습니다. 모든 데이터는 `localStorage`에 기기 안에만 저장되며, 서버도 회원가입도 없습니다.

## 기능

- 📝 **일별 수입 기록**: 플랫폼별로 수입, 비용, 근무 시간, 메모(최대 50자, 선택)를 기록합니다. 기록은 수정하거나 삭제할 수 있습니다.
- 🛵 **플랫폼 관리**: 이름, 카테고리, 색상을 갖춘 플랫폼을 최대 20개까지 추가할 수 있습니다. 처음에는 배달, 대리운전, 쿠팡플렉스가 등록되어 있습니다.
- 📊 **홈 대시보드**: 주간 또는 월간 순수입, 월 목표 달성률, 14일 추이 차트, 플랫폼별 수입 비중을 보여줍니다.
- ⏱️ **실질 시급**: 플랫폼별 실질 시급과 전체 평균을 시급 탭에서 확인합니다.
- 🔥 **연속 기록**: 하루 이상 기록한 날이 며칠 연속인지, 최장 기록은 며칠인지 보여줍니다.
- 📄 **월간 리포트**: 최근 12개월의 월별 내역을 보여줍니다. 리워드 광고를 보면 열립니다.
- 🖼️ **공유**: 텍스트 요약을 클립보드에 복사하거나, 요약 카드를 PNG로 저장합니다.
- ⚙️ **설정**: 월 수입 목표를 정하고, 모든 기록을 지우고, 로컬 저장 안내를 확인합니다.
- 📢 **광고**: 홈과 시급 화면에 배너 광고를 App-in-Toss SDK로 보여줍니다.

## 기술 스택

- **프레임워크**: React 18, TypeScript, Vite 6
- **라우팅**: React Router 7 (`react-router-dom`, `BrowserRouter`)
- **UI**: Toss Design System (`@toss/tds-mobile`, `@toss/tds-mobile-ait`), Emotion (`@emotion/react`, `@emotion/styled`). 차트는 직접 작성한 인라인 SVG입니다.
- **플랫폼 SDK**: `@apps-in-toss/web-framework` (광고, 햅틱, 클립보드 등)
- **데이터**: 브라우저 `localStorage`만 사용 (데이터베이스, 백엔드, 로그인 없음)
- **테스트**: jsdom과 Testing Library를 쓰는 Vitest, 시각 스모크 테스트는 Playwright

## 시작하기

요구 사항: Node.js와 npm. 이 프로젝트는 npm을 사용합니다(`package-lock.json`).

```bash
# 의존성 설치
npm install

# 프로덕션 번들 빌드 (결과물은 dist/)
npx vite build

# 타입 검사와 단위 테스트
npx tsc --noEmit
npx vitest run
```

`npm run build`는 `vite build`를 실행한 뒤, 개발 전용 TDS 갤러리가 결과물에 포함되지 않았는지 확인합니다.

## 환경 변수

프로젝트 루트의 `.env` 또는 `.env.local` 파일이나 빌드 환경에 설정합니다.

| 변수 | 설명 | 필수 여부 |
|----------|-------------|----------|
| `VITE_TOSS_AD_GROUP_ID` | 배너와 리워드 광고 슬롯에 쓰는 앱인토스 콘솔의 광고 그룹 ID. 없으면 광고 슬롯이 비어 보입니다. | 광고 사용 시 필수 |

앱은 이 외의 환경 변수를 읽지 않습니다. IAP 컴포넌트(`src/components/TossPurchase.tsx`)는 어떤 화면에서도 사용하지 않습니다.

## 프로젝트 구조

```
src/
├── App.tsx         # Route table
├── main.tsx        # Entry point (providers and BrowserRouter)
├── pages/          # Screens: Home, Entry, Platforms, Wage, Report, Share, Settings
├── components/     # Reusable TDS-based UI (ScreenScaffold, Card, SummaryHero, FloatingTabBar, ...)
├── hooks/          # State hooks (useLedger, useAppToast, useOnboardingNotice)
├── lib/            # Pure logic: calc, format, date, validate, storage, constants, types
├── styles/         # Global and ad-related CSS
└── __tests__/      # Vitest suites
e2e/                # Playwright visual smoke tests and screenshots
scripts/            # Build and project checks
.ai-factory/        # Product and design documents (PRD, SPEC, task list)
```

## 배포

Apps-in-Toss는 빌드 결과물을 토스 CDN에 호스팅합니다. 정적 빌드만 지원하며, 서버 사이드 렌더링은 지원하지 않습니다.

1. `apps-in-toss.config.ts`의 `appName`이 앱인토스 콘솔에 등록된 앱 이름과 대소문자까지 같은지 확인하세요. 다르면 배포 에러(4031)가 납니다. `package.json`의 `name`도 그대로 두세요.
2. 토스용 번들을 빌드합니다.
   ```bash
   npx ait build
   ```
3. 앱인토스 개발자 콘솔에 `.ait` 번들을 업로드하고 검수를 요청합니다. 앱은 다음 검수 항목을 통과해야 합니다.
   - 만 19세 이상 이용자만 대상으로 합니다. 미성년자 대상 콘텐츠는 없습니다.
   - 외부 도메인으로 이동하지 않으며, 다른 앱 설치를 유도하는 화면이 없습니다.
   - 콘솔 에러와 CORS 에러가 없습니다.
   - Android 7 이상, iOS 16 이상을 지원합니다.

## 라이선스

MIT

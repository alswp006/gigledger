import { Routes, Route, Navigate } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import Home from './pages/Home';
import Entry from './pages/Entry';
import Platforms from './pages/Platforms';
import Wage from './pages/Wage';
import Report from './pages/Report';
import Share from './pages/Share';
import Settings from './pages/Settings';

// Dev-only TDS Gallery route — `import.meta.env.DEV` is statically replaced
// (true in dev, false in prod) so the entire import + Route is tree-shaken
// from production builds. Verify with: `grep -r "TdsGallery" dist/` → empty.
const DevTdsGallery = import.meta.env.DEV
  ? lazy(() => import('./pages/__TdsGallery'))
  : null;

/**
 * 라우트 테이블 — RouteState(@/lib/types)가 선언한 7개 경로가 전부 여기에 있다.
 * BrowserRouter는 main.tsx(@AI:ANCHOR)가 이미 열었다 — 여기서 다시 열면 라우터가 중첩되어
 * navigate가 조용히 무시된다.
 *
 * 각 화면은 location.state를 신뢰하지 않고 자체 폴백을 갖는다(직접 URL 진입·새로고침 대비).
 */
export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/entry" element={<Entry />} />
      <Route path="/platforms" element={<Platforms />} />
      <Route path="/wage" element={<Wage />} />
      <Route path="/report" element={<Report />} />
      <Route path="/share" element={<Share />} />
      <Route path="/settings" element={<Settings />} />
      {DevTdsGallery && (
        <Route
          path="/__tds-gallery"
          element={
            <Suspense fallback={null}>
              <DevTdsGallery />
            </Suspense>
          }
        />
      )}
      {/* 알 수 없는 경로는 막다른 길로 두지 않는다 — 홈으로 되돌린다(히스토리에 쌓지 않게 replace). */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

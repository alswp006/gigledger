# GigLedger

앱인토스 (Vite + React + TDS) 배달·대리운전·쿠팡플렉스 등 여러 플랫폼 수입을 매일 기록해 한 곳에서 합산 관리 긱워커·N잡러는 수입원이 여러 플랫폼에 흩어져 있어 이번 달 총수입과 실질 시급을 파악하기 어려움

## Tech Stack

- React 18.0.0
- TypeScript
- Vitest

## Routes

| Path | Description |
|------|-------------|
| `/Entry` | Entry |
| `/Home` | Home |
| `/Platforms` | Platforms |
| `/Report` | Report |
| `/Settings` | Settings |
| `/Share` | Share |
| `/Wage` | Wage |

## Getting Started

```bash
pnpm install
pnpm dev
```

## Development

```bash
pnpm typecheck    # Type checking
pnpm test         # Run tests
pnpm build        # Production build
```

## Design Documents

See `.ai-factory/` directory for full design artifacts:
- `prd.md` — Product Requirements Document
- `spec.md` — Technical Specification
- `task.md` — Epic/Task Breakdown

---
Built with [AI Factory](https://github.com/alswp006/ai-factory) · Last synced: 2026-08-31

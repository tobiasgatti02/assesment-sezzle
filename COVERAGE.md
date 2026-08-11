# Test Coverage Report

Last generated: 2026-08-11

Coverage artifacts are intentionally reproducible rather than committed. Run `make coverage` from the repository root to regenerate `frontend/coverage/index.html`, `frontend/coverage/coverage-summary.json`, and `backend/coverage.out`.

## Frontend

Command: `cd frontend && npm run test:coverage`

| Metric | Covered | Total | Coverage |
| --- | ---: | ---: | ---: |
| Statements | 245 | 299 | 81.93% |
| Branches | 158 | 203 | 77.83% |
| Functions | 64 | 66 | 96.96% |
| Lines | 226 | 266 | 84.96% |

All configured thresholds pass: 80% statements, 75% branches, 90% functions, and 80% lines.

The frontend report includes the API client, calculator/history components and hooks, keyboard adapter, storage validation, and formatting utilities. Entry-point bootstrap and declaration-only files are excluded.

## Backend

Command: `cd backend && go test -coverprofile=coverage.out ./internal/... && go tool cover -func=coverage.out`

| Package | Statement coverage |
| --- | ---: |
| `internal/calculator` | 96.7% |
| `internal/httpapi` | 100.0% |
| `internal/webapp` | 100.0% |
| **Total** | **98.4%** |

The backend report focuses on the testable service, HTTP, and frontend-composition packages. The process entry point in `cmd/server` only wires configuration and starts `http.Server`, so it is validated by build/vet rather than included in the unit coverage denominator.

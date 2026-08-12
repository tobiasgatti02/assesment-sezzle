# Sezzle Full-Stack Calculator

A small, production-minded calculator with a React/TypeScript frontend and a Go REST API. It supports basic and scientific operations, full keyboard control, and browser-persisted calculation history.

## Run locally

Prerequisites: Go 1.22+ and Node.js 20+.

Start the API:

```bash
cd backend
go run ./cmd/server
```

In another terminal, start the client:

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173`. Vite proxies `/api` requests to the Go server at `http://localhost:8080`. Set the backend `ADDRESS` environment variable to use a different listen address.

### Run frontend and backend with Docker

The multi-stage image builds the React application, compiles a static Go binary, and copies only those artifacts into a non-root runtime image:

```bash
docker build -t sezzle-calculator .
docker run --rm -p 8080:8080 sezzle-calculator
```

Open `http://localhost:8080`. In the container, the Go process serves both the compiled frontend and `/api/v1/calculate`; no Node.js process is included in the runtime image.

## Features

- Addition, subtraction, multiplication, division, exponentiation, and square root
- Collapsible scientific functions: sine, cosine, tangent, natural logarithm, base-10 logarithm, and reciprocal
- All arithmetic and calculation validation performed by the Go service
- Structured, user-safe API errors for invalid requests, domain errors, division by zero, and non-finite results
- Mouse, touch, and full keyboard operation through the same calculator actions
- Responsive, accessible controls with focus states, accessible names, and live result/error feedback
- Subtle display/error transitions that respect `prefers-reduced-motion`
- Friendly messages for mathematical, domain, malformed-request, and incomplete-calculation errors
- Newest-first calculation history with reuse, individual deletion, and clear-all actions
- Defensive `localStorage` persistence capped at 50 entries
- Display-only significant-digit formatting that removes common floating-point noise without changing stored API results

### Keyboard shortcuts

| Key | Action |
| --- | --- |
| `0–9` | Enter a digit |
| `.` | Enter a decimal point |
| `+` | Addition |
| `-` | Subtraction |
| `*` | Multiplication |
| `/` | Division |
| `^` | Exponentiation |
| `Enter` / `=` | Calculate |
| `Backspace` | Delete the last display character |
| `Escape` / `Delete` | Clear the calculator |
| `R` | Square root |

Modified shortcuts are ignored, so browser commands such as `Cmd+R` and `Ctrl+R` continue to work normally. Keyboard shortcuts are also ignored while focus is in an editable control.

### Scientific functions

Open the compact **Scientific** section inside the calculator to use:

| Control | Operation |
| --- | --- |
| `sin` | Sine |
| `cos` | Cosine |
| `tan` | Tangent |
| `ln` | Natural logarithm |
| `log` | Base-10 logarithm |
| `1/x` | Reciprocal |

Trigonometric inputs use radians, indicated by the `RAD` label. Scientific functions are unary and execute immediately against the current display, just like square root. Logarithms reject zero and negative inputs; reciprocal rejects zero.

## API

`POST /api/v1/calculate`

Example request from a terminal:

```bash
curl -X POST http://localhost:8080/api/v1/calculate \
  -H 'Content-Type: application/json' \
  --data '{"operation":"power","operands":[2,10]}'
```

Response:

```json
{
  "result": 1024
}
```

Binary request example:

```json
{
  "operation": "power",
  "operands": [2, 10]
}
```

Unary request example:

```json
{
  "operation": "sqrt",
  "operands": [81]
}
```

Success responses use `{ "result": number }`. Errors use a stable structure:

```json
{
  "error": {
    "code": "INVALID_DOMAIN",
    "message": "square root is only defined for non-negative numbers"
  }
}
```

Supported operation names are `add`, `subtract`, `multiply`, `divide`, `power`, `sqrt`, `sin`, `cos`, `tan`, `ln`, `log10`, and `reciprocal`. Binary operations require exactly two operands; all scientific operations require exactly one.

## Architecture

```text
frontend/
  src/api/             typed REST client and API errors
  src/components/      calculator and history presentation
  src/hooks/           calculator actions, keyboard adapter, history state
  src/storage/         validated localStorage boundary
  src/types/           shared frontend domain types
  src/utils/           display/expression/time formatting

backend/
  cmd/server/          process setup and HTTP server configuration
  internal/calculator/ typed operations, validation, and arithmetic
  internal/httpapi/    request decoding and structured JSON responses
```

The HTTP handler contains no arithmetic. It performs transport concerns and delegates to the calculator service, which validates operand counts and domains, executes arithmetic, and rejects `NaN`/infinite operands or results before JSON encoding.

The React calculator hook exposes one set of actions (`inputDigit`, `selectOperation`, `calculateResult`, and so on). Buttons and the keyboard adapter invoke those same actions, preventing divergent input behavior. Request sequencing ignores late responses after a clear or history reuse.

### Why the production container uses one Go process

The frontend is a static Vite build, so running a separate Node.js server in production would add an unnecessary process and dependency surface. When `STATIC_DIR` is configured, the Go composition layer serves those assets while preserving the API and health routes. Without `STATIC_DIR`, local development remains API-only and uses Vite's development proxy.

### Why history uses localStorage

History is local UI state: there is no authentication or cross-device identity, and persistence should survive a refresh without adding a database. A dedicated adapter safely parses stored values, filters invalid entries, tolerates unavailable/corrupted storage, and caps the list at 50. Only successful API calculations are recorded; duplicates are intentionally preserved as separate user actions.

### Why arithmetic remains server-side

The API is the source of truth for calculation and validation rules. This keeps error behavior consistent and preserves the full-stack boundary: the browser constructs requests and formats returned values but never substitutes JavaScript arithmetic for a final calculation.

## Quality checks

Frontend:

```bash
cd frontend
npm test
npm run lint
npm run build
```

Backend:

```bash
cd backend
gofmt -w cmd internal
go test ./...
go vet ./...
```

Run both layers through the root `Makefile`:

```bash
make test
make lint
make build
make coverage
```

### Coverage

```bash
cd frontend
npm run test:coverage
# Open coverage/index.html for the detailed HTML report.

cd ../backend
go test -coverprofile=coverage.out ./internal/...
go tool cover -func=coverage.out
```

Vitest enforces minimum coverage thresholds of 80% statements, 75% branches, 90% functions, and 80% lines. The latest measured summary and scope are recorded in [COVERAGE.md](./COVERAGE.md). Generated HTML/JSON profiles and Go coverage data are ignored by Git and can be reproduced with `make coverage`.

Frontend tests use Vitest and React Testing Library to cover API payloads, basic/scientific behavior, failures, keyboard mappings, history persistence/reuse/deletion/clearing, corrupt storage, ordering, and the 50-entry limit. Backend tests are table-driven and cover all operations, operand-count errors, malformed requests, invalid domains, unsupported operations, and non-finite values/results.

## Trade-offs

- History is intentionally browser- and origin-local; it does not sync across devices or users.
- Relative timestamps update when the history panel renders rather than on a background timer, avoiding work for a list capped at 50 items.
- Display formatting uses 15 significant digits to suppress common IEEE-754 noise. Original numeric results remain unchanged in history and API data.
- The container serves static files directly and does not implement client-side route fallback because this calculator has a single frontend route.

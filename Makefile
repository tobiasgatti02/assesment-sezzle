.PHONY: test lint build coverage

test:
	cd frontend && npm test
	cd backend && go test ./...

lint:
	cd frontend && npm run lint
	cd backend && go vet ./...

build:
	cd frontend && npm run build
	mkdir -p backend/bin
	cd backend && go build -o bin/calculator ./cmd/server

coverage:
	cd frontend && npm run test:coverage
	cd backend && go test -coverprofile=coverage.out ./internal/...
	cd backend && go tool cover -func=coverage.out

package webapp

import (
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"
	"strings"
	"testing"
)

func TestNewWithoutStaticDirectoryReturnsAPI(t *testing.T) {
	t.Parallel()

	api := http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		w.WriteHeader(http.StatusNoContent)
	})
	response := httptest.NewRecorder()
	New(api, "").ServeHTTP(response, httptest.NewRequest(http.MethodGet, "/anything", nil))

	if response.Code != http.StatusNoContent {
		t.Fatalf("status = %d, want %d", response.Code, http.StatusNoContent)
	}
}

func TestNewServesFrontendAndPreservesAPI(t *testing.T) {
	t.Parallel()

	staticDir := t.TempDir()
	index := []byte("<!doctype html><title>Calculator</title>")
	if err := os.WriteFile(filepath.Join(staticDir, "index.html"), index, 0o600); err != nil {
		t.Fatalf("write index: %v", err)
	}
	api := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		_, _ = w.Write([]byte("api:" + r.URL.Path))
	})
	handler := New(api, staticDir)

	tests := []struct {
		path        string
		wantStatus  int
		wantBody    string
		contentType string
	}{
		{path: "/", wantStatus: http.StatusOK, wantBody: "Calculator", contentType: "text/html"},
		{path: "/api/v1/calculate", wantStatus: http.StatusOK, wantBody: "api:/api/v1/calculate"},
		{path: "/health", wantStatus: http.StatusOK, wantBody: "api:/health"},
	}

	for _, test := range tests {
		test := test
		t.Run(test.path, func(t *testing.T) {
			t.Parallel()
			response := httptest.NewRecorder()
			request := httptest.NewRequest(http.MethodGet, test.path, nil)
			handler.ServeHTTP(response, request)

			if response.Code != test.wantStatus {
				t.Fatalf("status = %d, want %d", response.Code, test.wantStatus)
			}
			if !strings.Contains(response.Body.String(), test.wantBody) {
				t.Errorf("body = %q, want it to contain %q", response.Body.String(), test.wantBody)
			}
			if test.contentType != "" && !strings.Contains(response.Header().Get("Content-Type"), test.contentType) {
				t.Errorf("content type = %q, want it to contain %q", response.Header().Get("Content-Type"), test.contentType)
			}
		})
	}
}

package httpapi

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"sezzle-calculator/backend/internal/calculator"
)

func TestCalculateHandler(t *testing.T) {
	t.Parallel()

	tests := []struct {
		name       string
		body       string
		wantStatus int
		wantResult *float64
		wantCode   string
	}{
		{name: "power", body: `{"operation":"power","operands":[2,10]}`, wantStatus: http.StatusOK, wantResult: floatPointer(1024)},
		{name: "square root", body: `{"operation":"sqrt","operands":[81]}`, wantStatus: http.StatusOK, wantResult: floatPointer(9)},
		{name: "negative square root", body: `{"operation":"sqrt","operands":[-1]}`, wantStatus: http.StatusBadRequest, wantCode: calculator.CodeInvalidDomain},
		{name: "invalid power operand count", body: `{"operation":"power","operands":[2]}`, wantStatus: http.StatusBadRequest, wantCode: calculator.CodeInvalidOperandCount},
		{name: "invalid square root operand count", body: `{"operation":"sqrt","operands":[4,2]}`, wantStatus: http.StatusBadRequest, wantCode: calculator.CodeInvalidOperandCount},
		{name: "unsupported operation", body: `{"operation":"modulo","operands":[4,2]}`, wantStatus: http.StatusBadRequest, wantCode: calculator.CodeInvalidOperation},
		{name: "malformed JSON", body: `{"operation":`, wantStatus: http.StatusBadRequest, wantCode: "MALFORMED_REQUEST"},
		{name: "unknown field", body: `{"operation":"add","operands":[1,2],"extra":true}`, wantStatus: http.StatusBadRequest, wantCode: "MALFORMED_REQUEST"},
		{name: "multiple JSON values", body: `{"operation":"add","operands":[1,2]} {}`, wantStatus: http.StatusBadRequest, wantCode: "MALFORMED_REQUEST"},
	}

	server := NewHandler(calculator.NewService()).Routes()
	for _, test := range tests {
		test := test
		t.Run(test.name, func(t *testing.T) {
			t.Parallel()
			request := httptest.NewRequest(http.MethodPost, "/api/v1/calculate", strings.NewReader(test.body))
			request.Header.Set("Content-Type", "application/json")
			response := httptest.NewRecorder()

			server.ServeHTTP(response, request)
			if response.Code != test.wantStatus {
				t.Fatalf("status = %d, want %d; body = %s", response.Code, test.wantStatus, response.Body.String())
			}

			if test.wantResult != nil {
				var body calculateResponse
				if err := json.NewDecoder(response.Body).Decode(&body); err != nil {
					t.Fatalf("decode response: %v", err)
				}
				if body.Result != *test.wantResult {
					t.Errorf("result = %v, want %v", body.Result, *test.wantResult)
				}
				return
			}

			var body errorResponse
			if err := json.NewDecoder(response.Body).Decode(&body); err != nil {
				t.Fatalf("decode response: %v", err)
			}
			if body.Error == nil || body.Error.Code != test.wantCode {
				t.Errorf("error = %#v, want code %q", body.Error, test.wantCode)
			}
			if body.Error == nil || body.Error.Message == "" {
				t.Error("error response must contain a user-safe message")
			}
		})
	}
}

func TestHealthHandler(t *testing.T) {
	t.Parallel()

	response := httptest.NewRecorder()
	request := httptest.NewRequest(http.MethodGet, "/health", nil)
	NewHandler(calculator.NewService()).Routes().ServeHTTP(response, request)

	if response.Code != http.StatusOK {
		t.Fatalf("status = %d, want %d", response.Code, http.StatusOK)
	}
	if response.Header().Get("Content-Type") != "application/json" {
		t.Errorf("content type = %q, want application/json", response.Header().Get("Content-Type"))
	}
}

func floatPointer(value float64) *float64 { return &value }

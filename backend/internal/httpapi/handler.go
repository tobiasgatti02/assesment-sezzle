package httpapi

import (
	"encoding/json"
	"errors"
	"io"
	"net/http"

	"sezzle-calculator/backend/internal/calculator"
)

const maxRequestBytes = 1 << 20

type calculationService interface {
	Calculate(operation calculator.Operation, operands []float64) (float64, *calculator.Error)
}

type Handler struct {
	calculator calculationService
}

type calculateRequest struct {
	Operation calculator.Operation `json:"operation"`
	Operands  []*float64           `json:"operands"`
}

type calculateResponse struct {
	Result float64 `json:"result"`
}

type errorResponse struct {
	Error *calculator.Error `json:"error"`
}

func NewHandler(service calculationService) *Handler {
	return &Handler{calculator: service}
}

func (h *Handler) Routes() http.Handler {
	mux := http.NewServeMux()
	mux.HandleFunc("POST /api/v1/calculate", h.calculate)
	mux.HandleFunc("GET /health", func(w http.ResponseWriter, _ *http.Request) {
		writeJSON(w, http.StatusOK, map[string]string{"status": "ok"})
	})
	return mux
}

func (h *Handler) calculate(w http.ResponseWriter, r *http.Request) {
	r.Body = http.MaxBytesReader(w, r.Body, maxRequestBytes)
	decoder := json.NewDecoder(r.Body)
	decoder.DisallowUnknownFields()

	var request calculateRequest
	if err := decoder.Decode(&request); err != nil {
		writeMalformedRequest(w)
		return
	}
	if err := decoder.Decode(&struct{}{}); !errors.Is(err, io.EOF) {
		writeMalformedRequest(w)
		return
	}

	operands := make([]float64, len(request.Operands))
	for index, operand := range request.Operands {
		if operand == nil {
			writeJSON(w, http.StatusBadRequest, errorResponse{Error: &calculator.Error{
				Code:    calculator.CodeInvalidOperand,
				Message: "operands must be finite numbers",
			}})
			return
		}
		operands[index] = *operand
	}

	result, calculationErr := h.calculator.Calculate(request.Operation, operands)
	if calculationErr != nil {
		writeJSON(w, http.StatusBadRequest, errorResponse{Error: calculationErr})
		return
	}
	writeJSON(w, http.StatusOK, calculateResponse{Result: result})
}

func writeMalformedRequest(w http.ResponseWriter) {
	writeJSON(w, http.StatusBadRequest, errorResponse{Error: &calculator.Error{
		Code:    "MALFORMED_REQUEST",
		Message: "request body must be valid calculation JSON",
	}})
}

func writeJSON(w http.ResponseWriter, status int, value any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(value)
}

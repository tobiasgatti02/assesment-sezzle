package calculator

import (
	"math"
)

// Operation identifies an arithmetic operation supported by the calculator.
type Operation string

const (
	OperationAdd      Operation = "add"
	OperationSubtract Operation = "subtract"
	OperationMultiply Operation = "multiply"
	OperationDivide   Operation = "divide"
	OperationPower    Operation = "power"
	OperationSqrt     Operation = "sqrt"
)

const (
	CodeInvalidOperation    = "INVALID_OPERATION"
	CodeInvalidOperandCount = "INVALID_OPERAND_COUNT"
	CodeInvalidOperand      = "INVALID_OPERAND"
	CodeDivisionByZero      = "DIVISION_BY_ZERO"
	CodeInvalidDomain       = "INVALID_DOMAIN"
	CodeInvalidResult       = "INVALID_RESULT"
)

// Error is a safe, structured error that can be returned through the API.
type Error struct {
	Code    string `json:"code"`
	Message string `json:"message"`
}

func (e *Error) Error() string { return e.Message }

// Service owns calculation rules independently of HTTP transport concerns.
type Service struct{}

func NewService() *Service { return &Service{} }

// Calculate validates and executes one operation.
func (s *Service) Calculate(operation Operation, operands []float64) (float64, *Error) {
	expectedOperands, ok := operandCount(operation)
	if !ok {
		return 0, &Error{Code: CodeInvalidOperation, Message: "unsupported operation"}
	}
	if len(operands) != expectedOperands {
		return 0, &Error{
			Code:    CodeInvalidOperandCount,
			Message: "operation received an invalid number of operands",
		}
	}
	for _, operand := range operands {
		if !isFinite(operand) {
			return 0, &Error{Code: CodeInvalidOperand, Message: "operands must be finite numbers"}
		}
	}

	var result float64
	switch operation {
	case OperationAdd:
		result = operands[0] + operands[1]
	case OperationSubtract:
		result = operands[0] - operands[1]
	case OperationMultiply:
		result = operands[0] * operands[1]
	case OperationDivide:
		if operands[1] == 0 {
			return 0, &Error{Code: CodeDivisionByZero, Message: "cannot divide by zero"}
		}
		result = operands[0] / operands[1]
	case OperationPower:
		result = math.Pow(operands[0], operands[1])
	case OperationSqrt:
		if operands[0] < 0 {
			return 0, &Error{
				Code:    CodeInvalidDomain,
				Message: "square root is only defined for non-negative numbers",
			}
		}
		result = math.Sqrt(operands[0])
	}

	if !isFinite(result) {
		return 0, &Error{
			Code:    CodeInvalidResult,
			Message: "calculation result is outside the supported range",
		}
	}
	return result, nil
}

func operandCount(operation Operation) (int, bool) {
	switch operation {
	case OperationAdd, OperationSubtract, OperationMultiply, OperationDivide, OperationPower:
		return 2, true
	case OperationSqrt:
		return 1, true
	default:
		return 0, false
	}
}

func isFinite(value float64) bool {
	return !math.IsNaN(value) && !math.IsInf(value, 0)
}

package calculator

import (
	"math"
	"testing"
)

func TestServiceCalculate(t *testing.T) {
	t.Parallel()

	tests := []struct {
		name      string
		operation Operation
		operands  []float64
		want      float64
		wantCode  string
	}{
		{name: "addition", operation: OperationAdd, operands: []float64{2, 3}, want: 5},
		{name: "subtraction", operation: OperationSubtract, operands: []float64{5, 8}, want: -3},
		{name: "multiplication", operation: OperationMultiply, operands: []float64{4, 2.5}, want: 10},
		{name: "division", operation: OperationDivide, operands: []float64{8, 2}, want: 4},
		{name: "division by zero", operation: OperationDivide, operands: []float64{1, 0}, wantCode: CodeDivisionByZero},
		{name: "power positive exponent", operation: OperationPower, operands: []float64{2, 10}, want: 1024},
		{name: "power zero exponent", operation: OperationPower, operands: []float64{5, 0}, want: 1},
		{name: "power negative exponent", operation: OperationPower, operands: []float64{2, -2}, want: 0.25},
		{name: "power negative base", operation: OperationPower, operands: []float64{-2, 3}, want: -8},
		{name: "square root perfect square", operation: OperationSqrt, operands: []float64{81}, want: 9},
		{name: "square root non-perfect square", operation: OperationSqrt, operands: []float64{2}, want: math.Sqrt(2)},
		{name: "square root zero", operation: OperationSqrt, operands: []float64{0}, want: 0},
		{name: "square root negative", operation: OperationSqrt, operands: []float64{-1}, wantCode: CodeInvalidDomain},
		{name: "sine in radians", operation: OperationSin, operands: []float64{math.Pi / 2}, want: 1},
		{name: "cosine in radians", operation: OperationCos, operands: []float64{0}, want: 1},
		{name: "tangent in radians", operation: OperationTan, operands: []float64{0}, want: 0},
		{name: "natural logarithm", operation: OperationLn, operands: []float64{math.E}, want: 1},
		{name: "natural logarithm zero", operation: OperationLn, operands: []float64{0}, wantCode: CodeInvalidDomain},
		{name: "base-10 logarithm", operation: OperationLog10, operands: []float64{100}, want: 2},
		{name: "base-10 logarithm negative", operation: OperationLog10, operands: []float64{-10}, wantCode: CodeInvalidDomain},
		{name: "reciprocal", operation: OperationReciprocal, operands: []float64{4}, want: 0.25},
		{name: "reciprocal zero", operation: OperationReciprocal, operands: []float64{0}, wantCode: CodeDivisionByZero},
		{name: "power missing operand", operation: OperationPower, operands: []float64{2}, wantCode: CodeInvalidOperandCount},
		{name: "power extra operand", operation: OperationPower, operands: []float64{2, 3, 4}, wantCode: CodeInvalidOperandCount},
		{name: "square root missing operand", operation: OperationSqrt, operands: nil, wantCode: CodeInvalidOperandCount},
		{name: "square root extra operand", operation: OperationSqrt, operands: []float64{4, 2}, wantCode: CodeInvalidOperandCount},
		{name: "scientific operation extra operand", operation: OperationSin, operands: []float64{1, 2}, wantCode: CodeInvalidOperandCount},
		{name: "non-finite operand", operation: OperationAdd, operands: []float64{math.Inf(1), 1}, wantCode: CodeInvalidOperand},
		{name: "non-finite power result", operation: OperationPower, operands: []float64{math.MaxFloat64, 2}, wantCode: CodeInvalidResult},
		{name: "NaN power result", operation: OperationPower, operands: []float64{-1, 0.5}, wantCode: CodeInvalidResult},
		{name: "unsupported operation", operation: Operation("modulo"), operands: []float64{4, 2}, wantCode: CodeInvalidOperation},
	}

	service := NewService()
	for _, test := range tests {
		test := test
		t.Run(test.name, func(t *testing.T) {
			t.Parallel()
			got, calculationErr := service.Calculate(test.operation, test.operands)
			if test.wantCode != "" {
				if calculationErr == nil {
					t.Fatalf("Calculate() error = nil, want code %q", test.wantCode)
				}
				if calculationErr.Code != test.wantCode {
					t.Fatalf("Calculate() error code = %q, want %q", calculationErr.Code, test.wantCode)
				}
				return
			}

			if calculationErr != nil {
				t.Fatalf("Calculate() unexpected error: %v", calculationErr)
			}
			if math.Abs(got-test.want) > 1e-12 {
				t.Errorf("Calculate() = %.15g, want %.15g", got, test.want)
			}
		})
	}
}

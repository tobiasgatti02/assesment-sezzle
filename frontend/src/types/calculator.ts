export const binaryOperations = [
  "add",
  "subtract",
  "multiply",
  "divide",
  "power",
] as const;

export type BinaryOperation = (typeof binaryOperations)[number];

export const unaryOperations = [
  "sqrt",
  "sin",
  "cos",
  "tan",
  "ln",
  "log10",
  "reciprocal",
] as const;

export type UnaryOperation = (typeof unaryOperations)[number];
export type Operation = BinaryOperation | UnaryOperation;

export interface CalculationRequest {
  operation: Operation;
  operands: number[];
}

export interface CalculationResponse {
  result: number;
}

export interface ApiErrorBody {
  error: {
    code: string;
    message: string;
  };
}

export interface CalculationHistoryItem {
  id: string;
  operation: Operation;
  operands: number[];
  expression: string;
  result: number;
  createdAt: string;
}

export const operationSymbols: Record<Operation, string> = {
  add: "+",
  subtract: "−",
  multiply: "×",
  divide: "÷",
  power: "^",
  sqrt: "√",
  sin: "sin",
  cos: "cos",
  tan: "tan",
  ln: "ln",
  log10: "log",
  reciprocal: "1 ÷",
};

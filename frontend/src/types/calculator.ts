export const binaryOperations = [
  "add",
  "subtract",
  "multiply",
  "divide",
  "power",
] as const;

export type BinaryOperation = (typeof binaryOperations)[number];
export type Operation = BinaryOperation | "sqrt";

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
};

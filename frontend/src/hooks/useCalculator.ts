import { useCallback, useMemo, useRef, useState } from "react";
import { calculate, CalculatorApiError } from "../api/calculatorApi";
import type { CompletedCalculation } from "./useHistory";
import {
  operationSymbols,
  type BinaryOperation,
  type Operation,
} from "../types/calculator";
import { formatExpression, formatNumber } from "../utils/numberFormat";

interface UseCalculatorOptions {
  onCalculationComplete: (calculation: CompletedCalculation) => void;
}

export interface CalculatorActions {
  inputDigit: (digit: string) => void;
  inputDecimal: () => void;
  selectOperation: (operation: BinaryOperation) => void;
  calculateResult: () => void;
  applySquareRoot: () => void;
  backspace: () => void;
  clear: () => void;
  reuseResult: (result: number) => void;
}

export function useCalculator({
  onCalculationComplete,
}: UseCalculatorOptions) {
  const [display, setDisplay] = useState("0");
  const [expression, setExpression] = useState("");
  const [storedValue, setStoredValue] = useState<number | null>(null);
  const [pendingOperation, setPendingOperation] =
    useState<BinaryOperation | null>(null);
  const [waitingForOperand, setWaitingForOperand] = useState(false);
  const [justCalculated, setJustCalculated] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const requestSequence = useRef(0);
  const activeRequest = useRef<number | null>(null);

  const reset = useCallback((nextDisplay = "0") => {
    activeRequest.current = null;
    requestSequence.current += 1;
    setDisplay(nextDisplay);
    setExpression("");
    setStoredValue(null);
    setPendingOperation(null);
    setWaitingForOperand(false);
    setJustCalculated(false);
    setError(null);
    setIsCalculating(false);
  }, []);

  const runCalculation = useCallback(
    async (
      operation: Operation,
      operands: number[],
      calculationExpression: string,
    ): Promise<number | null> => {
      if (activeRequest.current !== null) return null;

      const requestId = ++requestSequence.current;
      activeRequest.current = requestId;
      setIsCalculating(true);
      setError(null);
      try {
        const result = await calculate({ operation, operands });
        if (activeRequest.current !== requestId) return null;
        onCalculationComplete({
          operation,
          operands,
          expression: calculationExpression,
          result,
        });
        return result;
      } catch (requestError) {
        if (activeRequest.current !== requestId) return null;
        setError(toUserMessage(requestError));
        setStoredValue(null);
        setPendingOperation(null);
        setWaitingForOperand(false);
        setJustCalculated(true);
        return null;
      } finally {
        if (activeRequest.current === requestId) {
          activeRequest.current = null;
          setIsCalculating(false);
        }
      }
    },
    [onCalculationComplete],
  );

  const inputDigit = useCallback(
    (digit: string) => {
      if (!/^\d$/.test(digit) || activeRequest.current !== null) return;
      if (error || justCalculated) {
        reset(digit);
        return;
      }
      if (waitingForOperand) {
        setDisplay(digit);
        setWaitingForOperand(false);
        return;
      }
      setDisplay((current) => (current === "0" ? digit : current + digit));
    },
    [error, justCalculated, reset, waitingForOperand],
  );

  const inputDecimal = useCallback(() => {
    if (activeRequest.current !== null) return;
    if (error || justCalculated) {
      reset("0.");
      return;
    }
    if (waitingForOperand) {
      setDisplay("0.");
      setWaitingForOperand(false);
      return;
    }
    setDisplay((current) => (current.includes(".") ? current : `${current}.`));
  }, [error, justCalculated, reset, waitingForOperand]);

  const selectOperation = useCallback(
    async (operation: BinaryOperation) => {
      if (activeRequest.current !== null || error) return;

      const currentValue = Number(display);
      if (pendingOperation && storedValue !== null) {
        if (waitingForOperand) {
          setPendingOperation(operation);
          setExpression(
            `${formatNumber(storedValue)} ${operationSymbols[operation]}`,
          );
          return;
        }

        const chainedExpression = formatExpression(pendingOperation, [
          storedValue,
          currentValue,
        ]);
        const result = await runCalculation(pendingOperation, [
          storedValue,
          currentValue,
        ], chainedExpression);
        if (result === null) return;

        setDisplay(formatNumber(result));
        setStoredValue(result);
        setPendingOperation(operation);
        setWaitingForOperand(true);
        setJustCalculated(false);
        setExpression(`${formatNumber(result)} ${operationSymbols[operation]}`);
        return;
      }

      setStoredValue(currentValue);
      setPendingOperation(operation);
      setWaitingForOperand(true);
      setJustCalculated(false);
      setExpression(`${formatNumber(currentValue)} ${operationSymbols[operation]}`);
    },
    [
      display,
      error,
      pendingOperation,
      runCalculation,
      storedValue,
      waitingForOperand,
    ],
  );

  const calculateResult = useCallback(async () => {
    if (
      activeRequest.current !== null ||
      error ||
      !pendingOperation ||
      storedValue === null ||
      waitingForOperand
    ) {
      return;
    }

    const currentValue = Number(display);
    const operands = [storedValue, currentValue];
    const calculationExpression = formatExpression(pendingOperation, operands);
    const result = await runCalculation(
      pendingOperation,
      operands,
      calculationExpression,
    );
    if (result === null) return;

    setDisplay(formatNumber(result));
    setExpression(`${calculationExpression} =`);
    setStoredValue(null);
    setPendingOperation(null);
    setWaitingForOperand(false);
    setJustCalculated(true);
  }, [
    display,
    error,
    pendingOperation,
    runCalculation,
    storedValue,
    waitingForOperand,
  ]);

  const applySquareRoot = useCallback(async () => {
    if (activeRequest.current !== null || error || waitingForOperand) return;

    const operand = Number(display);
    const calculationExpression = formatExpression("sqrt", [operand]);
    const result = await runCalculation("sqrt", [operand], calculationExpression);
    if (result === null) return;

    setDisplay(formatNumber(result));
    setExpression(calculationExpression);
    setWaitingForOperand(false);
    setJustCalculated(pendingOperation === null);
  }, [display, error, pendingOperation, runCalculation, waitingForOperand]);

  const backspace = useCallback(() => {
    if (activeRequest.current !== null || waitingForOperand) return;
    if (error) {
      reset();
      return;
    }
    setDisplay((current) => {
      if (current.length <= 1 || (current.startsWith("-") && current.length === 2)) {
        return "0";
      }
      return current.slice(0, -1);
    });
    if (justCalculated) {
      setExpression("");
      setJustCalculated(false);
    }
  }, [error, justCalculated, reset, waitingForOperand]);

  const reuseResult = useCallback(
    (result: number) => reset(formatNumber(result)),
    [reset],
  );

  const actions = useMemo<CalculatorActions>(
    () => ({
      inputDigit,
      inputDecimal,
      selectOperation: (operation) => void selectOperation(operation),
      calculateResult: () => void calculateResult(),
      applySquareRoot: () => void applySquareRoot(),
      backspace,
      clear: () => reset(),
      reuseResult,
    }),
    [
      applySquareRoot,
      backspace,
      calculateResult,
      inputDecimal,
      inputDigit,
      reset,
      reuseResult,
      selectOperation,
    ],
  );

  return {
    display,
    expression,
    pendingOperation,
    error,
    isCalculating,
    actions,
  };
}

function toUserMessage(error: unknown): string {
  if (error instanceof CalculatorApiError) {
    switch (error.code) {
      case "DIVISION_BY_ZERO":
        return "Cannot divide by zero";
      case "INVALID_DOMAIN":
        return "Square root requires a non-negative number";
      case "INVALID_RESULT":
        return "The result is outside the supported range";
      case "NETWORK_ERROR":
        return "Unable to reach the calculator service";
      default:
        return "Unable to calculate";
    }
  }
  return "Unable to calculate";
}

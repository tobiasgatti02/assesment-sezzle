import { useCallback, useState } from "react";
import {
  clearHistory as clearStoredHistory,
  loadHistory,
  prependHistoryItem,
  saveHistory,
} from "../storage/historyStorage";
import type {
  CalculationHistoryItem,
  Operation,
} from "../types/calculator";

export interface CompletedCalculation {
  operation: Operation;
  operands: number[];
  expression: string;
  result: number;
}

export function useHistory() {
  const [history, setHistory] = useState<CalculationHistoryItem[]>(loadHistory);

  const addCalculation = useCallback((calculation: CompletedCalculation) => {
    const item: CalculationHistoryItem = {
      ...calculation,
      id: createId(),
      createdAt: new Date().toISOString(),
    };
    setHistory((current) => {
      const next = prependHistoryItem(current, item);
      saveHistory(next);
      return next;
    });
  }, []);

  const deleteCalculation = useCallback((id: string) => {
    setHistory((current) => {
      const next = current.filter((item) => item.id !== id);
      saveHistory(next);
      return next;
    });
  }, []);

  const clearHistory = useCallback(() => {
    clearStoredHistory();
    setHistory([]);
  }, []);

  return { history, addCalculation, deleteCalculation, clearHistory };
}

function createId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

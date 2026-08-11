import {
  binaryOperations,
  type CalculationHistoryItem,
  type Operation,
} from "../types/calculator";

export const HISTORY_STORAGE_KEY = "sezzle-calculator-history";
export const MAX_HISTORY_ITEMS = 50;

const operations = new Set<Operation>([...binaryOperations, "sqrt"]);

function defaultStorage(): Storage | null {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

export function loadHistory(
  storage: Storage | null = defaultStorage(),
): CalculationHistoryItem[] {
  if (!storage) return [];

  try {
    const serialized = storage.getItem(HISTORY_STORAGE_KEY);
    if (!serialized) return [];
    const value: unknown = JSON.parse(serialized);
    if (!Array.isArray(value)) return [];
    return value.filter(isHistoryItem).slice(0, MAX_HISTORY_ITEMS);
  } catch {
    return [];
  }
}

export function saveHistory(
  history: CalculationHistoryItem[],
  storage: Storage | null = defaultStorage(),
): void {
  if (!storage) return;
  try {
    storage.setItem(
      HISTORY_STORAGE_KEY,
      JSON.stringify(history.slice(0, MAX_HISTORY_ITEMS)),
    );
  } catch {
    // Storage can be unavailable or full; calculations must still work.
  }
}

export function clearHistory(storage: Storage | null = defaultStorage()): void {
  if (!storage) return;
  try {
    storage.removeItem(HISTORY_STORAGE_KEY);
  } catch {
    // Treat inaccessible storage as already empty.
  }
}

export function prependHistoryItem(
  history: CalculationHistoryItem[],
  item: CalculationHistoryItem,
): CalculationHistoryItem[] {
  return [item, ...history].slice(0, MAX_HISTORY_ITEMS);
}

function isHistoryItem(value: unknown): value is CalculationHistoryItem {
  if (typeof value !== "object" || value === null) return false;

  const item = value as Partial<CalculationHistoryItem>;
  return (
    typeof item.id === "string" &&
    item.id.length > 0 &&
    typeof item.operation === "string" &&
    operations.has(item.operation as Operation) &&
    Array.isArray(item.operands) &&
    item.operands.every(
      (operand) => typeof operand === "number" && Number.isFinite(operand),
    ) &&
    typeof item.expression === "string" &&
    item.expression.length > 0 &&
    typeof item.result === "number" &&
    Number.isFinite(item.result) &&
    typeof item.createdAt === "string" &&
    !Number.isNaN(Date.parse(item.createdAt))
  );
}

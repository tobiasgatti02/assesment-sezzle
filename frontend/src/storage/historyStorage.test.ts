import { beforeEach, describe, expect, it } from "vitest";
import {
  clearHistory,
  HISTORY_STORAGE_KEY,
  loadHistory,
  MAX_HISTORY_ITEMS,
  prependHistoryItem,
  saveHistory,
} from "./historyStorage";
import type { CalculationHistoryItem } from "../types/calculator";

const item = (id: string): CalculationHistoryItem => ({
  id,
  operation: "add",
  operands: [1, 2],
  expression: "1 + 2",
  result: 3,
  createdAt: "2026-08-11T12:00:00.000Z",
});

describe("historyStorage", () => {
  beforeEach(() => localStorage.clear());

  it("returns an empty history when storage is empty", () => {
    expect(loadHistory()).toEqual([]);
  });

  it("loads valid history", () => {
    localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify([item("one")]));

    expect(loadHistory()).toEqual([item("one")]);
  });

  it("recovers from malformed JSON and invalid stored structures", () => {
    localStorage.setItem(HISTORY_STORAGE_KEY, "not-json");
    expect(loadHistory()).toEqual([]);

    localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify({ item: item("one") }));
    expect(loadHistory()).toEqual([]);

    localStorage.setItem(
      HISTORY_STORAGE_KEY,
      JSON.stringify([item("valid"), { id: "invalid", result: "three" }]),
    );
    expect(loadHistory()).toEqual([item("valid")]);
  });

  it("saves and clears history using the namespaced key", () => {
    saveHistory([item("one")]);
    expect(JSON.parse(localStorage.getItem(HISTORY_STORAGE_KEY) ?? "null")).toEqual([
      item("one"),
    ]);

    clearHistory();
    expect(localStorage.getItem(HISTORY_STORAGE_KEY)).toBeNull();
  });

  it("keeps newest items first and enforces the maximum size", () => {
    let history: CalculationHistoryItem[] = [];
    for (let index = 0; index < MAX_HISTORY_ITEMS + 5; index += 1) {
      history = prependHistoryItem(history, item(String(index)));
    }

    expect(history).toHaveLength(MAX_HISTORY_ITEMS);
    expect(history[0].id).toBe(String(MAX_HISTORY_ITEMS + 4));
    expect(history[history.length - 1]?.id).toBe("5");

    saveHistory([...history, ...Array.from({ length: 5 }, (_, index) => item(`old-${index}`))]);
    expect(loadHistory()).toHaveLength(MAX_HISTORY_ITEMS);
  });
});

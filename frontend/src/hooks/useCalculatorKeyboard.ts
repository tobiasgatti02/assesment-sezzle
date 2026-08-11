import { useEffect, useRef } from "react";
import type { CalculatorActions } from "./useCalculator";
import type { BinaryOperation } from "../types/calculator";

const keyOperations: Record<string, BinaryOperation> = {
  "+": "add",
  "-": "subtract",
  "*": "multiply",
  "/": "divide",
  "^": "power",
};

export function useCalculatorKeyboard(actions: CalculatorActions): void {
  const actionsRef = useRef(actions);
  useEffect(() => {
    actionsRef.current = actions;
  }, [actions]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (isEditableTarget(event.target) || event.ctrlKey || event.metaKey || event.altKey) {
        return;
      }

      let consumed = true;
      const currentActions = actionsRef.current;
      if (/^\d$/.test(event.key)) {
        currentActions.inputDigit(event.key);
      } else if (event.key === ".") {
        currentActions.inputDecimal();
      } else if (event.key in keyOperations) {
        currentActions.selectOperation(keyOperations[event.key]);
      } else if (event.key === "Enter" || event.key === "=") {
        if (!event.repeat) currentActions.calculateResult();
      } else if (event.key === "Backspace") {
        currentActions.backspace();
      } else if (event.key === "Escape" || event.key === "Delete") {
        currentActions.clear();
      } else if (event.key.toLowerCase() === "r") {
        if (!event.repeat) currentActions.applySquareRoot();
      } else {
        consumed = false;
      }

      if (consumed) event.preventDefault();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);
}

function isEditableTarget(target: EventTarget | null): boolean {
  return (
    target instanceof HTMLElement &&
    (target.matches("input, textarea, select") || target.isContentEditable)
  );
}

import type {
  BinaryOperation,
  Operation,
} from "../types/calculator";
import type { CalculatorActions } from "../hooks/useCalculator";
import { ScientificPanel } from "./ScientificPanel";

interface CalculatorProps {
  display: string;
  expression: string;
  pendingOperation: BinaryOperation | null;
  error: string | null;
  isCalculating: boolean;
  actions: CalculatorActions;
}

interface KeyProps {
  label: string;
  ariaLabel?: string;
  className?: string;
  operation?: Operation;
  pendingOperation?: BinaryOperation | null;
  disabled?: boolean;
  onPress: () => void;
}

function CalculatorKey({
  label,
  ariaLabel,
  className = "",
  operation,
  pendingOperation,
  disabled,
  onPress,
}: KeyProps) {
  const isSelected = Boolean(operation && operation === pendingOperation);
  return (
    <button
      type="button"
      className={`calculator-key ${className} ${isSelected ? "is-selected" : ""}`}
      aria-label={ariaLabel}
      aria-pressed={operation && operation !== "sqrt" ? isSelected : undefined}
      disabled={disabled}
      onClick={onPress}
    >
      {label}
    </button>
  );
}

export function Calculator({
  display,
  expression,
  pendingOperation,
  error,
  isCalculating,
  actions,
}: CalculatorProps) {
  return (
    <section className="calculator-card" aria-label="Calculator">
      <div
        className={`calculator-display ${error ? "has-error" : ""}`}
        aria-busy={isCalculating}
      >
        <div className="display-expression" aria-hidden="true">
          {isCalculating ? "Calculating…" : expression || "\u00a0"}
        </div>
        <output
          className="display-value"
          aria-label="Calculator display"
          aria-live="polite"
          aria-atomic="true"
        >
          <span
            key={`${display}-${expression}`}
            className="display-value-content"
          >
            {display}
          </span>
        </output>
        <div className="display-message" role={error ? "alert" : undefined}>
          {error ? (
            <span key={error} className="display-message-content">
              {error}
            </span>
          ) : (
            "\u00a0"
          )}
        </div>
      </div>

      <ScientificPanel
        disabled={isCalculating}
        onApply={actions.applyUnaryOperation}
      />

      <div className="calculator-keypad">
        <CalculatorKey label="C" ariaLabel="Clear" className="key-utility" onPress={actions.clear} />
        <CalculatorKey label="⌫" ariaLabel="Backspace" className="key-utility" onPress={actions.backspace} />
        <CalculatorKey label="√" ariaLabel="Square root" className="key-operator" operation="sqrt" disabled={isCalculating} onPress={() => actions.applyUnaryOperation("sqrt")} />
        <CalculatorKey label="÷" ariaLabel="Divide" className="key-operator" operation="divide" pendingOperation={pendingOperation} disabled={isCalculating} onPress={() => actions.selectOperation("divide")} />

        {["7", "8", "9"].map((digit) => <CalculatorKey key={digit} label={digit} disabled={isCalculating} onPress={() => actions.inputDigit(digit)} />)}
        <CalculatorKey label="×" ariaLabel="Multiply" className="key-operator" operation="multiply" pendingOperation={pendingOperation} disabled={isCalculating} onPress={() => actions.selectOperation("multiply")} />

        {["4", "5", "6"].map((digit) => <CalculatorKey key={digit} label={digit} disabled={isCalculating} onPress={() => actions.inputDigit(digit)} />)}
        <CalculatorKey label="−" ariaLabel="Subtract" className="key-operator" operation="subtract" pendingOperation={pendingOperation} disabled={isCalculating} onPress={() => actions.selectOperation("subtract")} />

        {["1", "2", "3"].map((digit) => <CalculatorKey key={digit} label={digit} disabled={isCalculating} onPress={() => actions.inputDigit(digit)} />)}
        <CalculatorKey label="+" ariaLabel="Add" className="key-operator" operation="add" pendingOperation={pendingOperation} disabled={isCalculating} onPress={() => actions.selectOperation("add")} />

        <CalculatorKey label="0" className="key-zero" disabled={isCalculating} onPress={() => actions.inputDigit("0")} />
        <CalculatorKey label="." ariaLabel="Decimal point" disabled={isCalculating} onPress={actions.inputDecimal} />
        <CalculatorKey label="^" ariaLabel="Raise to power" className="key-operator" operation="power" pendingOperation={pendingOperation} disabled={isCalculating} onPress={() => actions.selectOperation("power")} />
        <CalculatorKey label="=" ariaLabel="Calculate result" className="key-equals" disabled={isCalculating} onPress={actions.calculateResult} />
      </div>
    </section>
  );
}

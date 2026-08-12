import { useState } from "react";
import type { UnaryOperation } from "../types/calculator";

interface ScientificPanelProps {
  disabled: boolean;
  onApply: (operation: UnaryOperation) => void;
}

const scientificKeys: Array<{
  operation: Exclude<UnaryOperation, "sqrt">;
  label: string;
  accessibleName: string;
}> = [
  { operation: "sin", label: "sin", accessibleName: "Sine in radians" },
  { operation: "cos", label: "cos", accessibleName: "Cosine in radians" },
  { operation: "tan", label: "tan", accessibleName: "Tangent in radians" },
  { operation: "ln", label: "ln", accessibleName: "Natural logarithm" },
  { operation: "log10", label: "log", accessibleName: "Base-10 logarithm" },
  { operation: "reciprocal", label: "1/x", accessibleName: "Reciprocal" },
];

export function ScientificPanel({
  disabled,
  onApply,
}: ScientificPanelProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="scientific-section">
      <button
        type="button"
        className="scientific-toggle"
        aria-expanded={isOpen}
        aria-controls="scientific-controls"
        onClick={() => setIsOpen((current) => !current)}
      >
        <span>Scientific</span>
        <span className="scientific-meta">
          RAD
          <span className="scientific-chevron" aria-hidden="true">
            {isOpen ? "−" : "+"}
          </span>
        </span>
      </button>

      {isOpen && (
        <div
          id="scientific-controls"
          className="scientific-controls"
          role="group"
          aria-label="Scientific functions"
        >
          {scientificKeys.map(({ operation, label, accessibleName }) => (
            <button
              key={operation}
              type="button"
              className="scientific-key"
              aria-label={accessibleName}
              disabled={disabled}
              onClick={() => onApply(operation)}
            >
              {label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

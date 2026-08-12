import { Calculator } from "./components/Calculator";
import { HistoryPanel } from "./components/HistoryPanel";
import { useCalculator } from "./hooks/useCalculator";
import { useCalculatorKeyboard } from "./hooks/useCalculatorKeyboard";
import { useHistory } from "./hooks/useHistory";

export default function App() {
  const { history, addCalculation, deleteCalculation, clearHistory } =
    useHistory();
  const calculator = useCalculator({
    onCalculationComplete: addCalculation,
  });
  useCalculatorKeyboard(calculator.actions);

  return (
    <main className="app-shell">
      <header className="app-header">
        <h1>Calculate with confidence.</h1>
      </header>
      <div className="workspace">
        <Calculator {...calculator} />
        <HistoryPanel
          history={history}
          onReuse={calculator.actions.reuseResult}
          onDelete={deleteCalculation}
          onClear={clearHistory}
        />
      </div>
      <p className="keyboard-hint">
        Keyboard ready <span aria-hidden="true">·</span> Enter to solve <span aria-hidden="true">·</span> R for square root
      </p>
    </main>
  );
}

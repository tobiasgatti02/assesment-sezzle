import type { CalculationHistoryItem } from "../types/calculator";
import { formatNumber, formatRelativeTime } from "../utils/numberFormat";

interface HistoryPanelProps {
  history: CalculationHistoryItem[];
  onReuse: (result: number) => void;
  onDelete: (id: string) => void;
  onClear: () => void;
}

export function HistoryPanel({
  history,
  onReuse,
  onDelete,
  onClear,
}: HistoryPanelProps) {
  return (
    <aside className="history-card" aria-labelledby="history-title">
      <div className="history-header">
        <h2 id="history-title">History</h2>
        {history.length > 0 && (
          <button type="button" className="clear-history" onClick={onClear}>
            Clear history
          </button>
        )}
      </div>

      {history.length === 0 ? (
        <div className="history-empty">
          <p>No calculations yet</p>
          <span>Your recent calculations will appear here.</span>
        </div>
      ) : (
        <ol className="history-list">
          {history.map((item) => (
            <li className="history-item" key={item.id}>
              <button
                type="button"
                className="history-reuse"
                aria-label={`Reuse result ${formatNumber(item.result)} from ${item.expression}`}
                onClick={() => onReuse(item.result)}
              >
                <span className="history-expression">{item.expression}</span>
                <strong className="history-result">{formatNumber(item.result)}</strong>
                <time dateTime={item.createdAt}>
                  {formatRelativeTime(item.createdAt)}
                </time>
              </button>
              <button
                type="button"
                className="history-delete"
                aria-label={`Delete calculation ${item.expression}`}
                title="Delete calculation"
                onClick={() => onDelete(item.id)}
              >
                <span aria-hidden="true">×</span>
              </button>
            </li>
          ))}
        </ol>
      )}
    </aside>
  );
}

import {
  operationSymbols,
  type BinaryOperation,
  type Operation,
} from "../types/calculator";

// Fifteen significant digits hide common binary floating-point noise while
// retaining useful precision. The backend value itself is never modified.
export function formatNumber(value: number): string {
  if (Object.is(value, -0)) return "0";
  return Number.parseFloat(value.toPrecision(15)).toString();
}

export function formatExpression(
  operation: Operation,
  operands: number[],
): string {
  if (operation === "sqrt") {
    return `${operationSymbols.sqrt}${formatNumber(operands[0])}`;
  }
  const [left, right] = operands;
  return `${formatNumber(left)} ${operationSymbols[operation as BinaryOperation]} ${formatNumber(right)}`;
}

export function formatRelativeTime(
  isoTimestamp: string,
  now = new Date(),
): string {
  const createdAt = new Date(isoTimestamp);
  const elapsedSeconds = Math.max(
    0,
    Math.floor((now.getTime() - createdAt.getTime()) / 1000),
  );
  if (elapsedSeconds < 60) return "Just now";

  const minutes = Math.floor(elapsedSeconds / 60);
  if (minutes < 60) return `${minutes} min ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hr ago`;
  if (hours < 48) return "Yesterday";

  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    year: createdAt.getFullYear() === now.getFullYear() ? undefined : "numeric",
  }).format(createdAt);
}

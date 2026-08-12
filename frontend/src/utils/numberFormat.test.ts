import { describe, expect, it } from "vitest";
import { formatExpression, formatNumber, formatRelativeTime } from "./numberFormat";

describe("number formatting", () => {
  it("removes floating-point noise without globally rounding decimals", () => {
    expect(formatNumber(0.30000000000000004)).toBe("0.3");
    expect(formatNumber(Math.sqrt(2))).toBe("1.4142135623731");
    expect(formatNumber(-0)).toBe("0");
  });

  it("uses human-readable operation symbols", () => {
    expect(formatExpression("multiply", [12, 8])).toBe("12 × 8");
    expect(formatExpression("sqrt", [81])).toBe("√81");
    expect(formatExpression("power", [2, 10])).toBe("2 ^ 10");
    expect(formatExpression("sin", [0.5])).toBe("sin(0.5)");
    expect(formatExpression("log10", [100])).toBe("log(100)");
    expect(formatExpression("reciprocal", [4])).toBe("1 ÷ 4");
  });

  it("formats timestamps without exposing ISO strings", () => {
    const now = new Date("2026-08-11T12:00:00.000Z");
    expect(formatRelativeTime("2026-08-11T11:59:50.000Z", now)).toBe("Just now");
    expect(formatRelativeTime("2026-08-11T11:58:00.000Z", now)).toBe("2 min ago");
    expect(formatRelativeTime("2026-08-11T09:00:00.000Z", now)).toBe("3 hr ago");
    expect(formatRelativeTime("2026-08-10T10:00:00.000Z", now)).toBe("Yesterday");
  });
});

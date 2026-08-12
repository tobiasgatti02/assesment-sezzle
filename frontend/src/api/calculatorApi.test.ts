import { describe, expect, it, vi } from "vitest";
import { calculate } from "./calculatorApi";

describe("calculator API client", () => {
  it.each([Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY, Number.NaN])(
    "rejects non-finite operand %s before sending a request",
    async (operand) => {
      const fetchMock = vi.fn();
      vi.stubGlobal("fetch", fetchMock);

      await expect(
        calculate({ operation: "add", operands: [operand, 2] }),
      ).rejects.toMatchObject({
        code: "INVALID_OPERAND",
      });
      expect(fetchMock).not.toHaveBeenCalled();
    },
  );
});

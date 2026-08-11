import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import App from "./App";
import { HISTORY_STORAGE_KEY } from "./storage/historyStorage";
import type { CalculationHistoryItem } from "./types/calculator";

function response(body: unknown, ok = true): Response {
  return {
    ok,
    json: vi.fn().mockResolvedValue(body),
  } as unknown as Response;
}

function mockFetch(...responses: Response[]) {
  const fetchMock = vi.fn();
  for (const nextResponse of responses) {
    fetchMock.mockResolvedValueOnce(nextResponse);
  }
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

function display() {
  return screen.getByLabelText("Calculator display");
}

function storedItem(
  overrides: Partial<CalculationHistoryItem> = {},
): CalculationHistoryItem {
  return {
    id: "history-one",
    operation: "multiply",
    operands: [12, 8],
    expression: "12 × 8",
    result: 96,
    createdAt: "2026-08-11T12:00:00.000Z",
    ...overrides,
  };
}

describe("calculator", () => {
  it("calculates exponentiation by button and records the API result", async () => {
    const user = userEvent.setup();
    const fetchMock = mockFetch(response({ result: 1024 }));
    render(<App />);

    await user.click(screen.getByRole("button", { name: "2" }));
    await user.click(screen.getByRole("button", { name: "Raise to power" }));
    await user.click(screen.getByRole("button", { name: "1" }));
    await user.click(screen.getByRole("button", { name: "0" }));
    await user.click(screen.getByRole("button", { name: "Calculate result" }));

    await waitFor(() => expect(display()).toHaveTextContent("1024"));
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/v1/calculate",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ operation: "power", operands: [2, 10] }),
      }),
    );
    expect(screen.getByText("2 ^ 10")).toBeInTheDocument();
    expect(screen.getByText("1024", { selector: ".history-result" })).toBeInTheDocument();
  });

  it("executes square root immediately and records it", async () => {
    const user = userEvent.setup();
    const fetchMock = mockFetch(response({ result: 9 }));
    render(<App />);

    await user.click(screen.getByRole("button", { name: "8" }));
    await user.click(screen.getByRole("button", { name: "1" }));
    await user.click(screen.getByRole("button", { name: "Square root" }));

    await waitFor(() => expect(display()).toHaveTextContent("9"));
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/v1/calculate",
      expect.objectContaining({
        body: JSON.stringify({ operation: "sqrt", operands: [81] }),
      }),
    );
    expect(screen.getByText("√81", { selector: ".history-expression" })).toBeInTheDocument();
  });

  it("shows a friendly square-root error and does not add failed history", async () => {
    const user = userEvent.setup();
    mockFetch(
      response({ result: -9 }),
      response(
        {
          error: {
            code: "INVALID_DOMAIN",
            message: "square root is only defined for non-negative numbers",
          },
        },
        false,
      ),
    );
    render(<App />);

    await user.click(screen.getByRole("button", { name: "3" }));
    await user.click(screen.getByRole("button", { name: "Subtract" }));
    await user.click(screen.getByRole("button", { name: "1" }));
    await user.click(screen.getByRole("button", { name: "2" }));
    await user.click(screen.getByRole("button", { name: "Calculate result" }));
    await waitFor(() => expect(display()).toHaveTextContent("-9"));

    await user.click(screen.getByRole("button", { name: "Square root" }));
    expect(
      await screen.findByText("Square root requires a non-negative number"),
    ).toBeInTheDocument();
    expect(screen.getAllByRole("listitem")).toHaveLength(1);

    await user.click(screen.getByRole("button", { name: "Clear" }));
    expect(display()).toHaveTextContent("0");
  });

  it("does not add failed division to history", async () => {
    const user = userEvent.setup();
    mockFetch(
      response(
        { error: { code: "DIVISION_BY_ZERO", message: "cannot divide by zero" } },
        false,
      ),
    );
    render(<App />);

    await user.click(screen.getByRole("button", { name: "8" }));
    await user.click(screen.getByRole("button", { name: "Divide" }));
    await user.click(screen.getByRole("button", { name: "0" }));
    await user.click(screen.getByRole("button", { name: "Calculate result" }));

    expect(await screen.findByText("Cannot divide by zero")).toBeInTheDocument();
    expect(screen.getByText("No calculations yet")).toBeInTheDocument();
  });

  it("supports digits, decimals, operators, equals, backspace, and clear from the keyboard", async () => {
    const fetchMock = mockFetch(response({ result: 1024 }), response({ result: 1025 }));
    render(<App />);

    fireEvent.keyDown(window, { key: "1" });
    fireEvent.keyDown(window, { key: "2" });
    fireEvent.keyDown(window, { key: "." });
    fireEvent.keyDown(window, { key: "3" });
    fireEvent.keyDown(window, { key: "Backspace" });
    expect(display()).toHaveTextContent("12.");

    fireEvent.keyDown(window, { key: "Escape" });
    expect(display()).toHaveTextContent("0");

    fireEvent.keyDown(window, { key: "2" });
    fireEvent.keyDown(window, { key: "^" });
    expect(screen.getByRole("button", { name: "Raise to power" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    fireEvent.keyDown(window, { key: "1" });
    fireEvent.keyDown(window, { key: "0" });
    fireEvent.keyDown(window, { key: "Enter" });
    await waitFor(() => expect(display()).toHaveTextContent("1024"));

    fireEvent.keyDown(window, { key: "+" });
    fireEvent.keyDown(window, { key: "1" });
    fireEvent.keyDown(window, { key: "=" });
    await waitFor(() => expect(display()).toHaveTextContent("1025"));

    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      "/api/v1/calculate",
      expect.objectContaining({
        body: JSON.stringify({ operation: "power", operands: [2, 10] }),
      }),
    );
  });

  it.each([
    ["+", "Add"],
    ["-", "Subtract"],
    ["*", "Multiply"],
    ["/", "Divide"],
  ])("maps the %s key to the %s action", (key, label) => {
    render(<App />);

    fireEvent.keyDown(window, { key });

    expect(screen.getByRole("button", { name: label })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });

  it("uses R for square root without hijacking modified browser shortcuts", async () => {
    const fetchMock = mockFetch(response({ result: 3 }));
    render(<App />);

    fireEvent.keyDown(window, { key: "9" });
    const modifiedEvent = new KeyboardEvent("keydown", {
      key: "r",
      metaKey: true,
      cancelable: true,
    });
    window.dispatchEvent(modifiedEvent);
    expect(modifiedEvent.defaultPrevented).toBe(false);
    expect(fetchMock).not.toHaveBeenCalled();

    fireEvent.keyDown(window, { key: "r" });
    await waitFor(() => expect(display()).toHaveTextContent("3"));
  });
});

describe("history", () => {
  it("loads valid history from localStorage and recovers from corruption", () => {
    localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify([storedItem()]));
    const { unmount } = render(<App />);
    expect(screen.getByText("12 × 8")).toBeInTheDocument();

    unmount();
    localStorage.setItem(HISTORY_STORAGE_KEY, "corrupted-json");
    render(<App />);
    expect(screen.getByText("No calculations yet")).toBeInTheDocument();
  });

  it("reuses a result without an API call, then continues calculating", async () => {
    localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify([storedItem()]));
    const fetchMock = mockFetch(response({ result: 100 }));
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: /Reuse result 96/ }));
    expect(display()).toHaveTextContent("96");
    expect(fetchMock).not.toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: "Add" }));
    await user.click(screen.getByRole("button", { name: "4" }));
    await user.click(screen.getByRole("button", { name: "Calculate result" }));
    await waitFor(() => expect(display()).toHaveTextContent("100"));
    const items = screen.getAllByRole("listitem");
    expect(within(items[0]).getByText("96 + 4")).toBeInTheDocument();
    expect(within(items[1]).getByText("12 × 8")).toBeInTheDocument();
  });

  it("deletes one entry and persists the change", async () => {
    const first = storedItem();
    const second = storedItem({
      id: "history-two",
      operation: "add",
      expression: "2 + 2",
      operands: [2, 2],
      result: 4,
    });
    localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify([second, first]));
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: "Delete calculation 2 + 2" }));
    expect(screen.queryByText("2 + 2")).not.toBeInTheDocument();
    expect(screen.getByText("12 × 8")).toBeInTheDocument();
    expect(JSON.parse(localStorage.getItem(HISTORY_STORAGE_KEY) ?? "[]")).toEqual([
      first,
    ]);
  });

  it("clears all history", async () => {
    localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify([storedItem()]));
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: "Clear history" }));

    expect(screen.getByText("No calculations yet")).toBeInTheDocument();
    expect(localStorage.getItem(HISTORY_STORAGE_KEY)).toBeNull();
  });
});

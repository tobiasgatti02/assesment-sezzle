import type {
  ApiErrorBody,
  CalculationRequest,
  CalculationResponse,
} from "../types/calculator";

export class CalculatorApiError extends Error {
  constructor(
    public readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = "CalculatorApiError";
  }
}

export async function calculate(
  request: CalculationRequest,
): Promise<number> {
  if (!request.operands.every(Number.isFinite)) {
    throw new CalculatorApiError(
      "INVALID_OPERAND",
      "Operands must be finite numbers",
    );
  }

  let response: Response;
  try {
    response = await fetch("/api/v1/calculate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(request),
    });
  } catch {
    throw new CalculatorApiError(
      "NETWORK_ERROR",
      "Unable to reach the calculator service",
    );
  }

  const body: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    if (isApiErrorBody(body)) {
      throw new CalculatorApiError(body.error.code, body.error.message);
    }
    throw new CalculatorApiError(
      "API_ERROR",
      "The calculator service could not complete the request",
    );
  }

  if (!isCalculationResponse(body)) {
    throw new CalculatorApiError(
      "INVALID_RESPONSE",
      "The calculator service returned an invalid response",
    );
  }
  return body.result;
}

function isCalculationResponse(value: unknown): value is CalculationResponse {
  return (
    typeof value === "object" &&
    value !== null &&
    "result" in value &&
    typeof value.result === "number" &&
    Number.isFinite(value.result)
  );
}

function isApiErrorBody(value: unknown): value is ApiErrorBody {
  if (typeof value !== "object" || value === null || !("error" in value)) {
    return false;
  }
  const error = value.error;
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    "message" in error &&
    typeof error.code === "string" &&
    typeof error.message === "string"
  );
}

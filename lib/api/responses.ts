import { NextResponse } from "next/server";
import { uid } from "@/lib/utils";
import type { ApiError } from "@/types/common";

/**
 * Typed API responses (spec §43).
 *
 * Every API route returns either data or the same error
 * envelope, so clients never have to guess the shape:
 *
 *   { "error": { "code": "...", "message": "...", "requestId": "..." } }
 */

export interface ApiSuccess<T> {
  data: T;
  meta?: {
    requestId: string;
    [key: string]: unknown;
  };
}

export function apiOk<T>(
  data: T,
  init?: { status?: number; meta?: Record<string, unknown> },
): NextResponse {
  const body: ApiSuccess<T> = {
    data,
    meta: {
      requestId: uid("req"),
      ...init?.meta,
    },
  };
  return NextResponse.json(body, {
    status: init?.status ?? 200,
  });
}

export function apiError(
  code: string,
  message: string,
  status = 400,
  requestId?: string,
): NextResponse {
  const body: ApiError = {
    error: {
      code,
      message,
      requestId: requestId ?? uid("req"),
    },
  };
  return NextResponse.json(body, { status });
}

/** Map a thrown error to the standard envelope. */
export function apiErrorFromException(
  exception: unknown,
): NextResponse {
  const message =
    exception instanceof Error ? exception.message : String(exception);

  // Providers prefix their errors with a stable code, e.g.
  // "AI_NOT_CONFIGURED: ...", so map those to HTTP statuses.
  const code = message.includes(":")
    ? message.slice(0, message.indexOf(":")).trim()
    : "INTERNAL_ERROR";

  const statusMap: Record<string, number> = {
    AI_NOT_CONFIGURED: 503,
    AI_PROVIDER_ERROR: 502,
    AI_OUTPUT_ERROR: 502,
    AI_INPUT_ERROR: 400,
    AI_UNAVAILABLE: 503,
    NOT_FOUND: 404,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    RATE_LIMITED: 429,
  };

  const status = statusMap[code] ?? 500;
  const cleanMessage = message.includes(":")
    ? message.slice(message.indexOf(":") + 1).trim()
    : message;

  return apiError(code, cleanMessage, status);
}

/** Map provider/feature errors to a client-safe message. */
export function publicErrorMessage(exception: unknown): string {
  const message =
    exception instanceof Error ? exception.message : String(exception);
  if (message.startsWith("AI_NOT_CONFIGURED")) {
    return "The AI service is not configured for this request.";
  }
  if (message.startsWith("AI_PROVIDER_ERROR")) {
    return "The AI provider could not complete the request.";
  }
  if (message.startsWith("AI_OUTPUT_ERROR")) {
    return "The AI returned a result that failed validation, so no answer is shown.";
  }
  return "Something went wrong while handling the request.";
}
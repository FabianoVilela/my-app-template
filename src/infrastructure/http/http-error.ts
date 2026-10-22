export type HttpErrorKind =
  | "http"
  | "network"
  | "timeout"
  | "cancelled"
  | "invalid-response"
  | "unexpected";

type HttpErrorDetails = {
  status?: number;
  body?: unknown;
  cause?: unknown;
};

export class HttpError extends Error {
  readonly kind: HttpErrorKind;
  readonly status: number | undefined;
  readonly body: unknown;

  constructor(kind: HttpErrorKind, details: HttpErrorDetails = {}) {
    super(`HTTP request failed: ${kind}`, { cause: details.cause });
    this.name = "HttpError";
    this.kind = kind;
    this.status = details.status;
    this.body = details.body;
  }
}

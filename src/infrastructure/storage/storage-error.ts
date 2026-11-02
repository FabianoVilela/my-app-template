export type StorageErrorKind =
  | "initialization"
  | "read"
  | "write"
  | "remove"
  | "unavailable";

export class StorageError extends Error {
  readonly kind: StorageErrorKind;

  constructor(kind: StorageErrorKind, details: { cause?: unknown } = {}) {
    super(`Storage operation failed: ${kind}`, { cause: details.cause });
    this.name = "StorageError";
    this.kind = kind;
  }
}

/** Technical identifiers only: never include payloads, credentials or personal data. */
export type ErrorContext = {
  operation: string;
};

export interface ErrorReporter {
  captureException(error: unknown, context: ErrorContext): void;
  addBreadcrumb(operation: string): void;
}

export const noopErrorReporter: ErrorReporter = {
  captureException: () => undefined,
  addBreadcrumb: () => undefined,
};

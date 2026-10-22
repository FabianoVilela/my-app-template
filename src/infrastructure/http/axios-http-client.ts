import axios from "axios";

import type { HttpClient } from "./http-client";
import { HttpError } from "./http-error";

const DEFAULT_TIMEOUT_MS = 10_000;

export type AxiosHttpClientConfig = {
  baseUrl: string;
  timeoutMs?: number;
};

export function createAxiosHttpClient({
  baseUrl,
  timeoutMs = DEFAULT_TIMEOUT_MS,
}: AxiosHttpClientConfig): HttpClient {
  const instance = axios.create({
    baseURL: baseUrl,
    timeout: timeoutMs,
    headers: { Accept: "application/json" },
    // Decode JSON after HTTP errors have been classified, including HTML errors.
    responseType: "text",
    transitional: { clarifyTimeoutError: true },
    validateStatus: (status) => status >= 200 && status < 300,
  });

  return {
    async request(request) {
      try {
        const response = await instance.request<string>({
          method: request.method,
          url: request.path,
          params: request.query,
          headers: {
            ...(request.body !== undefined && {
              "Content-Type": "application/json",
            }),
            ...request.headers,
          },
          data:
            request.body === undefined
              ? undefined
              : JSON.stringify(request.body),
          signal: request.signal,
        });

        if (
          request.method === "HEAD" ||
          response.status === 204 ||
          response.status === 205
        ) {
          return { status: response.status, body: undefined };
        }

        try {
          return {
            status: response.status,
            body: parseBody(response.data),
          };
        } catch (cause: unknown) {
          throw new HttpError("invalid-response", {
            status: response.status,
            body: response.data,
            cause,
          });
        }
      } catch (error: unknown) {
        throw normalizeError(error);
      }
    },
  };
}

function parseBody(body: string): unknown {
  return body === "" ? undefined : JSON.parse(body);
}

function normalizeError(error: unknown): HttpError {
  if (error instanceof HttpError) {
    return error;
  }

  if (axios.isCancel(error)) {
    return new HttpError("cancelled", { cause: error });
  }

  if (!axios.isAxiosError<string>(error)) {
    return new HttpError("unexpected", { cause: error });
  }

  if (error.response) {
    let body: unknown = error.response.data;

    try {
      body = parseBody(error.response.data);
    } catch {
      // Keep non-JSON error bodies without losing the HTTP status.
    }

    return new HttpError("http", {
      status: error.response.status,
      body,
      cause: error,
    });
  }

  if (error.code === "ETIMEDOUT") {
    return new HttpError("timeout", { cause: error });
  }

  if (error.code === "ERR_NETWORK" || error.request) {
    return new HttpError("network", { cause: error });
  }

  return new HttpError("unexpected", { cause: error });
}

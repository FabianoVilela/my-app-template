export type HttpMethod =
  | "GET"
  | "POST"
  | "PUT"
  | "PATCH"
  | "DELETE"
  | "HEAD"
  | "OPTIONS";

export type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | { [key: string]: JsonValue };

export type HttpRequest = {
  method: HttpMethod;
  path: string;
  query?: Record<string, string | number | boolean>;
  headers?: Record<string, string>;
  body?: JsonValue;
  signal?: AbortSignal;
};

export type HttpResponse = {
  status: number;
  body: unknown;
};

export interface HttpClient {
  request(request: HttpRequest): Promise<HttpResponse>;
}

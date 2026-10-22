# HTTP client and module services

The template provides a JSON HTTP transport with an application-owned contract
and an Axios adapter. It does not create a client on import, contact a backend at
startup, or include example business features. The products code below is a guide
for a derived project, not a module to add to the template.

## Files and responsibilities

| File | Responsibility |
| --- | --- |
| `src/infrastructure/http/http-client.ts` | HTTP methods, JSON request bodies, request/response types and the `HttpClient` interface. |
| `src/infrastructure/http/http-error.ts` | Library-independent failure kinds and response metadata. |
| `src/infrastructure/http/axios-http-client.ts` | Axios configuration, JSON serialization, request execution, response parsing and error normalization. |
| A module's `application/ports/product-service.ts` | Operations and data required by its consumers, without HTTP or Axios imports. |
| A module's `infrastructure/product-service.ts` | Endpoints, external payloads, validation, mapping and endpoint-specific error handling. |
| `src/bootstrap/create-dependencies.ts`, when needed | Select the default HTTP implementation, accept overrides and assemble real module services. |

Only the Axios adapter imports the `axios` package. Domain and application do not
import HTTP infrastructure. Presentation receives module capabilities through
props or a focused module provider; it does not import concrete services or
bootstrap. See [application architecture](AGENTS.md) for the full dependency rules.

## Transport contract

- Use `request` with an explicit `GET`, `POST`, `PUT`, `PATCH`, `DELETE`, `HEAD` or
  `OPTIONS` method. Use relative API paths; keep the base URL in client configuration.
- Requests support flat query parameters containing strings, numbers and booleans,
  string headers, JSON bodies and an optional `AbortSignal`. Omit absent query
  parameters. Do not send bodies with `GET` or `HEAD`.
- A supplied body is JSON-encoded, including strings, numbers, booleans and `null`.
  `undefined` means no body. Keep JSON content types when supplying custom headers.
- Timeout defaults to 10,000 ms and can be changed at client creation. Setting
  `timeoutMs` to `0` disables Axios's request timeout; cancellation remains available.
- Final response statuses from 200 through 299 resolve with `{ status, body }`.
  Other HTTP statuses reject with `HttpError`, including `404`.
- Empty bodies, `HEAD`, `204` and `205` return `body: undefined`. Nonempty success
  bodies must be valid JSON. The body remains `unknown`: valid JSON does not prove
  that it matches a module's expected payload.
- The adapter reads response text and parses it after HTTP status handling. A
  non-JSON error page stays an HTTP failure, preserving its status and raw body.
- The contract has no per-request accepted-status policy, automatic `null`, retries,
  refresh, cache, offline queue, response headers, upload or download API. Extend it
  deliberately when a real consumer requires a capability; preserve the contract
  when replacing the adapter.

## Failures

| `HttpError.kind` | Meaning |
| --- | --- |
| `http` | A response outside 200–299. `status` is preserved; `body` is parsed JSON when possible, otherwise the raw response. |
| `network` | A transport failure without a response. This does not establish whether the device is offline. |
| `timeout` | The configured request timeout elapsed. |
| `cancelled` | The request's signal was cancelled. |
| `invalid-response` | A nonempty success body could not be decoded as JSON. `status` and raw `body` are preserved. |
| `unexpected` | Another request/configuration/serialization failure. |

The adapter enables Axios's explicit timeout code to distinguish timeouts from
other transport aborts. It normalizes request failures, including failures before
the request is sent. `cause` is an opaque diagnostic value, not a contract to
inspect for Axios-specific properties. It may contain request details; do not
render or serialize it as a user-facing error.

Services do not need a `catch` unless they recover, translate or add meaningful
context. Developers decide each endpoint's behavior. Do not globally turn `404`
into `null` or treat every `401` as a navigation instruction. If application code
needs to distinguish failures, define that meaning in the module's application
contract and translate technical failures in its infrastructure.

Payload validation belongs in the module. Valid JSON with the wrong fields is a
module integration failure, not a JSON syntax error. Use a named module error
when consumers need to distinguish that condition.

## Example: product service

For a simple integration, keep the consumed model and service contract together
in `modules/products/application/ports/product-service.ts`. Introduce domain
models when there is actual domain knowledge to represent.

```ts
export type Product = {
  id: string;
  name: string;
};

export interface ProductService {
  getProductById(id: string): Promise<Product>;
}

export class InvalidProductResponseError extends Error {
  constructor() {
    super("Invalid product response");
    this.name = "InvalidProductResponseError";
  }
}
```

Implement it in `modules/products/infrastructure/product-service.ts`. Keep small
private payload conversions in this file; a separate DTO or mapper file is optional.

```ts
import type { HttpClient } from "@/infrastructure/http/http-client";

import {
  InvalidProductResponseError,
  type Product,
  type ProductService,
} from "../application/ports/product-service";

export function createProductService(http: HttpClient): ProductService {
  return {
    async getProductById(id) {
      const response = await http.request({
        method: "GET",
        path: `/products/${encodeURIComponent(id)}`,
      });

      return parseProduct(response.body);
    },
  };
}

function parseProduct(body: unknown): Product {
  if (
    typeof body !== "object" ||
    body === null ||
    !("id" in body) ||
    typeof body.id !== "string" ||
    !("display_name" in body) ||
    typeof body.display_name !== "string"
  ) {
    throw new InvalidProductResponseError();
  }

  return { id: body.id, name: body.display_name };
}
```

The factory connects HTTP once and returns a service whose methods retain that
dependency. Calling `getProductById` does not require injecting HTTP again. Add
related endpoints to the service as needed; do not generate a gateway object, a
pass-through use case or a generic CRUD base class for each endpoint.

## Default client and overrides

The default belongs in bootstrap, not in service imports. Once a derived project
has a real service, its `bootstrap/create-dependencies.ts` could contain:

```ts
import { createAxiosHttpClient } from "@/infrastructure/http/axios-http-client";
import type { HttpClient } from "@/infrastructure/http/http-client";
import { createProductService } from "@/modules/products/infrastructure/product-service";

type DependencyOverrides = {
  http?: HttpClient;
};

export function createDependencies(overrides: DependencyOverrides = {}) {
  const http = overrides.http ?? createApiHttpClient();

  return {
    productService: createProductService(http),
  };
}

function createApiHttpClient(): HttpClient {
  const baseUrl = process.env.EXPO_PUBLIC_API_URL;

  if (!baseUrl) {
    throw new Error("EXPO_PUBLIC_API_URL is required to connect the API");
  }

  return createAxiosHttpClient({ baseUrl, timeoutMs: 10_000 });
}
```

The template deliberately does not create this file before there are services to
assemble. `.env.example` documents the optional API URL. Copy it to `.env` and
configure the URL when connecting the first API. The unmodified template starts
without it. Use Expo's static `process.env.EXPO_PUBLIC_API_URL` notation; these
values are public configuration, not secrets.

Create dependencies explicitly at the app's composition boundary. When React owns
that lifetime, retain them with lazy state initialization in the bootstrap provider
composition. Do not call the factory on every render or export an eagerly created
global instance. Factories must not send requests during construction.
Session-specific resources must be replaced when the session changes.

Bootstrap supplies the assembled service through props or mounts a focused
products provider from the module's presentation layer. Routes remain thin;
screens consume the service contract. Do not use a universal service locator or
have modules import bootstrap. Start with props and add a provider when it avoids
repeated passing through the component tree.

An override bypasses the default client and its environment requirement:

```ts
const fakeHttp: HttpClient = {
  async request() {
    return {
      status: 200,
      body: { id: "123", display_name: "Keyboard" },
    };
  },
};

const dependencies = createDependencies({ http: fakeHttp });
const product = await dependencies.productService.getProductById("123");
```

Use the same pattern with another real `HttpClient`, or construct one service with
an alternative client. For multiple APIs, create clients per API configuration
and inject the appropriate one; do not mutate a shared client's base URL.

## Cancellation and interceptors

At the transport boundary, cancellation uses the standard signal:

```ts
const controller = new AbortController();
const pendingRequest = http.request({
  method: "GET",
  path: "/products",
  signal: controller.signal,
});

controller.abort();

try {
  await pendingRequest;
} catch (error: unknown) {
  if (!(error instanceof HttpError) || error.kind !== "cancelled") {
    throw error;
  }
}
```

The example assumes the `HttpClient` instance and `HttpError` import from their
defining infrastructure files. If an application operation needs cancellation,
include an appropriate capability in its own contract instead of importing an
HTTP request type into the core.

The initial adapter does not register interceptors because there is no session or
observability consumer yet. Add technical interceptors inside the adapter when
required, receiving external capabilities such as a token getter by injection.
Read changing tokens at request time. Register interceptors once per instance;
eject dynamically attached interceptors when their owner ends but the instance
remains alive. Keep authenticated instances scoped to the intended API.

Response interceptors must return the response or propagate the rejection. Keep
navigation, notifications, domain rules and module payload mappings outside them.
Design refresh concurrency and retry/idempotency behavior before adding automatic
replays. Error normalization already has one owner in the adapter.

## Verification and adapter replacement

There is no configured test runner in the template. Do not add one just to fill
the architecture. When introducing a runner for real behavior, verify JSON bodies
and query serialization, success/no-content responses, malformed JSON, HTTP error
bodies, cancellation, timeout, network failures and dependency substitution.
Verify supported platforms as well; transport errors and redirects can differ.

Replacing Axios requires another `HttpClient` implementation and changing the
default selection in bootstrap. Module services keep their existing contract.
Matching TypeScript types alone is insufficient: preserve the behavior described
above, including primitive JSON bodies and failure categories.

## References

- [Axios request configuration](https://github.com/axios/axios#request-config)
- [Axios errors](https://github.com/axios/axios#handling-errors)
- [Axios interceptors](https://github.com/axios/axios#interceptors)
- [Expo environment variables](https://docs.expo.dev/guides/environment-variables/)

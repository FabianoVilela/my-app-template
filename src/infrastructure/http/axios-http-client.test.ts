import { HttpResponse, http } from "msw/http";
import { delay } from "msw/utils/delay";

import { httpServer } from "../../../tests/http-server";
import { createAxiosHttpClient } from "./axios-http-client";
import { HttpError } from "./http-error";

const BASE_URL = "https://api.example.test";

describe("Axios HTTP client", () => {
  const client = createAxiosHttpClient({ baseUrl: BASE_URL });

  test("sends query parameters and headers and decodes JSON", async () => {
    httpServer.use(
      http.get(`${BASE_URL}/items`, ({ request }) => {
        const url = new URL(request.url);
        return HttpResponse.json({
          page: url.searchParams.get("page"),
          active: url.searchParams.get("active"),
          accept: request.headers.get("accept"),
          authorization: request.headers.get("authorization"),
        });
      }),
    );

    await expect(
      client.request({
        method: "GET",
        path: "/items",
        query: { page: 2, active: true },
        headers: { Authorization: "Bearer test-token" },
      }),
    ).resolves.toEqual({
      status: 200,
      body: {
        page: "2",
        active: "true",
        accept: "application/json",
        authorization: "Bearer test-token",
      },
    });
  });

  test("serializes a JSON request body", async () => {
    httpServer.use(
      http.post(`${BASE_URL}/items`, async ({ request }) =>
        HttpResponse.json(
          {
            contentType: request.headers.get("content-type"),
            payload: await request.json(),
          },
          { status: 201 },
        ),
      ),
    );

    await expect(
      client.request({
        method: "POST",
        path: "/items",
        body: { name: "Item" },
      }),
    ).resolves.toEqual({
      status: 201,
      body: { contentType: "application/json", payload: { name: "Item" } },
    });
  });

  test.each([204, 205])("returns no body for status %i", async (status) => {
    httpServer.use(
      http.delete(
        `${BASE_URL}/items/1`,
        () =>
          new HttpResponse(null, {
            status,
            headers: { "Content-Length": "0" },
          }),
      ),
    );

    await expect(
      client.request({ method: "DELETE", path: "/items/1" }),
    ).resolves.toEqual({ status, body: undefined });
  });

  test("returns no body for a HEAD request", async () => {
    httpServer.use(
      http.head(`${BASE_URL}/items`, () => new HttpResponse(null)),
    );

    await expect(
      client.request({ method: "HEAD", path: "/items" }),
    ).resolves.toEqual({ status: 200, body: undefined });
  });

  test("accepts an empty successful response", async () => {
    httpServer.use(http.get(`${BASE_URL}/items`, () => new HttpResponse("")));

    await expect(
      client.request({ method: "GET", path: "/items" }),
    ).resolves.toEqual({ status: 200, body: undefined });
  });

  test("reports malformed successful JSON as an invalid response", async () => {
    httpServer.use(
      http.get(`${BASE_URL}/items`, () => HttpResponse.text("not JSON")),
    );

    await expect(
      client.request({ method: "GET", path: "/items" }),
    ).rejects.toMatchObject({
      name: "HttpError",
      kind: "invalid-response",
      status: 200,
      body: "not JSON",
      cause: expect.any(SyntaxError),
    });
  });

  test("preserves the HTTP status and decoded error body", async () => {
    httpServer.use(
      http.get(`${BASE_URL}/items`, () =>
        HttpResponse.json({ message: "Unavailable" }, { status: 503 }),
      ),
    );

    await expect(
      client.request({ method: "GET", path: "/items" }),
    ).rejects.toMatchObject({
      kind: "http",
      status: 503,
      body: { message: "Unavailable" },
    });
  });

  test("preserves non-JSON HTTP errors without misclassifying them", async () => {
    httpServer.use(
      http.get(`${BASE_URL}/items`, () =>
        HttpResponse.html("<h1>Bad Gateway</h1>", { status: 502 }),
      ),
    );

    await expect(
      client.request({ method: "GET", path: "/items" }),
    ).rejects.toMatchObject({
      kind: "http",
      status: 502,
      body: "<h1>Bad Gateway</h1>",
    });
  });

  test("translates a network failure to HttpError", async () => {
    httpServer.use(http.get(`${BASE_URL}/items`, () => HttpResponse.error()));

    const request = client.request({ method: "GET", path: "/items" });
    await expect(request).rejects.toBeInstanceOf(HttpError);
    await expect(request).rejects.toMatchObject({ kind: "network" });
  });

  test("translates a timeout without treating it as a network failure", async () => {
    httpServer.use(
      http.get(`${BASE_URL}/items`, async () => {
        await delay(100);
        return HttpResponse.json([]);
      }),
    );
    const impatientClient = createAxiosHttpClient({
      baseUrl: BASE_URL,
      timeoutMs: 20,
    });

    await expect(
      impatientClient.request({ method: "GET", path: "/items" }),
    ).rejects.toMatchObject({ kind: "timeout" });
  });

  test("translates an aborted request to cancellation", async () => {
    const controller = new AbortController();
    controller.abort();

    await expect(
      client.request({
        method: "GET",
        path: "/items",
        signal: controller.signal,
      }),
    ).rejects.toMatchObject({ kind: "cancelled" });
  });
});

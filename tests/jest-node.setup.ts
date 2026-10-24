import { httpServer } from "./http-server";

beforeAll(() => {
  httpServer.listen({ onUnhandledFrame: "error" });
});

afterEach(() => {
  httpServer.resetHandlers();
});

afterAll(() => {
  httpServer.close();
});

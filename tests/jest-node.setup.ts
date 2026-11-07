import { httpServer } from "./http-server";

// readEnv reads the app variant from expo-constants, which loads native
// modules and cannot run in Node. Without app config the variant defaults to
// development; a test can replace this mock with its own jest.mock.
jest.mock("expo-constants", () => ({
  __esModule: true,
  default: { expoConfig: { extra: {} } },
}));

beforeAll(() => {
  httpServer.listen({ onUnhandledFrame: "error" });
});

afterEach(() => {
  httpServer.resetHandlers();
});

afterAll(() => {
  httpServer.close();
});

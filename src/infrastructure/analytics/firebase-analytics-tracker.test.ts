jest.mock("@react-native-firebase/analytics", () => ({
  getAnalytics: jest.fn(() => ({ name: "analytics" })),
  logEvent: jest.fn(() => Promise.resolve()),
  logScreenView: jest.fn(() => Promise.resolve()),
  setAnalyticsCollectionEnabled: jest.fn(() => Promise.resolve()),
  setConsent: jest.fn(() => Promise.resolve()),
}));

import {
  getAnalytics,
  logEvent,
  logScreenView,
  setAnalyticsCollectionEnabled,
  setConsent,
} from "@react-native-firebase/analytics";
import {
  type AnalyticsTracker,
  noopAnalyticsTracker,
} from "./analytics-tracker";
import { createFirebaseAnalyticsTracker } from "./firebase-analytics-tracker";

const instance = { name: "analytics" };

type TestEvents = {
  share: { content_type: string; method: string };
  tutorial_complete: undefined;
};
type TestScreen = "/" | "/items/[id]";

test("does not touch the SDK when disabled", () => {
  expect(createFirebaseAnalyticsTracker({ isEnabled: false })).toBe(
    noopAnalyticsTracker,
  );
  expect(getAnalytics).not.toHaveBeenCalled();
});

test.each([true, false])(
  "applies consent %s while advertising signals stay denied",
  async (isGranted) => {
    const tracker = createFirebaseAnalyticsTracker({ isEnabled: true });

    await tracker.setCollectionConsent(isGranted);

    expect(setConsent).toHaveBeenCalledWith(instance, {
      analytics_storage: isGranted,
      ad_storage: false,
      ad_user_data: false,
      ad_personalization: false,
    });
    expect(setAnalyticsCollectionEnabled).toHaveBeenCalledWith(
      instance,
      isGranted,
    );
  },
);

test("logs screens and events", () => {
  const tracker = createFirebaseAnalyticsTracker<TestEvents, TestScreen>({
    isEnabled: true,
  });

  tracker.logScreenView("/items/[id]");
  tracker.logEvent("share", { content_type: "item", method: "system" });
  tracker.logEvent("tutorial_complete");

  expect(logScreenView).toHaveBeenCalledWith(instance, {
    screen_name: "/items/[id]",
    screen_class: "/items/[id]",
  });
  expect(logEvent).toHaveBeenCalledWith(instance, "share", {
    content_type: "item",
    method: "system",
  });
  expect(logEvent).toHaveBeenCalledWith(
    instance,
    "tutorial_complete",
    undefined,
  );
});

test("the bound catalog types event names, parameters and screens", () => {
  const tracker: AnalyticsTracker<TestEvents, TestScreen> =
    noopAnalyticsTracker;

  // @ts-expect-error: unknown event name.
  tracker.logEvent("item_shared");
  // @ts-expect-error: the event requires parameters.
  tracker.logEvent("share");
  // @ts-expect-error: unknown parameter.
  tracker.logEvent("share", { content_type: "item", method: "x", id: 1 });
  // @ts-expect-error: the event takes no parameters.
  tracker.logEvent("tutorial_complete", { count: 1 });
  // @ts-expect-error: not a route pattern.
  tracker.logScreenView("/items/42");

  expect(tracker).toBe(noopAnalyticsTracker);
});

test("swallows SDK failures when logging", async () => {
  jest.mocked(getAnalytics).mockImplementationOnce(() => {
    throw new Error("No Firebase App");
  });

  expect(createFirebaseAnalyticsTracker({ isEnabled: true })).toBe(
    noopAnalyticsTracker,
  );

  const tracker = createFirebaseAnalyticsTracker<TestEvents, TestScreen>({
    isEnabled: true,
  });
  jest.mocked(logScreenView).mockRejectedValueOnce(new Error("native"));
  jest.mocked(logEvent).mockImplementationOnce(() => {
    throw new Error("native");
  });

  expect(() => tracker.logScreenView("/")).not.toThrow();
  expect(() => tracker.logEvent("tutorial_complete")).not.toThrow();
  await Promise.resolve();
});

test("reports consent failures to the caller", async () => {
  jest.mocked(setConsent).mockRejectedValueOnce(new Error("native"));

  await expect(
    createFirebaseAnalyticsTracker({ isEnabled: true }).setCollectionConsent(
      true,
    ),
  ).rejects.toThrow("native");
});

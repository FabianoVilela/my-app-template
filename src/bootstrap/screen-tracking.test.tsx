import { toRoutePattern } from "./screen-tracking";

test.each([
  [[], "/"],
  [["settings"], "/settings"],
  [["(tabs)", "items", "[id]"], "/items/[id]"],
  [["(auth)", "(modal)", "[...rest]"], "/[...rest]"],
])("maps segments %j to route pattern %s", (segments, pattern) => {
  expect(toRoutePattern(segments)).toBe(pattern);
});

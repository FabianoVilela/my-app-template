import { render, screen, userEvent } from "@testing-library/react-native";
import { Collapse, CollapseGroup } from "./collapse";
import { Text } from "./text";

function Faq({ isSingleExpand = false }: { isSingleExpand?: boolean }) {
  return (
    <CollapseGroup isSingleExpand={isSingleExpand}>
      <Collapse title="Change password" isInitiallyOpen>
        <Text>Open Settings, then Security.</Text>
      </Collapse>
      <Collapse title="Offline use">
        <Text>Recent content stays available.</Text>
      </Collapse>
    </CollapseGroup>
  );
}

function header(name: string) {
  return screen.getByRole("button", { name });
}

test("toggles each item independently by default", async () => {
  await render(<Faq />);
  const user = userEvent.setup();

  expect(header("Change password")).toBeExpanded();
  expect(header("Offline use")).toBeCollapsed();

  await user.press(header("Offline use"));

  expect(header("Change password")).toBeExpanded();
  expect(header("Offline use")).toBeExpanded();

  await user.press(header("Change password"));

  expect(header("Change password")).toBeCollapsed();
});

test("keeps only one item open in single-expand mode", async () => {
  await render(<Faq isSingleExpand />);
  const user = userEvent.setup();

  await user.press(header("Offline use"));

  expect(header("Change password")).toBeCollapsed();
  expect(header("Offline use")).toBeExpanded();

  await user.press(header("Offline use"));

  expect(header("Offline use")).toBeCollapsed();
});

test("hides collapsed content from assistive tech", async () => {
  await render(<Faq />);

  expect(screen.getByText("Open Settings, then Security.")).toBeVisible();
  expect(
    screen.queryByText("Recent content stays available."),
  ).not.toBeVisible();
});

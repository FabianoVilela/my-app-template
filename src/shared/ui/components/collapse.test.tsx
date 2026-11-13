import { render, screen, userEvent } from "@testing-library/react-native";
import { Collapse, type CollapseExpandMode, CollapseGroup } from "./collapse";
import { Text } from "./text";

function Faq({ expandMode }: { expandMode?: CollapseExpandMode }) {
  return (
    <CollapseGroup expandMode={expandMode} defaultExpanded={["password"]}>
      <Collapse value="password" title="Change password">
        <Text>Open Settings, then Security.</Text>
      </Collapse>
      <Collapse value="offline" title="Offline use">
        <Text>Recent content stays available.</Text>
      </Collapse>
    </CollapseGroup>
  );
}

function header(name: string) {
  return screen.getByRole("button", { name });
}

test("opens the default items and toggles each independently", async () => {
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

test("keeps only one item open in single mode", async () => {
  await render(<Faq expandMode="single" />);
  const user = userEvent.setup();

  await user.press(header("Offline use"));

  expect(header("Change password")).toBeCollapsed();
  expect(header("Offline use")).toBeExpanded();

  await user.press(header("Offline use"));

  expect(header("Offline use")).toBeCollapsed();
});

test("renders content only while open", async () => {
  await render(<Faq />);

  expect(screen.getByText("Open Settings, then Security.")).toBeOnTheScreen();
  expect(
    screen.queryByText("Recent content stays available."),
  ).not.toBeOnTheScreen();
});

test("toggles on its own outside a group", async () => {
  await render(
    <Collapse value="terms" title="Terms">
      <Text>Read carefully.</Text>
    </Collapse>,
  );

  await userEvent.setup().press(header("Terms"));

  expect(header("Terms")).toBeExpanded();
  expect(screen.getByText("Read carefully.")).toBeOnTheScreen();
});

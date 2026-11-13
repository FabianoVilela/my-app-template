import { render, screen } from "@testing-library/react-native";
import { Bell } from "lucide-react-native";
import { Icon } from "./icon";

test("exposes a labeled icon as an image", async () => {
  await render(<Icon icon={Bell} accessibilityLabel="Notifications" />);

  expect(
    screen.getByRole("image", { name: "Notifications" }),
  ).toBeOnTheScreen();
});

test("hides a decorative icon from assistive tech", async () => {
  await render(<Icon icon={Bell} />);

  expect(screen.queryByRole("image")).not.toBeOnTheScreen();
});

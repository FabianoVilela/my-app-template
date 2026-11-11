import { render, screen } from "@testing-library/react-native";
import { Divider } from "./divider";

test("renders its label between the lines", async () => {
  await render(<Divider label="or" />);

  expect(screen.getByText("or")).toBeOnTheScreen();
});

test("renders a plain line without text", async () => {
  await render(<Divider />);

  expect(screen.root).toBeEmptyElement();
});

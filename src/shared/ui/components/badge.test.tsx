import { render, screen } from "@testing-library/react-native";
import { Badge } from "./badge";

test("renders its label", async () => {
  await render(<Badge label="Active" tone="success" hasDot />);

  expect(screen.getByText("Active")).toBeOnTheScreen();
});

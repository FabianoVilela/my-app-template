import type { LucideIcon } from "lucide-react-native";
import { useUnistyles } from "react-native-unistyles";
import type { lightTheme } from "../theme";
import type { TextColor } from "./text";

export type IconSize = keyof (typeof lightTheme)["icon"]["size"];

export type IconProps = {
  /** A Lucide icon, imported from `lucide-react-native`. */
  icon: LucideIcon;
  /** Defaults to `md` (20). */
  size?: IconSize;
  /** Color role; defaults to `text`. */
  color?: TextColor;
  /** Makes the icon meaningful to assistive tech; omit for decorative icons. */
  accessibilityLabel?: string;
};

/** The only way shared and module UI render icons: Lucide at the design stroke. */
export function Icon({
  icon: LucideComponent,
  size = "md",
  color = "text",
  accessibilityLabel,
}: IconProps) {
  // SVG color and size are props, not styles, so they read the theme here.
  const { theme } = useUnistyles();
  const isDecorative = accessibilityLabel === undefined;

  return (
    <LucideComponent
      size={theme.icon.size[size]}
      color={theme.colors[color]}
      strokeWidth={theme.icon.strokeWidth}
      // Lucide hides every icon by default; a label opts it back in.
      aria-hidden={isDecorative}
      accessible={!isDecorative}
      accessibilityRole={isDecorative ? undefined : "image"}
      accessibilityLabel={accessibilityLabel}
    />
  );
}

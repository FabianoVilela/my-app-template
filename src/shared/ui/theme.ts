/** Design tokens shared by every theme; colors vary per light/dark theme. */
const spacing = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 } as const;
const radius = { md: 8 } as const;
const typography = {
  body: { fontSize: 16, lineHeight: 24 },
  title: { fontSize: 20, lineHeight: 28, fontWeight: "600" },
} as const;

export const lightTheme = {
  colors: {
    background: "#FFFFFF",
    text: "#11181C",
    textMuted: "#5F6B73",
    primary: "#0A6FD1",
    onPrimary: "#FFFFFF",
  },
  spacing,
  radius,
  typography,
};

export const darkTheme = {
  colors: {
    background: "#151718",
    text: "#ECEDEE",
    textMuted: "#9BA1A6",
    primary: "#5AAEFF",
    onPrimary: "#0B1A2A",
  },
  spacing,
  radius,
  typography,
} satisfies typeof lightTheme;

/** Minimum window widths; the first breakpoint must start at 0. */
export const breakpoints = { xs: 0, sm: 576, md: 768, lg: 992, xl: 1200 };

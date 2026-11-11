# Design system

The app uses one design system, **Teal**: clean surfaces, a teal primary, a navy secondary and Plus Jakarta Sans throughout. This guide explains where its decisions live, how the tokens map to code and the interaction rules every shared component follows.

## Sources of truth

| Source | Owns | Change it when |
| --- | --- | --- |
| [`src/shared/ui/theme.ts`](../../src/shared/ui/theme.ts) | Token values used at runtime | A token is added, removed or changes value |
| [`src/shared/ui/fonts.ts`](../../src/shared/ui/fonts.ts) | The typeface and the weights loaded at startup | Typography needs a weight that is not loaded |
| This guide | Token meaning, usage and interaction rules | A rule or a token's intent changes |

Code wins over any external design file. Apply approved visual changes to `theme.ts` and this guide in the same change.

## Using tokens

Read tokens through Unistyles, never as literals in components:

```tsx
const styles = StyleSheet.create((theme) => ({
  card: {
    padding: theme.spacing[4],
    borderRadius: theme.radius.xl,
    backgroundColor: theme.colors.surface,
    boxShadow: theme.shadows.sm,
  },
  title: { ...theme.typography.h3, color: theme.colors.text },
}));
```

`light` and `dark` must keep the same shape; `darkTheme` uses `satisfies typeof lightTheme` to enforce it. Themes follow the OS appearance (`adaptiveThemes`). Add a token only for a value with reusable meaning; a one-off measurement stays in the component.

## Color roles

Colors are named by role, not hue. Pair each fill with its `on*` color for content placed on it.

| Role | Tokens | Use |
| --- | --- | --- |
| Canvas | `background`, `surface`, `surfaceMuted` | Screen background, cards and sheets, subtle fills and pressed ghost states |
| Lines | `border`, `borderStrong`, `control` | Dividers and card borders, outline buttons, unchecked inputs and selection controls |
| Text | `text`, `textSecondary`, `textMuted` | Primary content, supporting content, placeholders and captions |
| Primary | `primary`, `primaryPressed`, `onPrimary`, `primarySoft`, `onPrimarySoft` | Main actions and selected controls; soft variants for tonal buttons and badges |
| Secondary | `secondary`, `secondaryPressed`, `onSecondary` | Strong neutral actions |
| Inverse | `inverse`, `onInverse` | Toasts and selected chips |
| Interaction | `link`, `focus`, `focusRing` | Inline links, focus outlines and focused input halos |
| Status | `success`, `warning`, `danger`, `info`, each with `*Soft`; `onDanger` | Feedback, validation, alerts and badges |
| Highlight | `highlight`, `onHighlight` | Promotional or "new" emphasis, in purple to stay distinct from status colors |
| Disabled | `disabled`, `onDisabled` | Fill and content of any disabled control |
| Selection controls | `knob`, `track` | Switch knob and progress track |

### Contrast

White on `primary` (#17B5A6) measures 2.6:1, below WCAG AA for text. The product owner accepted it for visual preference. To keep text and focus indicators readable:

- Use `link` for teal text and `focus` for outlines, never `primary`.
- Keep primary button labels at the `button` text style (16 px, weight 600) or larger.
- Do not place body text in `onPrimary` on a `primary` fill.

## Typography

One family, Plus Jakarta Sans, loaded with weights 400, 500, 600, 700 and 800. Every style sets `fontFamily` and `fontWeight`; `fontWeight` selects the loaded face on all platforms.

| Token | Size / line height | Weight | Use |
| --- | --- | --- | --- |
| `display` | 40 / 44 | 800 | Hero numbers and onboarding headlines |
| `h1` | 30 / 36 | 700 | Screen titles |
| `h2` | 22 / 28 | 700 | Section titles |
| `h3` | 17 / 24 | 600 | Card and list titles |
| `body` | 16 / 24 | 400 | Default text |
| `bodySmall` | 14 / 20 | 400 | Dense text |
| `label` | 14 / 20 | 500 | Field labels and chips |
| `button` | 16 / 24 | 600 | Button labels |
| `helper` | 13 / 18 | 400 | Field help and error messages |
| `caption` | 12 / 16 | 400 | Metadata and timestamps |
| `overline` | 11 / 16 | 600 | Uppercase group headers |
| `mono` | 12 / 16 | system | Codes and identifiers, in the platform monospace font |

Headings and `display` use negative letter spacing; it is part of the token. Typography tokens carry no color: pick a text role separately.

### Font loading

`startup` calls `loadFonts()` from `shared/ui/fonts.ts` while the splash screen is visible. It uses `expo-font` at runtime so Android, iOS and web share one code path. A failed load is reported as `fonts.load` and the app continues in the system font; a missing typeface never blocks startup.

## Spacing, radius and elevation

Spacing follows a 4 pt grid. The key is the multiple of 4: `spacing[1]` is 4, `spacing[4]` is 16, `spacing[16]` is 64. Available keys are 0, 1, 2, 3, 4, 5, 6, 8, 10, 12 and 16. Screens use `spacing[5]` (20) as horizontal padding.

| Radius | Value | Use |
| --- | --- | --- |
| `xs` | 6 | Checkboxes and small tags |
| `sm` | 10 | Icon buttons and inner elements |
| `md` | 12 | Buttons, inputs, alerts and toasts |
| `lg` | 16 | Small containers and tiles |
| `xl` | 18 | Cards and grouped lists |
| `xxl` | 28 | Bottom sheets and large media |
| `full` | 999 | Pills, badges, avatars and switches |

`shadows.sm`, `shadows.md` and `shadows.lg` are `boxShadow` strings for resting controls, raised cards and floating layers. Use `shadows.card` for cards: the dark theme sets it to a transparent shadow and relies on the card border. `shadows.knob` is the switch knob.

## Iconography

Icons come from [Lucide](https://lucide.dev) through `lucide-react-native`. Components render them through the shared `Icon` component in `shared/ui/components/`, never by importing Lucide directly, so size and stroke stay consistent.

- Sizes: `icon.size.sm` (16), `md` (20, default) and `lg` (24).
- Stroke: `icon.strokeWidth` (1.75), with round caps and joins.
- Color: inherit the surrounding text role; icon-only buttons need an accessibility label.

## Interaction states

Shared components are touch-first and follow these rules:

- **Pressed:** shift the tone, never scale. Filled variants switch to their `*Pressed` color (`primaryPressed`, `secondaryPressed`, `primarySoftPressed`, `dangerPressed`), paint the border in the fill color and drop their shadow. Outline and ghost variants gain a `surfaceMuted` background.
- **Hover:** none. Hover styles would mask the pressed state on touch devices.
- **Focus:** a 2 px `focus` outline; focused inputs add a 4 px `focusRing` halo.
- **Loading:** keep the variant color at `state.loadingOpacity` (0.7), show a spinner and ignore presses. Loading is not disabled.
- **Disabled:** `disabled` fill with `onDisabled` content, no shadow, and the control announces its disabled state.
- **Error:** `danger` border with a `dangerSoft` halo and a `helper` message in `danger`.
- **Minimum touch target:** 44 × 44 points, even when the visible control is smaller.

## Motion

| Token | Value | Use |
| --- | --- | --- |
| `motion.duration.fast` | 120 ms | Pressed color changes |
| `motion.duration.base` | 200 ms | Selection controls and fades |
| `motion.duration.slow` | 320 ms | Expanding content, such as a Collapse |
| `motion.easing` | `[0.2, 0.8, 0.2, 1]` | Pass to `Easing.bezier` for every non-linear transition |

Respect the OS reduced-motion setting: skip size and position animations when it is enabled. `useReducedMotion` in `shared/ui` follows that setting. Animations use React Native's `Animated`; Reanimated is not installed, so add it deliberately when a gesture-driven or UI-thread animation needs it.

## Components

Shared components live in `src/shared/ui/components/`, one file per component with its test beside it, and consume only these tokens. Tokens, fonts and hooks such as `useReducedMotion` stay in `src/shared/ui/`. Props are documented in each component's source; this guide keeps only rules that span components.

File names below are relative to `src/shared/ui/components/`.

| Component | File | Notes |
| --- | --- | --- |
| `Text` | `text.tsx` | `variant` picks a typography token, `color` a color role; heading variants get the header role |
| `Screen` | `screen.tsx` | Background, 20 pt side padding and safe areas; pass `edges={["bottom"]}` under a navigator header; `isScrollable` for long content |
| `Divider` | `divider.tsx` | 1 px `border` line, optionally with a centered label |
| `Checkbox`, `RadioButton`, `Switch` | `checkbox.tsx`, `radio-button.tsx`, `switch.tsx` | Controlled; the whole row, label included, is the touch target and carries the role and checked state. Wrap radio sets in a `radiogroup` view |
| `Badge` | `badge.tsx` | Non-interactive status pill in one of seven tones, with an optional dot |
| `Icon` | `icon.tsx` | Renders a Lucide icon at a token size, stroke and color role; decorative unless given an accessibility label |
| `Button` | `button.tsx` | Variants `primary`, `secondary`, `soft`, `outline`, `ghost`, `danger` and `ghostDanger`; sizes `sm`, `md` and `lg`; leading or trailing icons; `isLoading`, `isDisabled` and `isBlock`. Pass `icon` and a required `accessibilityLabel` for an icon-only button |
| `Input` | `input.tsx` | Labeled field with helper and error text; `type="password"` adds a show/hide toggle and `type="search"` a pill with a clear button. Toggle and clear labels come from the `ui` translation namespace |
| `CollapseGroup`, `Collapse` | `collapse.tsx` | A card of disclosure rows. `isSingleExpand` on the group keeps one item open; each item takes any children and `hasContentPadding` (default `true`) |
| `ErrorScreen` | `error-screen.tsx` | Full-screen startup and render failure fallback with fixed bilingual text, used by bootstrap |

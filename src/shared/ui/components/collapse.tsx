import { ChevronDown } from "lucide-react-native";
import {
  Children,
  createContext,
  Fragment,
  isValidElement,
  type ReactNode,
  use,
  useEffect,
  useState,
} from "react";
import {
  Animated,
  Easing,
  LayoutAnimation,
  Pressable,
  View,
} from "react-native";
import { StyleSheet } from "react-native-unistyles";
import { motion } from "../theme";
import { useReducedMotion } from "../use-reduced-motion";
import { Divider } from "./divider";
import { Icon } from "./icon";
import { Text } from "./text";

export type CollapseExpandMode = "single" | "multiple";

type CollapseGroupContextValue = {
  state: { expanded: ReadonlySet<string> };
  actions: { toggle: (value: string) => void };
};

const CollapseGroupContext = createContext<CollapseGroupContextValue | null>(
  null,
);

/**
 * Animates the next layout change natively: size changes ease, content
 * fades in and out. Skipped when the OS asks for reduced motion.
 */
function animateNextLayout(isReducedMotion: boolean) {
  if (isReducedMotion) return;

  LayoutAnimation.configureNext({
    duration: motion.duration.slow,
    create: { type: "easeInEaseOut", property: "opacity" },
    update: { type: "easeInEaseOut" },
    delete: { type: "easeInEaseOut", property: "opacity" },
  });
}

function nextExpanded(
  expanded: ReadonlySet<string>,
  value: string,
  expandMode: CollapseExpandMode,
): ReadonlySet<string> {
  if (expanded.has(value)) {
    const next = new Set(expanded);
    next.delete(value);
    return next;
  }

  return expandMode === "single"
    ? new Set([value])
    : new Set(expanded).add(value);
}

export type CollapseGroupProps = {
  /** `single` keeps one item open at a time. Defaults to `multiple`. */
  expandMode?: CollapseExpandMode;
  /** Values of the items open on first render. */
  defaultExpanded?: readonly string[];
  /** `Collapse` items; dividers are added between them. */
  children: ReactNode;
};

/** Card that stacks `Collapse` items and owns which of them are open. */
export function CollapseGroup({
  expandMode = "multiple",
  defaultExpanded = [],
  children,
}: CollapseGroupProps) {
  const isReducedMotion = useReducedMotion();
  const [expanded, setExpanded] = useState<ReadonlySet<string>>(
    () =>
      new Set(
        expandMode === "single" ? defaultExpanded.slice(0, 1) : defaultExpanded,
      ),
  );
  const items = Children.toArray(children);

  function toggle(value: string) {
    animateNextLayout(isReducedMotion);
    setExpanded((current) => nextExpanded(current, value, expandMode));
  }

  return (
    <CollapseGroupContext value={{ state: { expanded }, actions: { toggle } }}>
      <View style={styles.card}>
        {items.map((item, index) => (
          // Children.toArray gives every element a stable key.
          <Fragment key={isValidElement(item) ? item.key : undefined}>
            {index > 0 ? <Divider /> : null}
            {item}
          </Fragment>
        ))}
      </View>
    </CollapseGroupContext>
  );
}

export type CollapseProps = {
  /** Identifies the item within its `CollapseGroup`. */
  value: string;
  title: string;
  /** Any content: text, components or both. */
  children: ReactNode;
  /** Initial state when used outside a group; groups use `defaultExpanded`. */
  isInitiallyOpen?: boolean;
  /** Pads the content to align with the title. Defaults to `true`. */
  hasContentPadding?: boolean;
};

/** Disclosure row: the header toggles content that expands in place. */
export function Collapse({
  value,
  title,
  children,
  isInitiallyOpen = false,
  hasContentPadding = true,
}: CollapseProps) {
  const group = use(CollapseGroupContext);
  const isReducedMotion = useReducedMotion();
  const [isLocallyOpen, setIsLocallyOpen] = useState(isInitiallyOpen);
  const isOpen = group ? group.state.expanded.has(value) : isLocallyOpen;
  const [rotation] = useState(() => new Animated.Value(isOpen ? 1 : 0));

  styles.useVariants({ hasContentPadding });

  useEffect(() => {
    const animation = Animated.timing(rotation, {
      toValue: isOpen ? 1 : 0,
      duration: isReducedMotion ? 0 : motion.duration.slow,
      easing: Easing.bezier(...motion.easing),
      useNativeDriver: true,
    });

    animation.start();

    return () => animation.stop();
  }, [isOpen, isReducedMotion, rotation]);

  function handleToggle() {
    if (group) {
      group.actions.toggle(value);
      return;
    }

    animateNextLayout(isReducedMotion);
    setIsLocallyOpen(!isOpen);
  }

  const chevronStyle = {
    transform: [
      {
        rotate: rotation.interpolate({
          inputRange: [0, 1],
          outputRange: ["0deg", "180deg"],
        }),
      },
    ],
  };

  return (
    <View style={styles.item}>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ expanded: isOpen }}
        onPress={handleToggle}
        style={({ pressed }) => [
          styles.header,
          pressed ? styles.headerPressed : null,
        ]}
      >
        <Text variant="label" style={styles.title}>
          {title}
        </Text>
        <Animated.View style={chevronStyle}>
          <Icon icon={ChevronDown} color="textMuted" />
        </Animated.View>
      </Pressable>
      {isOpen ? <View style={styles.content}>{children}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  card: {
    overflow: "hidden",
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.xl,
    borderCurve: "continuous",
    backgroundColor: theme.colors.surface,
    boxShadow: theme.shadows.card,
  },
  item: {
    overflow: "hidden",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing[3],
    minHeight: 56,
    paddingVertical: theme.spacing[3],
    paddingHorizontal: theme.spacing[4],
  },
  headerPressed: {
    backgroundColor: theme.colors.surfaceMuted,
  },
  title: {
    flex: 1,
  },
  content: {
    variants: {
      hasContentPadding: {
        true: {
          paddingHorizontal: theme.spacing[4],
          paddingBottom: theme.spacing[4],
        },
      },
    },
  },
}));

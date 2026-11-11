import { ChevronDown } from "lucide-react-native";
import {
  Children,
  createContext,
  Fragment,
  isValidElement,
  type ReactNode,
  useContext,
  useEffect,
  useId,
  useState,
} from "react";
import { Animated, Easing, Pressable, View } from "react-native";
import { StyleSheet, useUnistyles } from "react-native-unistyles";
import { useReducedMotion } from "../use-reduced-motion";
import { Divider } from "./divider";
import { Icon } from "./icon";
import { Text } from "./text";

type GroupContextValue = {
  isSingleExpand: boolean;
  /** `undefined` until a user opens or closes an item in single mode. */
  openId: string | null | undefined;
  setOpenId: (id: string | null) => void;
};

const GroupContext = createContext<GroupContextValue | null>(null);

export type CollapseGroupProps = {
  children: ReactNode;
  /** Opening an item closes the others. Defaults to `false`. */
  isSingleExpand?: boolean;
};

/** Card that stacks `Collapse` items with dividers between them. */
export function CollapseGroup({
  children,
  isSingleExpand = false,
}: CollapseGroupProps) {
  const [openId, setOpenId] = useState<string | null | undefined>(undefined);
  const items = Children.toArray(children);

  return (
    <GroupContext value={{ isSingleExpand, openId, setOpenId }}>
      <View style={styles.card}>
        {items.map((item, index) => (
          // Children.toArray gives every element a stable key.
          <Fragment key={isValidElement(item) ? item.key : undefined}>
            {index > 0 ? <Divider /> : null}
            {item}
          </Fragment>
        ))}
      </View>
    </GroupContext>
  );
}

export type CollapseProps = {
  title: string;
  /** Any content: text, components or both. */
  children: ReactNode;
  isInitiallyOpen?: boolean;
  /** Pads the content to align with the title. Defaults to `true`. */
  hasContentPadding?: boolean;
};

/** Disclosure row: the header toggles content that expands in place. */
export function Collapse({
  title,
  children,
  isInitiallyOpen = false,
  hasContentPadding = true,
}: CollapseProps) {
  const id = useId();
  const group = useContext(GroupContext);
  const [isLocallyOpen, setIsLocallyOpen] = useState(isInitiallyOpen);
  const isGroupControlled = group?.isSingleExpand === true;
  const isOpen = isGroupControlled
    ? isGroupItemOpen(group.openId, id, isInitiallyOpen)
    : isLocallyOpen;
  const { theme } = useUnistyles();
  const isReducedMotion = useReducedMotion();
  const [progress] = useState(() => new Animated.Value(isOpen ? 1 : 0));
  const [contentHeight] = useState(() => new Animated.Value(0));

  styles.useVariants({ hasContentPadding });

  useEffect(() => {
    // Height cannot use the native driver, so the whole transition runs in JS.
    const animation = Animated.timing(progress, {
      toValue: isOpen ? 1 : 0,
      duration: isReducedMotion ? 0 : theme.motion.duration.slow,
      easing: Easing.bezier(...theme.motion.easing),
      useNativeDriver: false,
    });

    animation.start();

    return () => animation.stop();
  }, [isOpen, isReducedMotion, progress, theme.motion]);

  const bodyStyle = { height: Animated.multiply(progress, contentHeight) };
  const contentStyle = {
    opacity: progress,
    transform: [
      {
        translateY: progress.interpolate({
          inputRange: [0, 1],
          outputRange: [-4, 0],
        }),
      },
    ],
  };
  const chevronStyle = {
    transform: [
      {
        rotate: progress.interpolate({
          inputRange: [0, 1],
          outputRange: ["0deg", "180deg"],
        }),
      },
    ],
  };

  function handleToggle() {
    if (isGroupControlled) {
      group.setOpenId(isOpen ? null : id);
      return;
    }

    setIsLocallyOpen(!isOpen);
  }

  return (
    <View>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ expanded: isOpen }}
        onPress={handleToggle}
        style={({ pressed }) =>
          pressed ? [styles.header, styles.headerPressed] : styles.header
        }
      >
        <Text variant="label" style={styles.title}>
          {title}
        </Text>
        <Animated.View style={chevronStyle}>
          <Icon icon={ChevronDown} color="textMuted" />
        </Animated.View>
      </Pressable>
      <Animated.View
        style={[styles.body, bodyStyle]}
        accessibilityElementsHidden={!isOpen}
        importantForAccessibility={isOpen ? "auto" : "no-hide-descendants"}
      >
        <Animated.View
          style={[styles.content, contentStyle]}
          onLayout={(event) =>
            contentHeight.setValue(event.nativeEvent.layout.height)
          }
        >
          {children}
        </Animated.View>
      </Animated.View>
    </View>
  );
}

/** Before any interaction, single mode honors each item's initial state. */
function isGroupItemOpen(
  openId: string | null | undefined,
  id: string,
  isInitiallyOpen: boolean,
) {
  if (openId === undefined) return isInitiallyOpen;

  return openId === id;
}

const styles = StyleSheet.create((theme) => ({
  card: {
    overflow: "hidden",
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.xl,
    backgroundColor: theme.colors.surface,
    boxShadow: theme.shadows.card,
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
  body: {
    overflow: "hidden",
  },
  // Absolute so it lays out at full height while the body is clipped.
  content: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
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

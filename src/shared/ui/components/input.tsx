import type { LucideIcon } from "lucide-react-native";
import { FieldFrame, FieldIcon, FieldInput, type FieldProps } from "./field";
import { useFieldFocus } from "./use-field-focus";

export type InputProps = FieldProps & {
  leadingIcon?: LucideIcon;
};

/** Labeled single-line text field with helper, error and disabled states. */
export function Input({
  label,
  helperText,
  errorText,
  isDisabled = false,
  leadingIcon,
  onFocus,
  onBlur,
  ...inputProps
}: InputProps) {
  const focus = useFieldFocus(onFocus, onBlur);

  return (
    <FieldFrame
      visibleLabel={label}
      helperText={helperText}
      errorText={errorText}
      isDisabled={isDisabled}
      isFocused={focus.isFocused}
    >
      {leadingIcon ? (
        <FieldIcon icon={leadingIcon} isDisabled={isDisabled} />
      ) : null}
      <FieldInput
        {...inputProps}
        isDisabled={isDisabled}
        accessibilityLabel={label}
        accessibilityHint={errorText ?? helperText}
        onFocus={focus.onFocus}
        onBlur={focus.onBlur}
      />
    </FieldFrame>
  );
}

import { Eye, EyeOff, type LucideIcon } from "lucide-react-native";
import { useState } from "react";
import { useAppTranslation } from "@/shared/i18n";
import {
  FieldAction,
  FieldFrame,
  FieldIcon,
  FieldInput,
  type FieldProps,
} from "./field";
import { useFieldFocus } from "./use-field-focus";

export type PasswordInputProps = FieldProps & {
  leadingIcon?: LucideIcon;
};

/** Password field with a show/hide toggle; hidden by default. */
export function PasswordInput({
  label,
  helperText,
  errorText,
  isDisabled = false,
  leadingIcon,
  onFocus,
  onBlur,
  ...inputProps
}: PasswordInputProps) {
  const { t } = useAppTranslation("ui");
  const focus = useFieldFocus(onFocus, onBlur);
  const [isVisible, setIsVisible] = useState(false);

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
        autoCapitalize="none"
        autoCorrect={false}
        autoComplete="current-password"
        {...inputProps}
        isDisabled={isDisabled}
        secureTextEntry={!isVisible}
        accessibilityLabel={label}
        accessibilityHint={errorText ?? helperText}
        onFocus={focus.onFocus}
        onBlur={focus.onBlur}
      />
      <FieldAction
        icon={isVisible ? EyeOff : Eye}
        accessibilityLabel={isVisible ? t("hidePassword") : t("showPassword")}
        isDisabled={isDisabled}
        onPress={() => setIsVisible((wasVisible) => !wasVisible)}
      />
    </FieldFrame>
  );
}

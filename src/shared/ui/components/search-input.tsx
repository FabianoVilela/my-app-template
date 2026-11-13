import { Search, X } from "lucide-react-native";
import { useAppTranslation } from "@/shared/i18n";
import {
  FieldAction,
  FieldFrame,
  FieldIcon,
  FieldInput,
  type FieldProps,
} from "./field";
import { useFieldFocus } from "./use-field-focus";

export type SearchInputProps = FieldProps;

/**
 * Pill search bar with a clear button while it has text. It shows no
 * visible label; `label` is its accessible name.
 */
export function SearchInput({
  label,
  value,
  onChangeText,
  helperText,
  errorText,
  isDisabled = false,
  onFocus,
  onBlur,
  ...inputProps
}: SearchInputProps) {
  const { t } = useAppTranslation("ui");
  const focus = useFieldFocus(onFocus, onBlur);

  return (
    <FieldFrame
      helperText={helperText}
      errorText={errorText}
      isDisabled={isDisabled}
      isFocused={focus.isFocused}
      shape="pill"
    >
      <FieldIcon icon={Search} isDisabled={isDisabled} />
      <FieldInput
        autoCapitalize="none"
        autoCorrect={false}
        returnKeyType="search"
        {...inputProps}
        value={value}
        onChangeText={onChangeText}
        isDisabled={isDisabled}
        accessibilityLabel={label}
        accessibilityHint={errorText ?? helperText}
        onFocus={focus.onFocus}
        onBlur={focus.onBlur}
      />
      {value.length > 0 ? (
        <FieldAction
          icon={X}
          accessibilityLabel={t("clearSearch")}
          isDisabled={isDisabled}
          onPress={() => onChangeText("")}
        />
      ) : null}
    </FieldFrame>
  );
}

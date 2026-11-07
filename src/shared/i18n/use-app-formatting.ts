import { useMemo } from "react";
import { useAppLocale } from "./use-app-locale";

export function useAppFormatting() {
  const { locale } = useAppLocale();

  return useMemo(() => {
    const numbers = new Map<string, Intl.NumberFormat>();
    const dates = new Map<string, Intl.DateTimeFormat>();

    function number(value: number, options: Intl.NumberFormatOptions = {}) {
      const key = JSON.stringify(options);
      let formatter = numbers.get(key);

      if (!formatter) {
        formatter = new Intl.NumberFormat(locale, options);
        numbers.set(key, formatter);
      }
      return formatter.format(value);
    }

    return {
      number,
      currency: (value: number, currency: string) =>
        number(value, { style: "currency", currency }),
      percent: (ratio: number, options: Intl.NumberFormatOptions = {}) =>
        number(ratio, { ...options, style: "percent" }),
      date(value: Date, options: Intl.DateTimeFormatOptions = {}) {
        const key = JSON.stringify(options);

        let formatter = dates.get(key);
        if (!formatter) {
          formatter = new Intl.DateTimeFormat(locale, options);
          dates.set(key, formatter);
        }

        return formatter.format(value);
      },
    };
  }, [locale]);
}

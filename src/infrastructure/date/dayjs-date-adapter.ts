import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";
import utc from "dayjs/plugin/utc";

import type { DateAdapter, DateFormat } from "@/shared/lib/date-adapter";

dayjs.extend(customParseFormat);
dayjs.extend(utc);

const FORMAT_PATTERNS: Record<DateFormat, string> = {
  "iso-date": "YYYY-MM-DD",
  "short-date": "DD/MM/YYYY",
  "date-time": "DD/MM/YYYY HH:mm",
  time: "HH:mm",
};

export type DayjsDateAdapterConfig = {
  timeZone?: "local" | "utc";
};

export function createDayjsDateAdapter({
  timeZone = "local",
}: DayjsDateAdapterConfig = {}): DateAdapter {
  function readDate(value: Date) {
    assertValidDate(value);
    return timeZone === "utc" ? dayjs.utc(value) : dayjs(value);
  }

  return {
    parse(value, format) {
      const pattern = FORMAT_PATTERNS[format];
      const parsed =
        timeZone === "utc"
          ? dayjs.utc(value, pattern, true)
          : dayjs(value, pattern, true);

      return parsed.isValid() ? parsed.toDate() : null;
    },
    isValid,
    format(value, format) {
      return readDate(value).format(FORMAT_PATTERNS[format]);
    },
    add(value, amount, unit) {
      assertValidAmount(amount);
      const result = readDate(value).add(amount, unit).toDate();
      assertValidDate(result);
      return result;
    },
    subtract(value, amount, unit) {
      assertValidAmount(amount);
      const result = readDate(value).subtract(amount, unit).toDate();
      assertValidDate(result);
      return result;
    },
    startOf(value, unit) {
      const result = readDate(value).startOf(unit).toDate();
      assertValidDate(result);
      return result;
    },
    endOf(value, unit) {
      const result = readDate(value).endOf(unit).toDate();
      assertValidDate(result);
      return result;
    },
    difference(value, reference, unit) {
      return readDate(value).diff(readDate(reference), unit);
    },
    isBefore(value, reference, unit = "millisecond") {
      return readDate(value).isBefore(readDate(reference), unit);
    },
    isAfter(value, reference, unit = "millisecond") {
      return readDate(value).isAfter(readDate(reference), unit);
    },
    isSame(value, reference, unit = "millisecond") {
      return readDate(value).isSame(readDate(reference), unit);
    },
    toISOString(value) {
      return readDate(value).toISOString();
    },
  };
}

function isValid(value: Date): boolean {
  return value instanceof Date && Number.isFinite(value.getTime());
}

function assertValidDate(value: Date): void {
  if (!isValid(value)) {
    throw new RangeError("Invalid date");
  }
}

function assertValidAmount(amount: number): void {
  if (!Number.isSafeInteger(amount)) {
    throw new RangeError("Date amount must be a safe integer");
  }
}

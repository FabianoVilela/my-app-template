/** Project formats: YYYY-MM-DD, DD/MM/YYYY, DD/MM/YYYY HH:mm, and HH:mm. */
export type DateFormat = "iso-date" | "short-date" | "date-time" | "time";

export type DateParseFormat = Exclude<DateFormat, "time">;

export type DateUnit =
  | "year"
  | "month"
  | "day"
  | "hour"
  | "minute"
  | "second"
  | "millisecond";

/** Operations reject invalid dates with RangeError, except parse and isValid. */
export interface DateAdapter {
  /** Strict parsing; invalid input returns null instead of rolling over. */
  parse(value: string, format: DateParseFormat): Date | null;
  isValid(value: Date): boolean;
  format(value: Date, format: DateFormat): string;
  /** Amounts must be safe integers. Returned dates never mutate the input. */
  add(value: Date, amount: number, unit: DateUnit): Date;
  subtract(value: Date, amount: number, unit: DateUnit): Date;
  startOf(value: Date, unit: DateUnit): Date;
  endOf(value: Date, unit: DateUnit): Date;
  /** Signed value minus reference, truncated toward zero in the given unit. */
  difference(value: Date, reference: Date, unit: DateUnit): number;
  isBefore(value: Date, reference: Date, unit?: DateUnit): boolean;
  isAfter(value: Date, reference: Date, unit?: DateUnit): boolean;
  isSame(value: Date, reference: Date, unit?: DateUnit): boolean;
  toISOString(value: Date): string;
}

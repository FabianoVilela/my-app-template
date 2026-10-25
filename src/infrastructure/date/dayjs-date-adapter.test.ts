import type {
  DateAdapter,
  DateFormat,
  DateParseFormat,
  DateUnit,
} from "@/shared/lib/date-adapter";

import { createDayjsDateAdapter } from "./dayjs-date-adapter";

describe.each(["local", "utc"] as const)(
  "Day.js date adapter (%s)",
  (timeZone) => {
    const adapter: DateAdapter = createDayjsDateAdapter({ timeZone });

    function createDate(
      year: number,
      month: number,
      day: number,
      hour = 0,
      minute = 0,
      second = 0,
      millisecond = 0,
    ): Date {
      return timeZone === "utc"
        ? new Date(
            Date.UTC(year, month - 1, day, hour, minute, second, millisecond),
          )
        : new Date(year, month - 1, day, hour, minute, second, millisecond);
    }

    test.each<{ value: string; format: DateParseFormat; expected: Date }>([
      {
        value: "2024-02-29",
        format: "iso-date",
        expected: createDate(2024, 2, 29),
      },
      {
        value: "29/02/2024",
        format: "short-date",
        expected: createDate(2024, 2, 29),
      },
      {
        value: "29/02/2024 23:05",
        format: "date-time",
        expected: createDate(2024, 2, 29, 23, 5),
      },
    ])("parses $format into a native Date", ({ value, format, expected }) => {
      const result = adapter.parse(value, format);

      expect(result).toBeInstanceOf(Date);
      expect(result).toEqual(expected);
    });

    test.each<{ value: string; format: DateParseFormat }>([
      { value: "2023-02-29", format: "iso-date" },
      { value: "2024-02-30", format: "iso-date" },
      { value: "2024-13-01", format: "iso-date" },
      { value: "2024-00-01", format: "iso-date" },
      { value: "2024-01-00", format: "iso-date" },
      { value: "31/04/2024", format: "short-date" },
      { value: "29/02/2023", format: "short-date" },
      { value: "2024-2-9", format: "iso-date" },
      { value: "29/02/2024", format: "iso-date" },
      { value: "2024-02-29 trailing", format: "iso-date" },
      { value: " 2024-02-29", format: "iso-date" },
      { value: "29/02/2024 24:00", format: "date-time" },
      { value: "29/02/2024 12:60", format: "date-time" },
      { value: "", format: "iso-date" },
      { value: "not a date", format: "iso-date" },
    ])("rejects '$value' as $format without rollover", ({ value, format }) => {
      expect(adapter.parse(value, format)).toBeNull();
    });

    test("validates native dates, including the Unix epoch", () => {
      expect(adapter.isValid(new Date(0))).toBe(true);
      expect(adapter.isValid(new Date(Number.NaN))).toBe(false);
    });

    test.each<{ format: DateFormat; expected: string }>([
      { format: "iso-date", expected: "2024-02-29" },
      { format: "short-date", expected: "29/02/2024" },
      { format: "date-time", expected: "29/02/2024 23:05" },
      { format: "time", expected: "23:05" },
    ])(
      "formats $format using the project convention",
      ({ format, expected }) => {
        expect(adapter.format(createDate(2024, 2, 29, 23, 5), format)).toBe(
          expected,
        );
      },
    );

    test.each<{ unit: DateUnit; expected: Date }>([
      { unit: "year", expected: createDate(2025, 2, 28) },
      { unit: "month", expected: createDate(2024, 3, 29) },
      { unit: "day", expected: createDate(2024, 3, 1) },
      { unit: "hour", expected: createDate(2024, 2, 29, 1) },
      { unit: "minute", expected: createDate(2024, 2, 29, 0, 1) },
      { unit: "second", expected: createDate(2024, 2, 29, 0, 0, 1) },
      { unit: "millisecond", expected: createDate(2024, 2, 29, 0, 0, 0, 1) },
    ])("adds a $unit without changing the input", ({ unit, expected }) => {
      const input = createDate(2024, 2, 29);
      const originalTime = input.getTime();

      const result = adapter.add(input, 1, unit);

      expect(result).toEqual(expected);
      expect(result).not.toBe(input);
      expect(input.getTime()).toBe(originalTime);
    });

    test("clamps month arithmetic to the last valid day", () => {
      expect(adapter.add(createDate(2024, 1, 31), 1, "month")).toEqual(
        createDate(2024, 2, 29),
      );
      expect(adapter.subtract(createDate(2023, 3, 31), 1, "month")).toEqual(
        createDate(2023, 2, 28),
      );
      expect(adapter.subtract(createDate(2024, 2, 29), 1, "year")).toEqual(
        createDate(2023, 2, 28),
      );
    });

    test("subtracts across year boundaries without changing the input", () => {
      const input = createDate(2024, 1, 1);
      const originalTime = input.getTime();

      expect(adapter.subtract(input, 1, "day")).toEqual(
        createDate(2023, 12, 31),
      );
      expect(input.getTime()).toBe(originalTime);
    });

    test.each([
      { month: 3, day: 9 },
      { month: 11, day: 2 },
    ])(
      "preserves wall-clock time across the day after $month/$day",
      ({ month, day }) => {
        const input = createDate(2024, month, day, 12);
        const nextDay = createDate(2024, month, day + 1, 12);

        expect(adapter.add(input, 1, "day")).toEqual(nextDay);
        expect(adapter.subtract(nextDay, 1, "day")).toEqual(input);
        expect(adapter.difference(nextDay, input, "day")).toBe(1);
      },
    );

    test("supports zero and negative amounts with independent return values", () => {
      const input = createDate(2024, 2, 29);
      const copy = adapter.add(input, 0, "day");
      copy.setTime(0);

      expect(input).toEqual(createDate(2024, 2, 29));
      expect(adapter.add(input, -1, "day")).toEqual(createDate(2024, 2, 28));
      expect(adapter.subtract(input, -1, "day")).toEqual(
        createDate(2024, 3, 1),
      );
    });

    test.each([
      0.5,
      Number.NaN,
      Infinity,
      -Infinity,
      Number.MAX_SAFE_INTEGER + 1,
    ])("rejects an unsupported amount (%s) consistently", (amount) => {
      const input = createDate(2024, 2, 29);

      expect(() => adapter.add(input, amount, "day")).toThrow(RangeError);
      expect(() => adapter.subtract(input, amount, "day")).toThrow(RangeError);
    });

    test("rejects arithmetic outside the native Date range", () => {
      const input = createDate(2024, 2, 29);

      expect(() => adapter.add(input, Number.MAX_SAFE_INTEGER, "day")).toThrow(
        RangeError,
      );
      expect(() =>
        adapter.subtract(input, Number.MAX_SAFE_INTEGER, "day"),
      ).toThrow(RangeError);
    });

    test.each<{ unit: DateUnit; start: Date; end: Date }>([
      {
        unit: "year",
        start: createDate(2024, 1, 1),
        end: createDate(2024, 12, 31, 23, 59, 59, 999),
      },
      {
        unit: "month",
        start: createDate(2024, 2, 1),
        end: createDate(2024, 2, 29, 23, 59, 59, 999),
      },
      {
        unit: "day",
        start: createDate(2024, 2, 15),
        end: createDate(2024, 2, 15, 23, 59, 59, 999),
      },
      {
        unit: "hour",
        start: createDate(2024, 2, 15, 13),
        end: createDate(2024, 2, 15, 13, 59, 59, 999),
      },
      {
        unit: "minute",
        start: createDate(2024, 2, 15, 13, 24),
        end: createDate(2024, 2, 15, 13, 24, 59, 999),
      },
      {
        unit: "second",
        start: createDate(2024, 2, 15, 13, 24, 35),
        end: createDate(2024, 2, 15, 13, 24, 35, 999),
      },
      {
        unit: "millisecond",
        start: createDate(2024, 2, 15, 13, 24, 35, 456),
        end: createDate(2024, 2, 15, 13, 24, 35, 456),
      },
    ])(
      "finds $unit boundaries without changing the input",
      ({ unit, start, end }) => {
        const input = createDate(2024, 2, 15, 13, 24, 35, 456);
        const originalTime = input.getTime();

        expect(adapter.startOf(input, unit)).toEqual(start);
        expect(adapter.endOf(input, unit)).toEqual(end);
        expect(input.getTime()).toBe(originalTime);
      },
    );

    test("returns signed differences truncated toward zero", () => {
      const start = createDate(2024, 2, 29);
      const end = createDate(2024, 2, 29, 1, 30);

      expect(adapter.difference(end, start, "minute")).toBe(90);
      expect(adapter.difference(end, start, "hour")).toBe(1);
      expect(adapter.difference(start, end, "hour")).toBe(-1);
      expect(adapter.difference(start, start, "millisecond")).toBe(0);
    });

    test("compares instants at millisecond precision by default", () => {
      const earlier = createDate(2024, 2, 29);
      const later = new Date(earlier.getTime() + 1);

      expect(adapter.isBefore(earlier, later)).toBe(true);
      expect(adapter.isBefore(later, earlier)).toBe(false);
      expect(adapter.isAfter(later, earlier)).toBe(true);
      expect(adapter.isAfter(earlier, later)).toBe(false);
      expect(adapter.isSame(earlier, new Date(earlier))).toBe(true);
      expect(adapter.isSame(earlier, later)).toBe(false);
      expect(adapter.isBefore(earlier, earlier)).toBe(false);
      expect(adapter.isAfter(earlier, earlier)).toBe(false);
    });

    test("compares calendar units including their larger units", () => {
      const morning = createDate(2024, 2, 29, 8);
      const evening = createDate(2024, 2, 29, 20);
      const nextYear = createDate(2025, 2, 28, 8);

      expect(adapter.isSame(morning, evening, "day")).toBe(true);
      expect(adapter.isBefore(morning, evening, "day")).toBe(false);
      expect(adapter.isAfter(evening, morning, "day")).toBe(false);
      expect(adapter.isSame(morning, nextYear, "month")).toBe(false);
      expect(adapter.isBefore(morning, nextYear, "month")).toBe(true);
      expect(adapter.isAfter(nextYear, morning, "month")).toBe(true);
    });

    test("serializes the instant to UTC regardless of the adapter mode", () => {
      const input = new Date("2024-02-29T23:05:06.123-03:00");

      expect(adapter.toISOString(input)).toBe("2024-03-01T02:05:06.123Z");
    });

    test("rejects invalid dates consistently, including comparison operands", () => {
      const valid = createDate(2024, 2, 29);
      const invalid = new Date(Number.NaN);
      const operations = [
        () => adapter.format(invalid, "iso-date"),
        () => adapter.add(invalid, 1, "day"),
        () => adapter.subtract(invalid, 1, "day"),
        () => adapter.startOf(invalid, "day"),
        () => adapter.endOf(invalid, "day"),
        () => adapter.difference(invalid, valid, "day"),
        () => adapter.difference(valid, invalid, "day"),
        () => adapter.isBefore(invalid, valid),
        () => adapter.isBefore(valid, invalid),
        () => adapter.isAfter(invalid, valid),
        () => adapter.isAfter(valid, invalid),
        () => adapter.isSame(invalid, valid),
        () => adapter.isSame(valid, invalid),
        () => adapter.toISOString(invalid),
      ];

      for (const operation of operations) {
        expect(operation).toThrow(new RangeError("Invalid date"));
      }
    });
  },
);

test("keeps UTC and local adapters independent and defaults to local time", () => {
  const localAdapter = createDayjsDateAdapter();
  const utcAdapter = createDayjsDateAdapter({ timeZone: "utc" });
  const instant = new Date("2024-03-01T01:30:00.000Z");
  const localMidnight = new Date(
    instant.getFullYear(),
    instant.getMonth(),
    instant.getDate(),
  );

  expect(utcAdapter.startOf(instant, "day")).toEqual(
    new Date("2024-03-01T00:00:00.000Z"),
  );
  expect(localAdapter.startOf(instant, "day")).toEqual(localMidnight);
  expect(utcAdapter.format(instant, "date-time")).toBe("01/03/2024 01:30");
  expect(localAdapter.parse("01/03/2024", "short-date")).toEqual(
    new Date(2024, 2, 1),
  );
  expect(utcAdapter.parse("01/03/2024", "short-date")).toEqual(
    new Date("2024-03-01T00:00:00.000Z"),
  );
});

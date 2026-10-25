# Date operations

The template provides a library-independent `DateAdapter` contract and a Day.js
implementation. Only the concrete adapter imports `dayjs` and its plugins.
Consumers exchange native `Date` objects, strings, numbers and booleans; the
contract does not expose Day.js instances, types, format tokens or plugin APIs.

## Files and responsibilities

| File | Responsibility |
| --- | --- |
| `src/shared/lib/date-adapter.ts` | Pure contract, project formats and supported calendar units. Safe for domain and application type imports. |
| `src/infrastructure/date/dayjs-date-adapter.ts` | Format mapping, strict parsing, date operations and input validation. |
| `src/infrastructure/date/dayjs-date-adapter.test.ts` | Behavior tests against the real implementation, without mocking Day.js. |
| `src/bootstrap/create-dependencies.ts`, when needed | Select an adapter and inject it into real consumers. |

The contract lives in `shared/lib` because it contains only framework-independent
types. The implementation belongs to infrastructure. See
[application architecture](AGENTS.md#date-operations) for dependency rules.

## Formats and parsing

Use the project's format names instead of library masks:

| Format | Output / accepted input | Parsing |
| --- | --- | --- |
| `iso-date` | `2024-02-29` (`YYYY-MM-DD`) | Supported |
| `short-date` | `29/02/2024` (`DD/MM/YYYY`) | Supported |
| `date-time` | `29/02/2024 23:05` (`DD/MM/YYYY HH:mm`) | Supported |
| `time` | `23:05` (`HH:mm`, 24-hour clock) | Formatting only |

`parse` requires a format and returns a new native `Date`, or `null` when input
does not match exactly. Impossible calendar dates, invalid times, missing zero
padding, extra whitespace and trailing text are rejected. Date-only input means
midnight in the configured mode. Time-only parsing is excluded so it cannot
implicitly depend on today's date. These are numeric formats, independent of
locale; `short-date` always uses day/month/year.

`iso-date` represents a calendar date, not a full ISO timestamp. The adapter does
not provide permissive string parsing or arbitrary masks. Parse external timestamp
payloads and validate their schema in the owning infrastructure boundary. Extend
the contract deliberately when another format is required.

## Operations and errors

- `isValid` checks a native `Date`, including the Unix epoch. Invalid dates return
  `false`; `parse` returns `null` for invalid text. All other operations throw a
  native `RangeError` for invalid date inputs, including either comparison operand.
- `format` uses one of the four project formats. `toISOString` serializes the
  instant in UTC with milliseconds and `Z`, regardless of adapter mode.
- `add` and `subtract` accept safe integer amounts and singular `year`, `month`,
  `day`, `hour`, `minute`, `second` or `millisecond` units. Zero and negative amounts
  are supported. Fractional, nonfinite or unsafe amounts, and results outside the
  native `Date` range, throw `RangeError`.
- Month and year arithmetic clamps to the last valid day: adding one month to
  January 31, 2024 yields February 29. Adding one year to February 29, 2024 yields
  February 28, 2025.
- `startOf` and `endOf` return the first and last millisecond of the selected unit.
  Results outside the native `Date` range throw `RangeError`.
- `difference(value, reference, unit)` returns the signed difference, truncated
  toward zero. Calendar month/year differences use calendar boundaries rather than
  a fixed number of milliseconds.
- `isBefore`, `isAfter` and `isSame` default to millisecond precision. An explicit
  unit compares that unit and its larger calendar units, so two times on the same
  day are equal at day precision, and February in different years is not equal at
  month precision.

Operations never mutate input dates. Every returned `Date` is a separate object,
including a zero addition or a boundary operation that leaves the instant equal.
Native dates remain mutable; callers own the returned values. No operation reads
the current clock.

## Time zones and composition

`createDayjsDateAdapter()` defaults to the device's local time. Pass
`{ timeZone: "utc" }` to parse, format, perform calendar arithmetic and compare
calendar units in UTC. A native `Date` represents an instant, not a stored time
zone. Converting between adapter modes changes its calendar representation, not
its instant. Local calendar days can span 23 or 25 hours at daylight saving
transitions; adding one day preserves local wall-clock time when it exists.
Named IANA zones, arbitrary offsets and localized text are not configured.

The adapter registers only the bundled `customParseFormat` and `utc` plugins.
It does not change the global locale or default time zone. Local and UTC adapters
can coexist. No default adapter is instantiated on import.

Compose concrete implementations in bootstrap when a real consumer exists:

```ts
// In bootstrap, when required by real consumers:
import { createDayjsDateAdapter } from "@/infrastructure/date/dayjs-date-adapter";
import type { DateAdapter } from "@/shared/lib/date-adapter";

export function createDependencies(dateAdapter?: DateAdapter) {
  return {
    dates: dateAdapter ?? createDayjsDateAdapter(),
  };
}
```

Receive `DateAdapter`, or a narrower `Pick<DateAdapter, ...>`, through explicit
parameters or factories. Presentation can receive it through props or an existing
focused provider. Tests for consumers can supply typed fakes; they do not need to
import Day.js or concrete infrastructure. Keep example business code out of the
numbered template modules.

To replace Day.js, implement the same contract and change the selection in
bootstrap. Preserve formats, invalid-input behavior, precision, calendar arithmetic,
time-zone semantics and immutability, in addition to the TypeScript signatures.

## Verification

Run `pnpm test --runTestsByPath src/infrastructure/date/dayjs-date-adapter.test.ts`.
The suite covers both modes, strict validation, leap years, month/year boundaries,
all formats and units, signed differences, precision, invalid inputs, overflow,
UTC serialization and input immutability. Run it with `TZ=UTC` and
`TZ=America/New_York` to exercise local behavior with different offsets and daylight
saving transitions. These tests use Node; device behavior is not exercised.

## References

- [Day.js installation](https://day.js.org/docs/en/installation/installation)
- [Strict format parsing](https://day.js.org/docs/en/parse/string-format)
- [UTC plugin](https://day.js.org/docs/en/plugin/utc)
- [Date manipulation](https://day.js.org/docs/en/manipulate/add)
- [Differences](https://day.js.org/docs/en/display/difference)

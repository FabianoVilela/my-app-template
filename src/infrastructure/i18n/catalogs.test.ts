import "intl-pluralrules";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { APP_LOCALES } from "@/shared/i18n/contracts";
import appJson from "../../../app.json";

const root = join(__dirname, "locales");
// Catalog directories are lowercase locale tags, such as pt-br for pt-BR.
const locales = Object.fromEntries(
  APP_LOCALES.map((locale) => [locale.toLowerCase(), locale]),
);

function leaves(
  value: Record<string, unknown>,
  prefix = "",
): Record<string, string> {
  const result: Record<string, string> = {};

  for (const [key, entry] of Object.entries(value)) {
    const path = prefix ? `${prefix}.${key}` : key;

    if (typeof entry === "string") result[path] = entry;
    else if (entry && typeof entry === "object")
      Object.assign(result, leaves(entry as Record<string, unknown>, path));
    else throw new Error(`Non-message value: ${path}`);
  }

  return result;
}

const logicalKey = (key: string) =>
  key.replace(/_(zero|one|two|few|many|other)$/, "");
const placeholders = (text: string) =>
  [...text.matchAll(/{{(.*?)}}/g)].map((match) => match[1]).sort();
const tags = (text: string) =>
  [...text.matchAll(/<([a-zA-Z]+)>/g)].map((match) => match[1]).sort();
const namespaces = readdirSync(join(root, "en")).sort();

test("catalog directories and native supported locales match APP_LOCALES", () => {
  const directories = readdirSync(root, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name);
  const [, localization] = appJson.expo.plugins.find(
    (plugin) => Array.isArray(plugin) && plugin[0] === "expo-localization",
  ) as [string, { supportedLocales: string[] }];

  expect(directories.sort()).toEqual(Object.keys(locales).sort());
  expect([...localization.supportedLocales].sort()).toEqual(
    [...APP_LOCALES].sort(),
  );
});

for (const [directory, locale] of Object.entries(locales)) {
  test(`${locale} has complete messages, variables, markup and plural categories`, () => {
    expect(readdirSync(join(root, directory)).sort()).toEqual(namespaces);

    for (const namespace of namespaces) {
      const reference = leaves(
        JSON.parse(readFileSync(join(root, "en", namespace), "utf8")),
      );

      const translated = leaves(
        JSON.parse(readFileSync(join(root, directory, namespace), "utf8")),
      );

      expect(
        [...new Set(Object.keys(translated).map(logicalKey))].sort(),
      ).toEqual([...new Set(Object.keys(reference).map(logicalKey))].sort());

      for (const [key, text] of Object.entries(translated)) {
        const referenceText = Object.entries(reference).find(
          ([candidate]) => logicalKey(candidate) === logicalKey(key),
        )?.[1];

        expect(text.trim()).not.toBe("");
        expect(placeholders(text)).toEqual(placeholders(referenceText ?? ""));
        expect(tags(text)).toEqual(tags(referenceText ?? ""));

        if (key !== logicalKey(key)) {
          for (const category of new Intl.PluralRules(locale).resolvedOptions()
            .pluralCategories)
            expect(translated).toHaveProperty(`${logicalKey(key)}_${category}`);
        }
      }
    }
  });
}

import * as Mmkv from "react-native-mmkv";

import { createMmkvStorage } from "./mmkv-storage";
import { StorageError } from "./storage-error";

// MMKV provides its own test storage, but Nitro still bootstraps on import.
jest.mock("react-native-nitro-modules", () => ({
  NitroModules: {
    createHybridObject() {
      throw new Error("Native Nitro objects must not be created in Jest");
    },
  },
}));

// The package re-exports createMMKV as a non-configurable getter. Wrap only the
// factory so failures can be injected while retaining MMKV's own test storage.
jest.mock("react-native-mmkv", () => {
  const actual = jest.requireActual<typeof Mmkv>("react-native-mmkv");
  return { ...actual, createMMKV: jest.fn(actual.createMMKV) };
});

describe("MMKV local storage", () => {
  test("returns null for missing keys and preserves empty strings", () => {
    const storage = createMmkvStorage({ id: "preferences" });

    expect(storage.getItem("missing")).toBeNull();
    storage.setItem("empty", "");
    expect(storage.getItem("empty")).toBe("");
  });

  test("persists and overwrites strings synchronously without decoding JSON", () => {
    const storage = createMmkvStorage({ id: "preferences" });
    const state = JSON.stringify({ theme: "dark", fontScale: 1.2 });

    expect(storage.setItem("settings", state)).toBeUndefined();
    expect(storage.getItem("settings")).toBe(state);
    storage.setItem("settings", "invalid json");
    expect(storage.getItem("settings")).toBe("invalid json");
  });

  test("removes only the requested key and allows repeated removal", () => {
    const storage = createMmkvStorage({ id: "preferences" });
    storage.setItem("theme", "dark");
    storage.setItem("language", "pt-BR");

    expect(storage.removeItem("theme")).toBeUndefined();
    expect(storage.getItem("theme")).toBeNull();
    expect(storage.getItem("language")).toBe("pt-BR");
    expect(() => storage.removeItem("theme")).not.toThrow();
  });

  test("creates a single instance with the explicitly selected namespace", () => {
    const createInstance = jest.mocked(Mmkv.createMMKV);

    expect(createInstance).not.toHaveBeenCalled();
    createMmkvStorage({ id: "app.preferences" });
    expect(createInstance).toHaveBeenCalledTimes(1);
    expect(createInstance).toHaveBeenCalledWith({ id: "app.preferences" });
  });

  test.each(["", "   "])("rejects an empty namespace (%j)", (id) => {
    const createInstance = jest.mocked(Mmkv.createMMKV);

    expect(() => createMmkvStorage({ id })).toThrow(RangeError);
    expect(createInstance).not.toHaveBeenCalled();
  });

  test("normalizes initialization errors", () => {
    const cause = new Error("Native storage unavailable");
    jest.mocked(Mmkv.createMMKV).mockImplementationOnce(() => {
      throw cause;
    });

    expect(() => createMmkvStorage({ id: "preferences" })).toThrow(
      new StorageError("initialization", { cause }),
    );
  });

  test.each(["read", "write", "remove"] as const)(
    "normalizes %s errors without including stored keys or values",
    (kind) => {
      const instance = Mmkv.createMMKV({ id: "preferences" });
      jest.mocked(Mmkv.createMMKV).mockReturnValueOnce(instance);
      const cause = new Error("Native failure");
      const fail = () => {
        throw cause;
      };
      jest.spyOn(instance, "getString").mockImplementation(fail);
      jest.spyOn(instance, "set").mockImplementation(fail);
      jest.spyOn(instance, "remove").mockImplementation(fail);
      const storage = createMmkvStorage({ id: "preferences" });
      const actions = {
        read: () => storage.getItem("private-key"),
        write: () => storage.setItem("private-key", "private-value"),
        remove: () => storage.removeItem("private-key"),
      };

      try {
        actions[kind]();
        throw new Error("Expected a storage failure");
      } catch (error: unknown) {
        expect(error).toBeInstanceOf(StorageError);
        expect(error).toMatchObject({ kind, cause });
        expect(String(error)).not.toContain("private-key");
        expect(String(error)).not.toContain("private-value");
      }
    },
  );
});

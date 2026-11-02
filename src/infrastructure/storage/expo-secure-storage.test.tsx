import * as SecureStore from "expo-secure-store";

import { createExpoSecureStorage } from "./expo-secure-storage";
import { StorageError } from "./storage-error";

const SERVICE = "app.credentials";
const OPTIONS = {
  keychainService: SERVICE,
  keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
};

describe("Expo secure storage", () => {
  test("does not access device storage during construction", () => {
    const availability = jest.spyOn(SecureStore, "isAvailableAsync");
    const read = jest.spyOn(SecureStore, "getItemAsync");

    createExpoSecureStorage({ service: SERVICE });

    expect(availability).not.toHaveBeenCalled();
    expect(read).not.toHaveBeenCalled();
  });

  test.each([null, "", "token-value"])(
    "returns stored values including %j without substituting defaults",
    async (value) => {
      const read = jest
        .spyOn(SecureStore, "getItemAsync")
        .mockResolvedValue(value);
      const storage = createExpoSecureStorage({ service: SERVICE });

      await expect(storage.getItem("access-token")).resolves.toBe(value);
      expect(read).toHaveBeenCalledWith("access-token", OPTIONS);
    },
  );

  test("uses the asynchronous API and device-only protection when writing", async () => {
    const write = jest
      .spyOn(SecureStore, "setItemAsync")
      .mockResolvedValue(undefined);
    const storage = createExpoSecureStorage({ service: SERVICE });

    await expect(
      storage.setItem("access-token", "token-value"),
    ).resolves.toBeUndefined();
    expect(write).toHaveBeenCalledWith("access-token", "token-value", OPTIONS);
  });

  test("reuses the selected service when removing an entry", async () => {
    const remove = jest
      .spyOn(SecureStore, "deleteItemAsync")
      .mockResolvedValue(undefined);
    const storage = createExpoSecureStorage({ service: "another.credentials" });

    await expect(storage.removeItem("access-token")).resolves.toBeUndefined();
    expect(remove).toHaveBeenCalledWith("access-token", {
      ...OPTIONS,
      keychainService: "another.credentials",
    });
  });

  test.each(["", "   "])("rejects an empty service (%j)", (service) => {
    expect(() => createExpoSecureStorage({ service })).toThrow(RangeError);
  });

  test.each(["getItem", "setItem", "removeItem"] as const)(
    "rejects %s on unsupported platforms without accessing a backend",
    async (operation) => {
      jest.spyOn(SecureStore, "isAvailableAsync").mockResolvedValue(false);
      const read = jest.spyOn(SecureStore, "getItemAsync");
      const write = jest.spyOn(SecureStore, "setItemAsync");
      const remove = jest.spyOn(SecureStore, "deleteItemAsync");
      const storage = createExpoSecureStorage({ service: SERVICE });

      await expect(
        storage[operation]("access-token", "token-value"),
      ).rejects.toEqual(new StorageError("unavailable"));
      expect(read).not.toHaveBeenCalled();
      expect(write).not.toHaveBeenCalled();
      expect(remove).not.toHaveBeenCalled();
    },
  );

  test.each([
    ["getItemAsync", "getItem", "read"],
    ["setItemAsync", "setItem", "write"],
    ["deleteItemAsync", "removeItem", "remove"],
  ] as const)(
    "normalizes %s failures without including keys or credentials",
    async (nativeMethod, operation, kind) => {
      const cause = new Error("Native failure");
      jest.spyOn(SecureStore, nativeMethod).mockRejectedValue(cause);
      const storage = createExpoSecureStorage({ service: SERVICE });

      const result = storage[operation]("private-key", "private-value");

      await expect(result).rejects.toBeInstanceOf(StorageError);
      await expect(result).rejects.toMatchObject({ kind, cause });
      await expect(result).rejects.toHaveProperty(
        "message",
        `Storage operation failed: ${kind}`,
      );
    },
  );

  test("does not turn availability failures into missing credentials", async () => {
    const cause = new Error("Availability check failed");
    jest.spyOn(SecureStore, "isAvailableAsync").mockRejectedValue(cause);
    const read = jest.spyOn(SecureStore, "getItemAsync");
    const storage = createExpoSecureStorage({ service: SERVICE });

    await expect(storage.getItem("access-token")).rejects.toMatchObject({
      kind: "read",
      cause,
    });
    expect(read).not.toHaveBeenCalled();
  });

  test("normalizes invalid SecureStore keys as failed writes", async () => {
    const storage = createExpoSecureStorage({ service: SERVICE });

    await expect(
      storage.setItem("invalid:key", "token-value"),
    ).rejects.toMatchObject({
      kind: "write",
    });
  });
});

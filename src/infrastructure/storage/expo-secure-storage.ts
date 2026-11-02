import * as SecureStore from "expo-secure-store";

import type { SecureStorage } from "./secure-storage";
import { StorageError } from "./storage-error";

export type ExpoSecureStorageConfig = {
  /** Stable namespace, reused for reads, writes and removals. */
  service: string;
};

export function createExpoSecureStorage({
  service,
}: ExpoSecureStorageConfig): SecureStorage {
  if (service.trim() === "") {
    throw new RangeError("Storage service must not be empty");
  }

  const options = {
    keychainService: service,
    keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
  };

  return {
    getItem(key) {
      return execute("read", () => SecureStore.getItemAsync(key, options));
    },
    setItem(key, value) {
      return execute("write", () =>
        SecureStore.setItemAsync(key, value, options),
      );
    },
    removeItem(key) {
      return execute("remove", () => SecureStore.deleteItemAsync(key, options));
    },
  };
}

async function execute<T>(
  kind: "read" | "write" | "remove",
  action: () => Promise<T>,
): Promise<T> {
  try {
    if (!(await SecureStore.isAvailableAsync())) {
      throw new StorageError("unavailable");
    }

    return await action();
  } catch (cause: unknown) {
    if (cause instanceof StorageError) {
      throw cause;
    }

    throw new StorageError(kind, { cause });
  }
}

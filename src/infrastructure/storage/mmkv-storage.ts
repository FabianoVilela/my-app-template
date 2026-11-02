import { createMMKV } from "react-native-mmkv";

import type { LocalStorage } from "./local-storage";
import { StorageError } from "./storage-error";

export type MmkvStorageConfig = {
  /** Stable namespace. Changing it selects a different storage instance. */
  id: string;
};

export function createMmkvStorage({ id }: MmkvStorageConfig): LocalStorage {
  if (id.trim() === "") {
    throw new RangeError("Storage id must not be empty");
  }

  const instance = initializeStorage(id);

  return {
    getItem(key) {
      try {
        return instance.getString(key) ?? null;
      } catch (cause: unknown) {
        throw new StorageError("read", { cause });
      }
    },
    setItem(key, value) {
      try {
        instance.set(key, value);
      } catch (cause: unknown) {
        throw new StorageError("write", { cause });
      }
    },
    removeItem(key) {
      try {
        instance.remove(key);
      } catch (cause: unknown) {
        throw new StorageError("remove", { cause });
      }
    },
  };
}

function initializeStorage(id: string) {
  try {
    return createMMKV({ id });
  } catch (cause: unknown) {
    throw new StorageError("initialization", { cause });
  }
}

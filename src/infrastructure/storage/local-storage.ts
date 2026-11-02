/** Synchronous string persistence for non-sensitive preferences and state. */
export interface LocalStorage {
  /** Returns null only when the key is absent; preserves empty strings. */
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  /** Removing an absent key succeeds. */
  removeItem(key: string): void;
}

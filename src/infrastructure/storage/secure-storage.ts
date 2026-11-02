/** Asynchronous device-protected string persistence for tokens and credentials. */
export interface SecureStorage {
  /** Returns null for absent or system-invalidated entries. */
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  /** Removing an absent key succeeds. */
  removeItem(key: string): Promise<void>;
}

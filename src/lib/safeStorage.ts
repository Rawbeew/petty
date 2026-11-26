/* Petty — localStorage that never throws. In sandboxed/embedded contexts
 * (Arena preview, in-app webviews) storage access itself raises SecurityError —
 * which used to crash renders. All device storage goes through here. */
export const safeGet = (key: string): string | null => {
  try { return localStorage.getItem(key); } catch { return null; }
};
export const safeSet = (key: string, value: string): boolean => {
  try { localStorage.setItem(key, value); return true; } catch { return false; }
};
export const safeRemove = (key: string): void => {
  try { localStorage.removeItem(key); } catch { /* nothing to remove */ }
};

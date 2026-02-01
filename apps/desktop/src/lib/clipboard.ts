/**
 * Copy text to clipboard. Works in both Electron and web (browser).
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  if (typeof window === "undefined") return false;
  try {
    if (window.electronAPI?.setClipboard) {
      await window.electronAPI.setClipboard(text);
      return true;
    }
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

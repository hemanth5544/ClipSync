
export function isURL(str: string): boolean {
  if (!str || typeof str !== "string") return false;
  
  const trimmed = str.trim();
  if (trimmed.length === 0) return false;
  
  try {
    if (/^https?:\/\//i.test(trimmed)) {
      new URL(trimmed);
      return true;
    }
    // Check if it's a URL without protocol (e.g., example.com, www.example.com)
    // More comprehensive pattern
    const urlPattern = /^(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}(?::\d+)?(?:\/[^\s]*)?$/;
    if (urlPattern.test(trimmed)) {
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

/**
 * Normalize URL to have protocol
 */
export function normalizeURL(url: string): string {
  const trimmed = url.trim();
  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }
  return `https://${trimmed}`;
}

/**
 * Open URL in default browser (Electron)
 */
export async function openURL(url: string): Promise<void> {
  if (typeof window !== "undefined" && window.electronAPI) {
    try {
      if ((window.electronAPI as any).openExternal) {
        await (window.electronAPI as any).openExternal(url);
      } else {
        window.open(url, "_blank");
      }
    } catch (error) {
      console.error("Failed to open URL:", error);
      window.open(url, "_blank");
    }
  } else {
    window.open(url, "_blank");
  }
}

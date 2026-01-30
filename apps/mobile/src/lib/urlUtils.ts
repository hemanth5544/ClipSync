import * as Linking from "expo-linking";

export function isURL(str: string): boolean {
  if (!str || typeof str !== "string") return false;
  
  const trimmed = str.trim();
  if (trimmed.length === 0) return false;
  
  try {
    if (/^https?:\/\//i.test(trimmed)) {
      new URL(trimmed);
      return true;
    }
    const urlPattern = /^(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}(?::\d+)?(?:\/[^\s]*)?$/;
    if (urlPattern.test(trimmed)) {
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

export function normalizeURL(url: string): string {
  const trimmed = url.trim();
  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }
  return `https://${trimmed}`;
}

export async function openURL(url: string): Promise<void> {
  const normalized = normalizeURL(url);
  const canOpen = await Linking.canOpenURL(normalized);
  if (canOpen) {
    await Linking.openURL(normalized);
  } else {
    console.error("Cannot open URL:", normalized);
  }
}

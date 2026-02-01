"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { api } from "@/lib/api";
import { useToast } from "@clipsync/ui";

export const CLIP_SAVED_EVENT = "clip-saved";

const saveClipToApi = async (
  content: string,
  deviceName: string,
  lastContentRef: React.MutableRefObject<string>,
  isSavingRef: React.MutableRefObject<boolean>
): Promise<boolean> => {
  if (isSavingRef.current || content === lastContentRef.current) return false;
  if (!content || content.trim() === "") return false;

  lastContentRef.current = content;
  isSavingRef.current = true;
  try {
    const savedClip = await api.clips.create({ content, deviceName });
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent(CLIP_SAVED_EVENT, { detail: savedClip }));
    }
    return true;
  } catch (error) {
    console.error("Failed to save clip:", error);
    lastContentRef.current = "";
    return false;
  } finally {
    isSavingRef.current = false;
  }
};

export function useClipboard() {
  const { toast } = useToast();
  const toastRef = useRef(toast);
  toastRef.current = toast;

  const [deviceInfo, setDeviceInfo] = useState<{
    name: string;
    platform: string;
    arch: string;
  } | null>(null);
  const lastContentRef = useRef<string>("");
  const isSavingRef = useRef(false);
  const deviceInfoRef = useRef<string>("Unknown Device");
  const isWebRef = useRef(false);

  const saveFromClipboard = useCallback(async (): Promise<boolean> => {
    if (typeof window === "undefined" || !navigator.clipboard?.readText) return false;
    try {
      const content = await navigator.clipboard.readText();
      const deviceName = isWebRef.current ? "Web" : deviceInfoRef.current;
      return saveClipToApi(content, deviceName, lastContentRef, isSavingRef);
    } catch (error) {
      console.error("Failed to read clipboard:", error);
      return false;
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const isElectron = !!window.electronAPI;
    isWebRef.current = !isElectron;

    if (isElectron) {
      // Electron: use native clipboard monitoring
      window.electronAPI.getDeviceInfo()
        .then((info) => {
          setDeviceInfo(info);
          deviceInfoRef.current = info.name;
        })
        .catch(() => {});

      const handleClipboardChange = async (data: { content: string }) => {
        await saveClipToApi(data.content, deviceInfoRef.current, lastContentRef, isSavingRef);
      };

      window.electronAPI.onClipboardChanged(handleClipboardChange);
      return () => window.electronAPI.removeClipboardListener();
    }

    // Web: clipboardData.getData() is EMPTY in copy event (per spec).
    // Use: (1) paste event - when user pastes into our app, save it
    //      (2) copy event - use window.getSelection() since selection is still available
    setDeviceInfo({ name: "Web", platform: "web", arch: "" });
    deviceInfoRef.current = "Web";

    const handlePaste = async (e: ClipboardEvent) => {
      const text = e.clipboardData?.getData("text/plain")?.trim();
      if (text) {
        const ok = await saveClipToApi(text, "Web", lastContentRef, isSavingRef);
        if (ok) toastRef.current?.({ title: "Added to clips", description: "Pasted content saved" });
      }
    };

    const handleCopy = async () => {
      const text = window.getSelection()?.toString()?.trim();
      if (text) {
        const ok = await saveClipToApi(text, "Web", lastContentRef, isSavingRef);
        if (ok) toastRef.current?.({ title: "Added to clips", description: "Copied content saved" });
      }
    };

    // When user switches back to our tab: read clipboard (requires permission from "Save clipboard" click)
    const handleVisibilityChange = async () => {
      if (document.visibilityState !== "visible" || !navigator.clipboard?.readText) return;
      try {
        const content = (await navigator.clipboard.readText())?.trim();
        if (content) {
          const ok = await saveClipToApi(content, "Web", lastContentRef, isSavingRef);
          if (ok) toastRef.current?.({ title: "Added to clips", description: "Clipboard from other tab saved" });
        }
      } catch {
        // Permission denied or doc not focused – user needs to click "Save clipboard" once to grant
      }
    };

    document.addEventListener("paste", handlePaste);
    document.addEventListener("copy", handleCopy);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("paste", handlePaste);
      document.removeEventListener("copy", handleCopy);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  const isWeb = typeof window !== "undefined" && !window.electronAPI;
  return { deviceInfo, saveFromClipboard, isWeb };
}

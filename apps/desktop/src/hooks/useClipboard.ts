"use client";

import { useEffect, useState, useRef } from "react";
import { api } from "@/lib/api";

export const CLIP_SAVED_EVENT = "clip-saved";

export function useClipboard() {
  const [deviceInfo, setDeviceInfo] = useState<{
    name: string;
    platform: string;
    arch: string;
  } | null>(null);
  const lastContentRef = useRef<string>("");
  const isSavingRef = useRef(false);
  const deviceInfoRef = useRef<string>("Unknown Device");

  useEffect(() => {
    if (typeof window === "undefined" || !window.electronAPI) {
      console.log("Electron API not available - clipboard monitoring disabled");
      return;
    }

    console.log("Setting up clipboard monitoring...");

    // Test IPC communication first
    if ((window.electronAPI as any).testIPC) {
      (window.electronAPI as any).testIPC()
        .then((result: any) => {
          console.log("IPC test successful:", result);
        })
        .catch((err: any) => {
          console.error("IPC test failed:", err);
        });
    }

    window.electronAPI.getDeviceInfo()
      .then((info) => {
        setDeviceInfo(info);
        deviceInfoRef.current = info.name;
        console.log("Device info loaded:", info.name);
      })
      .catch((err) => {
        console.error("Failed to get device info:", err);
      });

    const handleClipboardChange = async (data: {
      content: string;
      timestamp: string;
    }) => {
      console.log("Clipboard changed detected:", data.content.substring(0, 50));

      if (isSavingRef.current || data.content === lastContentRef.current) {
        console.log("Skipping duplicate or already saving");
        return;
      }

      if (!data.content || data.content.trim() === "") {
        console.log("Skipping empty content");
        return;
      }

      lastContentRef.current = data.content;
      isSavingRef.current = true;

      try {
        const deviceName = deviceInfoRef.current;

        console.log("Saving clip to API...");
        const savedClip = await api.clips.create({
          content: data.content,
          deviceName: deviceName,
        });

        console.log("Clip saved successfully! ID:", savedClip.id);
        
        if (typeof window !== "undefined") {
          window.dispatchEvent(new CustomEvent(CLIP_SAVED_EVENT, { detail: savedClip }));
        }
      } catch (error: any) {
        console.error("Failed to save clip:", error);
        console.error("Error details:", error.message);
        // Reset lastContentRef on error so we can retry
        lastContentRef.current = "";
      } finally {
        isSavingRef.current = false;
      }
    };

    console.log("Registering clipboard change listener...");
    window.electronAPI.onClipboardChanged(handleClipboardChange);

    return () => {
      console.log("Cleaning up clipboard listener");
      window.electronAPI.removeClipboardListener();
    };
  }, []);

  return { deviceInfo };
}

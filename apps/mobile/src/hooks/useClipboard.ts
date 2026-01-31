import { useEffect, useRef, useState } from "react";
import * as Clipboard from "expo-clipboard";
import * as Device from "expo-device";
import { api } from "../lib/api";

export const CLIP_SAVED_EVENT = "clip-saved";

export function useClipboard() {
  const [deviceName, setDeviceName] = useState<string>("Mobile Device");
  const lastContentRef = useRef<string>("");
  const isSavingRef = useRef(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Get device name
    const getDeviceInfo = async () => {
      try {
        const name = Device.deviceName || Device.modelName || "Mobile Device";
        setDeviceName(name);
      } catch (error) {
        console.error("Failed to get device info:", error);
      }
    };

    getDeviceInfo();

    // Monitor clipboard every 1 second
    const checkClipboard = async () => {
      try {
        const currentContent = await Clipboard.getStringAsync();
        
        if (
          currentContent &&
          currentContent.trim() !== "" &&
          currentContent !== lastContentRef.current &&
          !isSavingRef.current
        ) {
          lastContentRef.current = currentContent;
          isSavingRef.current = true;

          try {
            console.log("Saving clip to API...");
            const savedClip = await api.clips.create({
              content: currentContent,
              deviceName: deviceName,
            });

            console.log("Clip saved successfully! ID:", savedClip.id);
            
            // Note: React Native doesn't have window events
            // UI will refresh via polling or manual refresh
          } catch (error: any) {
            console.error("Failed to save clip:", error);
            // Reset on error to allow retry
            lastContentRef.current = "";
          } finally {
            isSavingRef.current = false;
          }
        }
      } catch (error) {
        console.error("Clipboard check error:", error);
      }
    };

    // Check immediately, then every second
    checkClipboard();
    intervalRef.current = setInterval(checkClipboard, 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [deviceName]);

  return { deviceName };
}

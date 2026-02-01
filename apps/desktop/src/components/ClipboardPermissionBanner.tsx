"use client";

import { useState, useEffect } from "react";
import { Button } from "@clipsync/ui";
import { Clipboard, X } from "lucide-react";

const STORAGE_KEY = "clipsync-clipboard-access-granted";

export default function ClipboardPermissionBanner() {
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (typeof window === "undefined" || window.electronAPI) {
      setChecking(false);
      return;
    }
    // Check if we already have permission (Chrome) or user dismissed
    const granted = localStorage.getItem(STORAGE_KEY) === "true";
    if (granted) {
      setVisible(false);
      setChecking(false);
      return;
    }
    // Check Permissions API (Chrome only)
    if (navigator.permissions?.query) {
      navigator.permissions
        .query({ name: "clipboard-read" as PermissionName })
        .then((result) => {
          if (result.state === "granted") {
            localStorage.setItem(STORAGE_KEY, "true");
            setVisible(false);
          } else {
            setVisible(true);
          }
        })
        .catch(() => setVisible(true))
        .finally(() => setChecking(false));
    } else {
      setVisible(true);
      setChecking(false);
    }
  }, []);

  const handleAllow = async () => {
    if (!navigator.clipboard?.readText) return;
    try {
      // Call readText directly on click – this triggers the browser's permission prompt
      await navigator.clipboard.readText();
      localStorage.setItem(STORAGE_KEY, "true");
      setVisible(false);
    } catch (err) {
      // Permission denied or prompt was dismissed – keep banner visible
      console.warn("Clipboard access denied:", err);
    }
  };

  const handleDismiss = () => {
    setDismissed(true);
    setVisible(false);
  };

  if (checking || !visible || dismissed) return null;

  return (
    <div className="flex items-center justify-between gap-3 px-4 py-2.5 bg-primary/10 border-b border-primary/20 flex-shrink-0">
      <p className="text-sm text-foreground">
        <Clipboard className="inline h-4 w-4 mr-2 align-middle" />
        Allow clipboard access to save copies from other tabs when you switch back.
      </p>
      <div className="flex items-center gap-2 shrink-0">
        <Button size="sm" onClick={handleAllow}>
          Allow clipboard access
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={handleDismiss}
          title="Dismiss"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

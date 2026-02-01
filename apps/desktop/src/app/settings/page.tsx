"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, Switch, Label } from "@clipsync/ui";
import Sidebar from "@/components/Sidebar";
import { useClipboardContext } from "@/contexts/ClipboardContext";
import AppHeader from "@/components/AppHeader";
import SearchOverlay from "@/components/SearchOverlay";
import { useToast } from "@clipsync/ui";
import { Clip } from "@clipsync/types";

export default function SettingsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { saveFromClipboard, isWeb } = useClipboardContext();
  const [searchOverlayOpen, setSearchOverlayOpen] = useState(false);
  const [autoStart, setAutoStart] = useState(false);
  const [syncInterval, setSyncInterval] = useState(300); // 5 minutes
  const [historyLimit, setHistoryLimit] = useState(1000);
  const [notifyRemoteClips, setNotifyRemoteClips] = useState(true);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        setSearchOverlayOpen(true);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    // Load settings from localStorage or Electron store
    const savedAutoStart = localStorage.getItem("autoStart") === "true";
    const savedSyncInterval = parseInt(localStorage.getItem("syncInterval") || "300");
    const savedHistoryLimit = parseInt(localStorage.getItem("historyLimit") || "1000");
    const savedNotifyRemote = localStorage.getItem("notifyRemoteClips");
    setNotifyRemoteClips(savedNotifyRemote === null ? true : savedNotifyRemote !== "false");

    setAutoStart(savedAutoStart);
    setSyncInterval(savedSyncInterval);
    setHistoryLimit(savedHistoryLimit);
  }, []);

  const handleAutoStartChange = (checked: boolean) => {
    setAutoStart(checked);
    localStorage.setItem("autoStart", checked.toString());
  };

  const handleSyncIntervalChange = (value: number) => {
    setSyncInterval(value);
    localStorage.setItem("syncInterval", value.toString());
  };

  const handleHistoryLimitChange = (value: number) => {
    setHistoryLimit(value);
    localStorage.setItem("historyLimit", value.toString());
  };

  const handleNotifyRemoteClipsChange = (checked: boolean) => {
    setNotifyRemoteClips(checked);
    localStorage.setItem("notifyRemoteClips", checked ? "true" : "false");
  };

  return (
    <div className="flex h-full min-h-0 bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col min-h-0 min-w-0">
        <AppHeader
          searchQuery=""
          onSearchClick={() => setSearchOverlayOpen(true)}
          onClearSearch={() => {}}
          showNewSnippet={false}
          onSaveFromClipboard={isWeb ? async () => {
            const ok = await saveFromClipboard();
            if (ok) toast({ title: "Saved", description: "Clipboard added to clips" });
            else toast({ title: "Empty or failed", variant: "destructive" });
            return ok;
          } : undefined}
          isWeb={isWeb}
          pageTitle="Settings"
          shortcutHint
        />
        <SearchOverlay
          open={searchOverlayOpen}
          onOpenChange={setSearchOverlayOpen}
          onSearchSubmit={() => setSearchOverlayOpen(false)}
          onNavigate={(path) => { router.push(path); setSearchOverlayOpen(false); }}
          onAddSnippet={() => setSearchOverlayOpen(false)}
          onSelectClip={async (clip: Clip) => {
            const ok = await import("@/lib/clipboard").then((m) => m.copyToClipboard(clip.content));
            if (ok) toast({ title: "Copied", description: "Content copied to clipboard" });
            else toast({ title: "Failed to copy", variant: "destructive" });
          }}
        />
        <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden px-4 py-4">
          <div className="max-w-3xl mx-auto space-y-6">
          
          <Card>
            <CardHeader>
              <CardTitle>General</CardTitle>
              <CardDescription>Configure general application settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="auto-start">Auto-start on boot</Label>
                  <p className="text-sm text-muted-foreground">
                    Automatically start ClipSync when your computer boots
                  </p>
                </div>
                <Switch
                  id="auto-start"
                  checked={autoStart}
                  onCheckedChange={handleAutoStartChange}
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="notify-remote">Notify when synced from other device</Label>
                  <p className="text-sm text-muted-foreground">
                    Show a push notification when new clipboard content arrives from another device
                  </p>
                </div>
                <Switch
                  id="notify-remote"
                  checked={notifyRemoteClips}
                  onCheckedChange={handleNotifyRemoteClipsChange}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Sync</CardTitle>
              <CardDescription>Configure synchronization settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="sync-interval">Sync Interval (seconds)</Label>
                <input
                  id="sync-interval"
                  type="number"
                  min="60"
                  max="3600"
                  value={syncInterval}
                  onChange={(e) => handleSyncIntervalChange(parseInt(e.target.value))}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                />
                <p className="text-sm text-muted-foreground">
                  How often to sync clips with the server (60-3600 seconds)
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>History</CardTitle>
              <CardDescription>Configure clipboard history settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="history-limit">History Limit</Label>
                <input
                  id="history-limit"
                  type="number"
                  min="100"
                  max="10000"
                  value={historyLimit}
                  onChange={(e) => handleHistoryLimitChange(parseInt(e.target.value))}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                />
                <p className="text-sm text-muted-foreground">
                  Maximum number of clips to keep in history (100-10000)
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
        </div>
      </div>
    </div>
  );
}

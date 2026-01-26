"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, Switch, Label } from "@clipsync/ui";
import Sidebar from "@/components/Sidebar";

export default function SettingsPage() {
  const [autoStart, setAutoStart] = useState(false);
  const [syncInterval, setSyncInterval] = useState(300); // 5 minutes
  const [historyLimit, setHistoryLimit] = useState(1000);

  useEffect(() => {
    // Load settings from localStorage or Electron store
    const savedAutoStart = localStorage.getItem("autoStart") === "true";
    const savedSyncInterval = parseInt(localStorage.getItem("syncInterval") || "300");
    const savedHistoryLimit = parseInt(localStorage.getItem("historyLimit") || "1000");
    
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

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-3xl mx-auto space-y-6">
          <h1 className="text-3xl font-bold">Settings</h1>
          
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
  );
}

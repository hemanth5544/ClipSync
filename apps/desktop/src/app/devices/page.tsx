"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/lib/better-auth";
import Sidebar from "@/components/Sidebar";
import AppHeader from "@/components/AppHeader";
import SearchOverlay from "@/components/SearchOverlay";
import PairingCode from "@/components/PairingCode";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@clipsync/ui";
import { useToast } from "@clipsync/ui";
import { Clip } from "@clipsync/types";

export default function DevicesPage() {
  const { data: session, isPending } = useSession();
  const router = useRouter();
  const { toast } = useToast();
  const [searchOverlayOpen, setSearchOverlayOpen] = useState(false);

  useEffect(() => {
    if (!isPending && !session) {
      router.push("/auth/login");
    }
  }, [session, isPending, router]);

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

  if (isPending) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <div className="flex h-full min-h-0 bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col min-h-0 min-w-0">
        <AppHeader
          searchQuery=""
          onSearchClick={() => setSearchOverlayOpen(true)}
          onClearSearch={() => {}}
          showNewSnippet={false}
          pageTitle="Devices"
          shortcutHint
        />
        <SearchOverlay
          open={searchOverlayOpen}
          onOpenChange={setSearchOverlayOpen}
          onSearchSubmit={() => setSearchOverlayOpen(false)}
          onNavigate={(path) => { router.push(path); setSearchOverlayOpen(false); }}
          onAddSnippet={() => setSearchOverlayOpen(false)}
          onSelectClip={async (clip: Clip) => {
            if (typeof window !== "undefined" && window.electronAPI) {
              await window.electronAPI.setClipboard(clip.content);
              toast({ title: "Copied", description: "Content copied to clipboard" });
            }
          }}
        />
        <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden p-6">
          <div className="max-w-2xl mx-auto">
            <p className="text-muted-foreground mb-6">
              Connect your mobile device to sync clips across all your devices
            </p>
          
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-xl">Pair Mobile Device</CardTitle>
              <CardDescription>
                Scan the QR code or enter the pairing code on your mobile app
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <PairingCode />
            </CardContent>
          </Card>
        </div>
        </div>
      </div>
    </div>
  );
}

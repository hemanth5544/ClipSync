"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/lib/better-auth";
import ClipList from "@/components/ClipList";
import Sidebar from "@/components/Sidebar";
import { KeyboardShortcuts } from "@/components/KeyboardShortcuts";
import { useClipboardContext } from "@/contexts/ClipboardContext";
import { api } from "@/lib/api";
import { CLIP_SAVED_EVENT } from "@/hooks/useClipboard";
import { Button, Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, Textarea } from "@clipsync/ui";
import { useToast } from "@clipsync/ui";
import { Plus } from "lucide-react";
import SearchOverlay from "@/components/SearchOverlay";
import AppHeader from "@/components/AppHeader";
import { Clip } from "@clipsync/types";

export default function Home() {
  const { data: session, isPending, refetch } = useSession();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const [addSnippetOpen, setAddSnippetOpen] = useState(false);
  const [newSnippetContent, setNewSnippetContent] = useState("");
  const [searchOverlayOpen, setSearchOverlayOpen] = useState(false);
  const refetchedOnce = useRef(false);
  const { toast } = useToast();
  const { saveFromClipboard, isWeb } = useClipboardContext();

  // After OAuth redirect, cookie may be set but first get-session can run before it.
  // Refetch once when we have no session so cross-domain cookie is picked up.
  useEffect(() => {
    if (!isPending && !session && typeof refetch === "function" && !refetchedOnce.current) {
      refetchedOnce.current = true;
      refetch();
    }
  }, [isPending, session, refetch]);

  useEffect(() => {
    if (!isPending && !session) {
      // Brief delay so refetch (after OAuth redirect) can complete before redirecting to login
      const id = setTimeout(() => router.push("/auth/login"), 600);
      return () => clearTimeout(id);
    }
  }, [session, isPending, router]);
  
  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        setSearchOverlayOpen(true);
      }
      // ? to show shortcuts
      if (e.key === "?" && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        setShortcutsOpen(true);
      }
      if ((e.ctrlKey || e.metaKey) && e.key === "f" && !e.shiftKey) {
        e.preventDefault();
        router.push("/favorites");
      }
      if ((e.ctrlKey || e.metaKey) && e.key === ",") {
        e.preventDefault();
        router.push("/settings");
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [router]);

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

const isElectron = typeof window !== "undefined" && window.electronAPI;

  const handleAddSnippet = async () => {
    const content = newSnippetContent.trim();
    if (!content) {
      toast({ title: "Empty snippet", description: "Enter some text to save.", variant: "destructive" });
      return;
    }
    try {
      let deviceName = "Web";
      if (typeof window !== "undefined" && window.electronAPI) {
        const info = await window.electronAPI.getDeviceInfo();
        deviceName = info.name;
      }
      const saved = await api.clips.create({ content, deviceName });
      window.dispatchEvent(new CustomEvent(CLIP_SAVED_EVENT, { detail: saved }));
      toast({ title: "Snippet saved", description: "Added to All Clips." });
      setNewSnippetContent("");
      setAddSnippetOpen(false);
    } catch (error: unknown) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save snippet",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="flex h-full min-h-0 bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col min-h-0 min-w-0">
        <AppHeader
          searchQuery={searchQuery}
          onSearchClick={() => setSearchOverlayOpen(true)}
          onClearSearch={(e) => { e.stopPropagation(); setSearchQuery(""); }}
          showNewSnippet
          onNewSnippet={() => setAddSnippetOpen(true)}
          onSaveFromClipboard={isWeb ? async () => {
            const ok = await saveFromClipboard();
            if (ok) toast({ title: "Saved", description: "Clipboard added to clips" });
            else toast({ title: "Empty or failed", description: "Clipboard is empty or access denied", variant: "destructive" });
            return ok;
          } : undefined}
          isWeb={isWeb}
          shortcutHint
        />

        <SearchOverlay
          open={searchOverlayOpen}
          onOpenChange={setSearchOverlayOpen}
          onSearchSubmit={(q) => {
            setSearchQuery(q);
            setSearchOverlayOpen(false);
          }}
          onNavigate={(path) => {
            router.push(path);
            setSearchOverlayOpen(false);
          }}
          onAddSnippet={() => {
            setAddSnippetOpen(true);
            setSearchOverlayOpen(false);
          }}
          onSelectClip={async (clip: Clip) => {
            const ok = await import("@/lib/clipboard").then((m) => m.copyToClipboard(clip.content));
            if (ok) toast({ title: "Copied", description: "Content copied to clipboard" });
            else toast({ title: "Failed to copy", variant: "destructive" });
          }}
        />
        {/* {!isElectron && (
          <div className="p-4 bg-yellow-500/10 border-b border-yellow-500/20 flex-shrink-0">
            <p className="text-sm text-yellow-600 dark:text-yellow-400">
              ⚠️ Clipboard monitoring only works in Electron. Run: <code className="bg-black/10 px-1 rounded">pnpm electron:dev</code>
            </p>
          </div>
        )} */}
        <main className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden px-4 py-4">
          <ClipList searchQuery={searchQuery} />
        </main>
      </div>
      <KeyboardShortcuts open={shortcutsOpen} onOpenChange={setShortcutsOpen} />

      <Dialog open={addSnippetOpen} onOpenChange={setAddSnippetOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Add new snippet</DialogTitle>
            <DialogDescription>
              Paste or type text to save as a new clip. It will appear in your latest copied list.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder="Paste or type your snippet here..."
            value={newSnippetContent}
            onChange={(e) => setNewSnippetContent(e.target.value)}
            className="min-h-[160px] resize-y"
            autoFocus
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => { setAddSnippetOpen(false); setNewSnippetContent(""); }}>
              Cancel
            </Button>
            <Button onClick={handleAddSnippet} disabled={!newSnippetContent.trim()}>
              Save snippet
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

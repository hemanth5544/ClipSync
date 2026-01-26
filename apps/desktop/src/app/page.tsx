"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/lib/better-auth";
import ClipList from "@/components/ClipList";
import Sidebar from "@/components/Sidebar";
import SearchBar from "@/components/SearchBar";
import { KeyboardShortcuts } from "@/components/KeyboardShortcuts";
import { useClipboard } from "@/hooks/useClipboard";

export default function Home() {
  const { data: session, isPending } = useSession();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  useClipboard(); 

  useEffect(() => {
    if (!isPending && !session) {
      router.push("/auth/login");
    }
  }, [session, isPending, router]);
  
  //Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        searchInputRef.current?.focus();
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
      if (e.key === "Escape" && searchQuery) {
        setSearchQuery("");
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [searchQuery, router]);

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

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <SearchBar 
          searchQuery={searchQuery} 
          onSearchChange={setSearchQuery}
          inputRef={searchInputRef}
        />
        {!isElectron && (
          <div className="p-4 bg-yellow-500/10 border-b border-yellow-500/20">
            <p className="text-sm text-yellow-600 dark:text-yellow-400">
              ⚠️ Clipboard monitoring only works in Electron. Run: <code className="bg-black/10 px-1 rounded">pnpm electron:dev</code>
            </p>
          </div>
        )}
        <main className="flex-1 overflow-auto p-6">
          <ClipList searchQuery={searchQuery} />
        </main>
      </div>
      <KeyboardShortcuts open={shortcutsOpen} onOpenChange={setShortcutsOpen} />
    </div>
  );
}

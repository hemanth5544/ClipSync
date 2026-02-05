"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { SyncedMessage } from "@clipsync/types";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle, Button, Dialog, DialogContent, DialogHeader, DialogTitle } from "@clipsync/ui";
import { Copy, Check, MessageCircle, Clock, User, Trash2, Expand } from "lucide-react";
import { useToast } from "@clipsync/ui";
import Sidebar from "@/components/Sidebar";
import { useClipboardContext } from "@/contexts/ClipboardContext";
import AppHeader from "@/components/AppHeader";
import SearchOverlay from "@/components/SearchOverlay";
import { formatRelativeTime } from "@/lib/timeUtils";
import { useSession } from "@/lib/better-auth";

const MESSAGES_DISPLAY_LIMIT = 100;

export default function MessagesPage() {
  const router = useRouter();
  const { data: session, isPending } = useSession();
  const [messages, setMessages] = useState<SyncedMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchOverlayOpen, setSearchOverlayOpen] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [fullMessage, setFullMessage] = useState<SyncedMessage | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [clearAllDialogOpen, setClearAllDialogOpen] = useState(false);
  const [clearingAll, setClearingAll] = useState(false);
  const { toast } = useToast();
  const { saveFromClipboard, isWeb } = useClipboardContext();

  useEffect(() => {
    if (!isPending && !session) {
      const id = setTimeout(() => router.push("/auth/login"), 400);
      return () => clearTimeout(id);
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

  useEffect(() => {
    loadMessages();
    const interval = setInterval(loadMessages, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadMessages = async () => {
    if (!session) return;
    try {
      setLoading(true);
      const response = await api.messages.list({ pageSize: MESSAGES_DISPLAY_LIMIT });
      setMessages(response.data);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load messages",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClearAllConfirm = async () => {
    try {
      setClearingAll(true);
      await api.messages.clearAll();
      setMessages([]);
      setFullMessage(null);
      setClearAllDialogOpen(false);
      toast({ title: "Cleared", description: "All messages have been deleted." });
    } catch {
      toast({ title: "Error", description: "Failed to clear messages", variant: "destructive" });
    } finally {
      setClearingAll(false);
    }
  };

  const handleCopy = async (body: string, id: string) => {
    try {
      const ok = await import("@/lib/clipboard").then((m) => m.copyToClipboard(body));
      if (ok) {
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
        toast({ title: "Copied", description: "Message copied to clipboard" });
      } else {
        toast({ title: "Failed to copy", variant: "destructive" });
      }
    } catch {
      toast({ title: "Error", description: "Failed to copy", variant: "destructive" });
    }
  };

  const handleDelete = async (msg: SyncedMessage) => {
    if (!confirm("Delete this message? This cannot be undone.")) return;
    try {
      setDeletingId(msg.id);
      await api.messages.delete(msg.id);
      setMessages((prev) => prev.filter((m) => m.id !== msg.id));
      if (fullMessage?.id === msg.id) setFullMessage(null);
      toast({ title: "Deleted", description: "Message removed" });
    } catch {
      toast({ title: "Error", description: "Failed to delete message", variant: "destructive" });
    } finally {
      setDeletingId(null);
    }
  };

  const filteredMessages = useMemo(() => {
    if (!searchQuery.trim()) return messages;
    const q = searchQuery.toLowerCase();
    return messages.filter(
      (m) =>
        (m.sender || "").toLowerCase().includes(q) ||
        (m.address || "").toLowerCase().includes(q) ||
        (m.body || "").toLowerCase().includes(q)
    );
  }, [messages, searchQuery]);

  const mainContent = loading ? (
    <div className="flex-1 flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
    </div>
  ) : messages.length === 0 ? (
    <div className="flex-1 flex items-center justify-center text-muted-foreground">
      <div className="text-center">
        <MessageCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p className="text-lg">No synced messages yet</p>
        <p className="text-sm">Sync SMS from the ClipSync app on your Android phone to see them here</p>
      </div>
    </div>
  ) : filteredMessages.length === 0 && searchQuery ? (
    <div className="flex-1 flex items-center justify-center text-muted-foreground">
      <div className="text-center">
        <p className="text-lg">No messages found</p>
        <p className="text-sm">Try a different search term</p>
      </div>
    </div>
  ) : (
    <main className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden px-4 py-4">
      <div className="grid gap-4">
        {filteredMessages.map((msg) => {
          const isCopied = copiedId === msg.id;
          const sender = msg.sender || msg.address || "Unknown";
          return (
            <Card
              key={msg.id}
              className={`hover:shadow-lg transition-all ${isCopied ? "ring-2 ring-green-500 ring-offset-2" : ""}`}
            >
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-base font-medium flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground shrink-0" />
                      <span className="truncate">{sender}</span>
                    </CardTitle>
                    <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      <span>{formatRelativeTime(msg.receivedAt)}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setFullMessage(msg)}
                      title="View full message"
                    >
                      <Expand className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleCopy(msg.body, msg.id)}
                      className={isCopied ? "text-green-500" : ""}
                      title="Copy to clipboard"
                    >
                      {isCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(msg)}
                      disabled={deletingId === msg.id}
                      className="text-destructive hover:text-destructive"
                      title="Delete message"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-sm text-muted-foreground whitespace-pre-wrap break-words line-clamp-6">
                  {msg.body}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </main>
  );

  return (
    <>
      <div className="flex h-full min-h-0 bg-background">
        <Sidebar />
        <div className="flex-1 flex flex-col min-h-0 min-w-0">
          <AppHeader
            searchQuery={searchQuery}
            onSearchClick={() => setSearchOverlayOpen(true)}
            onClearSearch={(e) => {
              e.stopPropagation();
              setSearchQuery("");
            }}
            showNewSnippet={false}
            onSaveFromClipboard={
              isWeb
                ? async () => {
                    const ok = await saveFromClipboard();
                    if (ok) toast({ title: "Saved", description: "Clipboard added to clips" });
                    else toast({ title: "Empty or failed", variant: "destructive" });
                    return ok;
                  }
                : undefined
            }
            isWeb={isWeb}
            pageTitle="Messages"
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
            onAddSnippet={() => setSearchOverlayOpen(false)}
            onSelectClip={async () => {}}
          />
          {!loading && messages.length > 0 && (
            <div className="flex items-center justify-between px-4 py-3 border-b bg-muted/30 shrink-0">
              <p className="text-sm text-muted-foreground">
                Last {MESSAGES_DISPLAY_LIMIT} messages · {messages.length} shown
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setClearAllDialogOpen(true)}
                className="text-destructive hover:text-destructive hover:bg-destructive/10"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Clear all messages
              </Button>
            </div>
          )}
          {mainContent}
        </div>
      </div>

      <Dialog open={!!fullMessage} onOpenChange={(open) => !open && setFullMessage(null)}>
        <DialogContent className="max-w-lg max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <User className="h-4 w-4" />
              {fullMessage ? (fullMessage.sender || fullMessage.address || "Unknown") : ""}
            </DialogTitle>
          </DialogHeader>
          {fullMessage && (
            <>
              <p className="text-sm text-muted-foreground">
                {formatRelativeTime(fullMessage.receivedAt)}
              </p>
              <div className="flex-1 min-h-0 overflow-y-auto rounded border bg-muted/30 p-3">
                <p className="text-sm whitespace-pre-wrap break-words">{fullMessage.body}</p>
              </div>
              <div className="flex gap-2 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fullMessage && handleCopy(fullMessage.body, fullMessage.id)}
                >
                  <Copy className="h-4 w-4 mr-2" />
                  Copy
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => fullMessage && handleDelete(fullMessage)}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={clearAllDialogOpen} onOpenChange={setClearAllDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Clear all messages?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            This will delete all synced messages from all your devices. This cannot be undone.
          </p>
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => setClearAllDialogOpen(false)} disabled={clearingAll}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleClearAllConfirm} disabled={clearingAll}>
              {clearingAll ? "Clearing…" : "Clear all"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

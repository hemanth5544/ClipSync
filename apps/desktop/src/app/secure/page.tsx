"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/lib/better-auth";
import { api } from "@/lib/api";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
} from "@clipsync/ui";
import { Lock, Unlock, Plus, Copy, Trash2, Shield, Eye, EyeOff } from "lucide-react";
import { useToast } from "@clipsync/ui";
import Sidebar from "@/components/Sidebar";
import { useClipboardContext } from "@/contexts/ClipboardContext";
import AppHeader from "@/components/AppHeader";
import SearchOverlay from "@/components/SearchOverlay";
import { Clip } from "@clipsync/types";
import {
  deriveKey,
  encryptPayload,
  decryptPayload,
} from "@/lib/vaultCrypto";

interface DecryptedClip {
  id: string;
  title: string;
  content: string;
  createdAt: string;
}

export default function SecurePage() {
  const { data: session, isPending } = useSession();
  const router = useRouter();
  const { toast } = useToast();
  const { saveFromClipboard, isWeb } = useClipboardContext();
  const [searchOverlayOpen, setSearchOverlayOpen] = useState(false);
  const [vaultExists, setVaultExists] = useState<boolean | null>(null);
  const [salt, setSalt] = useState<string | null>(null);
  const [unlocked, setUnlocked] = useState(false);
  const [clips, setClips] = useState<DecryptedClip[]>([]);
  const [loading, setLoading] = useState(true);
  const [setupOpen, setSetupOpen] = useState(false);
  const [unlockOpen, setUnlockOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [masterPassword, setMasterPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [addTitle, setAddTitle] = useState("");
  const [addContent, setAddContent] = useState("");
  const [showPasswords, setShowPasswords] = useState<Set<string>>(new Set());
  const keyRef = useRef<CryptoKey | null>(null);

  const clearKey = useCallback(() => {
    keyRef.current = null;
    setUnlocked(false);
    setClips([]);
  }, []);

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

  const loadVaultStatus = useCallback(async () => {
    try {
      setLoading(true);
      const status = await api.secure.getVaultStatus();
      setVaultExists(status.exists);
      if (status.exists && status.salt) {
        setSalt(status.salt);
        setUnlockOpen(true);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load vault status",
        variant: "destructive",
      });
      setVaultExists(false);
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    if (!isPending && !session) {
      router.push("/auth/login");
    }
  }, [session, isPending, router]);

  useEffect(() => {
    if (!isPending && session) {
      loadVaultStatus();
    }
  }, [isPending, session, loadVaultStatus]);

  const handleSetup = async () => {
    if (!masterPassword || masterPassword.length < 6) {
      toast({
        title: "Invalid password",
        description: "Password must be at least 6 characters",
        variant: "destructive",
      });
      return;
    }
    if (masterPassword !== confirmPassword) {
      toast({
        title: "Passwords don't match",
        description: "Please confirm your password",
        variant: "destructive",
      });
      return;
    }
    try {
      const { salt: newSalt } = await api.secure.createVault();
      setSalt(newSalt);
      setVaultExists(true);
      const key = await deriveKey(masterPassword, newSalt);
      keyRef.current = key;
      setUnlocked(true);
      setSetupOpen(false);
      setMasterPassword("");
      setConfirmPassword("");
      loadClips(key);
      toast({ title: "Secure vault created", description: "Your passwords are now protected." });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create vault",
        variant: "destructive",
      });
    }
  };

  const loadClips = async (key: CryptoKey): Promise<boolean> => {
    const encrypted = await api.secure.getClips();
    const decrypted: DecryptedClip[] = [];
    for (const c of encrypted) {
      try {
        const payload = await decryptPayload(key, c.encryptedPayload, c.nonce);
        decrypted.push({ id: c.id, ...payload, createdAt: c.createdAt });
      } catch {
        // Skip corrupted entries; we'll check after loop if password was wrong
      }
    }
    // If we have encrypted clips but decrypted none, password is wrong
    if (encrypted.length > 0 && decrypted.length === 0) {
      throw new Error("Wrong password");
    }
    setClips(decrypted);
    return true;
  };

  const handleUnlock = async () => {
    if (!masterPassword || !salt) return;
    try {
      const key = await deriveKey(masterPassword, salt);
      await loadClips(key);
      keyRef.current = key;
      setUnlocked(true);
      setUnlockOpen(false);
      setMasterPassword("");
      toast({ title: "Vault unlocked" });
    } catch (error) {
      setUnlocked(false);
      keyRef.current = null;
      setClips([]);
      toast({
        title: "Wrong password",
        description: "Please try again",
        variant: "destructive",
      });
    }
  };

  const handleLock = () => {
    clearKey();
    setUnlockOpen(true);
    toast({ title: "Vault locked" });
  };

  const handleAdd = async () => {
    if (!addTitle.trim() || !addContent.trim() || !keyRef.current) return;
    try {
      const { encryptedPayload, nonce } = await encryptPayload(keyRef.current, {
        title: addTitle.trim(),
        content: addContent.trim(),
      });
      const { id, createdAt } = await api.secure.createClip(encryptedPayload, nonce);
      setClips((prev) => [
        { id, title: addTitle.trim(), content: addContent.trim(), createdAt },
        ...prev,
      ]);
      setAddOpen(false);
      setAddTitle("");
      setAddContent("");
      toast({ title: "Saved", description: "Password added to vault" });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save",
        variant: "destructive",
      });
    }
  };

  const handleCopy = async (content: string) => {
    try {
      const ok = await import("@/lib/clipboard").then((m) => m.copyToClipboard(content));
      if (ok) toast({ title: "Copied", description: "Copied to clipboard" });
      else toast({ title: "Failed to copy", variant: "destructive" });
    } catch {
      toast({ title: "Failed to copy", variant: "destructive" });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.secure.deleteClip(id);
      setClips((prev) => prev.filter((c) => c.id !== id));
      toast({ title: "Deleted" });
    } catch (error) {
      toast({ title: "Failed to delete", variant: "destructive" });
    }
  };

  const toggleShowPassword = (id: string) => {
    setShowPasswords((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  if (isPending || !session) {
    return (
      <div className="flex h-full min-h-0 bg-background">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
        </div>
      </div>
    );
  }

  if (loading) {
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
            pageTitle="Secure"
            shortcutHint
          />
          <div className="flex-1 flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
          </div>
        </div>
      </div>
    );
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
          onSaveFromClipboard={isWeb ? async () => {
            const ok = await saveFromClipboard();
            if (ok) toast({ title: "Saved", description: "Clipboard added to clips" });
            else toast({ title: "Empty or failed", variant: "destructive" });
            return ok;
          } : undefined}
          isWeb={isWeb}
          pageTitle="Secure"
          shortcutHint
        />
        <SearchOverlay
          open={searchOverlayOpen}
          onOpenChange={setSearchOverlayOpen}
          onSearchSubmit={() => setSearchOverlayOpen(false)}
          onNavigate={(path) => {
            router.push(path);
            setSearchOverlayOpen(false);
          }}
          onAddSnippet={() => setSearchOverlayOpen(false)}
          onSelectClip={async (clip: Clip) => {
            const ok = await import("@/lib/clipboard").then((m) => m.copyToClipboard(clip.content));
            if (ok) toast({ title: "Copied", description: "Content copied to clipboard" });
            else toast({ title: "Failed to copy", variant: "destructive" });
          }}
        />
        <main className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden px-4 py-4">
          <div className="max-w-2xl mx-auto">
            {!vaultExists && (
              <Card className="border-amber-500/30 bg-amber-50/30 dark:bg-amber-950/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5 text-amber-500" />
                    Set up Secure Vault
                  </CardTitle>
                  <CardDescription>
                    Store passwords and secrets encrypted. Your master password is never sent to our servers.
                    Only you can decrypt your data.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button onClick={() => setSetupOpen(true)}>
                    <Lock className="h-4 w-4 mr-2" />
                    Create vault
                  </Button>
                </CardContent>
              </Card>
            )}

            {vaultExists && !unlocked && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Lock className="h-5 w-5" />
                    Vault locked
                  </CardTitle>
                  <CardDescription>
                    Enter your master password to view your saved passwords.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button onClick={() => setUnlockOpen(true)}>
                    <Unlock className="h-4 w-4 mr-2" />
                    Unlock vault
                  </Button>
                </CardContent>
              </Card>
            )}

            {unlocked && (
              <>
                <div className="flex items-center justify-between mb-4">
                  <p className="text-sm text-muted-foreground">
                    {clips.length} password{clips.length !== 1 ? "s" : ""} stored
                  </p>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={handleLock}>
                      <Lock className="h-4 w-4 mr-1" />
                      Lock
                    </Button>
                    <Button size="sm" onClick={() => setAddOpen(true)}>
                      <Plus className="h-4 w-4 mr-1" />
                      Add password
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  {clips.length === 0 ? (
                    <Card>
                      <CardContent className="py-12 text-center text-muted-foreground">
                        <Shield className="h-12 w-12 mx-auto mb-3 opacity-50" />
                        <p>No passwords yet</p>
                        <Button variant="link" className="mt-2" onClick={() => setAddOpen(true)}>
                          Add your first password
                        </Button>
                      </CardContent>
                    </Card>
                  ) : (
                    clips.map((clip) => (
                      <Card key={clip.id}>
                        <CardHeader className="py-3">
                          <div className="flex items-start justify-between gap-2">
                            <CardTitle className="text-base">{clip.title}</CardTitle>
                            <div className="flex gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => toggleShowPassword(clip.id)}
                                title={showPasswords.has(clip.id) ? "Hide" : "Show"}
                              >
                                {showPasswords.has(clip.id) ? (
                                  <EyeOff className="h-4 w-4" />
                                ) : (
                                  <Eye className="h-4 w-4" />
                                )}
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => handleCopy(clip.content)}
                                title="Copy"
                              >
                                <Copy className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-destructive hover:text-destructive"
                                onClick={() => handleDelete(clip.id)}
                                title="Delete"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="pt-0">
                          <code className="text-sm font-mono">
                            {showPasswords.has(clip.id)
                              ? clip.content
                              : "••••••••••••"}
                          </code>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              </>
            )}
          </div>
        </main>
      </div>

      {/* Setup dialog */}
      <Dialog open={setupOpen} onOpenChange={setSetupOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create master password</DialogTitle>
            <DialogDescription>
              This password encrypts your vault. You need it to unlock. We never store it.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="setup-pw">Master password</Label>
              <Input
                id="setup-pw"
                type="password"
                value={masterPassword}
                onChange={(e) => setMasterPassword(e.target.value)}
                placeholder="Min 6 characters"
              />
            </div>
            <div>
              <Label htmlFor="setup-confirm">Confirm password</Label>
              <Input
                id="setup-confirm"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter password"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSetupOpen(false)}>Cancel</Button>
            <Button onClick={handleSetup}>Create vault</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Unlock dialog */}
      <Dialog open={unlockOpen} onOpenChange={setUnlockOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Unlock vault</DialogTitle>
            <DialogDescription>Enter your master password</DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="unlock-pw">Master password</Label>
            <Input
              id="unlock-pw"
              type="password"
              value={masterPassword}
              onChange={(e) => setMasterPassword(e.target.value)}
              placeholder="Password"
              onKeyDown={(e) => e.key === "Enter" && handleUnlock()}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setUnlockOpen(false)}>Cancel</Button>
            <Button onClick={handleUnlock}>Unlock</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add password dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add password</DialogTitle>
            <DialogDescription>Store a password securely. Both title and content are encrypted.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="add-title">Title (e.g. Gmail, GitHub)</Label>
              <Input
                id="add-title"
                value={addTitle}
                onChange={(e) => setAddTitle(e.target.value)}
                placeholder="Service name"
              />
            </div>
            <div>
              <Label htmlFor="add-content">Password</Label>
              <Input
                id="add-content"
                type="password"
                value={addContent}
                onChange={(e) => setAddContent(e.target.value)}
                placeholder="Your password"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)}>Cancel</Button>
            <Button onClick={handleAdd} disabled={!addTitle.trim() || !addContent.trim()}>
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

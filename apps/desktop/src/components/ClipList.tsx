"use client";

import { useEffect, useState, useMemo } from "react";
import { Clip } from "@clipsync/types";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle, Badge, Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@clipsync/ui";
import { ToastAction } from "@clipsync/ui";
import { Heart, Copy, Trash2, Clock, Monitor, ChevronDown, ChevronUp, Check, ExternalLink, Pin, Maximize2, Code, FileText, List, LayoutGrid } from "lucide-react";
import { Button } from "@clipsync/ui";
import { useToast } from "@clipsync/ui";
import { CLIP_SAVED_EVENT } from "@/hooks/useClipboard";
import { formatRelativeTime, getDateGroup, type DateGroup } from "@/lib/timeUtils";
import { isURL, normalizeURL, openURL } from "@/lib/urlUtils";
import { analyzeContent } from "@/lib/contentUtils";
import ClipPreviewModal from "./ClipPreviewModal";
import { ClipSkeletonList } from "./ClipSkeleton";
import EmptyState from "./EmptyState";

interface ClipListProps {
  searchQuery?: string;
}

export default function ClipList({ searchQuery = "" }: ClipListProps) {
  const [clips, setClips] = useState<Clip[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedClips, setExpandedClips] = useState<Set<string>>(new Set());
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [clipToDelete, setClipToDelete] = useState<Clip | null>(null);
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [clipToPreview, setClipToPreview] = useState<Clip | null>(null);
  const [copiedClipId, setCopiedClipId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"list" | "compact">("list");
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [deletedClips, setDeletedClips] = useState<Clip[]>([]); // For undo functionality cleanup
  const { toast } = useToast();

  useEffect(() => {
    loadClips();
    
    // Listen for clip saved events to refresh immediately
    const handleClipSaved = () => {
      console.log("Clip saved event received, refreshing list...");
      loadClips();
    };
    
    window.addEventListener(CLIP_SAVED_EVENT, handleClipSaved);
    
    // Fallback: Refresh every 30 seconds to catch any missed updates
    // (e.g., if clips were added from another device)
    const interval = setInterval(() => {
      loadClips();
    }, 30000); // 30 seconds instead of 2 seconds
    
    return () => {
      window.removeEventListener(CLIP_SAVED_EVENT, handleClipSaved);
      clearInterval(interval);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadClips = async () => {
    try {
      setLoading(true);
      const response = await api.clips.getAll({ pageSize: 50 });
      setClips(response.data);
      console.log("Loaded clips:", response.data.length);
    } catch (error: any) {
      console.error("Failed to load clips:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to load clips. Check console for details.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async (content: string, clipId: string) => {
    try {
      if (window.electronAPI) {
        await window.electronAPI.setClipboard(content);
        setCopiedClipId(clipId);
        setTimeout(() => setCopiedClipId(null), 2000);
        toast({
          title: "Copied",
          description: "Content copied to clipboard",
        });
        // Save to API so it appears in "latest copied" (Electron skips clipboard-changed when we set clipboard)
        const deviceName = (await window.electronAPI.getDeviceInfo()).name;
        const saved = await api.clips.create({ content, deviceName });
        window.dispatchEvent(new CustomEvent(CLIP_SAVED_EVENT, { detail: saved }));
        setClips((prev) => [saved, ...prev.filter((c) => c.id !== clipId)]);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to copy to clipboard",
        variant: "destructive",
      });
    }
  };

  // Filter and sort clips - pinned first, then by date
  const filteredClips = useMemo(() => {
    let filtered = clips;
    
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = clips.filter((clip) => {
        const contentMatch = clip.content.toLowerCase().includes(query);
        const deviceMatch = clip.deviceName?.toLowerCase().includes(query);
        const tagsMatch = clip.tags?.some((tag) => tag.toLowerCase().includes(query));
        return contentMatch || deviceMatch || tagsMatch;
      });
    }
    
    // Sort: pinned first, then by copiedAt desc
    return [...filtered].sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      return new Date(b.copiedAt).getTime() - new Date(a.copiedAt).getTime();
    });
  }, [clips, searchQuery]);

  const handleDeleteClick = (clip: Clip) => {
    setClipToDelete(clip);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!clipToDelete) return;
    
    const clipToRestore = { ...clipToDelete };
    
    try {
      await api.clips.delete(clipToDelete.id);
      setClips((prevClips) => prevClips.filter((clip) => clip.id !== clipToDelete.id));
      setDeletedClips((prev) => [...prev, clipToRestore]);
      
      toast({
        title: "Clip deleted",
        description: "Clip has been deleted",
        action: (
          <ToastAction
            altText="Undo"
            onClick={async () => {
              try {
                // Restore the clip
                const restored = await api.clips.create({
                  content: clipToRestore.content,
                  deviceName: clipToRestore.deviceName || undefined,
                  tags: clipToRestore.tags,
                });
                setClips((prevClips) => [...prevClips, restored]);
                setDeletedClips((prev) => prev.filter((c) => c.id !== clipToRestore.id));
                toast({
                  title: "Restored",
                  description: "Clip has been restored",
                });
              } catch (error) {
                toast({
                  title: "Error",
                  description: "Failed to restore clip",
                  variant: "destructive",
                });
              }
            }}
          >
            Undo
          </ToastAction>
        ),
      });
      
      // Auto-remove from deletedClips after 10 seconds
      setTimeout(() => {
        setDeletedClips((prev) => prev.filter((c) => c.id !== clipToDelete.id));
      }, 10000);
      
      setDeleteDialogOpen(false);
      setClipToDelete(null);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete clip",
        variant: "destructive",
      });
    }
  };

  const toggleExpand = (clipId: string) => {
    setExpandedClips((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(clipId)) {
        newSet.delete(clipId);
      } else {
        newSet.add(clipId);
      }
      return newSet;
    });
  };

  const handleToggleFavorite = async (clip: Clip) => {
    try {
      const updated = await api.clips.toggleFavorite(clip.id);
      setClips((prevClips) => prevClips.map((c) => (c.id === clip.id ? updated : c)));
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update favorite",
        variant: "destructive",
      });
    }
  };

  const handleTogglePin = async (clip: Clip) => {
    try {
      const updated = await api.clips.togglePin(clip.id);
      setClips((prevClips) => prevClips.map((c) => (c.id === clip.id ? updated : c)));
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update pin",
        variant: "destructive",
      });
    }
  };

  const handlePreview = (clip: Clip) => {
    setClipToPreview(clip);
    setPreviewModalOpen(true);
  };

  if (loading && clips.length === 0) {
    return <ClipSkeletonList count={5} />;
  }

  const handleTestSave = async () => {
    try {
      const testClip = await api.clips.create({
        content: "Test clip - " + new Date().toLocaleTimeString(),
        deviceName: "Manual Test",
      });
      toast({
        title: "Success",
        description: "Test clip saved! ID: " + testClip.id,
      });
      // Dispatch event to trigger refresh (or just call loadClips directly)
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent(CLIP_SAVED_EVENT, { detail: testClip }));
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to save test clip",
        variant: "destructive",
      });
    }
  };

  if (clips.length === 0) {
    return (
      <EmptyState
        type="empty"
        onTestConnection={handleTestSave}
      />
    );
  }

  if (filteredClips.length === 0 && searchQuery) {
    return <EmptyState type="search" searchQuery={searchQuery} />;
  }

  const groupOrder: DateGroup[] = ["Today", "Yesterday", "This week", "Older"];
  const clipsByDate = groupOrder.reduce<Record<DateGroup, Clip[]>>(
    (acc, group) => {
      acc[group] = filteredClips.filter((c) => getDateGroup(c.copiedAt) === group);
      return acc;
    },
    { Today: [], Yesterday: [], "This week": [], Older: [] }
  );

  return (
    <>
      <div className="flex items-center justify-end gap-1 mb-4">
        <Button
          variant={viewMode === "list" ? "secondary" : "ghost"}
          size="sm"
          onClick={() => setViewMode("list")}
          title="List view"
        >
          <List className="h-4 w-4 mr-1" />
          List
        </Button>
        <Button
          variant={viewMode === "compact" ? "secondary" : "ghost"}
          size="sm"
          onClick={() => setViewMode("compact")}
          title="Compact view"
        >
          <LayoutGrid className="h-4 w-4 mr-1" />
          Compact
        </Button>
      </div>
      <div className="space-y-6">
        {groupOrder.map((group) => {
          const groupClips = clipsByDate[group];
          if (groupClips.length === 0) return null;
          return (
            <section key={group}>
              <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-3 px-1">
                {group}
              </h2>
              <div className={viewMode === "compact" ? "grid gap-2" : "grid gap-4"}>
                {groupClips.map((clip) => {
          const isExpanded = expandedClips.has(clip.id);
          const isCopied = copiedClipId === clip.id;
          const shouldShowExpand = clip.content.length > 150;
          const contentInfo = analyzeContent(clip.content);
          const isUrl = isURL(clip.content);
          
          return (
            <Card 
              key={clip.id} 
              className={`transition-all relative border hover:shadow-md hover:border-accent/50 ${
                isCopied ? "ring-2 ring-green-500 ring-offset-2 shadow-md border-green-500/30" : ""
              }               ${clip.isPinned ? "border-l-4 border-l-primary" : ""} ${
                viewMode === "compact" ? "py-2 px-3" : ""
              }`}
            >
              {clip.isPinned && (
                <div className={viewMode === "compact" ? "absolute top-1.5 right-2" : "absolute top-2 right-2"}>
                  <Pin className="h-4 w-4 text-primary fill-primary" />
                </div>
              )}
              <CardHeader className={viewMode === "compact" ? "p-0 pb-1" : ""}>
                <div className={`flex items-start justify-between gap-4 ${viewMode === "compact" ? "items-center" : ""}`}>
                  <div className="flex-1 min-w-0">
                    <div className={`flex items-center gap-2 ${viewMode === "compact" ? "mb-0" : "mb-1"}`}>
                      {contentInfo.isCode && (
                        <Code className="h-3 w-3 text-muted-foreground" />
                      )}
                      {contentInfo.isFilePath && (
                        <FileText className="h-3 w-3 text-muted-foreground" />
                      )}
                      <CardTitle className={`font-medium ${viewMode === "compact" ? "text-sm line-clamp-1" : "text-base line-clamp-2"}`}>
                        {clip.contentPreview || clip.content.substring(0, viewMode === "compact" ? 60 : 100)}
                      </CardTitle>
                    </div>
                    {viewMode !== "compact" && (
                    <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      <span>{formatRelativeTime(clip.copiedAt)}</span>
                      {contentInfo.language && (
                        <>
                          <span>•</span>
                          <Badge variant="outline" className="text-xs">
                            {contentInfo.language}
                          </Badge>
                        </>
                      )}
                    </div>
                    )}
                  </div>
                  <div className="flex gap-1 flex-shrink-0">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleTogglePin(clip)}
                      className={clip.isPinned ? "text-primary" : ""}
                      title={clip.isPinned ? "Unpin" : "Pin"}
                    >
                      <Pin
                        className={`h-4 w-4 ${clip.isPinned ? "fill-current" : ""}`}
                      />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleToggleFavorite(clip)}
                      className={clip.isFavorite ? "text-red-500" : ""}
                      title="Toggle favorite"
                    >
                      <Heart
                        className={`h-4 w-4 ${clip.isFavorite ? "fill-current" : ""}`}
                      />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handlePreview(clip)}
                      title="Preview full content"
                    >
                      <Maximize2 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleCopy(clip.content, clip.id)}
                      className={isCopied ? "text-green-600 dark:text-green-400 bg-green-500/10" : ""}
                      title={isCopied ? "Copied!" : "Copy to clipboard"}
                    >
                      {isCopied ? (
                        <Check className="h-4 w-4" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteClick(clip)}
                      title="Delete clip"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className={viewMode === "compact" ? "p-0 pt-0" : ""}>
                {isUrl ? (
                  <div className="flex items-center gap-2">
                    <a
                      href={normalizeURL(clip.content)}
                      onClick={(e) => {
                        e.preventDefault();
                        openURL(normalizeURL(clip.content));
                      }}
                      className="text-sm text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300 underline flex items-center gap-1 break-all"
                    >
                      <ExternalLink className="h-3 w-3 flex-shrink-0" />
                      <span className={isExpanded ? "" : "line-clamp-3"}>{clip.content}</span>
                    </a>
                  </div>
                ) : contentInfo.isCode && contentInfo.language ? (
                  <div className="relative">
                    <pre className="text-xs bg-muted p-3 rounded-lg overflow-x-auto">
                      <code>{clip.content.substring(0, isExpanded ? undefined : 300)}</code>
                    </pre>
                    {clip.content.length > 300 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handlePreview(clip)}
                        className="mt-2 text-xs"
                      >
                        View full code
                      </Button>
                    )}
                  </div>
                ) : contentInfo.isFilePath ? (
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <p className={`text-sm font-mono text-muted-foreground ${isExpanded ? "" : "line-clamp-3"}`}>
                      {clip.content}
                    </p>
                  </div>
                ) : (
                  <p className={`text-sm text-muted-foreground ${isExpanded ? "" : viewMode === "compact" ? "line-clamp-1" : "line-clamp-3"}`}>
                    {clip.content}
                  </p>
                )}
                {shouldShowExpand && !contentInfo.isCode && viewMode !== "compact" && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleExpand(clip.id)}
                    className="mt-2 text-xs"
                  >
                    {isExpanded ? (
                      <>
                        <ChevronUp className="h-3 w-3 mr-1" />
                        Show less
                      </>
                    ) : (
                      <>
                        <ChevronDown className="h-3 w-3 mr-1" />
                        Show more
                      </>
                    )}
                  </Button>
                )}
                {clip.tags && clip.tags.length > 0 && viewMode !== "compact" && (
                  <div className="flex gap-2 mt-3 flex-wrap">
                    {clip.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 text-xs bg-secondary rounded-md"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
                {/* Device name tag at bottom right corner */}
                {clip.deviceName && viewMode !== "compact" && (
                  <div className="flex justify-end mt-4">
                    <Badge 
                      className="inline-flex items-center gap-1 bg-orange-500 text-white hover:bg-orange-600 border-orange-600 max-w-[120px] truncate"
                      title={clip.deviceName}
                    >
                      <Monitor className="h-3 w-3 flex-shrink-0" />
                      <span className="truncate">{clip.deviceName}</span>
                    </Badge>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
              </div>
            </section>
          );
        })}
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Clip?</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this clip? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          {clipToDelete && (
            <div className="py-4">
              <p className="text-sm text-muted-foreground line-clamp-3">
                {clipToDelete.content}
              </p>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setDeleteDialogOpen(false);
                setClipToDelete(null);
              }}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteConfirm}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Preview Modal */}
      <ClipPreviewModal
        clip={clipToPreview}
        open={previewModalOpen}
        onOpenChange={setPreviewModalOpen}
        onDelete={handleDeleteClick}
        onToggleFavorite={handleToggleFavorite}
        onTogglePin={handleTogglePin}
      />
    </>
  );
}

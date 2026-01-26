"use client";

import { useEffect, useState, useMemo } from "react";
import { Clip } from "@clipsync/types";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle, Badge, Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@clipsync/ui";
import { Heart, Copy, Trash2, Clock, Monitor, ChevronDown, ChevronUp, Check, ExternalLink } from "lucide-react";
import { Button } from "@clipsync/ui";
import { useToast } from "@clipsync/ui";
import Sidebar from "@/components/Sidebar";
import SearchBar from "@/components/SearchBar";
import { formatRelativeTime } from "@/lib/timeUtils";
import { isURL, normalizeURL, openURL } from "@/lib/urlUtils";

export default function FavoritesPage() {
  const [clips, setClips] = useState<Clip[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedClips, setExpandedClips] = useState<Set<string>>(new Set());
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [clipToDelete, setClipToDelete] = useState<Clip | null>(null);
  const [copiedClipId, setCopiedClipId] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadFavorites();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadFavorites = async () => {
    try {
      setLoading(true);
      const response = await api.clips.getAll({ favorite: true, pageSize: 100 });
      setClips(response.data);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load favorites",
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
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to copy to clipboard",
        variant: "destructive",
      });
    }
  };

  const handleDeleteClick = (clip: Clip) => {
    setClipToDelete(clip);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!clipToDelete) return;
    
    try {
      await api.clips.delete(clipToDelete.id);
      setClips(clips.filter((clip) => clip.id !== clipToDelete.id));
      toast({
        title: "Deleted",
        description: "Clip deleted successfully",
      });
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

  const filteredClips = useMemo(() => {
    if (!searchQuery.trim()) return clips;
    
    const query = searchQuery.toLowerCase();
    return clips.filter((clip) => {
      const contentMatch = clip.content.toLowerCase().includes(query);
      const deviceMatch = clip.deviceName?.toLowerCase().includes(query);
      const tagsMatch = clip.tags?.some((tag) => tag.toLowerCase().includes(query));
      return contentMatch || deviceMatch || tagsMatch;
    });
  }, [clips, searchQuery]);

  if (loading) {
    return (
      <div className="flex h-screen bg-background">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  if (clips.length === 0) {
    return (
      <div className="flex h-screen bg-background">
        <Sidebar />
        <div className="flex-1 flex flex-col">
          <SearchBar searchQuery={searchQuery} onSearchChange={setSearchQuery} />
          <div className="flex-1 flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <Heart className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg">No favorite clips yet</p>
              <p className="text-sm">Mark clips as favorites to see them here</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (filteredClips.length === 0 && searchQuery) {
    return (
      <div className="flex h-screen bg-background">
        <Sidebar />
        <div className="flex-1 flex flex-col">
          <SearchBar searchQuery={searchQuery} onSearchChange={setSearchQuery} />
          <div className="flex-1 flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <p className="text-lg">No favorites found</p>
              <p className="text-sm">Try a different search term</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="flex h-screen bg-background">
        <Sidebar />
        <div className="flex-1 flex flex-col">
          <SearchBar searchQuery={searchQuery} onSearchChange={setSearchQuery} />
          <main className="flex-1 overflow-auto p-6">
            <div className="grid gap-4">
              {filteredClips.map((clip) => {
                const isExpanded = expandedClips.has(clip.id);
                const isCopied = copiedClipId === clip.id;
                const shouldShowExpand = clip.content.length > 150;
                
                return (
                  <Card key={clip.id} className={`hover:shadow-lg transition-all ${isCopied ? "ring-2 ring-green-500 ring-offset-2" : ""}`}>
                    <CardHeader>
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <CardTitle className="text-base font-medium line-clamp-2">
                            {clip.contentPreview || clip.content.substring(0, 100)}
                          </CardTitle>
                          <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            <span>{formatRelativeTime(clip.copiedAt)}</span>
                          </div>
                        </div>
                        <div className="flex gap-2 flex-shrink-0">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleCopy(clip.content, clip.id)}
                            className={isCopied ? "text-green-500" : ""}
                            title="Copy to clipboard"
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
                    <CardContent>
                      {isURL(clip.content) ? (
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
                      ) : (
                        <p className={`text-sm text-muted-foreground ${isExpanded ? "" : "line-clamp-3"}`}>
                          {clip.content}
                        </p>
                      )}
                      {shouldShowExpand && (
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
                      {clip.tags && clip.tags.length > 0 && (
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
                      {clip.deviceName && (
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
          </main>
        </div>
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
    </>
  );
}

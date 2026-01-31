"use client";

import { useEffect, useState, useRef, useMemo } from "react";
import { createPortal } from "react-dom";
import { Search, ChevronRight, Star, Settings, Home, Plus, FileText } from "lucide-react";
import { api } from "@/lib/api";
import { Clip } from "@clipsync/types";
import { formatRelativeTime } from "@/lib/timeUtils";
import { cn } from "@clipsync/ui";

export type SearchOverlayAction =
  | { type: "search"; id: string; label: string; query: string }
  | { type: "page"; id: string; label: string; path: string; icon: React.ReactNode }
  | { type: "action"; id: string; label: string; icon: React.ReactNode }
  | { type: "clip"; id: string; clip: Clip };

interface SearchOverlayProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Called when user applies search (types and selects search or presses Enter on search intent) */
  onSearchSubmit: (query: string) => void;
  onNavigate: (path: string) => void;
  onAddSnippet: () => void;
  /** Called when user selects a clip (e.g. copy and close) */
  onSelectClip?: (clip: Clip) => void;
}

const PAGES: { id: string; label: string; path: string; icon: React.ReactNode }[] = [
  { id: "home", label: "Home", path: "/", icon: <Home className="h-4 w-4" /> },
  { id: "favorites", label: "Favorites", path: "/favorites", icon: <Star className="h-4 w-4" /> },
  { id: "settings", label: "Settings", path: "/settings", icon: <Settings className="h-4 w-4" /> },
];

const ACTIONS: { id: string; label: string; icon: React.ReactNode }[] = [
  { id: "add-snippet", label: "Add new snippet", icon: <Plus className="h-4 w-4" /> },
];

export default function SearchOverlay({
  open,
  onOpenChange,
  onSearchSubmit,
  onNavigate,
  onAddSnippet,
  onSelectClip,
}: SearchOverlayProps) {
  const [query, setQuery] = useState("");
  const [clips, setClips] = useState<Clip[]>([]);
  const [loadingClips, setLoadingClips] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) {
      setQuery("");
      setSelectedIndex(0);
      inputRef.current?.focus();
      setLoadingClips(true);
      api.clips
        .getAll({ pageSize: 20 })
        .then((res) => setClips(res.data || []))
        .catch(() => setClips([]))
        .finally(() => setLoadingClips(false));
    }
  }, [open]);

  const filteredClips = useMemo(() => {
    if (!query.trim()) return clips.slice(0, 8);
    const q = query.toLowerCase();
    return clips.filter(
      (c) =>
        c.content.toLowerCase().includes(q) ||
        c.deviceName?.toLowerCase().includes(q) ||
        c.tags?.some((t) => t.toLowerCase().includes(q))
    );
  }, [clips, query]);

  const items: SearchOverlayAction[] = useMemo(() => {
    const list: SearchOverlayAction[] = [];
    if (query.trim()) {
      list.push({
        type: "search",
        id: "search-query",
        label: `Search clips for "${query.trim()}"`,
        query: query.trim(),
      });
    }
    list.push(...PAGES.map((p) => ({ type: "page" as const, ...p, icon: p.icon })));
    list.push(...ACTIONS.map((a) => ({ type: "action" as const, ...a, icon: a.icon })));
    filteredClips.forEach((clip) =>
      list.push({ type: "clip", id: clip.id, clip })
    );
    return list;
  }, [filteredClips, query]);

  useEffect(() => {
    setSelectedIndex((i) => Math.min(Math.max(0, i), Math.max(0, items.length - 1)));
  }, [items.length]);

  useEffect(() => {
    const el = listRef.current;
    if (!el || selectedIndex >= items.length) return;
    const child = el.children[selectedIndex] as HTMLElement;
    child?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [selectedIndex, items.length]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      e.preventDefault();
      onOpenChange(false);
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((i) => Math.min(i + 1, items.length - 1));
      return;
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((i) => Math.max(i - 1, 0));
      return;
    }
    if (e.key === "Enter") {
      e.preventDefault();
      const item = items[selectedIndex];
      if (item) runItem(item);
      return;
    }
  };

  const runItem = (item: SearchOverlayAction) => {
    if (item.type === "search") {
      onSearchSubmit(item.query);
      onOpenChange(false);
      return;
    }
    if (item.type === "page") {
      onNavigate(item.path);
      onOpenChange(false);
      return;
    }
    if (item.type === "action") {
      if (item.id === "add-snippet") {
        onAddSnippet();
        onOpenChange(false);
      }
      return;
    }
    if (item.type === "clip") {
      if (onSelectClip) {
        onSelectClip(item.clip);
      }
      onOpenChange(false);
    }
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onOpenChange(false);
  };

  if (typeof document === "undefined" || !open) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh] px-4 bg-black/60 backdrop-blur-sm animate-in fade-in-0 duration-200"
      role="dialog"
      aria-modal="true"
      aria-label="Search"
      onClick={handleBackdropClick}
    >
      <div
        className="w-full max-w-2xl rounded-xl bg-card border border-border shadow-2xl overflow-hidden animate-in zoom-in-95 slide-in-from-top-4 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-border bg-muted/30">
          <Search className="h-5 w-5 text-muted-foreground shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search clips, go to page, or add snippet..."
            className="flex-1 min-w-0 bg-transparent text-foreground text-base outline-none placeholder:text-muted-foreground"
          />
          <kbd className="hidden sm:inline-flex h-6 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
            ESC
          </kbd>
        </div>

        {/* Results */}
        <div
          ref={listRef}
          className="max-h-[min(60vh,400px)] overflow-y-auto py-2"
        >
          {items.length === 0 && !loadingClips ? (
            <div className="px-4 py-8 text-center text-sm text-muted-foreground">
              {query.trim() ? "No clips match your search." : "No recent clips."}
            </div>
          ) : (
            <ul className="py-1" role="listbox">
              {items.flatMap((item, index) => {
                const isSelected = index === selectedIndex;
                const prevType = index > 0 ? items[index - 1].type : null;
                const showSectionLabel = prevType !== item.type;
                const sectionLabels: Record<string, string> = {
                  search: "Search",
                  page: "Pages",
                  action: "Actions",
                  clip: "Recent clips",
                };
                const sectionLabel = showSectionLabel ? sectionLabels[item.type] : null;
                const itemLi =
                  item.type === "search" ? (
                    <li
                      key={item.id}
                      role="option"
                      aria-selected={isSelected}
                      className={cn(
                        "flex items-center gap-3 px-4 py-2.5 cursor-pointer transition-colors",
                        isSelected ? "bg-accent text-accent-foreground" : "hover:bg-accent/50"
                      )}
                      onMouseEnter={() => setSelectedIndex(index)}
                      onClick={() => runItem(item)}
                    >
                      <Search className="h-4 w-4 text-muted-foreground shrink-0" />
                      <span className="flex-1 font-medium">{item.label}</span>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </li>
                  ) : item.type === "page" ? (
                    <li
                      key={item.id}
                      role="option"
                      aria-selected={isSelected}
                      className={cn(
                        "flex items-center gap-3 px-4 py-2.5 cursor-pointer transition-colors",
                        isSelected ? "bg-accent text-accent-foreground" : "hover:bg-accent/50"
                      )}
                      onMouseEnter={() => setSelectedIndex(index)}
                      onClick={() => runItem(item)}
                    >
                      <span className="text-muted-foreground">{item.icon}</span>
                      <span className="flex-1 font-medium">{item.label}</span>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </li>
                  ) : item.type === "action" ? (
                    <li
                      key={item.id}
                      role="option"
                      aria-selected={isSelected}
                      className={cn(
                        "flex items-center gap-3 px-4 py-2.5 cursor-pointer transition-colors",
                        isSelected ? "bg-accent text-accent-foreground" : "hover:bg-accent/50"
                      )}
                      onMouseEnter={() => setSelectedIndex(index)}
                      onClick={() => runItem(item)}
                    >
                      <span className="text-muted-foreground">{item.icon}</span>
                      <span className="flex-1 font-medium">{item.label}</span>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </li>
                  ) : (
                    <li
                      key={item.id}
                      role="option"
                      aria-selected={isSelected}
                      className={cn(
                        "flex items-center gap-3 px-4 py-2.5 cursor-pointer transition-colors",
                        isSelected ? "bg-accent text-accent-foreground" : "hover:bg-accent/50"
                      )}
                      onMouseEnter={() => setSelectedIndex(index)}
                      onClick={() => runItem(item)}
                    >
                      <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {item.clip.contentPreview || item.clip.content.slice(0, 60)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatRelativeTime(item.clip.copiedAt)}
                          {item.clip.deviceName ? ` · ${item.clip.deviceName}` : ""}
                        </p>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                    </li>
                  );
                return [
                  ...(sectionLabel
                    ? [
                        <li
                          key={`section-${item.type}-${index}`}
                          className="px-4 py-1.5 text-xs font-medium text-muted-foreground uppercase tracking-wider sticky top-0 bg-card/95 backdrop-blur py-2 pointer-events-none"
                        >
                          {sectionLabel}
                        </li>,
                      ]
                    : []),
                  itemLi,
                ];
              })}
            </ul>
          )}
        </div>

        <div className="px-4 py-2 border-t border-border bg-muted/20 flex items-center justify-between text-xs text-muted-foreground">
          <span>↑↓ Navigate · Enter Select · Esc Close</span>
          <span>⌘K to open</span>
        </div>
      </div>
    </div>,
    document.body
  );
}

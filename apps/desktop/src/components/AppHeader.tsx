"use client";

import { Button } from "@clipsync/ui";
import { Search, Plus, X } from "lucide-react";

interface AppHeaderProps {
  searchQuery: string;
  onSearchClick: () => void;
  onClearSearch: (e: React.MouseEvent) => void;
  showNewSnippet?: boolean;
  onNewSnippet?: () => void;
  /** Optional page title shown below the bar (e.g. "Favorites") */
  pageTitle?: string;
  /** Optional hint text, e.g. "Press ? for shortcuts" */
  shortcutHint?: boolean;
}

export default function AppHeader({
  searchQuery,
  onSearchClick,
  onClearSearch,
  showNewSnippet = true,
  onNewSnippet,
  pageTitle,
  shortcutHint = false,
}: AppHeaderProps) {
  return (
    <>
      <div className="flex items-center gap-2 p-4 border-b border-border flex-shrink-0">
        <div className="flex-1 min-w-0 flex items-center gap-2">
          <button
            type="button"
            onClick={onSearchClick}
            className="flex-1 min-w-0 flex items-center gap-3 px-3 py-2 rounded-md border border-input bg-background text-muted-foreground hover:bg-accent/50 hover:text-foreground transition-colors text-left"
          >
            <Search className="h-4 w-4 shrink-0" />
            <span className="truncate">
              {searchQuery ? `Search: ${searchQuery}` : "Search clips, go to page..."}
            </span>
            <kbd className="hidden sm:inline-flex ml-auto h-6 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
              ⌘K
            </kbd>
          </button>
          {searchQuery && (
            <Button
              variant="ghost"
              size="icon"
              className="shrink-0"
              onClick={onClearSearch}
              title="Clear search"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
        {showNewSnippet && onNewSnippet && (
          <Button onClick={onNewSnippet} className="flex-shrink-0" title="Add new snippet">
            <Plus className="h-4 w-4 mr-2" />
            New snippet
          </Button>
        )}
      </div>
      {pageTitle && (
        <div className="px-4 py-2 border-b border-border flex-shrink-0">
          <h1 className="text-xl font-semibold">{pageTitle}</h1>
        </div>
      )}
      {shortcutHint && (
        <p className="px-4 py-1 text-xs text-muted-foreground border-b border-border flex-shrink-0">
          Press <kbd className="px-1 py-0.5 rounded bg-muted font-mono text-[10px]">?</kbd> for shortcuts
        </p>
      )}
    </>
  );
}

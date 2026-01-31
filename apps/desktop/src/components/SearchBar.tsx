"use client";

import { Input } from "@clipsync/ui";
import { Search, X } from "lucide-react";
import { Button } from "@clipsync/ui";
import { RefObject } from "react";

interface SearchBarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  inputRef?: RefObject<HTMLInputElement>;
  /** When true, no outer padding/border (e.g. when used in a row with other controls) */
  compact?: boolean;
}

export default function SearchBar({ searchQuery, onSearchChange, inputRef, compact }: SearchBarProps) {
  return (
    <div className={compact ? "flex-1 min-w-0" : "p-4 border-b border-border"}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          ref={inputRef}
          type="text"
          placeholder="Search clips... (Press Ctrl+K to focus)"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10 pr-10"
        />
        {searchQuery && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6"
            onClick={() => onSearchChange("")}
          >
            <X className="h-3 w-3" />
          </Button>
        )}
      </div>
    </div>
  );
}

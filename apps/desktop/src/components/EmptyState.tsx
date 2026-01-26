"use client";

import { Clipboard, Search, Heart } from "lucide-react";
import { Button } from "@clipsync/ui";

interface EmptyStateProps {
  type?: "empty" | "search" | "favorites";
  searchQuery?: string;
  onTestConnection?: () => void;
}

export default function EmptyState({ 
  type = "empty", 
  searchQuery = "",
  onTestConnection 
}: EmptyStateProps) {
  const getContent = () => {
    switch (type) {
      case "search":
        return {
          icon: Search,
          title: "No clips found",
          description: searchQuery 
            ? `No clips match "${searchQuery}"`
            : "Try a different search term",
        };
      case "favorites":
        return {
          icon: Heart,
          title: "No favorites yet",
          description: "Mark clips as favorites to see them here",
        };
      default:
        return {
          icon: Clipboard,
          title: "No clips yet",
          description: "Start copying text to see your clipboard history",
        };
    }
  };

  const { icon: Icon, title, description } = getContent();

  return (
    <div className="flex flex-col items-center justify-center h-[60vh] text-center px-4">
      <div className="relative mb-6">
        <div className="absolute inset-0 bg-primary/10 rounded-full blur-2xl"></div>
        <div className="relative bg-muted rounded-full p-6">
          <Icon className="h-12 w-12 text-muted-foreground" />
        </div>
      </div>
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      <p className="text-muted-foreground mb-6 max-w-md">{description}</p>
      {type === "empty" && typeof window !== "undefined" && !window.electronAPI && (
        <div className="space-y-3">
          <p className="text-xs text-yellow-600 dark:text-yellow-400">
            Note: Make sure you are running the Electron app, not just the browser
          </p>
          {onTestConnection && (
            <Button onClick={onTestConnection} variant="outline" size="sm">
              Test API Connection
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

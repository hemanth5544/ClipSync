"use client";

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@clipsync/ui";
import { Keyboard } from "lucide-react";

interface KeyboardShortcutsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function KeyboardShortcuts({ open, onOpenChange }: KeyboardShortcutsProps) {
  const shortcuts = [
    { key: "Ctrl+K", description: "Focus search" },
    { key: "Esc", description: "Clear search / Close dialogs" },
    { key: "Ctrl+F", description: "Go to favorites" },
    { key: "Ctrl+,", description: "Open settings" },
    { key: "?", description: "Show keyboard shortcuts" },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Keyboard className="h-5 w-5" />
            Keyboard Shortcuts
          </DialogTitle>
          <DialogDescription>
            Use these shortcuts to navigate ClipSync faster
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <div className="space-y-3">
            {shortcuts.map((shortcut, index) => (
              <div key={index} className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{shortcut.description}</span>
                <kbd className="px-2 py-1 text-xs font-semibold bg-secondary rounded border border-border">
                  {shortcut.key}
                </kbd>
              </div>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

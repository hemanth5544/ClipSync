"use client";

import { useEffect, useState } from "react";
import { Clip } from "@clipsync/types";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@clipsync/ui";
import { X, Copy, Check, Heart, Pin, Trash2, Shield, Clock, Monitor, Code } from "lucide-react";
import { Button } from "@clipsync/ui";
import { useToast } from "@clipsync/ui";
import { analyzeContent } from "@/lib/contentUtils";
import { useTheme } from "next-themes";
import { formatRelativeTime } from "@/lib/timeUtils";
import { isURL, normalizeURL, openURL } from "@/lib/urlUtils";

interface ClipPreviewModalProps {
  clip: Clip | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDelete: (clip: Clip) => void;
  onToggleFavorite: (clip: Clip) => void;
  onTogglePin: (clip: Clip) => void;
  onMoveToSecure?: () => void;
}

export default function ClipPreviewModal({
  clip,
  open,
  onOpenChange,
  onDelete,
  onToggleFavorite,
  onTogglePin,
  onMoveToSecure,
}: ClipPreviewModalProps) {
  const { theme, resolvedTheme } = useTheme();
  const [copied, setCopied] = useState(false);
  const [SyntaxHighlighter, setSyntaxHighlighter] = useState<any>(null);
  const [styles, setStyles] = useState<any>(null);
  const { toast } = useToast();
  const isDark = resolvedTheme === "dark" || theme === "dark";

  // Load syntax highlighter dynamically
  useEffect(() => {
    if (open && clip) {
      import("react-syntax-highlighter")
        .then((mod) => {
          setSyntaxHighlighter(() => mod.Prism);
          return import("react-syntax-highlighter/dist/esm/styles/prism");
        })
        .then((styleMod) => {
          setStyles(styleMod);
        })
        .catch((error) => {
          console.warn("Failed to load syntax highlighter:", error);
          // Gracefully handle missing package
        });
    }
  }, [open, clip]);

  useEffect(() => {
    if (copied) {
      const timer = setTimeout(() => setCopied(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [copied]);

  if (!clip) return null;

  const contentInfo = analyzeContent(clip.content);
  const isUrl = isURL(clip.content);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(clip.content);
    setCopied(true);
    toast({
      title: "Copied!",
      description: "Content copied to clipboard",
    });
  };

  const handleUrlClick = async () => {
    if (isUrl) {
      await openURL(normalizeURL(clip.content));
    }
  };

  const renderContent = () => {
    if (isUrl) {
      return (
        <div className="space-y-4">
          <div className="flex items-center gap-2 p-4 bg-muted rounded-lg">
            <span className="text-sm font-medium">URL detected</span>
          </div>
          <button
            onClick={handleUrlClick}
            className="text-blue-600 dark:text-blue-400 hover:underline break-all text-left"
          >
            {clip.content}
          </button>
        </div>
      );
    }

    if (contentInfo.isCode && contentInfo.language) {
      if (SyntaxHighlighter && styles) {
        const style = isDark ? styles.oneDark : styles.oneLight;
        return (
          <div className="rounded-lg overflow-hidden border">
            <SyntaxHighlighter
              language={contentInfo.language}
              style={style}
              customStyle={{
                margin: 0,
                borderRadius: "0.5rem",
                fontSize: "0.875rem",
              }}
              showLineNumbers
            >
              {clip.content}
            </SyntaxHighlighter>
          </div>
        );
      } else {
        // Fallback: styled code block without syntax highlighting
        return (
          <div className="rounded-lg overflow-hidden border bg-muted p-4">
            <div className="flex items-center gap-2 mb-2">
              <Code className="h-4 w-4" />
              <span className="text-xs font-medium text-muted-foreground">
                {contentInfo.language}
              </span>
            </div>
            <pre className="whitespace-pre-wrap break-words font-mono text-sm overflow-auto max-h-[60vh]">
              {clip.content}
            </pre>
          </div>
        );
      }
    }

    if (contentInfo.isJSON) {
      try {
        const formatted = JSON.stringify(JSON.parse(clip.content), null, 2);
        if (SyntaxHighlighter && styles) {
          const style = isDark ? styles.oneDark : styles.oneLight;
          return (
            <div className="rounded-lg overflow-hidden border">
              <SyntaxHighlighter
                language="json"
                style={style}
                customStyle={{
                  margin: 0,
                  borderRadius: "0.5rem",
                  fontSize: "0.875rem",
                }}
                showLineNumbers
              >
                {formatted}
              </SyntaxHighlighter>
            </div>
          );
        } else {
          // Fallback: formatted JSON without syntax highlighting
          return (
            <div className="rounded-lg overflow-hidden border bg-muted p-4">
              <div className="flex items-center gap-2 mb-2">
                <Code className="h-4 w-4" />
                <span className="text-xs font-medium text-muted-foreground">JSON</span>
              </div>
              <pre className="whitespace-pre-wrap break-words font-mono text-sm overflow-auto max-h-[60vh]">
                {formatted}
              </pre>
            </div>
          );
        }
      } catch {
        // Fallback to plain text if JSON parsing fails
      }
    }

    // Plain text or markdown (for now, just show as text)
    return (
      <pre className="whitespace-pre-wrap break-words font-mono text-sm bg-muted p-4 rounded-lg overflow-auto max-h-[60vh]">
        {clip.content}
      </pre>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <DialogTitle className="text-xl mb-2">Clip Preview</DialogTitle>
              <DialogDescription className="flex items-center gap-4 text-sm">
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {formatRelativeTime(clip.copiedAt)}
                </span>
                {clip.deviceName && (
                  <span className="flex items-center gap-1">
                    <Monitor className="h-3 w-3" />
                    {clip.deviceName}
                  </span>
                )}
              </DialogDescription>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onOpenChange(false)}
              className="h-8 w-8"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-auto py-4">
          {renderContent()}
        </div>

        <div className="flex-shrink-0 flex items-center justify-between gap-2 pt-4 border-t">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => onTogglePin(clip)}
              title={clip.isPinned ? "Unpin" : "Pin"}
            >
              <Pin
                className={`h-4 w-4 ${
                  clip.isPinned ? "fill-foreground" : ""
                }`}
              />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => onToggleFavorite(clip)}
              title={clip.isFavorite ? "Unfavorite" : "Favorite"}
            >
              <Heart
                className={`h-4 w-4 ${
                  clip.isFavorite ? "fill-red-500 text-red-500" : ""
                }`}
              />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={handleCopy}
              title="Copy"
            >
              {copied ? (
                <Check className="h-4 w-4 text-green-600" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
            {onMoveToSecure && (
              <Button
                variant="outline"
                size="icon"
                onClick={() => {
                  onMoveToSecure();
                  onOpenChange(false);
                }}
                title="Move to Secure"
              >
                <Shield className="h-4 w-4" />
              </Button>
            )}
          </div>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => {
              onDelete(clip);
              onOpenChange(false);
            }}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

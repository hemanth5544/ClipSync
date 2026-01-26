/**
 * Content detection and formatting utilities
 */

export type ContentType = "code" | "markdown" | "json" | "url" | "filepath" | "text";

export interface ContentInfo {
  type: ContentType;
  language?: string;
  isCode: boolean;
  isMarkdown: boolean;
  isJSON: boolean;
  isURL: boolean;
  isFilePath: boolean;
}

/**
 * Detect file paths in content
 */
export function detectFilePath(text: string): boolean {
  // Common file path patterns
  const pathPatterns = [
    /^[\/\\]?([a-zA-Z]:)?[\/\\]?([\w\-\.]+[\/\\])+[\w\-\.]+\.\w+$/, // Windows/Unix paths
    /^[\/\\]?([\w\-\.]+[\/\\])+[\w\-\.]+$/, // Directory paths
    /^~\/[\w\/\.\-]+$/, // Home directory paths
    /^\.\/[\w\/\.\-]+$/, // Relative paths
    /^\.\.\/[\w\/\.\-]+$/, // Parent directory paths
  ];

  const lines = text.split("\n").filter((line) => line.trim().length > 0);
  if (lines.length === 0) return false;

  // Check if most lines look like file paths
  const matchingLines = lines.filter((line) => {
    const trimmed = line.trim();
    return pathPatterns.some((pattern) => pattern.test(trimmed));
  });

  return matchingLines.length >= lines.length * 0.7; // 70% of lines match
}

/**
 * Detect programming language from code content
 */
export function detectLanguage(content: string): string | undefined {
  const trimmed = content.trim();

  // Check for shebang
  if (trimmed.startsWith("#!")) {
    const shebang = trimmed.split("\n")[0];
    if (shebang.includes("python")) return "python";
    if (shebang.includes("node")) return "javascript";
    if (shebang.includes("bash") || shebang.includes("sh")) return "bash";
    if (shebang.includes("ruby")) return "ruby";
  }

  // Check for language-specific patterns
  const patterns: { [key: string]: RegExp[] } = {
    javascript: [
      /^(import|export|const|let|var|function|class|=>)/m,
      /console\.(log|error|warn)/,
      /require\(|module\.exports/,
    ],
    typescript: [
      /^(import|export|const|let|var|function|class|interface|type|=>)/m,
      /:\s*(string|number|boolean|any|void)/,
    ],
    python: [
      /^(def|class|import|from|if __name__)/m,
      /print\(|#.*python/i,
    ],
    java: [
      /^(public|private|protected|class|interface|import|package)/m,
      /@Override|@Deprecated/,
    ],
    go: [
      /^(package|import|func|type|var|const)/m,
      /:=|go func/,
    ],
    html: [
      /^<!DOCTYPE|<html|<head|<body|<div|<span/i,
      /<[a-z]+[^>]*>/i,
    ],
    css: [
      /^[.#]?[a-z-]+\s*\{/i,
      /@media|@keyframes|@import/,
    ],
    json: [
      /^\s*[\{\[]/,
      /"[\w]+"\s*:/,
    ],
    sql: [
      /^(SELECT|INSERT|UPDATE|DELETE|CREATE|ALTER|DROP)/i,
      /FROM|WHERE|JOIN|GROUP BY/i,
    ],
    bash: [
      /^#!\/bin\/(bash|sh)/,
      /\$\{|\$\(|if \[|for .* in/,
    ],
  };

  for (const [lang, regexes] of Object.entries(patterns)) {
    if (regexes.some((regex) => regex.test(trimmed))) {
      return lang;
    }
  }

  return undefined;
}

/**
 * Detect if content is markdown
 */
export function isMarkdown(content: string): boolean {
  const markdownPatterns = [
    /^#{1,6}\s+.+$/m, // Headers
    /^\s*[-*+]\s+.+$/m, // Lists
    /^\s*\d+\.\s+.+$/m, // Numbered lists
    /\[.+\]\(.+\)/, // Links
    /!\[.+\]\(.+\)/, // Images
    /^\s*```/m, // Code blocks
    /^\s*>/m, // Blockquotes
    /\*\*.*\*\*|__.*__/, // Bold
    /\*.*\*|_.*_/, // Italic
  ];

  return markdownPatterns.some((pattern) => pattern.test(content));
}

/**
 * Detect if content is JSON
 */
export function isJSON(content: string): boolean {
  const trimmed = content.trim();
  if (!trimmed.startsWith("{") && !trimmed.startsWith("[")) {
    return false;
  }

  try {
    JSON.parse(trimmed);
    return true;
  } catch {
    return false;
  }
}

/**
 * Analyze content and return information about it
 */
export function analyzeContent(content: string): ContentInfo {
  const trimmed = content.trim();

  // Check for URLs
  const urlPattern = /^https?:\/\/.+/i;
  const isURL = urlPattern.test(trimmed) && trimmed.split("\n").length === 1;

  // Check for file paths
  const isFilePath = detectFilePath(trimmed);

  // Check for JSON
  const isJSONContent = isJSON(trimmed);

  // Check for markdown
  const isMarkdownContent = isMarkdown(trimmed);

  // Check for code
  const language = detectLanguage(trimmed);
  const isCode = !!language || trimmed.includes("```") || trimmed.split("\n").length > 5;

  let type: ContentType = "text";
  if (isURL) type = "url";
  else if (isFilePath) type = "filepath";
  else if (isJSONContent) type = "json";
  else if (isCode) type = "code";
  else if (isMarkdownContent) type = "markdown";

  return {
    type,
    language,
    isCode,
    isMarkdown: isMarkdownContent,
    isJSON: isJSONContent,
    isURL,
    isFilePath,
  };
}

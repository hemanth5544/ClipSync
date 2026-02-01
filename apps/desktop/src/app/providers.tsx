"use client";

import { ThemeProvider } from "next-themes";
import { ClipboardProvider } from "@/contexts/ClipboardContext";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <ClipboardProvider>
        {children}
      </ClipboardProvider>
    </ThemeProvider>
  );
}

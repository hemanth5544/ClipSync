"use client";

import React, { createContext, useContext } from "react";
import { useClipboard } from "@/hooks/useClipboard";

type ClipboardContextValue = {
  saveFromClipboard: () => Promise<boolean>;
  isWeb: boolean;
};

const ClipboardContext = createContext<ClipboardContextValue | null>(null);

export function ClipboardProvider({ children }: { children: React.ReactNode }) {
  const { saveFromClipboard, isWeb } = useClipboard();
  return (
    <ClipboardContext.Provider value={{ saveFromClipboard, isWeb }}>
      {children}
    </ClipboardContext.Provider>
  );
}

export function useClipboardContext() {
  const ctx = useContext(ClipboardContext);
  return ctx ?? { saveFromClipboard: async () => false, isWeb: false };
}

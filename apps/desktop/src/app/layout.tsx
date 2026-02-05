import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "@clipsync/ui";
import { Providers } from "./providers";
import ClipboardBannerWhenAuthenticated from "@/components/ClipboardBannerWhenAuthenticated";

export const metadata: Metadata = {
  title: "ClipSync - Clipboard Manager",
  description: "Cross-platform clipboard manager with sync",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <Providers>
          <ClipboardBannerWhenAuthenticated />
          {children}
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}

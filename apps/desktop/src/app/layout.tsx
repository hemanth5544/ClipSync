import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@clipsync/ui";
import { Providers } from "./providers";
import ClipboardPermissionBanner from "@/components/ClipboardPermissionBanner";

const inter = Inter({ subsets: ["latin"] });

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
      <body className={inter.className}>
        <Providers>
          <ClipboardPermissionBanner />
          {children}
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}

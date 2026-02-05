"use client";

import { useSession } from "@/lib/better-auth";
import ClipboardPermissionBanner from "./ClipboardPermissionBanner";

/**
 * Only show the clipboard permission banner when the user is logged in.
 * This avoids asking for clipboard access on the very first visit (e.g. login/signup pages).
 */
export default function ClipboardBannerWhenAuthenticated() {
  const { data: session, isPending } = useSession();

  if (isPending || !session) return null;

  return <ClipboardPermissionBanner />;
}

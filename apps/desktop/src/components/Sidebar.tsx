"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useSession, signOut } from "@/lib/better-auth";
import { Button } from "@clipsync/ui";
import { Avatar, AvatarFallback, AvatarImage } from "@clipsync/ui";
import { Settings, LogOut, Home, Star, Smartphone, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import Link from "next/link";
import { ThemeToggle } from "./ThemeToggle";
import { api } from "@/lib/api";

const SIDEBAR_COLLAPSED_KEY = "clipsync-sidebar-collapsed";

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session } = useSession();
  const [clipStats, setClipStats] = useState({ total: 0, favorites: 0 });
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(SIDEBAR_COLLAPSED_KEY);
      setCollapsed(stored === "true");
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(collapsed));
    } catch {
      // ignore
    }
  }, [collapsed]);

  useEffect(() => {
    const loadStats = async () => {
      try {
        const [allClipsResponse, favoriteClipsResponse] = await Promise.all([
          api.clips.getAll({ pageSize: 1 }),
          api.clips.getAll({ favorite: true, pageSize: 1 }),
        ]);
        setClipStats({
          total: allClipsResponse.total || 0,
          favorites: favoriteClipsResponse.total || 0,
        });
      } catch (error) {
        console.error("Failed to load clip stats:", error);
      }
    };

    if (session) {
      loadStats();
      // Refresh stats every 30 seconds
      const interval = setInterval(loadStats, 30000);
      return () => clearInterval(interval);
    }
  }, [session]);

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (e) {
      console.warn("Sign out request failed:", e);
    }
    if (typeof window !== "undefined") {
      window.location.href = "/auth/login";
    } else {
      router.push("/auth/login");
    }
  };

  return (
    <div
      className={`${collapsed ? "w-16" : "w-64"} bg-card border-r border-border flex flex-col transition-[width] duration-200 ease-in-out shrink-0`}
    >
      <div className={`border-b border-border flex items-center ${collapsed ? "p-2 justify-center" : "p-3"}`}>
        {collapsed ? (
          <span className="text-lg font-bold" title="ClipSync">C</span>
        ) : (
          <h1 className="text-lg font-bold truncate">ClipSync</h1>
        )}
      </div>
      <nav className={`flex-1 space-y-1 ${collapsed ? "p-2" : "p-4"}`}>
        <Link href="/" title={collapsed ? "All Clips" : undefined}>
          <Button
            variant={pathname === "/" ? "secondary" : "ghost"}
            className={`w-full ${collapsed ? "justify-center p-2" : "justify-start"}`}
          >
            <Home className={collapsed ? "h-4 w-4" : "mr-2 h-4 w-4"} />
            {!collapsed && (
              <>
                All Clips
                {clipStats.total > 0 && (
                  <span className="ml-auto text-xs text-muted-foreground">
                    {clipStats.total}
                  </span>
                )}
              </>
            )}
          </Button>
        </Link>
        <Link href="/favorites" title={collapsed ? "Favorites" : undefined}>
          <Button
            variant={pathname === "/favorites" ? "secondary" : "ghost"}
            className={`w-full ${collapsed ? "justify-center p-2" : "justify-start"}`}
          >
            <Star className={`${collapsed ? "h-4 w-4" : "mr-2 h-4 w-4"} ${pathname === "/favorites" ? "text-yellow-500 fill-yellow-500" : ""}`} />
            {!collapsed && (
              <>
                Favorites
                {clipStats.favorites > 0 && (
                  <span className="ml-auto text-xs text-muted-foreground">
                    {clipStats.favorites}
                  </span>
                )}
              </>
            )}
          </Button>
        </Link>
        <Link href="/devices" title={collapsed ? "Devices" : undefined}>
          <Button
            variant={pathname === "/devices" ? "secondary" : "ghost"}
            className={`w-full ${collapsed ? "justify-center p-2" : "justify-start"}`}
          >
            <Smartphone className={collapsed ? "h-4 w-4" : "mr-2 h-4 w-4"} />
            {!collapsed && "Devices"}
          </Button>
        </Link>
        <ThemeToggle collapsed={collapsed} />
        <Link href="/settings" title={collapsed ? "Settings" : undefined}>
          <Button
            variant={pathname === "/settings" ? "secondary" : "ghost"}
            className={`w-full ${collapsed ? "justify-center p-2" : "justify-start"}`}
          >
            <Settings className={collapsed ? "h-4 w-4" : "mr-2 h-4 w-4"} />
            {!collapsed && "Settings"}
          </Button>
        </Link>
        <div className={collapsed ? "pt-2" : "pt-4"}>
          <Button
            variant="ghost"
            size={collapsed ? "icon" : "default"}
            className={`w-full ${collapsed ? "justify-center p-2" : "justify-start"}`}
            onClick={() => setCollapsed((c) => !c)}
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? (
              <PanelLeftOpen className="h-4 w-4" />
            ) : (
              <>
                <PanelLeftClose className="mr-2 h-4 w-4" />
                Collapse
              </>
            )}
          </Button>
        </div>
      </nav>
      {session?.user && (
        <div className={`border-t border-border ${collapsed ? "p-2" : "p-4"}`}>
          {collapsed ? (
            <div className="flex flex-col items-center gap-2">
              <Avatar className="h-8 w-8" title={session.user.name || session.user.email || "User"}>
                <AvatarImage src={session.user.image || undefined} />
                <AvatarFallback className="text-xs">
                  {session.user.name?.charAt(0).toUpperCase() || "U"}
                </AvatarFallback>
              </Avatar>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 hover:text-red-500 hover:bg-red-500/10"
                onClick={handleSignOut}
                title="Sign out"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-3 mb-3">
                <Avatar>
                  <AvatarImage src={session.user.image || undefined} />
                  <AvatarFallback>
                    {session.user.name?.charAt(0).toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {session.user.name || "User"}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {session.user.email}
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                className="w-full justify-start hover:text-red-500 hover:bg-red-500/10"
                onClick={handleSignOut}
              >
                <LogOut className="mr-2 h-4 w-4" />
                Sign Out
              </Button>
            </>
          )}
        </div>
      )}
    </div>
  );
}

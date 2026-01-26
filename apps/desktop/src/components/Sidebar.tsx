"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useSession, signOut } from "@/lib/better-auth";
import { Button } from "@clipsync/ui";
import { Avatar, AvatarFallback, AvatarImage } from "@clipsync/ui";
import { Settings, LogOut, Home, Star, Smartphone } from "lucide-react";
import Link from "next/link";
import { ThemeToggle } from "./ThemeToggle";
import { api } from "@/lib/api";

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session } = useSession();
  const [clipStats, setClipStats] = useState({ total: 0, favorites: 0 });

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
    await signOut();
    router.push("/auth/login");
  };

  return (
    <div className="w-64 bg-card border-r border-border flex flex-col">
      <div className="p-6 border-b border-border flex items-center justify-between">
        <h1 className="text-2xl font-bold">ClipSync</h1>
        <ThemeToggle />
      </div>
      <nav className="flex-1 p-4 space-y-2">
        <Link href="/">
          <Button
            variant={pathname === "/" ? "secondary" : "ghost"}
            className="w-full justify-start"
          >
            <Home className="mr-2 h-4 w-4" />
            All Clips
            {clipStats.total > 0 && (
              <span className="ml-auto text-xs text-muted-foreground">
                {clipStats.total}
              </span>
            )}
          </Button>
        </Link>
        <Link href="/favorites">
          <Button
            variant={pathname === "/favorites" ? "secondary" : "ghost"}
            className="w-full justify-start"
          >
            <Star className={`mr-2 h-4 w-4 ${pathname === "/favorites" ? "text-yellow-500 fill-yellow-500" : ""}`} />
            Favorites
            {clipStats.favorites > 0 && (
              <span className="ml-auto text-xs text-muted-foreground">
                {clipStats.favorites}
              </span>
            )}
          </Button>
        </Link>
        <Link href="/devices">
          <Button
            variant={pathname === "/devices" ? "secondary" : "ghost"}
            className="w-full justify-start"
          >
            <Smartphone className="mr-2 h-4 w-4" />
            Devices
          </Button>
        </Link>
        <Link href="/settings">
          <Button
            variant={pathname === "/settings" ? "secondary" : "ghost"}
            className="w-full justify-start"
          >
            <Settings className="mr-2 h-4 w-4" />
            Settings
          </Button>
        </Link>
      </nav>
      {session?.user && (
        <div className="p-4 border-t border-border">
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
        </div>
      )}
    </div>
  );
}

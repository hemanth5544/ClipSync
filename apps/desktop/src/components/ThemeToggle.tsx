"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@clipsync/ui";
import { useEffect, useState } from "react";

interface ThemeToggleProps {
  collapsed?: boolean;
}

export function ThemeToggle({ collapsed = false }: ThemeToggleProps) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = theme === "dark";
  const toggle = () => setTheme(isDark ? "light" : "dark");

  if (!mounted) {
    return (
      <Button variant="ghost" className={`w-full ${collapsed ? "justify-center p-2" : "justify-start"}`} disabled>
        <Sun className={collapsed ? "h-4 w-4" : "mr-2 h-4 w-4"} />
        {!collapsed && "Theme"}
      </Button>
    );
  }

  const Icon = isDark ? Moon : Sun;

  return (
    <Button
      variant="ghost"
      className={`w-full ${collapsed ? "justify-center p-2" : "justify-start"}`}
      onClick={toggle}
      title={isDark ? "Click for light" : "Click for dark"}
    >
      <Icon className={collapsed ? "h-4 w-4" : "mr-2 h-4 w-4"} />
      {!collapsed && "Theme"}
    </Button>
  );
}

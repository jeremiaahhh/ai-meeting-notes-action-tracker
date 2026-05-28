"use client";

import { Moon, Sparkles, Sun } from "lucide-react";
import Link from "next/link";
import { useTheme } from "next-themes";
import * as React from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useHealth } from "@/hooks/use-health";
import { cn } from "@/lib/utils";

export function TopNav() {
  const { health, isLoading, isError } = useHealth();
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);

  const provider = health?.provider ?? "—";
  const statusColor = isError
    ? "bg-destructive"
    : isLoading
      ? "bg-muted-foreground"
      : "bg-success";
  const statusLabel = isError ? "Backend offline" : isLoading ? "Connecting…" : "Backend online";

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-4 border-b bg-background/80 px-6 backdrop-blur">
      <Link href="/" className="md:hidden flex items-center gap-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <Sparkles className="h-5 w-5" />
        </div>
        <span className="font-semibold">Meeting Notes</span>
      </Link>

      <div className="ml-auto flex items-center gap-3">
        <Badge variant="outline" className="hidden sm:inline-flex items-center gap-2">
          <span className={cn("h-2 w-2 rounded-full", statusColor)} />
          {statusLabel}
        </Badge>
        <Badge variant={health?.mock_mode ? "warning" : "success"} className="hidden md:inline-flex">
          <Sparkles className="h-3 w-3" />
          {health?.mock_mode ? "Mock AI" : `Live · ${provider}`}
        </Badge>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
          aria-label="Toggle theme"
        >
          {mounted ? (
            resolvedTheme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />
          ) : (
            <Sun className="h-4 w-4" />
          )}
        </Button>
      </div>
    </header>
  );
}

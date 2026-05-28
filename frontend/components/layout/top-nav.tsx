"use client";

import { Moon, Sun } from "lucide-react";
import Image from "next/image";
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
        <Image
          src="/logo.png"
          alt="Meeting Notes"
          width={36}
          height={36}
          className="h-9 w-9 rounded-lg shadow-sm ring-1 ring-border"
        />
        <span className="font-semibold">Meeting Notes</span>
      </Link>

      <div className="ml-auto flex items-center gap-3">
        <Badge variant="outline" className="hidden sm:inline-flex items-center gap-2">
          <span className={cn("h-2 w-2 rounded-full", statusColor)} />
          {statusLabel}
        </Badge>
        <Badge variant={health?.mock_mode ? "warning" : "success"} className="hidden md:inline-flex items-center gap-1.5">
          <span
            className={cn(
              "h-1.5 w-1.5 rounded-full",
              health?.mock_mode ? "bg-amber-500" : "bg-emerald-500",
            )}
          />
          {health?.mock_mode ? "Mock mode" : `Live · ${provider}`}
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

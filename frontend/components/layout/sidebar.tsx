"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CheckSquare,
  FilePlus2,
  LayoutDashboard,
  ListChecks,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

const nav = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/meetings", label: "Meetings", icon: ListChecks },
  { href: "/meetings/new", label: "New meeting", icon: FilePlus2 },
  { href: "/action-items", label: "Action items", icon: CheckSquare },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex md:w-64 shrink-0 flex-col border-r bg-card/40">
      <div className="flex h-16 items-center gap-2.5 border-b px-5">
        <Image
          src="/logo.png"
          alt="Meeting Notes logo"
          width={36}
          height={36}
          priority
          className="h-9 w-9 rounded-lg shadow-sm ring-1 ring-border"
        />
        <div className="flex flex-col leading-tight">
          <span className="text-sm font-semibold">Meeting Notes</span>
          <span className="text-[11px] text-muted-foreground">
            Action tracker
          </span>
        </div>
      </div>

      <nav className="flex-1 space-y-1 p-3">
        {nav.map((item) => {
          const Icon = item.icon;
          const isActive =
            item.href === "/"
              ? pathname === "/"
              : pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "group flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span className="truncate">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="border-t p-4 text-xs text-muted-foreground space-y-2">
        <div className="flex items-center justify-between">
          <span className="font-medium text-foreground">Tip</span>
          <Badge variant="outline" className="text-[10px]">
            v1.0
          </Badge>
        </div>
        <p>Paste a transcript and click <span className="font-medium text-foreground">Generate notes</span> to see action items extracted in seconds.</p>
      </div>
    </aside>
  );
}

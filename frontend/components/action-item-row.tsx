"use client";

import { CalendarClock, User } from "lucide-react";
import * as React from "react";
import { toast } from "sonner";

import { ActionItemStatusBadge } from "@/components/status-badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { api, ApiError } from "@/lib/api";
import type { ActionItem, ActionItemStatus } from "@/lib/types";
import { cn, formatShortDate } from "@/lib/utils";

interface Props {
  item: ActionItem;
  onChanged?: (item: ActionItem) => void;
}

const STATUS_OPTIONS: ActionItemStatus[] = ["open", "in_progress", "completed"];
const STATUS_LABEL: Record<ActionItemStatus, string> = {
  open: "Open",
  in_progress: "In progress",
  completed: "Completed",
};

export function ActionItemRow({ item, onChanged }: Props) {
  const [pending, setPending] = React.useState(false);
  const completed = item.status === "completed";

  async function setStatus(status: ActionItemStatus) {
    setPending(true);
    try {
      const updated = await api.updateActionItem(item.id, { status });
      onChanged?.(updated);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to update action item");
    } finally {
      setPending(false);
    }
  }

  return (
    <li className="group flex items-start gap-3 rounded-xl border bg-card/60 p-4 transition-colors hover:bg-accent/40">
      <Checkbox
        checked={completed}
        disabled={pending}
        onCheckedChange={(value) => setStatus(value ? "completed" : "open")}
        className="mt-0.5"
      />
      <div className="min-w-0 flex-1 space-y-2">
        <p className={cn("text-sm leading-snug", completed && "text-muted-foreground line-through")}>{item.description}</p>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs text-muted-foreground">
          <ActionItemStatusBadge status={item.status} />
          {item.owner ? (
            <span className="inline-flex items-center gap-1.5">
              <User className="h-3 w-3" />
              {item.owner}
            </span>
          ) : null}
          {item.due_date ? (
            <span className="inline-flex items-center gap-1.5">
              <CalendarClock className="h-3 w-3" />
              {formatShortDate(item.due_date)}
            </span>
          ) : null}
        </div>
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="text-xs" disabled={pending}>
            Status
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Set status</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {STATUS_OPTIONS.map((s) => (
            <DropdownMenuItem key={s} onSelect={() => setStatus(s)}>
              {STATUS_LABEL[s]}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </li>
  );
}

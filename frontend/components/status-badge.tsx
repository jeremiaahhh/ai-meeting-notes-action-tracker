import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { ActionItemStatus, MeetingStatus } from "@/lib/types";
import { CheckCircle2, CircleDashed, Clock, Loader2, XCircle } from "lucide-react";

const meetingMap: Record<MeetingStatus, { label: string; variant: any; icon: any }> = {
  draft: { label: "Draft", variant: "muted", icon: CircleDashed },
  processing: { label: "Processing", variant: "default", icon: Loader2 },
  ready: { label: "Ready", variant: "success", icon: CheckCircle2 },
  failed: { label: "Failed", variant: "destructive", icon: XCircle },
};

const actionMap: Record<ActionItemStatus, { label: string; variant: any; icon: any }> = {
  open: { label: "Open", variant: "muted", icon: Clock },
  in_progress: { label: "In progress", variant: "warning", icon: Loader2 },
  completed: { label: "Completed", variant: "success", icon: CheckCircle2 },
};

export function MeetingStatusBadge({ status, className }: { status: MeetingStatus; className?: string }) {
  const info = meetingMap[status];
  const Icon = info.icon;
  return (
    <Badge variant={info.variant} className={cn("text-xs px-2 py-0.5", className)}>
      <Icon className={cn("h-3 w-3", status === "processing" && "animate-spin")} />
      {info.label}
    </Badge>
  );
}

export function ActionItemStatusBadge({
  status,
  className,
}: {
  status: ActionItemStatus;
  className?: string;
}) {
  const info = actionMap[status];
  const Icon = info.icon;
  return (
    <Badge variant={info.variant} className={cn("text-[10px] px-1.5 py-0.5 uppercase tracking-wide", className)}>
      <Icon className={cn("h-3 w-3", status === "in_progress" && "animate-spin")} />
      {info.label}
    </Badge>
  );
}

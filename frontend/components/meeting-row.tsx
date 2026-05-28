import Link from "next/link";
import { ArrowUpRight, Calendar, ListChecks, Users } from "lucide-react";

import { MeetingStatusBadge } from "@/components/status-badge";
import { Badge } from "@/components/ui/badge";
import type { MeetingSummary } from "@/lib/types";
import { formatDate, formatRelative } from "@/lib/utils";

export function MeetingRow({ meeting }: { meeting: MeetingSummary }) {
  return (
    <Link
      href={`/meetings/${meeting.id}`}
      className="group flex flex-col gap-3 rounded-xl border bg-card p-5 transition-colors hover:border-primary/40 hover:bg-accent/40 sm:flex-row sm:items-center sm:justify-between"
    >
      <div className="min-w-0 space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <MeetingStatusBadge status={meeting.status} />
          {meeting.has_notes ? (
            <Badge variant="outline" className="text-[10px] uppercase tracking-wide">
              Notes ready
            </Badge>
          ) : null}
        </div>
        <p className="truncate text-base font-semibold tracking-tight group-hover:text-primary">
          {meeting.title}
        </p>
        <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5" />
            {meeting.meeting_date ? formatDate(meeting.meeting_date) : `created ${formatRelative(meeting.created_at)}`}
          </span>
          {meeting.participants ? (
            <span className="inline-flex items-center gap-1.5 truncate">
              <Users className="h-3.5 w-3.5" />
              {meeting.participants}
            </span>
          ) : null}
          <span className="inline-flex items-center gap-1.5">
            <ListChecks className="h-3.5 w-3.5" />
            {meeting.open_action_item_count} open / {meeting.action_item_count} total
          </span>
        </div>
      </div>
      <ArrowUpRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-primary" />
    </Link>
  );
}

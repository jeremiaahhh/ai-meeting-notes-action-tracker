"use client";

import Link from "next/link";
import useSWR from "swr";
import { CheckSquare, ListChecks } from "lucide-react";

import { ActionItemRow } from "@/components/action-item-row";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/lib/api";
import type { Meeting, MeetingSummary } from "@/lib/types";

async function fetchMeetingsWithItems(): Promise<Meeting[]> {
  const summaries: MeetingSummary[] = await api.listMeetings();
  const withActions = summaries.filter((m) => m.action_item_count > 0).slice(0, 25);
  return Promise.all(withActions.map((m) => api.getMeeting(m.id)));
}

export default function ActionItemsPage() {
  const { data, error, isLoading, mutate } = useSWR<Meeting[]>("action-items", fetchMeetingsWithItems);
  const meetings = data ?? [];

  const totalActions = meetings.reduce((s, m) => s + m.action_items.length, 0);
  const openActions = meetings.reduce(
    (s, m) => s + m.action_items.filter((a) => a.status !== "completed").length,
    0,
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Action items"
        description="Every follow-up across your meetings, grouped by source. Tick them off as work progresses."
        action={
          <div className="flex gap-2">
            <Badge variant="muted">{openActions} open</Badge>
            <Badge variant="success">{totalActions - openActions} completed</Badge>
          </div>
        }
      />

      {error ? (
        <EmptyState
          icon={ListChecks}
          title="Could not load action items"
          description="Check that the backend is running and refresh."
        />
      ) : isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-40 w-full rounded-xl" />
          ))}
        </div>
      ) : meetings.length === 0 ? (
        <EmptyState
          icon={CheckSquare}
          title="No action items yet"
          description="Generate notes from a meeting transcript to populate this view."
        />
      ) : (
        <div className="space-y-6">
          {meetings.map((meeting) => (
            <Card key={meeting.id}>
              <CardHeader>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <Link href={`/meetings/${meeting.id}`} className="hover:underline">
                    <CardTitle>{meeting.title}</CardTitle>
                  </Link>
                  <Badge variant="outline" className="text-[10px] uppercase">
                    {meeting.action_items.filter((a) => a.status !== "completed").length} open
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {meeting.action_items.map((item) => (
                    <ActionItemRow
                      key={item.id}
                      item={item}
                      onChanged={(updated) =>
                        mutate(
                          (current) =>
                            current?.map((m) =>
                              m.id === meeting.id
                                ? {
                                    ...m,
                                    action_items: m.action_items.map((ai) =>
                                      ai.id === updated.id ? updated : ai,
                                    ),
                                  }
                                : m,
                            ) ?? current,
                          { revalidate: false },
                        )
                      }
                    />
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

"use client";

import Link from "next/link";
import * as React from "react";
import useSWR from "swr";
import { FilePlus2, ListChecks, Search } from "lucide-react";

import { EmptyState } from "@/components/empty-state";
import { MeetingRow } from "@/components/meeting-row";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/lib/api";
import type { MeetingSummary } from "@/lib/types";

export default function MeetingsListPage() {
  const [search, setSearch] = React.useState("");
  const [debounced, setDebounced] = React.useState("");

  React.useEffect(() => {
    const id = setTimeout(() => setDebounced(search.trim()), 250);
    return () => clearTimeout(id);
  }, [search]);

  const { data, error, isLoading } = useSWR<MeetingSummary[]>(
    ["meetings", debounced],
    () => api.listMeetings(debounced || undefined),
  );
  const meetings = data ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Meetings"
        description="All meetings in this workspace. Search by title, participants, or transcript."
        action={
          <Button asChild>
            <Link href="/meetings/new">
              <FilePlus2 className="h-4 w-4" />
              New meeting
            </Link>
          </Button>
        }
      />

      <div className="flex items-center gap-3">
        <div className="relative max-w-md flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search meetings…"
            className="pl-9"
          />
        </div>
        <p className="text-xs text-muted-foreground">
          {isLoading ? "Loading…" : `${meetings.length} result${meetings.length === 1 ? "" : "s"}`}
        </p>
      </div>

      <div className="space-y-3">
        {error ? (
          <EmptyState
            icon={ListChecks}
            title="Could not load meetings"
            description="Check that the backend is running and refresh."
          />
        ) : isLoading ? (
          Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-[96px] w-full rounded-xl" />)
        ) : meetings.length === 0 ? (
          <EmptyState
            icon={ListChecks}
            title={debounced ? "No meetings match your search" : "No meetings yet"}
            description={
              debounced
                ? "Try a different keyword or clear the search."
                : "Create your first meeting to get started."
            }
            action={
              !debounced ? (
                <Button asChild>
                  <Link href="/meetings/new">
                    <FilePlus2 className="h-4 w-4" />
                    Create meeting
                  </Link>
                </Button>
              ) : undefined
            }
          />
        ) : (
          meetings.map((m) => <MeetingRow key={m.id} meeting={m} />)
        )}
      </div>
    </div>
  );
}

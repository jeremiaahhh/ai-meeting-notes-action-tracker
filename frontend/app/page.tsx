"use client";

import Link from "next/link";
import useSWR from "swr";
import {
  ArrowRight,
  CalendarCheck2,
  CheckCircle2,
  FilePlus2,
  HelpCircle,
  ListChecks,
  Sparkles,
} from "lucide-react";

import { EmptyState } from "@/components/empty-state";
import { KpiCard } from "@/components/kpi-card";
import { MeetingRow } from "@/components/meeting-row";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/lib/api";
import type { MeetingSummary } from "@/lib/types";

export default function DashboardPage() {
  const { data, error, isLoading } = useSWR<MeetingSummary[]>("meetings", () => api.listMeetings());
  const meetings = data ?? [];
  const total = meetings.length;
  const totalActions = meetings.reduce((s, m) => s + m.action_item_count, 0);
  const openActions = meetings.reduce((s, m) => s + m.open_action_item_count, 0);
  const completedActions = totalActions - openActions;
  const notesReady = meetings.filter((m) => m.has_notes).length;

  const recent = meetings.slice(0, 5);

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Workspace overview"
        title="Meeting notes & action items"
        description="Paste a transcript, generate structured notes, and keep follow-ups moving — all in one place."
        action={
          <Button asChild>
            <Link href="/meetings/new">
              <FilePlus2 className="h-4 w-4" />
              New meeting
            </Link>
          </Button>
        }
      />

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-[112px] w-full rounded-xl" />)
        ) : (
          <>
            <KpiCard label="Total meetings" value={total} icon={CalendarCheck2} tone="default" />
            <KpiCard
              label="Open action items"
              value={openActions}
              hint={`${notesReady} meeting${notesReady === 1 ? "" : "s"} with notes`}
              icon={ListChecks}
              tone="warning"
            />
            <KpiCard
              label="Completed actions"
              value={completedActions}
              icon={CheckCircle2}
              tone="success"
            />
            <KpiCard
              label="Notes generated"
              value={notesReady}
              hint={total > 0 ? `${Math.round((notesReady / total) * 100)}% of meetings` : "—"}
              icon={Sparkles}
              tone="default"
            />
          </>
        )}
      </section>

      <section className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Recent meetings</CardTitle>
              <p className="text-xs text-muted-foreground">
                Quick view of the latest discussions and their status.
              </p>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/meetings">
                View all <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {error ? (
              <EmptyState
                icon={HelpCircle}
                title="Could not reach the backend"
                description="Start the FastAPI server, then refresh this page."
              />
            ) : isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-[88px] w-full rounded-xl" />
                ))}
              </div>
            ) : recent.length === 0 ? (
              <EmptyState
                icon={CalendarCheck2}
                title="No meetings yet"
                description="Create your first meeting and paste a transcript to generate notes in seconds."
                action={
                  <Button asChild>
                    <Link href="/meetings/new">
                      <FilePlus2 className="h-4 w-4" />
                      Create meeting
                    </Link>
                  </Button>
                }
              />
            ) : (
              recent.map((m) => <MeetingRow key={m.id} meeting={m} />)
            )}
          </CardContent>
        </Card>

        <Card className="self-start">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              <CardTitle>How it works</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <StepRow num={1} title="Create a meeting" body="Add a title and the participants who joined." />
            <StepRow num={2} title="Paste the transcript" body="Use any chat-style or speaker-labeled transcript." />
            <StepRow num={3} title="Generate notes" body="The AI extracts decisions, action items, owners, and dates." />
            <StepRow num={4} title="Track follow-ups" body="Tick items as you complete them and export to Markdown." />
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

function StepRow({ num, title, body }: { num: number; title: string; body: string }) {
  return (
    <div className="flex gap-3">
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
        {num}
      </div>
      <div>
        <p className="font-medium leading-tight">{title}</p>
        <p className="text-xs text-muted-foreground">{body}</p>
      </div>
    </div>
  );
}

"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import * as React from "react";
import { toast } from "sonner";
import useSWR from "swr";
import {
  AlertCircle,
  ArrowLeft,
  Calendar,
  CheckSquare,
  Download,
  Loader2,
  RefreshCw,
  Sparkles,
  Users,
} from "lucide-react";

import { ActionItemRow } from "@/components/action-item-row";
import { DeleteMeetingDialog } from "@/components/delete-meeting-dialog";
import { EmptyState } from "@/components/empty-state";
import { NotesPanel } from "@/components/notes-panel";
import { PageHeader } from "@/components/page-header";
import { MeetingStatusBadge } from "@/components/status-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { api, ApiError } from "@/lib/api";
import type { ActionItem, Meeting } from "@/lib/types";
import { formatDate, formatRelative } from "@/lib/utils";

export default function MeetingDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = params.id;

  const { data, error, isLoading, mutate } = useSWR<Meeting>(
    id ? ["meeting", id] : null,
    () => api.getMeeting(id),
  );
  const [generating, setGenerating] = React.useState(false);
  const [exporting, setExporting] = React.useState(false);

  async function handleGenerate() {
    if (!data) return;
    setGenerating(true);
    try {
      const updated = await api.generateNotes(data.id);
      await mutate(updated, { revalidate: false });
      toast.success(data.notes ? "Notes regenerated" : "AI notes generated");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to generate notes");
    } finally {
      setGenerating(false);
    }
  }

  async function handleExport() {
    if (!data) return;
    setExporting(true);
    try {
      const { filename, markdown } = await api.exportMarkdown(data.id);
      const blob = new Blob([markdown], { type: "text/markdown;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Markdown downloaded");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to export");
    } finally {
      setExporting(false);
    }
  }

  function handleActionItemChange(updated: ActionItem) {
    if (!data) return;
    void mutate(
      {
        ...data,
        action_items: data.action_items.map((ai) => (ai.id === updated.id ? updated : ai)),
      },
      { revalidate: false },
    );
  }

  if (error && !data) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
        <EmptyState
          icon={AlertCircle}
          title="Meeting not found"
          description="It may have been deleted, or the backend is unreachable."
        />
      </div>
    );
  }

  if (isLoading || !data) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid gap-6 lg:grid-cols-3">
          <Skeleton className="h-64 lg:col-span-2 rounded-xl" />
          <Skeleton className="h-64 rounded-xl" />
        </div>
      </div>
    );
  }

  const completed = data.action_items.filter((a) => a.status === "completed").length;

  return (
    <div className="space-y-6">
      <Button variant="ghost" size="sm" asChild>
        <Link href="/meetings">
          <ArrowLeft className="h-4 w-4" />
          All meetings
        </Link>
      </Button>

      <PageHeader
        eyebrow={`Updated ${formatRelative(data.updated_at)}`}
        title={data.title}
        description={data.participants ?? undefined}
        action={
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" onClick={handleExport} disabled={exporting || !data.notes}>
              {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
              Export Markdown
            </Button>
            <Button onClick={handleGenerate} disabled={generating || !data.transcript.trim()}>
              {generating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : data.notes ? (
                <RefreshCw className="h-4 w-4" />
              ) : (
                <Sparkles className="h-4 w-4" />
              )}
              {data.notes ? "Regenerate notes" : "Generate notes"}
            </Button>
          </div>
        }
      />

      <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
        <MeetingStatusBadge status={data.status} />
        {data.meeting_date ? (
          <span className="inline-flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5" /> {formatDate(data.meeting_date)}
          </span>
        ) : null}
        {data.participants ? (
          <span className="inline-flex items-center gap-1.5">
            <Users className="h-3.5 w-3.5" /> {data.participants}
          </span>
        ) : null}
        <span className="inline-flex items-center gap-1.5">
          <CheckSquare className="h-3.5 w-3.5" />
          {completed}/{data.action_items.length} action items completed
        </span>
        {data.error_message ? (
          <Badge variant="destructive" className="ml-auto">
            {data.error_message}
          </Badge>
        ) : null}
        <div className="ml-auto">
          <DeleteMeetingDialog meetingId={data.id} title={data.title} />
        </div>
      </div>

      <Tabs defaultValue="notes" className="space-y-4">
        <TabsList>
          <TabsTrigger value="notes">AI notes</TabsTrigger>
          <TabsTrigger value="actions">Action items ({data.action_items.length})</TabsTrigger>
          <TabsTrigger value="transcript">Transcript</TabsTrigger>
        </TabsList>

        <TabsContent value="notes" className="space-y-6">
          <NotesPanel meeting={data} />
        </TabsContent>

        <TabsContent value="actions" className="space-y-3">
          {data.action_items.length === 0 ? (
            <EmptyState
              icon={CheckSquare}
              title="No action items yet"
              description="Generate AI notes to extract action items from the transcript."
            />
          ) : (
            <ul className="space-y-3">
              {data.action_items.map((item) => (
                <ActionItemRow key={item.id} item={item} onChanged={handleActionItemChange} />
              ))}
            </ul>
          )}
        </TabsContent>

        <TabsContent value="transcript">
          <Card>
            <CardHeader>
              <CardTitle>Transcript</CardTitle>
            </CardHeader>
            <CardContent>
              {data.transcript ? (
                <pre className="whitespace-pre-wrap break-words rounded-lg bg-muted/50 p-4 text-xs leading-relaxed">
                  {data.transcript}
                </pre>
              ) : (
                <p className="text-sm text-muted-foreground">No transcript captured yet.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

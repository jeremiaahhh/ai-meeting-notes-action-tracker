"use client";

import { useRouter } from "next/navigation";
import * as React from "react";
import { toast } from "sonner";
import { ArrowLeft, FilePlus2, FileText, Loader2 } from "lucide-react";

import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { api, ApiError } from "@/lib/api";

const SAMPLE_TRANSCRIPT = `Anna: Welcome everyone. Today we need to finalize the Q3 launch plan for the new billing dashboard.
Marc: We decided to ship the new dashboard on July 15. Marketing will prepare the launch post by Friday.
Anna: Action item: Marc will draft the launch announcement by next Monday.
Sam: We still don't know how we want to handle EU pricing for the enterprise tier.
Anna: We agreed to keep the legacy export endpoint until Q4.
Marc: Owner: Sam will investigate the EU pricing question and report back by Friday.
Anna: Action item: Anna will schedule a follow-up review for next Wednesday.`;

export default function NewMeetingPage() {
  const router = useRouter();
  const [title, setTitle] = React.useState("");
  const [participants, setParticipants] = React.useState("");
  const [transcript, setTranscript] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);
  const [generateAfter, setGenerateAfter] = React.useState(true);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) {
      toast.error("Title is required");
      return;
    }
    setSubmitting(true);
    try {
      const meeting = await api.createMeeting({
        title: title.trim(),
        participants: participants.trim() || null,
        transcript,
      });
      toast.success("Meeting created");

      if (generateAfter && transcript.trim()) {
        try {
          await api.generateNotes(meeting.id);
          toast.success("AI notes generated");
        } catch (err) {
          toast.error(err instanceof ApiError ? err.message : "Failed to generate notes");
        }
      }

      router.push(`/meetings/${meeting.id}`);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to create meeting");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="New meeting"
        title="Capture a meeting"
        description="Paste your transcript below — we'll extract the summary, decisions, action items, and open questions."
        action={
          <Button variant="ghost" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
        }
      />

      <form onSubmit={handleSubmit} className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Transcript</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="title">Meeting title</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Q3 Launch Planning"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="participants">Participants</Label>
                <Input
                  id="participants"
                  value={participants}
                  onChange={(e) => setParticipants(e.target.value)}
                  placeholder="Anna, Marc, Sam"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="transcript">Transcript</Label>
              <Textarea
                id="transcript"
                value={transcript}
                onChange={(e) => setTranscript(e.target.value)}
                placeholder="Paste your meeting transcript here. Speaker-labeled or chat-style both work."
                className="min-h-[360px] text-xs leading-relaxed"
              />
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{transcript.length.toLocaleString()} characters</span>
                <Button
                  type="button"
                  variant="link"
                  size="sm"
                  className="h-auto px-0"
                  onClick={() => setTranscript(SAMPLE_TRANSCRIPT)}
                >
                  Use sample transcript
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="self-start">
          <CardHeader>
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-primary" />
              <CardTitle>Auto-generated summary</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              We'll extract structured notes the moment you save. You can re-run the analysis any time.
            </p>
            <label className="flex items-start gap-2 text-sm">
              <input
                type="checkbox"
                checked={generateAfter}
                onChange={(e) => setGenerateAfter(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-input"
              />
              <span>
                <span className="font-medium">Generate notes after saving</span>
                <span className="block text-xs text-muted-foreground">
                  Requires a non-empty transcript.
                </span>
              </span>
            </label>

            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <FilePlus2 className="h-4 w-4" />}
              {submitting ? "Saving…" : "Create meeting"}
            </Button>
            <p className="text-xs text-muted-foreground">
              Tip: speaker labels like <span className="font-mono">Anna:</span> help the model attribute action items
              to owners.
            </p>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}

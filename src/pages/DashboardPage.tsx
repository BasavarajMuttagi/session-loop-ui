import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router";
import { useUser } from "@clerk/react";
import {
  AlertCircle,
  RotateCcw,
  FileText,
  Play,
  Plus,
  RefreshCw,
  Mic,
  Calendar
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { listInterviews, retryInterview } from "../lib/api";
import type { InterviewAttemptRecord } from "../types/interview";

export function DashboardPage() {
  const { user, isLoaded } = useUser();
  const navigate = useNavigate();
  const [interviews, setInterviews] = useState<InterviewAttemptRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [retryingId, setRetryingId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function loadData() {
    if (!user) return;
    try {
      setLoading(true);
      setErrorMsg(null);
      const data = await listInterviews(user.id);
      setInterviews(Array.isArray(data) ? data : ((data as any).interviews || []));
    } catch (err: any) {
      console.error("Failed to load dashboard interviews:", err);
      setErrorMsg(err.message || "Failed to load interviews");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (isLoaded && user) {
      loadData();
    }
  }, [isLoaded, user]);

  async function handleRetry(oldRecord: InterviewAttemptRecord) {
    if (!user) return;
    try {
      setRetryingId(oldRecord.id);
      setErrorMsg(null);
      const newSessionId = `sess_${Date.now()}`;
      await retryInterview(oldRecord.id, newSessionId, user.id);
      navigate(`/interview/${newSessionId}`);
    } catch (err: any) {
      console.error("Failed to retry interview:", err);
      setErrorMsg(err.message || "Failed to retry interview");
    } finally {
      setRetryingId(null);
    }
  }

  // Calculate metrics
  const totalInterviews = interviews.length;
  const completedCount = interviews.filter((i) => i.status === "completed").length;
  const inProgressCount = interviews.filter((i) => i.status === "in_progress").length;
  const completionRate = totalInterviews > 0 ? Math.round((completedCount / totalInterviews) * 100) : 0;

  return (
    <div className="container mx-auto max-w-6xl px-4 sm:px-6 py-10 space-y-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-6 border-b border-border">
        <div className="space-y-1">
          <Badge variant="secondary" className="mb-1 font-mono">
            CANDIDATE ARCHIVE
          </Badge>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground">
            Practice Sessions
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Review past mock interviews, replay question transcripts, or retry tracks to build confidence.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={loadData}
            disabled={loading}
            className="text-xs h-9 gap-1.5 font-medium"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>

          <Link to="/create">
            <Button size="sm" className="text-xs h-9 gap-1.5 font-medium">
              <Plus className="h-3.5 w-3.5" />
              New Practice Track
            </Button>
          </Link>
        </div>
      </div>

      {errorMsg && (
        <div className="p-3.5 border border-destructive/30 bg-destructive/10 text-destructive text-xs flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Summary Metrics - Shadcn Card Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card size="sm">
          <CardHeader className="p-4 space-y-1">
            <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
              Total Sessions
            </span>
            <CardTitle className="text-2xl font-bold font-mono text-foreground normal-case">
              {totalInterviews}
            </CardTitle>
          </CardHeader>
        </Card>

        <Card size="sm">
          <CardHeader className="p-4 space-y-1">
            <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
              Completed
            </span>
            <CardTitle className="text-2xl font-bold font-mono text-foreground normal-case">
              {completedCount}
            </CardTitle>
          </CardHeader>
        </Card>

        <Card size="sm">
          <CardHeader className="p-4 space-y-1">
            <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
              In Progress
            </span>
            <CardTitle className="text-2xl font-bold font-mono text-foreground normal-case">
              {inProgressCount}
            </CardTitle>
          </CardHeader>
        </Card>

        <Card size="sm">
          <CardHeader className="p-4 space-y-1">
            <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
              Completion Rate
            </span>
            <CardTitle className="text-2xl font-bold font-mono text-foreground normal-case">
              {completionRate}%
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Sessions List */}
      <div className="space-y-4">
        <Badge variant="secondary" className="font-mono">
          SESSION HISTORY
        </Badge>

        {loading ? (
          <div className="py-16 text-center text-xs text-muted-foreground font-mono">
            Loading session archive...
          </div>
        ) : interviews.length === 0 ? (
          <Card className="border-dashed p-12 text-center space-y-4">
            <div className="mx-auto flex h-10 w-10 items-center justify-center bg-muted text-muted-foreground">
              <Mic className="h-5 w-5" />
            </div>
            <div className="space-y-1 max-w-sm mx-auto">
              <h3 className="text-sm font-bold text-foreground">No interview sessions found</h3>
              <p className="text-xs text-muted-foreground">
                Get started by launching a pre-built track from the homepage or generating a custom track.
              </p>
            </div>
            <Link to="/create">
              <Button size="sm" className="text-xs h-9 gap-1.5 font-medium">
                <Plus className="h-3.5 w-3.5" /> Start Your First Interview
              </Button>
            </Link>
          </Card>
        ) : (
          <Card className="divide-y divide-border overflow-hidden">
            {interviews.map((item) => {
              const isCompleted = item.status === "completed";
              const isRetryingThis = retryingId === item.id;
              const formattedDate = new Date(item.createdAt).toLocaleDateString(undefined, {
                month: "short",
                day: "numeric",
                year: "numeric",
              });

              return (
                <div
                  key={item.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-5 gap-4 hover:bg-muted/30 transition-colors"
                >
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="outline" className="font-mono text-[10px]">
                        Attempt #{item.attemptNumber}
                      </Badge>

                      <Badge
                        variant={isCompleted ? "default" : "secondary"}
                        className="font-mono text-[10px]"
                      >
                        {item.status.replace("_", " ")}
                      </Badge>

                      <span className="inline-flex items-center gap-1 font-mono text-[11px] text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        {formattedDate}
                      </span>
                    </div>

                    <h3 className="text-base font-bold tracking-tight text-foreground truncate">
                      {item.title}
                    </h3>

                    <p className="text-xs text-muted-foreground line-clamp-1">
                      {item.userPrompt}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <Link to={`/interview/${item.id}/report`}>
                      <Button variant="outline" size="sm" className="text-xs h-8 gap-1.5 font-medium">
                        <FileText className="h-3.5 w-3.5" />
                        Review
                      </Button>
                    </Link>

                    {isCompleted ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRetry(item)}
                        disabled={isRetryingThis}
                        className="text-xs h-8 gap-1.5 font-medium"
                      >
                        <RotateCcw className={`h-3.5 w-3.5 ${isRetryingThis ? "animate-spin" : ""}`} />
                        Retry Track
                      </Button>
                    ) : (
                      <Link to={`/interview/${item.id}`}>
                        <Button size="sm" className="text-xs h-8 gap-1.5 font-medium">
                          <Play className="h-3.5 w-3.5 fill-current" />
                          Resume
                        </Button>
                      </Link>
                    )}
                  </div>
                </div>
              );
            })}
          </Card>
        )}
      </div>
    </div>
  );
}

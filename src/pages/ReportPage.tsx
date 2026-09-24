import { Badge } from "@/components/ui/badge";
import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router";
import { useUser, SignInButton } from "@clerk/react";
import {
  RotateCcw,
  ArrowLeft,
  AlertCircle,
  RefreshCw,
  CornerDownRight,
  ListChecks,
  Lock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { getInterviewDetails, retryInterview } from "../lib/api";
import type { InterviewSession } from "../types/interview";

export function ReportPage() {
  const { id } = useParams<{ id: string }>();
  const { user, isLoaded } = useUser();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<InterviewSession | null>(null);
  const [isRetrying, setIsRetrying] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoaded || !id || !user) return;

    let isMounted = true;

    async function loadReport() {
      try {
        setLoading(true);
        setErrorMsg(null);
        const data = await getInterviewDetails(id!, user?.id);
        if (!isMounted) return;

        // Verify candidate ownership
        if (data.record?.candidateId && user?.id && data.record.candidateId !== user.id) {
          setErrorMsg("Access restricted: This interview report belongs to a different candidate account.");
          return;
        }

        setSession(data.liveState?.interview || data.record?.sessionData || null);
      } catch (err: any) {
        console.error("Failed to load interview report:", err);
        if (isMounted) {
          setErrorMsg(err.response?.data?.error || err.message || "Failed to load report");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadReport();

    return () => {
      isMounted = false;
    };
  }, [isLoaded, id, user]);

  async function handleRetry() {
    if (!user || !id) return;
    try {
      setIsRetrying(true);
      const newSessionId = `sess_${Date.now()}`;
      await retryInterview(id, newSessionId, user.id);
      navigate(`/interview/${newSessionId}`);
    } catch (err: any) {
      console.error("Retry failed:", err);
      setErrorMsg(err.message || "Failed to retry interview");
    } finally {
      setIsRetrying(false);
    }
  }

  // Not signed in state
  if (isLoaded && !user) {
    return (
      <div className="container mx-auto max-w-md px-4 py-20 text-center space-y-4">
        <div className="mx-auto flex h-12 w-12 items-center justify-center  bg-muted text-foreground border border-border">
          <Lock className="h-5 w-5" />
        </div>
        <div className="space-y-1">
          <h2 className="text-xl font-bold tracking-tight text-foreground">
            Sign In Required
          </h2>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Interview reports contain candidate transcripts and performance rubrics. Please sign in with your candidate account to access this session.
          </p>
        </div>
        <div className="pt-2">
          <SignInButton mode="modal">
            <Button size="sm" className="text-xs h-9 font-medium px-4">
              Sign In to View Report
            </Button>
          </SignInButton>
        </div>
      </div>
    );
  }

  if (!isLoaded || loading) {
    return (
      <div className="container mx-auto max-w-4xl px-4 py-20 flex flex-col items-center justify-center space-y-3">
        <RefreshCw className="h-6 w-6 animate-spin text-foreground" />
        <p className="text-sm font-bold text-foreground">Loading Evaluation Report...</p>
        <p className="text-xs text-muted-foreground font-mono">Aggregating question scores, transcripts, and rubric feedback...</p>
      </div>
    );
  }

  if (errorMsg || !session) {
    return (
      <div className="container mx-auto max-w-xl px-4 py-16 text-center space-y-4">
        <AlertCircle className="h-8 w-8 text-destructive mx-auto" />
        <h2 className="text-xl font-bold text-foreground">Unable to Display Report</h2>
        <p className="text-xs text-muted-foreground">{errorMsg || "The requested interview report could not be found."}</p>
        <Link to="/dashboard">
          <Button size="sm" variant="outline">
            Back to Archive
          </Button>
        </Link>
      </div>
    );
  }

  // Calculate metrics
  let totalPrompts = 0;
  let answeredCount = 0;
  let skippedCount = 0;

  for (const q of session.questions) {
    totalPrompts++;
    if (q.status === "answered") answeredCount++;
    if (q.status === "skipped") skippedCount++;
    for (const f of q.followUps || []) {
      totalPrompts++;
      if (f.status === "answered") answeredCount++;
      if (f.status === "skipped") skippedCount++;
    }
  }

  const completionPct = totalPrompts > 0 ? Math.round((answeredCount / totalPrompts) * 100) : 0;

  return (
    <div className="container mx-auto max-w-4xl px-4 sm:px-6 py-10 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-border pb-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Link to="/dashboard">
              <Button variant="ghost" size="sm" className="h-8 text-xs gap-1.5 font-medium -ml-2">
                <ArrowLeft className="h-3.5 w-3.5" /> Archive
              </Button>
            </Link>
            <span className="font-mono text-[10px] uppercase font-bold tracking-wider px-2 py-0.5  bg-muted text-foreground border border-border">
              Attempt #{session.attemptNumber}
            </span>
            <span className="font-mono text-[10px] text-muted-foreground">
              REF: {id}
            </span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground">
            {session.title}
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            {session.userPrompt}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            onClick={handleRetry}
            disabled={isRetrying}
            className="text-xs h-9 gap-1.5 font-semibold"
          >
            <RotateCcw className={`h-3.5 w-3.5 ${isRetrying ? "animate-spin" : ""}`} />
            {isRetrying ? "Preparing..." : `Retry Track (Attempt #${session.attemptNumber + 1})`}
          </Button>
        </div>
      </div>

      {/* Metrics Bar - Swiss Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4  border border-border bg-card space-y-1">
          <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
            Main Questions
          </span>
          <div className="text-2xl font-bold font-mono text-foreground">
            {session.questions.length}
          </div>
        </div>

        <div className="p-4  border border-border bg-card space-y-1">
          <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
            Items Answered
          </span>
          <div className="text-2xl font-bold font-mono text-foreground">
            {answeredCount}
          </div>
        </div>

        <div className="p-4  border border-border bg-card space-y-1">
          <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
            Items Skipped
          </span>
          <div className="text-2xl font-bold font-mono text-foreground">
            {skippedCount}
          </div>
        </div>

        <div className="p-4  border border-border bg-card space-y-1">
          <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
            Coverage Rate
          </span>
          <div className="text-2xl font-bold font-mono text-foreground">
            {completionPct}%
          </div>
        </div>
      </div>

      {/* Turn-by-Turn Response Breakdown */}
      <div className="space-y-6">
        <div className="flex items-center justify-between pb-2 border-b border-border">
          <h2 className="text-lg font-bold tracking-tight text-foreground flex items-center gap-2">
            <ListChecks className="h-4 w-4" />
            Turn-by-Turn Response Breakdown
          </h2>
          <span className="font-mono text-[11px] text-muted-foreground">
            {session.questions.length} Questions Evaluated
          </span>
        </div>

        <div className="space-y-6">
          {session.questions.map((q, idx) => (
            <div
              key={q.id}
              className=" border border-border bg-card p-6 space-y-5 shadow-xs"
            >
              {/* Question Header */}
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center gap-2 font-mono text-[10px] uppercase font-bold tracking-wider">
                    <span className="text-muted-foreground">Question {idx + 1}</span>
                    <Badge variant={q.status === "answered" ? "default" : "secondary"}>{q.status || "unanswered"}</Badge>
                  </div>
                  <h3 className="text-base font-bold text-foreground leading-snug">
                    {q.prompt}
                  </h3>
                </div>
              </div>

              {/* Candidate Response Transcript */}
              <div className=" border border-border bg-muted/30 p-4 space-y-1.5">
                <span className="font-mono text-[10px] uppercase font-bold tracking-wider text-muted-foreground">
                  Candidate Spoken Answer
                </span>
                <p className="text-xs text-foreground leading-relaxed whitespace-pre-wrap">
                  {q.answer ? q.answer : <span className="text-muted-foreground italic">(No transcript recorded / skipped)</span>}
                </p>
              </div>

              {/* Rubric Criteria */}
              {q.expectedAnswer && (
                <div className=" border border-border/60 bg-card p-4 space-y-1">
                  <span className="font-mono text-[10px] uppercase font-bold tracking-wider text-foreground">
                    Expected Evaluation Criteria
                  </span>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {q.expectedAnswer}
                  </p>
                </div>
              )}

              {/* Follow-up Questions */}
              {q.followUps && q.followUps.length > 0 && (
                <div className="pt-2 border-t border-border space-y-3">
                  <span className="font-mono text-[10px] uppercase font-bold tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <CornerDownRight className="h-3 w-3" />
                    Follow-up Questions ({q.followUps.length})
                  </span>

                  <div className="space-y-3 pl-3">
                    {q.followUps.map((fu, fIdx) => (
                      <div
                        key={fu.id}
                        className=" border border-border/80 bg-background p-4 space-y-2 text-xs"
                      >
                        <div className="flex items-center justify-between font-mono text-[10px]">
                          <span className="font-semibold text-foreground">
                            Follow-up {idx + 1}.{fIdx + 1}
                          </span>
                          <Badge variant={fu.status === "answered" ? "default" : "secondary"}>{fu.status || "unanswered"}</Badge>
                        </div>

                        <div className="font-semibold text-foreground text-xs leading-snug">
                          {fu.prompt}
                        </div>

                        <div className="text-muted-foreground text-xs leading-relaxed pt-1">
                          {fu.answer ? (
                            <span className="text-foreground">{fu.answer}</span>
                          ) : (
                            <span className="italic">(No response / skipped)</span>
                          )}
                        </div>

                        {fu.expectedAnswer && (
                          <div className="pt-2 text-[11px] text-muted-foreground border-t border-border/50">
                            <span className="font-bold text-foreground">Rubric: </span>
                            {fu.expectedAnswer}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

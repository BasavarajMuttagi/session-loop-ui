import { useState } from "react";
import { useNavigate, Link } from "react-router";
import { useUser } from "@clerk/react";
import {
  ArrowRight,
  ArrowLeft,
  AlertCircle,
  Clock,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { generateInterview } from "../lib/api";

const PRESET_TOPICS = [
  {
    title: "React Native Senior Architect",
    prompt:
      "Create a 6 question interview with followups where necessary, these are the sources - React Native docs: https://reactnative.dev/docs/getting-started React Native navigation overview: https://reactnative.dev/docs/navigation React Navigation getting started: https://reactnavigation.org/docs/getting-started/ React Native testing: https://reactnative.dev/docs/testing-overview New Architecture overview: https://reactnative.dev/architecture/landing-page",
  },
  {
    title: "Distributed Systems & Cloud Scale",
    prompt:
      "Create a 5 question mock interview on distributed consensus (Raft/Paxos), idempotency, cache invalidation at scale, and partition tolerance in high-throughput microservices.",
  },
  {
    title: "Web Performance & Frontend Systems",
    prompt:
      "Create a 5 question senior frontend interview evaluating Core Web Vitals optimization, asset preloading, React concurrency, micro-frontends, and client-side caching strategies.",
  },
];

export function CreateInterviewPage() {
  const { user } = useUser();
  const navigate = useNavigate();

  const [title, setTitle] = useState(PRESET_TOPICS[0].title);
  const [prompt, setPrompt] = useState(PRESET_TOPICS[0].prompt);
  const [durationMinutes, setDurationMinutes] = useState(15);
  const [isGenerating, setIsGenerating] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  function applyPreset(preset: typeof PRESET_TOPICS[0]) {
    setTitle(preset.title);
    setPrompt(preset.prompt);
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!user) {
      setErrorMsg("Please sign in to configure an interview practice session.");
      return;
    }

    try {
      setIsGenerating(true);
      setErrorMsg(null);

      // 1. Generate clean structured questions using the AI generator
      const res = await generateInterview(prompt.trim(), user.id);
      navigate(`/interview/${res.interviewId}`);
    } catch (err: any) {
      console.error("Create session error:", err);
      setErrorMsg(err.message || "Failed to generate interview track.");
    } finally {
      setIsGenerating(false);
    }
  }

  return (
    <div className="container mx-auto max-w-2xl px-4 sm:px-6 py-10 space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <Link to="/dashboard">
          <Button variant="ghost" size="sm" className="h-8 text-xs gap-1.5 font-medium -ml-2 mb-1">
            <ArrowLeft className="h-3.5 w-3.5" /> Back to Archive
          </Button>
        </Link>
        <span className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
          TRACK CONFIGURATION
        </span>
        <h1 className="text-3xl font-extrabold tracking-tight text-foreground">
          Create Custom Practice Track
        </h1>
        <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
          Provide documentation URLs, role requirements, or specific topics. Session Loop will synthesize tailored technical questions, follow-up challenges, and evaluation rubrics.
        </p>
      </div>

      {errorMsg && (
        <div className="p-3.5  border border-destructive/30 bg-destructive/10 text-destructive text-xs flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Preset Starters */}
      <div className="space-y-2">
        <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
          Quick-Fill Track Templates
        </span>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {PRESET_TOPICS.map((p) => (
            <Button
              key={p.title}
              type="button"
              variant="outline"
              onClick={() => applyPreset(p)}
              className="h-auto p-3 text-left flex-col items-start justify-start space-y-1 whitespace-normal"
            >
              <div className="font-semibold text-foreground truncate w-full text-xs">{p.title}</div>
              <div className="text-[10px] text-muted-foreground truncate w-full normal-case font-mono">1-click populate</div>
            </Button>
          ))}
        </div>
      </div>

      <form onSubmit={handleCreate} className="space-y-6  border border-border bg-card p-6 sm:p-8 shadow-xs">
        <div className="space-y-2">
          <label className="font-mono text-[11px] font-semibold text-foreground uppercase tracking-wider">
            Track Title
          </label>
          <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Senior Frontend Platform Engineer"
            className="w-full  border border-border bg-background px-3.5 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-foreground"
          />
        </div>

        <div className="space-y-2">
          <label className="font-mono text-[11px] font-semibold text-foreground uppercase tracking-wider flex items-center justify-between">
            <span>Assessment Instructions & Documentation Links</span>
            <span className="text-[10px] text-muted-foreground normal-case font-mono">URLs auto-parsed</span>
          </label>
          <textarea
            rows={5}
            required
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Paste your syllabus, documentation URLs, or specific competencies to test..."
            className="w-full  border border-border bg-background px-3.5 py-2 text-xs font-mono text-foreground focus:outline-none focus:ring-1 focus:ring-foreground leading-relaxed"
          />
        </div>

        <div className="space-y-2">
          <label className="font-mono text-[11px] font-semibold text-foreground uppercase tracking-wider flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5 text-foreground" />
            Session Duration
          </label>
          <div className="grid grid-cols-3 gap-3">
            {[10, 15, 20].map((mins) => (
              <Button
                key={mins}
                type="button"
                variant={durationMinutes === mins ? "default" : "outline"}
                onClick={() => setDurationMinutes(mins)}
                className="font-mono text-xs h-9"
              >
                {mins} Minutes
              </Button>
            ))}
          </div>
        </div>

        <div className="pt-2">
          <Button
            type="submit"
            size="lg"
            disabled={isGenerating}
            className="w-full h-11 text-xs font-semibold gap-2"
          >
            {isGenerating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Synthesizing Structured Interview Questions...
              </>
            ) : (
              <>
                Generate & Start Practice Session <ArrowRight className="h-4 w-4" />
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}

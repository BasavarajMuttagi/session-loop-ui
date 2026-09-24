import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { useUser, SignInButton, SignUpButton, Show } from "@clerk/react";
import {
  ArrowRight,
  Play,
  Clock,
  Sparkles,
  HelpCircle,
  RotateCcw,
  Zap,
  Mic,
  ChevronRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { SAMPLE_TEMPLATES, buildSessionFromTemplate } from "../lib/templates";
import { createInterview } from "../lib/api";

export function HomePage() {
  const { user } = useUser();
  const navigate = useNavigate();
  const [isStarting, setIsStarting] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function handleStartTrack(template: typeof SAMPLE_TEMPLATES[0]) {
    if (!user) return;
    try {
      setIsStarting(template.templateId);
      setErrorMsg(null);

      const sessionId = `sess_${Date.now()}`;
      const sessionInstance = buildSessionFromTemplate(template, sessionId);

      await createInterview(sessionInstance, user.id);
      navigate(`/interview/${sessionId}`);
    } catch (err: any) {
      console.error("Failed to start practice track:", err);
      setErrorMsg(err.message || "Failed to start interview session.");
    } finally {
      setIsStarting(null);
    }
  }

  return (
    <div className="container mx-auto max-w-6xl px-4 sm:px-6 py-12 sm:py-16 space-y-20">
      {/* Hero Section */}
      <section className="space-y-6 max-w-3xl">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="font-mono text-[10px]">
            VOICE SIMULATION
          </Badge>
          <span className="text-muted-foreground text-xs">&bull;</span>
          <span className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
            Targeted Technical Practice
          </span>
        </div>

        <h1 className="font-heading text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-foreground leading-[1.1]">
          Master technical interviews through live spoken dialogue.
        </h1>

        <p className="text-base sm:text-lg text-muted-foreground leading-relaxed max-w-2xl font-normal">
          Session Loop puts you in realistic, voice-first mock interview rounds.
          Speak your thoughts clearly, defend architectural trade-offs under live follow-up probes, and refine your delivery before meeting real hiring panels.
        </p>

        <div className="flex flex-wrap items-center gap-3 pt-2">
          <Show when="signed-in">
            <Link to="/dashboard">
              <Button size="lg" className="h-11 px-5 gap-2 text-sm font-semibold">
                Go to Archive <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link to="/create">
              <Button variant="outline" size="lg" className="h-11 px-5 gap-2 text-sm font-semibold">
                <Sparkles className="h-4 w-4" /> Create Custom Track
              </Button>
            </Link>
          </Show>

          <Show when="signed-out">
            <SignUpButton mode="modal">
              <Button size="lg" className="h-11 px-6 gap-2 text-sm font-semibold">
                Start Practicing Free <ArrowRight className="h-4 w-4" />
              </Button>
            </SignUpButton>
            <SignInButton mode="modal">
              <Button variant="outline" size="lg" className="h-11 px-5 text-sm font-semibold">
                Sign In
              </Button>
            </SignInButton>
          </Show>
        </div>

        {errorMsg && (
          <div className="p-3 border border-destructive/30 bg-destructive/10 text-destructive text-xs">
            {errorMsg}
          </div>
        )}
      </section>

      {/* Curated Practice Tracks - Using Shadcn Card Components */}
      <section className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-4 border-b border-border">
          <div>
            <Badge variant="secondary" className="mb-1 font-mono">
              CURATED ASSESSMENT TRACKS
            </Badge>
            <h2 className="text-2xl font-bold tracking-tight text-foreground">
              Select an interview track to practice now
            </h2>
          </div>

          <Show when="signed-in">
            <Link to="/create">
              <Button variant="ghost" size="sm" className="text-xs h-8 gap-1.5 font-medium">
                Custom Topic <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          </Show>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {SAMPLE_TEMPLATES.map((tmpl) => {
            const isLoadingThis = isStarting === tmpl.templateId;
            const totalQuestions = tmpl.questions.length;
            const totalFollowUps = tmpl.questions.reduce(
              (acc, q) => acc + (q.followUps?.length || 0),
              0
            );

            return (
              <Card
                key={tmpl.templateId}
                size="default"
                className="justify-between border border-border bg-card shadow-xs transition-colors hover:border-foreground/40"
              >
                <CardHeader className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className="font-mono text-[10px]">
                      {tmpl.attemptGroupId.replace("group_", "").replace("_", " ")}
                    </Badge>
                    <span className="inline-flex items-center gap-1 font-mono text-[11px] text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {Math.round(tmpl.interviewLengthSeconds / 60)}m
                    </span>
                  </div>

                  <CardTitle className="text-base normal-case tracking-tight font-bold line-clamp-2">
                    {tmpl.title}
                  </CardTitle>

                  <CardDescription className="text-xs line-clamp-3 leading-relaxed">
                    {tmpl.userPrompt}
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-4">
                  <Separator />
                  <div className="flex items-center justify-between font-mono text-[11px] text-muted-foreground">
                    <span>{totalQuestions} Main Questions</span>
                    <span>{totalFollowUps} Follow-ups</span>
                  </div>
                </CardContent>

                <CardFooter className="pt-0">
                  <Show when="signed-in">
                    <Button
                      className="w-full h-9 text-xs font-semibold gap-2"
                      onClick={() => handleStartTrack(tmpl)}
                      disabled={isLoadingThis}
                    >
                      {isLoadingThis ? (
                        "Connecting Session..."
                      ) : (
                        <>
                          <Play className="h-3.5 w-3.5 fill-current" />
                          Begin Live Session
                        </>
                      )}
                    </Button>
                  </Show>

                  <Show when="signed-out">
                    <SignUpButton mode="modal">
                      <Button variant="outline" className="w-full h-9 text-xs font-semibold">
                        Sign In to Practice
                      </Button>
                    </SignUpButton>
                  </Show>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      </section>

      {/* The Session Loop Method - Using Shadcn Card Components */}
      <section className="space-y-8 pt-4">
        <div className="max-w-xl space-y-1">
          <Badge variant="secondary" className="mb-1 font-mono">
            METHODOLOGY
          </Badge>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">
            Designed for deliberate interview mastery
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground">
            How Session Loop prepares you for real technical discussions.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card size="sm" className="border border-border bg-card shadow-xs">
            <CardHeader className="space-y-1">
              <span className="font-mono text-xs font-bold text-muted-foreground">01</span>
              <CardTitle className="text-sm normal-case tracking-tight font-bold flex items-center gap-2">
                <Mic className="h-4 w-4 text-foreground" />
                Spoken Articulation
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-xs leading-relaxed">
                Think and articulate your technical reasoning out loud. Natural voice pacing trains muscle memory for interview conversations.
              </CardDescription>
            </CardContent>
          </Card>

          <Card size="sm" className="border border-border bg-card shadow-xs">
            <CardHeader className="space-y-1">
              <span className="font-mono text-xs font-bold text-muted-foreground">02</span>
              <CardTitle className="text-sm normal-case tracking-tight font-bold flex items-center gap-2">
                <Zap className="h-4 w-4 text-foreground" />
                Unscripted Follow-ups
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-xs leading-relaxed">
                Real interviewers probe your claims. The interviewer introduces targeted follow-ups on bottlenecks, resiliency, and trade-offs.
              </CardDescription>
            </CardContent>
          </Card>

          <Card size="sm" className="border border-border bg-card shadow-xs">
            <CardHeader className="space-y-1">
              <span className="font-mono text-xs font-bold text-muted-foreground">03</span>
              <CardTitle className="text-sm normal-case tracking-tight font-bold flex items-center gap-2">
                <HelpCircle className="h-4 w-4 text-foreground" />
                Clarifications & Skips
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-xs leading-relaxed">
                Need guidance or missed a detail? Ask the interviewer to clarify scope or repeat the question without penalty.
              </CardDescription>
            </CardContent>
          </Card>

          <Card size="sm" className="border border-border bg-card shadow-xs">
            <CardHeader className="space-y-1">
              <span className="font-mono text-xs font-bold text-muted-foreground">04</span>
              <CardTitle className="text-sm normal-case tracking-tight font-bold flex items-center gap-2">
                <RotateCcw className="h-4 w-4 text-foreground" />
                Iterative Retries
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-xs leading-relaxed">
                Re-attempt any track as Attempt #2 or #3 with a single click. Compare your delivery against the expected evaluation rubrics.
              </CardDescription>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}

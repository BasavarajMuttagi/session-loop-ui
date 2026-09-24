import { useEffect, type ReactNode } from "react";
import { Routes, Route, Link } from "react-router";
import {
  Show,
  SignInButton,
  SignUpButton,
  UserButton,
  SignIn,
  SignUp,
  useAuth,
} from "@clerk/react";
import {
  Mic,
  LayoutDashboard,
  Plus,
  Lock,
  RefreshCw,
  PhoneOff,
  ArrowLeft,
  FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { registerAuthBridge } from "./lib/api";
import {
  InterviewHeaderProvider,
  useInterviewHeader,
} from "./context/InterviewHeaderContext";
import { InterviewProgressRing } from "./components/interview/InterviewProgressRing";

import { HomePage } from "./pages/HomePage";
import { DashboardPage } from "./pages/DashboardPage";
import { CreateInterviewPage } from "./pages/CreateInterviewPage";
import { InterviewRoomPage } from "./pages/InterviewRoomPage";
import { ReportPage } from "./pages/ReportPage";

function AuthTokenBridge() {
  const { getToken, userId } = useAuth();
  useEffect(() => {
    registerAuthBridge(getToken, userId);
  }, [getToken, userId]);
  return null;
}

function ProtectedRoute({ children }: { children: ReactNode }) {
  const { isLoaded, isSignedIn } = useAuth();

  if (!isLoaded) {
    return (
      <div className="container mx-auto max-w-4xl px-4 py-20 flex flex-col items-center justify-center space-y-3">
        <RefreshCw className="h-6 w-6 animate-spin text-foreground" />
        <p className="text-xs font-mono text-muted-foreground">Authenticating session...</p>
      </div>
    );
  }

  if (!isSignedIn) {
    return (
      <div className="container mx-auto max-w-md px-4 py-20 text-center space-y-4">
        <div className="mx-auto flex h-12 w-12 items-center justify-center  bg-muted text-foreground border border-border">
          <Lock className="h-5 w-5" />
        </div>
        <div className="space-y-1">
          <h2 className="text-xl font-bold tracking-tight text-foreground">
            Authentication Required
          </h2>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Please sign in to access your interview practice sessions and evaluation reports.
          </p>
        </div>
        <div className="pt-2">
          <SignInButton mode="modal">
            <Button size="sm" className="text-xs h-9 font-medium px-4">
              Sign In to Continue
            </Button>
          </SignInButton>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

/**
 * Unified Sticky App Header
 * In normal mode: displays brand logo, nav links, and profile avatar.
 * In active interview mode: displays title, attempt badge, Apple-style progress ring, End Session button, and profile avatar.
 * Pinned at top (sticky top-0 z-50) so it is ALWAYS visible when scrolling!
 */
function Header() {
  const { headerData } = useInterviewHeader();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur-md transition-all">
      <div className="w-full flex h-16 items-center justify-between px-6 sm:px-8 gap-4">
        {/* If inside an active interview session, show the unified interview stage header */}
        {headerData ? (
          <>
            {/* Left: Exit/Archive + Interview Title + Attempt */}
            <div className="flex-1 flex items-center gap-3 min-w-0">
              <Link
                to="/dashboard"
                className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5  hover:bg-muted text-muted-foreground hover:text-foreground transition-all shrink-0 border border-transparent hover:border-border"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                <span>Archive</span>
              </Link>

              <div className="h-4 w-px bg-border shrink-0" />

              <div className="flex items-center gap-2 min-w-0">
                <div className="flex h-7 w-7 items-center justify-center  bg-foreground text-background shrink-0">
                  <Mic className="h-3.5 w-3.5" />
                </div>
                <h1 className="text-sm font-bold text-foreground truncate max-w-[140px] sm:max-w-[220px] md:max-w-xs leading-none">
                  {headerData.title}
                </h1>
                <Badge variant="outline">#{headerData.attemptNumber}</Badge>
              </div>
            </div>

            {/* Center: Apple-style Activity Dual Progress Ring */}
            <div className="flex items-center justify-center shrink-0">
              <InterviewProgressRing
                totalQuestions={headerData.totalQuestions}
                currentQuestionIndex={headerData.currentQuestionIndex}
                isFollowUp={headerData.isFollowUp}
                followUpIndex={headerData.followUpIndex}
                answeredCount={headerData.answeredCount}
                skippedCount={headerData.skippedCount}
                isCompleted={headerData.isCompleted}
              />
            </div>

            {/* Right: End Session Button + Profile Circle */}
            <div className="flex-1 flex items-center justify-end gap-3 shrink-0">




              {!headerData.isCompleted ? (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={headerData.onEndSession}
                >
                  <PhoneOff className="h-4 w-4 mr-1.5" />
                  <span>End Session</span>
                </Button>
              ) : (
                <Link to={`/interview/${headerData.sessionId}/report`}>
                  <Button size="sm" className="h-8.5 px-3.5 text-xs gap-1.5 font-semibold shrink-0">
                    <FileText className="h-3.5 w-3.5" />
                    Review Report
                  </Button>
                </Link>
              )}

              <UserButton
                appearance={{
                  elements: {
                    userButtonAvatarBox: "w-8 h-8  ring-2 ring-border hover:ring-foreground/50 transition-all",
                  },
                }}
              />
            </div>
          </>
        ) : (
          /* Normal Global Navigation */
          <>
            {/* Brand Logo - Swiss Minimalist Style */}
            <Link
              to="/"
              className="flex items-center gap-2.5 font-semibold tracking-tight text-foreground hover:opacity-90 transition-opacity"
            >
              <div className="flex h-8 w-8 items-center justify-center  bg-foreground text-background">
                <Mic className="h-4 w-4" />
              </div>
              <div className="flex flex-col">
                <span className="text-base font-bold tracking-tight text-foreground leading-none">
                  Session Loop
                </span>
                <span className="text-[10px] uppercase font-mono tracking-widest text-muted-foreground mt-0.5">
                  Practice Platform
                </span>
              </div>
            </Link>

            {/* Navigation & Auth */}
            <div className="flex items-center justify-end gap-3 ml-auto">
              <Show when="signed-in">
                <div className="flex items-center gap-2 mr-1">
                  <Link to="/dashboard">
                    <Button variant="ghost" size="sm" className="text-xs h-8 gap-1.5 font-medium">
                      <LayoutDashboard className="h-3.5 w-3.5 text-foreground" />
                      Archive
                    </Button>
                  </Link>
                  <Link to="/create">
                    <Button size="sm" className="text-xs h-8 gap-1.5 font-medium">
                      <Plus className="h-3.5 w-3.5" />
                      New Track
                    </Button>
                  </Link>
                </div>

                <UserButton
                  appearance={{
                    elements: {
                      userButtonAvatarBox: "w-8 h-8  ring-1 ring-border",
                    },
                  }}
                />
              </Show>

              <Show when="signed-out">
                <SignInButton mode="modal">
                  <Button variant="ghost" size="sm" className="text-xs h-8 font-medium">
                    Sign In
                  </Button>
                </SignInButton>
                <SignUpButton mode="modal">
                  <Button size="sm" className="text-xs h-8 font-medium">
                    Get Started
                  </Button>
                </SignUpButton>
              </Show>
            </div>
          </>
        )}
      </div>
    </header>
  );
}

function SignInPage() {
  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center p-4">
      <SignIn routing="path" path="/sign-in" />
    </div>
  );
}

function SignUpPage() {
  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center p-4">
      <SignUp routing="path" path="/sign-up" />
    </div>
  );
}

export default function App() {
  return (
    <InterviewHeaderProvider>
      <div className="min-h-screen bg-background text-foreground flex flex-col antialiased selection:bg-foreground selection:text-background font-sans">
        <AuthTokenBridge />
        <Header />
        <main className="flex-1">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <DashboardPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/create"
              element={
                <ProtectedRoute>
                  <CreateInterviewPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/interview/:id"
              element={
                <ProtectedRoute>
                  <InterviewRoomPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/interview/:id/report"
              element={
                <ProtectedRoute>
                  <ReportPage />
                </ProtectedRoute>
              }
            />
            <Route path="/sign-in/*" element={<SignInPage />} />
            <Route path="/sign-up/*" element={<SignUpPage />} />
          </Routes>
        </main>
        <footer className="border-t border-border py-6 text-center text-xs text-muted-foreground">
          <div className="container mx-auto max-w-6xl px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
            <div className="font-mono text-[11px] tracking-wide">
              SESSION LOOP &bull; VOICE-FIRST TECHNICAL INTERVIEW PRACTICE
            </div>
            <div className="text-[11px]">
              Designed for software engineers, tech leads, and engineering candidates.
            </div>
          </div>
        </footer>
      </div>
    </InterviewHeaderProvider>
  );
}

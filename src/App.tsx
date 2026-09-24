import { Routes, Route, Link } from 'react-router'
import {
  Show,
  SignInButton,
  SignUpButton,
  UserButton,
  SignIn,
  SignUp,
  useUser,
} from '@clerk/react'
import { Sparkles, ShieldCheck, UserCheck, ArrowRight, Bot, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-md">
      <div className="container mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2.5 font-bold tracking-tight text-lg text-foreground hover:opacity-90 transition-opacity">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
            <Bot className="h-5 w-5" />
          </div>
          <span className="bg-gradient-to-r from-foreground via-foreground/90 to-foreground/70 bg-clip-text">
            Session Loop
          </span>
        </Link>

        <div className="flex items-center gap-3">
          <Show when="signed-out">
            <SignInButton mode="modal">
              <Button variant="ghost" size="sm">
                Sign In
              </Button>
            </SignInButton>
            <SignUpButton mode="modal">
              <Button size="sm">
                Get Started
              </Button>
            </SignUpButton>
          </Show>

          <Show when="signed-in">
            <div className="flex items-center gap-3">
              <UserButton
                showName
                appearance={{
                  elements: {
                    userButtonAvatarBox: 'w-9 h-9 ring-2 ring-primary/20',
                  },
                }}
              />
            </div>
          </Show>
        </div>
      </div>
    </header>
  )
}

function HomePage() {
  const { user, isLoaded } = useUser()

  return (
    <main className="container mx-auto max-w-5xl px-4 py-12 md:py-16">
      {/* Hero Section */}
      <div className="text-center space-y-4 max-w-2xl mx-auto">
        <div className="inline-flex items-center gap-2 rounded-full border border-border/80 bg-muted/50 px-3.5 py-1 text-xs font-medium text-muted-foreground">
          <Sparkles className="h-3.5 w-3.5 text-primary" />
          <span>Clerk Authentication Configured</span>
        </div>

        <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl">
          Next-Gen AI Interview Platform
        </h1>
        <p className="text-muted-foreground text-base sm:text-lg">
          Seamless interactive mock interviews, real-time feedback, and comprehensive evaluation powered by intelligent AI models.
        </p>
      </div>

      {/* Auth State Card */}
      <div className="mt-10 mx-auto max-w-xl">
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-primary" />
            Authentication Status
          </h2>

          <div className="mt-4">
            <Show when="signed-out">
              <div className="rounded-lg bg-muted/40 p-4 border border-border/50 text-sm space-y-3">
                <p className="text-muted-foreground">
                  You are currently browsing as a <strong className="text-foreground">Guest</strong>. Sign in or create an account to start an interview session and view history.
                </p>
                <div className="flex items-center gap-2 pt-1">
                  <SignInButton mode="modal">
                    <Button size="sm" className="gap-1.5">
                      Sign In <ArrowRight className="h-3.5 w-3.5" />
                    </Button>
                  </SignInButton>
                  <SignUpButton mode="modal">
                    <Button variant="outline" size="sm">
                      Create Account
                    </Button>
                  </SignUpButton>
                </div>
              </div>
            </Show>

            <Show when="signed-in">
              {isLoaded && (
                <div className="rounded-lg bg-primary/5 border border-primary/20 p-4 text-sm space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <UserCheck className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="font-medium text-foreground">
                        Welcome back, {user?.fullName || user?.firstName || 'User'}!
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {user?.primaryEmailAddress?.emailAddress}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 pt-2 border-t border-primary/10">
                    <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                      <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                      Session Active
                    </span>
                    <span className="text-xs text-muted-foreground">•</span>
                    <span className="text-xs text-muted-foreground font-mono">
                      ID: {user?.id}
                    </span>
                  </div>
                </div>
              )}
            </Show>
          </div>
        </div>
      </div>

      {/* Feature Grid */}
      <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="rounded-lg border border-border/60 bg-card/60 p-5 space-y-2">
          <div className="font-semibold text-foreground">Clerk Auth Ready</div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Multi-factor authentication, social OAuth, session management, and user profiles configured out-of-the-box.
          </p>
        </div>
        <div className="rounded-lg border border-border/60 bg-card/60 p-5 space-y-2">
          <div className="font-semibold text-foreground">shadcn/ui Themed</div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Clerk components automatically adapt to your custom OKLCH design tokens, typography, and dark mode palette.
          </p>
        </div>
        <div className="rounded-lg border border-border/60 bg-card/60 p-5 space-y-2">
          <div className="font-semibold text-foreground">React Router Ready</div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Directly supports protected routes, multi-step authentication paths, and persistent redirect flows.
          </p>
        </div>
      </div>
    </main>
  )
}

function SignInPage() {
  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center p-4">
      <SignIn routing="path" path="/sign-in" />
    </div>
  )
}

function SignUpPage() {
  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center p-4">
      <SignUp routing="path" path="/sign-up" />
    </div>
  )
}

export default function App() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <Header />
      <div className="flex-1">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/sign-in/*" element={<SignInPage />} />
          <Route path="/sign-up/*" element={<SignUpPage />} />
        </Routes>
      </div>
    </div>
  )
}

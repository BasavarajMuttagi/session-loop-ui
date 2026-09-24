import type { InterviewSession } from "../types/interview";

export const SAMPLE_TEMPLATES: Array<Omit<InterviewSession, "id" | "attemptNumber" | "retriedFromInterviewId" | "totalTimeTakenSeconds" | "status">> = [
  {
    templateId: "tmpl_system_design_v1",
    attemptGroupId: "group_system_design",
    title: "Senior Full-Stack & Distributed System Design",
    userPrompt: "Design a high-throughput, fault-tolerant collaborative editing system with real-time sync.",
    interviewLengthSeconds: 1200,
    opening: "Hello and welcome to your System Design interview. We will explore distributed consensus, real-time synchronization, and failure modes. Let's begin when you're ready.",
    closing: "That concludes our system design interview. Thank you for your thorough explanations and trade-off analyses.",
    questions: [
      {
        id: "q_sync_protocol",
        prompt: "How would you design the real-time synchronization protocol for multi-user document editing? Would you choose CRDTs or Operational Transformation?",
        clarify: "Consider bandwidth efficiency, conflict resolution, offline capability, and server compute requirements.",
        expectedAnswer: "Comparison between OT (centralized server dependency, transforms) vs CRDTs (state-based or operation-based, commutative, offline friendly).",
        answer: null,
        timerSeconds: 180,
        status: null,
        followUps: [
          {
            id: "fu_sync_scaling",
            prompt: "How does your chosen approach scale when 10,000 active concurrent users are editing the same large document in real-time?",
            clarify: "Focus on connection fanout, websocket multiplexing, message broadcast latency, and memory consumption on the coordinator node.",
            expectedAnswer: "Room sharding, Redis Pub/Sub or NATS fanout, delta compression, document chunking, and throttle/debounce flush.",
            answer: null,
            timerSeconds: 120,
            status: null,
          },
          {
            id: "fu_network_partition",
            prompt: "What happens during a 30-minute network partition for mobile clients? How do you guarantee convergence without data loss upon reconnect?",
            clarify: "Explain local vector clocks, tombstone garbage collection, and merge conflict resolution strategy.",
            expectedAnswer: "Local state storage in IndexedDB/SQLite, Lamport timestamps or version vectors, causal history replay.",
            answer: null,
            timerSeconds: 120,
            status: null,
          }
        ],
      },
      {
        id: "q_storage_architecture",
        prompt: "What storage engine and database architecture would you use to store snapshots versus immutable change logs?",
        clarify: "Discuss append-only log storage vs snapshot compaction in cold storage (like S3/R2).",
        expectedAnswer: "Log-structured event store (e.g., Kafka / Cassandra / DynamoDB) for operational deltas, combined with periodic snapshot compaction into S3/R2.",
        answer: null,
        timerSeconds: 180,
        status: null,
        followUps: [
          {
            id: "fu_point_in_time",
            prompt: "How would you implement Point-In-Time Recovery (PITR) allowing users to restore the document to any exact second in the past year?",
            clarify: "Think about checkpoint intervals, delta replay cost, and cold storage retrieval latency.",
            expectedAnswer: "Periodic checkpoints (hourly/daily snapshots) plus replaying change-events between the nearest prior snapshot and the target timestamp.",
            answer: null,
            timerSeconds: 120,
            status: null,
          }
        ],
      },
      {
        id: "q_rate_limiting",
        prompt: "How would you implement distributed rate limiting and abuse prevention to mitigate DDoS attacks without affecting legitimate rapid typers?",
        clarify: "Distinguish between typing keystroke burstiness and abusive HTTP/WebSocket spam.",
        expectedAnswer: "Token bucket or sliding window algorithm implemented at the edge (Cloudflare Worker / Redis), with higher burst thresholds for authenticated active sessions.",
        answer: null,
        timerSeconds: 120,
        status: null,
        followUps: [],
      }
    ],
  },
  {
    templateId: "tmpl_react_perf_v1",
    attemptGroupId: "group_react_perf",
    title: "Frontend Engineering & React 19 Internals",
    userPrompt: "Assess knowledge of React Server Components, concurrent rendering, virtual DOM optimizations, and browser paint pipelines.",
    interviewLengthSeconds: 900,
    opening: "Welcome to the Frontend Architecture assessment. We will dive deep into React rendering mechanics, memory profiling, and modern web performance.",
    closing: "Great job completing the frontend technical assessment. Your answers have been recorded for evaluation.",
    questions: [
      {
        id: "q_react_compiler",
        prompt: "Explain how React 19's React Compiler and Server Actions change state management and memoization compared to traditional useMemo and useCallback.",
        clarify: "Discuss compile-time auto-memoization, reactive graph analysis, and hydration boundaries.",
        expectedAnswer: "React Compiler analyzes javascript semantics to automatically insert fine-grained caching, eliminating manual useMemo/useCallback boilerplate and reducing re-renders.",
        answer: null,
        timerSeconds: 150,
        status: null,
        followUps: [
          {
            id: "fu_hydration_mismatch",
            prompt: "What causes hydration mismatches in SSR frameworks, and what strategies prevent layout shift and blank flashes?",
            clarify: "Mention browser-only APIs (localStorage, window width, timezone) during initial server HTML render.",
            expectedAnswer: "Differences between server-rendered HTML and client initial render tree. Resolved via useEffect/useSyncExternalStore, suppressHydrationWarning, or skeleton boundaries.",
            answer: null,
            timerSeconds: 120,
            status: null,
          }
        ],
      },
      {
        id: "q_web_vitals",
        prompt: "How do you systematically diagnose and fix a poor Interaction to Next Paint (INP) score on a heavy data visualization dashboard?",
        clarify: "Focus on Long Tasks (>50ms), main thread blocking, requestIdleCallback / scheduler API, and Web Workers.",
        expectedAnswer: "Profile via Chrome DevTools Performance panel, offload computation to Web Workers, chunk long loops using scheduler.yield(), and optimize layout thrashing.",
        answer: null,
        timerSeconds: 150,
        status: null,
        followUps: [],
      }
    ],
  },
  {
    templateId: "tmpl_behavioral_lead_v1",
    attemptGroupId: "group_behavioral_lead",
    title: "Engineering Leadership & Technical Conflict Resolution",
    userPrompt: "Evaluate behavioral competencies, ownership, crisis leadership, and architectural disagreements using the STAR method.",
    interviewLengthSeconds: 900,
    opening: "Welcome to the Behavioral Leadership session. Please share specific real-world experiences utilizing Situation, Task, Action, and Result.",
    closing: "Thank you for sharing your leadership experiences and approach to engineering collaboration.",
    questions: [
      {
        id: "q_arch_disagreement",
        prompt: "Tell me about a time when you and another senior engineer had a strong fundamental disagreement on an architectural direction. How did you resolve it?",
        clarify: "Detail the technical trade-offs, how you evaluated options objectively, and how you ensured team alignment post-decision.",
        expectedAnswer: "Clear STAR breakdown: technical RFC, spike POC benchmark, data-driven decision matrix, disagreement without malice, commit and support.",
        answer: null,
        timerSeconds: 180,
        status: null,
        followUps: [
          {
            id: "fu_arch_reflection",
            prompt: "Looking back at that decision 6 months later, what was the actual outcome in production, and what would you have done differently?",
            clarify: "Focus on operational realities, tech debt created or avoided, and lessons learned.",
            expectedAnswer: "Honest retrospective on monitoring, maintainability, team velocity, and post-mortems.",
            answer: null,
            timerSeconds: 120,
            status: null,
          }
        ],
      },
      {
        id: "q_prod_outage",
        prompt: "Describe a high-severity production incident you led. How did you manage stakeholder communication while diagnosing the root cause under pressure?",
        clarify: "Explain incident command protocol, blast radius containment, blameless post-mortem, and corrective action items.",
        expectedAnswer: "Incident commander role, live status pages, rollback vs fix-forward decision, blameless post-mortem with preventative SLO monitors.",
        answer: null,
        timerSeconds: 180,
        status: null,
        followUps: [],
      }
    ],
  }
];

export function buildSessionFromTemplate(
  template: typeof SAMPLE_TEMPLATES[0],
  sessionId = `sess_${Date.now()}`
): InterviewSession {
  return {
    id: sessionId,
    templateId: template.templateId,
    attemptGroupId: template.attemptGroupId,
    attemptNumber: 1,
    retriedFromInterviewId: null,
    title: template.title,
    userPrompt: template.userPrompt,
    interviewLengthSeconds: template.interviewLengthSeconds,
    totalTimeTakenSeconds: null,
    status: null,
    opening: template.opening,
    closing: template.closing,
    questions: JSON.parse(JSON.stringify(template.questions)),
  };
}

import { describe, it, expect } from "vitest";
import type { InterviewSession } from "../src/types/interview";
import {
  buildVisibleChatMessages,
  calculateSessionStats,
  normalizeTranscript,
} from "../src/lib/interviewUtils";

describe("interviewUtils pure helper tests", () => {
  const sampleSession: InterviewSession = {
    id: "sess_1",
    templateId: "tmpl_1",
    attemptGroupId: "grp_1",
    attemptNumber: 1,
    retriedFromInterviewId: null,
    title: "React Architecture",
    userPrompt: "Senior React mock interview",
    interviewLengthSeconds: 900,
    totalTimeTakenSeconds: null,
    status: "in_progress",
    opening: "Welcome to the React interview.",
    closing: "Thank you for completing the interview.",
    questions: [
      {
        id: "q_1",
        prompt: "How does React reconciliation work?",
        clarify: null,
        expectedAnswer: "Virtual DOM diffing",
        answer: "Diffs nodes by key and type.",
        timerSeconds: 180,
        status: "answered",
        followUps: [
          {
            id: "fu_1_1",
            prompt: "What about array index keys?",
            clarify: null,
            expectedAnswer: "Breaks reordering",
            answer: null,
            timerSeconds: 120,
            status: "skipped",
          },
        ],
      },
      {
        id: "q_2",
        prompt: "Explain useMemo vs useCallback.",
        clarify: null,
        expectedAnswer: "Memoized values vs callbacks",
        answer: null,
        timerSeconds: 180,
        status: null,
        followUps: [],
      },
    ],
  };

  it("should calculate accurate session statistics", () => {
    const stats = calculateSessionStats(sampleSession);
    expect(stats.answeredCount).toBe(1);
    expect(stats.skippedCount).toBe(1);
    expect(stats.totalCount).toBe(3); // 2 questions + 1 follow-up
  });

  it("should normalize transcript text accurately", () => {
    expect(normalizeTranscript("  Hello, World! 123 ")).toBe("helloworld123");
  });

  it("should build visible chat messages with opening combined into first question", () => {
    const { messages } = buildVisibleChatMessages({
      session: sampleSession,
      cursor: { questionIndex: 0, followUpIndex: 0 },
    });

    expect(messages[0].content).toContain("Welcome to the React interview.");
    expect(messages[0].content).toContain("How does React reconciliation work?");
    expect(messages.some((m) => m.content.includes("useMemo vs useCallback"))).toBe(false);
  });

  it("should deduplicate turns matching known prompts", () => {
    const { messages } = buildVisibleChatMessages({
      session: sampleSession,
      cursor: { questionIndex: 0, followUpIndex: 0 },
      extraTurns: [
        { id: "turn-dup", from: "assistant", text: "How does React reconciliation work?" },
      ],
    });

    // Does not duplicate question prompt
    const matches = messages.filter((m) => m.content.includes("reconciliation work"));
    expect(matches.length).toBe(1);
  });
});

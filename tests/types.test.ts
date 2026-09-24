import { describe, it, expect } from "vitest";
import {
  InterviewSessionSchema,
  PromptResponseSchema,
  RealtimeDataMessageSchema,
  QuestionSchema,
  FollowUpSchema,
} from "../src/types/interview";

describe("UI Domain Types & Zod Schemas", () => {
  it("should parse and validate valid FollowUpSchema", () => {
    const validFollowUp = {
      id: "fu_1_1",
      prompt: "What are the trade-offs of using array index as key?",
      clarify: "Explain rendering diff issues with reordered items.",
      expectedAnswer: "Array index causes incorrect DOM mutation on reordering.",
      answer: null,
      timerSeconds: 120,
      status: null,
    };
    const parsed = FollowUpSchema.parse(validFollowUp);
    expect(parsed.id).toBe("fu_1_1");
  });

  it("should validate and parse structured InterviewSessionSchema", () => {
    const validSession = {
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
      closing: "Thank you for interviewing.",
      questions: [
        {
          id: "q_1",
          prompt: "How does React reconciliation work?",
          clarify: null,
          expectedAnswer: "Fiber tree diffing algorithm",
          answer: null,
          timerSeconds: 180,
          status: null,
          followUps: [],
        },
      ],
    };

    const parsed = InterviewSessionSchema.parse(validSession);
    expect(parsed.title).toBe("React Architecture");
    expect(parsed.questions.length).toBe(1);
  });

  it("should validate RealtimeDataMessageSchema discriminated union", () => {
    const chatTurn = {
      type: "chat_turn",
      id: "turn-1",
      from: "assistant",
      text: "Hello candidate",
      timestamp: Date.now(),
      sequence: 1,
    };
    const parsedTurn = RealtimeDataMessageSchema.parse(chatTurn);
    expect(parsedTurn.type).toBe("chat_turn");

    const stateUpdate = {
      type: "state_update",
      cursor: { questionIndex: 1, followUpIndex: null },
      status: "in_progress",
      isComplete: false,
      totalQuestions: 3,
      revision: 12345,
    };
    const parsedState = RealtimeDataMessageSchema.parse(stateUpdate);
    expect(parsedState.type).toBe("state_update");

    const completed = {
      type: "session_completed",
      totalTimeTakenSeconds: 420,
    };
    const parsedCompleted = RealtimeDataMessageSchema.parse(completed);
    expect(parsedCompleted.type).toBe("session_completed");
  });
});

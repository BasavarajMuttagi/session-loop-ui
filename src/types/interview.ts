import { z } from "zod";

export const ItemStatusSchema = z.enum(["answered", "skipped"]);
export type ItemStatus = z.infer<typeof ItemStatusSchema>;

export const InterviewStatusSchema = z.enum(["in_progress", "completed", "timed_out"]);
export type InterviewStatus = z.infer<typeof InterviewStatusSchema>;

export const FollowUpSchema = z.object({
  id: z.string(),
  prompt: z.string(),
  clarify: z.string().nullable(),
  expectedAnswer: z.string(),
  answer: z.string().nullable(),
  timerSeconds: z.number(),
  status: ItemStatusSchema.nullable(),
});
export type FollowUp = z.infer<typeof FollowUpSchema>;

export const QuestionSchema = z.object({
  id: z.string(),
  prompt: z.string(),
  clarify: z.string().nullable(),
  expectedAnswer: z.string(),
  answer: z.string().nullable(),
  timerSeconds: z.number(),
  status: ItemStatusSchema.nullable(),
  followUps: z.array(FollowUpSchema),
});
export type Question = z.infer<typeof QuestionSchema>;

export const InterviewSessionSchema = z.object({
  id: z.string(),
  templateId: z.string(),
  attemptGroupId: z.string(),
  attemptNumber: z.number().int().positive(),
  retriedFromInterviewId: z.string().nullable(),
  title: z.string(),
  userPrompt: z.string(),
  interviewLengthSeconds: z.number().int().positive(),
  totalTimeTakenSeconds: z.number().int().nullable(),
  status: InterviewStatusSchema.nullable(),
  opening: z.string(),
  closing: z.string(),
  questions: z.array(QuestionSchema),
});
export type InterviewSession = z.infer<typeof InterviewSessionSchema>;

export const InterviewCursorSchema = z.object({
  questionIndex: z.number().int().nonnegative(),
  followUpIndex: z.number().int().nonnegative().nullable(),
});
export type InterviewCursor = z.infer<typeof InterviewCursorSchema>;

export const PendingSkipConfirmationSchema = z
  .object({
    questionIndex: z.number().int().nonnegative(),
    followUpIndex: z.number().int().nonnegative().nullable(),
  })
  .nullable();
export type PendingSkipConfirmation = z.infer<typeof PendingSkipConfirmationSchema>;

export const InterviewDOStateSchema = z.object({
  schemaVersion: z.literal(1),
  interview: InterviewSessionSchema,
  cursor: InterviewCursorSchema,
  pendingSkipConfirmation: PendingSkipConfirmationSchema,
  startedAtMs: z.number().nullable(),
  updatedAtMs: z.number(),
  revision: z.number(),
  processedRequestIds: z.array(z.string()),
});
export type InterviewDOState = z.infer<typeof InterviewDOStateSchema>;

export const PromptResponseTypeSchema = z.enum([
  "question",
  "follow_up",
  "clarification",
  "ask_skip_confirmation",
  "completed",
]);
export type PromptResponseType = z.infer<typeof PromptResponseTypeSchema>;

export const PromptResponseSchema = z.object({
  type: PromptResponseTypeSchema,
  text: z.string(),
  itemId: z.string().optional(),
  cursor: InterviewCursorSchema,
  interviewStatus: InterviewStatusSchema.nullable(),
  timerSeconds: z.number().optional(),
  isComplete: z.boolean(),
});
export type PromptResponse = z.infer<typeof PromptResponseSchema>;

export const InterviewAttemptRecordSchema = z.object({
  id: z.string(),
  templateId: z.string(),
  attemptGroupId: z.string(),
  attemptNumber: z.number(),
  retriedFromInterviewId: z.string().nullable(),
  candidateId: z.string(),
  title: z.string(),
  userPrompt: z.string(),
  interviewLengthSeconds: z.number(),
  totalTimeTakenSeconds: z.number().nullable(),
  status: InterviewStatusSchema,
  sessionData: InterviewSessionSchema.optional(),
  createdAt: z.string(),
  completedAt: z.string().nullable().optional(),
});
export type InterviewAttemptRecord = z.infer<typeof InterviewAttemptRecordSchema>;

export const LiveKitTokenResponseSchema = z.object({
  token: z.string(),
  room: z.string(),
  identity: z.string(),
});
export type LiveKitTokenResponse = z.infer<typeof LiveKitTokenResponseSchema>;

// --- Real-time Data Channel Protocol ---

export const RealtimeChatTurnMessageSchema = z.object({
  type: z.literal("chat_turn"),
  id: z.string(),
  from: z.enum(["assistant", "user"]),
  text: z.string(),
  timestamp: z.number(),
  sequence: z.number(),
});
export type RealtimeChatTurnMessage = z.infer<typeof RealtimeChatTurnMessageSchema>;

export const RealtimeLiveTranscriptMessageSchema = z.object({
  type: z.literal("live_transcript"),
  transcript: z.string(),
  isFinal: z.boolean(),
});
export type RealtimeLiveTranscriptMessage = z.infer<typeof RealtimeLiveTranscriptMessageSchema>;

export const RealtimeStateUpdateMessageSchema = z.object({
  type: z.literal("state_update"),
  cursor: InterviewCursorSchema,
  status: InterviewStatusSchema.nullable(),
  activePrompt: z.string().optional(),
  isComplete: z.boolean(),
  totalQuestions: z.number().int().nonnegative(),
  revision: z.number(),
});
export type RealtimeStateUpdateMessage = z.infer<typeof RealtimeStateUpdateMessageSchema>;

export const RealtimeSessionCompletedMessageSchema = z.object({
  type: z.literal("session_completed"),
  totalTimeTakenSeconds: z.number().optional(),
});
export type RealtimeSessionCompletedMessage = z.infer<typeof RealtimeSessionCompletedMessageSchema>;

export const RealtimeDataMessageSchema = z.discriminatedUnion("type", [
  RealtimeChatTurnMessageSchema,
  RealtimeLiveTranscriptMessageSchema,
  RealtimeStateUpdateMessageSchema,
  RealtimeSessionCompletedMessageSchema,
]);
export type RealtimeDataMessage = z.infer<typeof RealtimeDataMessageSchema>;

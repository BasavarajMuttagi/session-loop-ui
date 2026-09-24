import axios, { type AxiosInstance } from "axios";
import {
  type InterviewSession,
  type InterviewAttemptRecord,
  type PromptResponse,
  type LiveKitTokenResponse,
  PromptResponseSchema,
  LiveKitTokenResponseSchema,
} from "../types/interview";

const API_BASE_URL =
  import.meta.env.VITE_WORKER_API_URL || "http://127.0.0.1:8787";

export const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 30000,
});

let tokenGetter: (() => Promise<string | null>) | null = null;
let currentUserId: string | null = null;

/**
 * Registers Clerk auth token provider and current user ID
 */
export function registerAuthBridge(
  getter: (() => Promise<string | null>) | null,
  userId?: string | null
) {
  tokenGetter = getter;
  currentUserId = userId || null;
}

// Request interceptor to automatically attach Clerk JWT & userId
apiClient.interceptors.request.use(async (config) => {
  if (tokenGetter) {
    try {
      const token = await tokenGetter();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (err) {
      console.warn("Failed to get Clerk auth token:", err);
    }
  }
  if (currentUserId && !config.params?.userId) {
    config.params = { ...config.params, userId: currentUserId };
  }
  return config;
});

/**
 * Attaches auth token to outgoing requests if available
 */
export function setAuthHeader(token?: string | null) {
  if (token) {
    apiClient.defaults.headers.common["Authorization"] = `Bearer ${token}`;
  } else {
    delete apiClient.defaults.headers.common["Authorization"];
  }
}

/**
 * Generate a structured interview template from candidate prompt/docs using AI
 */
export async function generateInterview(
  prompt: string,
  userId: string,
  targetCount?: number,
  token?: string | null
): Promise<{ success: boolean; interviewId: string; title: string; prompt: PromptResponse }> {
  setAuthHeader(token);
  const response = await apiClient.post(
    "/api/interviews/generate",
    { prompt, userId, targetCount }
  );
  return response.data;
}

/**
 * Initialize a new interview session and Durable Object state machine
 */
export async function createInterview(
  session: InterviewSession,
  userId: string,
  token?: string | null
): Promise<{ success: boolean; interviewId: string; prompt: PromptResponse }> {
  setAuthHeader(token);
  const response = await apiClient.post(
    "/api/interviews",
    { session, userId }
  );
  return response.data;
}

/**
 * List past and active interview attempts for the candidate
 */
export async function listInterviews(
  userId: string,
  token?: string | null
): Promise<InterviewAttemptRecord[]> {
  setAuthHeader(token);
  const response = await apiClient.get(
    "/api/interviews",
    { params: { userId } }
  );
  return response.data;
}

/**
 * Fetch detailed state for an interview attempt
 */
export async function getInterviewDetails(
  id: string,
  userId?: string,
  token?: string | null
): Promise<{
  record: InterviewAttemptRecord;
  liveState: {
    interview: InterviewSession;
    cursor: { questionIndex: number; followUpIndex: number | null };
    pendingSkipConfirmation: { questionIndex: number; followUpIndex: number | null } | null;
    totalQuestions?: number;
  } | null;
}> {
  setAuthHeader(token);
  const response = await apiClient.get(`/api/interviews/${id}`, {
    params: userId ? { userId } : undefined,
  });
  return response.data;
}

/**
 * Create a fresh retry attempt (e.g. Attempt #2) from an existing interview
 */
export async function retryInterview(
  oldId: string,
  newSessionId: string,
  userId: string,
  token?: string | null
): Promise<{ success: boolean; interviewId: string; prompt: PromptResponse }> {
  setAuthHeader(token);
  const response = await apiClient.post(`/api/interviews/${oldId}/retry`, {
    newSessionId,
    userId,
  });
  return response.data;
}

/**
 * Submit candidate answer transcript for the active question or follow-up
 */
export async function submitAnswer(
  id: string,
  transcript: string,
  token?: string | null
): Promise<PromptResponse> {
  setAuthHeader(token);
  const response = await apiClient.post(
    `/api/interviews/${id}/answer`,
    {
      requestId: crypto.randomUUID(),
      transcript,
    }
  );
  return PromptResponseSchema.parse(response.data);
}

/**
 * Candidate requests to skip the active prompt
 */
export async function requestSkip(
  id: string,
  token?: string | null
): Promise<PromptResponse> {
  setAuthHeader(token);
  const response = await apiClient.post(
    `/api/interviews/${id}/skip/request`
  );
  return PromptResponseSchema.parse(response.data);
}

/**
 * Candidate confirms or declines a pending skip
 */
export async function confirmSkip(
  id: string,
  confirmed: boolean,
  transcript?: string,
  token?: string | null
): Promise<PromptResponse> {
  setAuthHeader(token);
  const response = await apiClient.post(
    `/api/interviews/${id}/skip/confirm`,
    {
      requestId: crypto.randomUUID(),
      confirmed,
      transcript,
    }
  );
  return PromptResponseSchema.parse(response.data);
}

/**
 * Request clarification for the current question
 */
export async function getClarification(
  id: string,
  token?: string | null
): Promise<PromptResponse> {
  setAuthHeader(token);
  const response = await apiClient.get(
    `/api/interviews/${id}/clarify`
  );
  return PromptResponseSchema.parse(response.data);
}

/**
 * Ask the interviewer to repeat the prompt
 */
export async function repeatPrompt(
  id: string,
  token?: string | null
): Promise<PromptResponse> {
  setAuthHeader(token);
  const response = await apiClient.get(
    `/api/interviews/${id}/repeat`
  );
  return PromptResponseSchema.parse(response.data);
}

/**
 * Explicitly end and conclude the interview session
 */
export async function endInterview(
  id: string,
  token?: string | null
): Promise<PromptResponse> {
  setAuthHeader(token);
  const response = await apiClient.post(
    `/api/interviews/${id}/end`
  );
  return PromptResponseSchema.parse(response.data);
}

/**
 * Acquire LiveKit WebRTC room token for the session
 */
export async function getLiveKitToken(
  id: string,
  userId: string,
  userName?: string,
  token?: string | null
): Promise<LiveKitTokenResponse> {
  setAuthHeader(token);
  const response = await apiClient.post(
    `/api/interviews/${id}/token`,
    { userId, userName }
  );
  return LiveKitTokenResponseSchema.parse(response.data);
}

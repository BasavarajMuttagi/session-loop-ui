import { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router";
import {
  getInterviewDetails,
  getLiveKitToken,
  endInterview,
  retryInterview,
} from "../lib/api";
import type {
  InterviewSession,
  InterviewCursor,
  RealtimeStateUpdateMessage,
} from "../types/interview";
import { calculateSessionStats } from "../lib/interviewUtils";

export function useInterviewSession(
  interviewId?: string,
  user?: { id: string; fullName?: string | null; firstName?: string | null } | null,
  isLoaded = true
) {
  const navigate = useNavigate();

  const [session, setSession] = useState<InterviewSession | null>(null);
  const [totalQuestionsCount, setTotalQuestionsCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [cursor, setCursor] = useState<InterviewCursor>({
    questionIndex: 0,
    followUpIndex: null,
  });
  const [lkToken, setLkToken] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isRetrying, setIsRetrying] = useState(false);
  const [chatTurns, setChatTurns] = useState<
    { id: string; from: "assistant" | "user"; text: string }[]
  >([]);

  const userId = user?.id;
  const userName = user?.fullName || user?.firstName || "Candidate";

  const refreshState = useCallback(async () => {
    if (!interviewId || !userId) return;
    try {
      const data = await getInterviewDetails(interviewId, userId);
      if (data.liveState) {
        setSession(data.liveState.interview || data.record?.sessionData || null);
        setCursor(data.liveState.cursor);
        if (data.liveState.totalQuestions) {
          setTotalQuestionsCount(data.liveState.totalQuestions);
        }
      } else if (data.record?.sessionData) {
        setSession(data.record.sessionData);
      }
    } catch (err) {
      console.error("Failed to refresh session state:", err);
    }
  }, [interviewId, userId]);

  // Main room initialization
  useEffect(() => {
    if (!isLoaded || !userId || !interviewId) return;

    let isCancelled = false;

    async function initRoom() {
      try {
        setLoading(true);
        setErrorMsg(null);

        const [data, tokenData] = await Promise.all([
          getInterviewDetails(interviewId!, userId),
          getLiveKitToken(interviewId!, userId!, userName),
        ]);

        if (isCancelled) return;

        if (data.liveState) {
          setSession(data.liveState.interview || data.record?.sessionData || null);
          setCursor(data.liveState.cursor);
          if (data.liveState.totalQuestions) {
            setTotalQuestionsCount(data.liveState.totalQuestions);
          }
        } else if (data.record?.sessionData) {
          setSession(data.record.sessionData);
        }

        if (tokenData?.token) {
          setLkToken(tokenData.token);
        }
      } catch (err: any) {
        console.error("Failed to initialize interview room:", err);
        if (!isCancelled) {
          setErrorMsg(err.message || "Failed to initialize interview room");
        }
      } finally {
        if (!isCancelled) {
          setLoading(false);
        }
      }
    }

    initRoom();

    return () => {
      isCancelled = true;
    };
  }, [interviewId, isLoaded, userId, userName]);

  // Periodic polling fallback to maintain consistency
  useEffect(() => {
    if (!interviewId || !userId || session?.status === "completed") return;
    const interval = setInterval(() => {
      refreshState();
    }, 3000);
    return () => clearInterval(interval);
  }, [interviewId, userId, session?.status, refreshState]);

  // Instant reactive state update handler from LiveKit WebRTC channel
  const handleStateUpdate = useCallback(
    (state: RealtimeStateUpdateMessage) => {
      setCursor(state.cursor);
      if (state.totalQuestions) {
        setTotalQuestionsCount(state.totalQuestions);
      }
      refreshState();
    },
    [refreshState]
  );

  // Deduplicated chat turn ingestion
  const handleChatTurn = useCallback(
    (turn: {
      id?: string;
      sequence?: number;
      timestamp?: number;
      from: "assistant" | "user";
      text: string;
    }) => {
      setChatTurns((prev) => {
        if (turn.id && prev.some((t) => t.id === turn.id)) return prev;
        if (prev.length > 0 && prev[prev.length - 1].text === turn.text) return prev;
        return [
          ...prev,
          {
            id:
              turn.id ||
              `turn-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            ...turn,
          },
        ];
      });
    },
    []
  );

  const handleEndSession = useCallback(async () => {
    if (!interviewId) return;
    try {
      await endInterview(interviewId);
      navigate(`/interview/${interviewId}/report`);
    } catch (err) {
      console.error("End interview error:", err);
      navigate(`/interview/${interviewId}/report`);
    }
  }, [interviewId, navigate]);

  const handleRetryFromHere = useCallback(async () => {
    if (!user || !interviewId) return;
    try {
      setIsRetrying(true);
      const newSessionId = `sess_${Date.now()}`;
      await retryInterview(interviewId, newSessionId, user.id);
      navigate(`/interview/${newSessionId}`);
    } catch (err: any) {
      console.error("Retry failed:", err);
      setErrorMsg(err.message || "Failed to retry interview");
    } finally {
      setIsRetrying(false);
    }
  }, [user, interviewId, navigate]);

  const isCompleted = useMemo(() => {
    if (!session) return false;
    return (
      cursor.questionIndex >= totalQuestionsCount ||
      session.status === "completed"
    );
  }, [session, cursor.questionIndex, totalQuestionsCount]);

  const { answeredCount, skippedCount } = useMemo(() => {
    return calculateSessionStats(session);
  }, [session]);

  return {
    session,
    totalQuestionsCount,
    cursor,
    loading,
    errorMsg,
    lkToken,
    isRetrying,
    isCompleted,
    answeredCount,
    skippedCount,
    chatTurns,
    refreshState,
    handleStateUpdate,
    handleChatTurn,
    handleEndSession,
    handleRetryFromHere,
  };
}

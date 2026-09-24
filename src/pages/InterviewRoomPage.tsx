import { useState, useRef, useEffect } from "react";
import { useParams, Link } from "react-router";
import { useUser } from "@clerk/react";
import { RefreshCw, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { VoiceRoom } from "../components/interview/VoiceRoom";
import { InterviewChat } from "../components/interview/InterviewChat";
import { useInterviewHeader } from "../context/InterviewHeaderContext";
import { useInterviewSession } from "../hooks/useInterviewSession";

export function InterviewRoomPage() {
  const { id } = useParams<{ id: string }>();
  const { user, isLoaded } = useUser();
  const { setHeaderData } = useInterviewHeader();

  const {
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
    handleStateUpdate,
    handleChatTurn,
    handleEndSession,
    handleRetryFromHere,
  } = useInterviewSession(id, user, isLoaded);

  const [micState, setMicState] = useState<{
    isMicrophoneEnabled: boolean;
    toggleMic: () => void;
    voiceStatus: "speaking" | "listening" | "idle";
  } | null>(null);

  const sendSpeechRef = useRef<((text: string, isClosing?: boolean) => Promise<void>) | null>(null);

  const serverUrl = import.meta.env.VITE_LIVEKIT_URL || "ws://localhost:7880";
  const userName = user?.fullName || user?.firstName || "Candidate";
  const userAvatarUrl = user?.imageUrl;

  // Sync state with global header
  useEffect(() => {
    if (!session) {
      setHeaderData(null);
      return;
    }

    setHeaderData({
      title: session.title,
      attemptNumber: session.attemptNumber,
      totalQuestions: totalQuestionsCount,
      currentQuestionIndex: cursor.questionIndex,
      isFollowUp: cursor.followUpIndex !== null,
      followUpIndex: cursor.followUpIndex,
      answeredCount,
      skippedCount,
      isCompleted,
      sessionId: id,
      onEndSession: handleEndSession,
      onRetry: handleRetryFromHere,
      isRetrying,
      isMicrophoneEnabled: micState?.isMicrophoneEnabled ?? true,
      onToggleMicrophone: micState?.toggleMic,
      voiceStatus: micState?.voiceStatus ?? "idle",
    });

    return () => {
      setHeaderData(null);
    };
  }, [
    session,
    cursor,
    isCompleted,
    answeredCount,
    skippedCount,
    totalQuestionsCount,
    id,
    handleEndSession,
    handleRetryFromHere,
    isRetrying,
    micState,
    setHeaderData,
  ]);

  if (!isLoaded || loading) {
    return (
      <div className="container mx-auto max-w-3xl px-4 py-24 flex flex-col items-center justify-center space-y-3">
        <RefreshCw className="h-6 w-6 animate-spin text-foreground" />
        <p className="text-sm font-bold text-foreground">Entering Live Practice Room...</p>
        <p className="text-xs text-muted-foreground font-mono">Connecting your audio stream and loading interview...</p>
      </div>
    );
  }

  if (errorMsg || !session) {
    return (
      <div className="container mx-auto max-w-md px-4 py-16 text-center space-y-4">
        <AlertCircle className="h-8 w-8 text-destructive mx-auto" />
        <h2 className="text-xl font-bold text-foreground">Unable to Join Session</h2>
        <p className="text-xs text-muted-foreground">{errorMsg || "Session data could not be retrieved"}</p>
        <Link to="/dashboard">
          <Button size="sm" variant="outline">
            Back to Archive
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col">
      {lkToken ? (
        <VoiceRoom
          token={lkToken}
          serverUrl={serverUrl}
          interviewTitle={session.title}
          isCompleted={isCompleted}
          onRoomReady={({ sendAgentSpeech }) => {
            sendSpeechRef.current = sendAgentSpeech;
          }}
          onMicStateChange={setMicState}
          onChatTurn={handleChatTurn}
          onStateUpdate={handleStateUpdate}
          onDisconnected={() => {
            console.log("Disconnected from voice room");
          }}
          onSessionConcluded={handleEndSession}
          renderChat={({ liveTranscript, agentState, agentAudioTrack, userState, userAudioTrack }) => (
            <InterviewChat
              session={session}
              cursor={cursor}
              liveTranscript={liveTranscript}
              isCompleted={isCompleted}
              userAvatarUrl={userAvatarUrl}
              userName={userName}
              agentState={agentState}
              agentAudioTrack={agentAudioTrack}
              userState={userState}
              userAudioTrack={userAudioTrack}
              extraTurns={chatTurns}
            />
          )}
        />
      ) : (
        <div className="flex-1 max-w-3xl mx-auto w-full p-4">
          <InterviewChat
            session={session}
            cursor={cursor}
            isCompleted={isCompleted}
            userAvatarUrl={userAvatarUrl}
            userName={userName}
          />
        </div>
      )}
    </div>
  );
}

import { Mic, MicOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { type ReactNode, useEffect, useRef, useCallback, useState } from "react";
import {
  LiveKitRoom,
  RoomAudioRenderer,
  StartAudio,
  useVoiceAssistant,
  useLocalParticipant,
  useRemoteParticipants,
  useSpeakingParticipants,
  useRoomContext,
  type AgentState,
} from "@livekit/components-react";
import "@livekit/components-styles";
import { RoomEvent, type RemoteAudioTrack, type LocalAudioTrack } from "livekit-client";
import type { RealtimeStateUpdateMessage } from "../../types/interview";

interface VoiceRoomProps {
  token: string;
  serverUrl: string;
  interviewTitle?: string;
  isCompleted?: boolean;
  onDisconnected: () => void;
  onSessionConcluded?: () => void;
  onRoomReady?: (actions: {
    sendAgentSpeech: (text: string, isClosing?: boolean) => Promise<void>;
  }) => void;
  onChatTurn?: (turn: { id?: string; sequence?: number; timestamp?: number; from: "assistant" | "user"; text: string }) => void;
  onStateUpdate?: (state: RealtimeStateUpdateMessage) => void;
  onMicStateChange?: (state: {
    isMicrophoneEnabled: boolean;
    toggleMic: () => void;
    voiceStatus: "speaking" | "listening" | "idle";
  }) => void;
  renderChat: (props: {
    liveTranscript: string;
    agentState: AgentState;
    agentAudioTrack?: RemoteAudioTrack | LocalAudioTrack;
    userState: AgentState;
    userAudioTrack?: RemoteAudioTrack | LocalAudioTrack;
  }) => ReactNode;
}

/**
 * Bridges room microphone and assistant state to header controls.
 */
function RoomStateBridge({
  onMicStateChange,
}: {
  onMicStateChange?: VoiceRoomProps["onMicStateChange"];
}) {
  const { state: vaState } = useVoiceAssistant();
  const speakingParticipants = useSpeakingParticipants();
  const remoteParticipants = useRemoteParticipants();
  const { localParticipant, isMicrophoneEnabled } = useLocalParticipant();

  const agentParticipant =
    remoteParticipants.find((p) => p.identity.includes("agent") || p.isAgent) ||
    remoteParticipants[0];

  const isAgentSpeaking =
    speakingParticipants.some((p) => p.identity === agentParticipant?.identity) ||
    agentParticipant?.isSpeaking ||
    vaState === "speaking";

  const toggleMic = useCallback(() => {
    if (localParticipant) {
      localParticipant.setMicrophoneEnabled(!isMicrophoneEnabled);
    }
  }, [localParticipant, isMicrophoneEnabled]);

  const voiceStatus = isAgentSpeaking
    ? "speaking"
    : isMicrophoneEnabled
    ? "listening"
    : "idle";

  useEffect(() => {
    if (onMicStateChange) {
      onMicStateChange({
        isMicrophoneEnabled: !!isMicrophoneEnabled,
        toggleMic,
        voiceStatus,
      });
    }
  }, [isMicrophoneEnabled, toggleMic, voiceStatus, onMicStateChange]);

  return null;
}

/**
 * Handles Live Data and Lifecycle Events
 */
function RoomEventsHandler({
  isCompleted,
  onSessionConcluded,
  onLiveTranscript,
  onChatTurn,
  onStateUpdate,
  onRoomReady,
}: {
  isCompleted?: boolean;
  onSessionConcluded?: () => void;
  onLiveTranscript: (text: string) => void;
  onChatTurn?: (turn: { id?: string; sequence?: number; timestamp?: number; from: "assistant" | "user"; text: string }) => void;
  onStateUpdate?: (state: RealtimeStateUpdateMessage) => void;
  onRoomReady?: (actions: {
    sendAgentSpeech: (text: string, isClosing?: boolean) => Promise<void>;
  }) => void;
}) {
  const room = useRoomContext();
  const { state: agentState } = useVoiceAssistant();
  const speakingParticipants = useSpeakingParticipants();
  const hasTriggeredRef = useRef(false);
  const wasSpeakingRef = useRef(false);

  // Dispatcher
  useEffect(() => {
    if (!room || !onRoomReady) return;
    const sendAgentSpeech = async (text: string, isClosing = false) => {
      try {
        const payload = new TextEncoder().encode(
          JSON.stringify({ type: "agent_say", text, isClosing })
        );
        if (room.localParticipant) {
          await room.localParticipant.publishData(payload, { reliable: true });
        }
      } catch (err) {
        console.error("Failed to send agent_say packet:", err);
      }
    };
    onRoomReady({ sendAgentSpeech });
  }, [room, onRoomReady]);

  const conclude = useCallback(async () => {
    if (hasTriggeredRef.current) return;
    hasTriggeredRef.current = true;
    console.log("[VoiceRoom] Gracefully concluding session...");
    try {
      if (room?.localParticipant) {
        await room.localParticipant.setMicrophoneEnabled(false);
      }
      room?.disconnect();
    } catch (e) {
      console.warn("Disconnect error:", e);
    }
    if (onSessionConcluded) {
      onSessionConcluded();
    }
  }, [room, onSessionConcluded]);

  // Data listener: live transcripts & completion signals
  useEffect(() => {
    if (!room) return;

    const handleData = (payload: Uint8Array) => {
      try {
        const text = new TextDecoder().decode(payload);
        const data = JSON.parse(text);

        if (data.type === "live_transcript" && typeof data.transcript === "string") {
          const cleanTranscript = data.transcript.trim();
          if (data.isFinal && cleanTranscript) {
            // Optimistic update: commit final candidate speech instantly into the chat list
            if (onChatTurn) {
              onChatTurn({
                id: `optimistic-user-${Date.now()}`,
                from: "user",
                text: cleanTranscript,
              });
            }
            onLiveTranscript("");
          } else {
            onLiveTranscript(data.transcript);
          }
        }

        if (data.type === "chat_turn" && typeof data.text === "string" && data.text.trim()) {
          if (onChatTurn) {
            onChatTurn({
              id: data.id,
              sequence: data.sequence,
              timestamp: data.timestamp,
              from: data.from === "assistant" ? "assistant" : "user",
              text: data.text.trim(),
            });
          }
        }

        if (data.type === "state_update" && data.cursor) {
          if (onStateUpdate) {
            onStateUpdate(data as RealtimeStateUpdateMessage);
          }
        }

        if (
          data.type === "interview_concluded" ||
          data.type === "session_completed"
        ) {
          conclude();
        }
      } catch (err) {
        console.error("Failed to parse data message:", err);
      }
    };

    room.on(RoomEvent.DataReceived, handleData);
    return () => {
      room.off(RoomEvent.DataReceived, handleData);
    };
  }, [room, onLiveTranscript, conclude]);

  // Audio completion watcher
  const isAgentSpeaking =
    agentState === "speaking" ||
    speakingParticipants.some((p) => p.identity !== room?.localParticipant?.identity);

  useEffect(() => {
    if (!isCompleted || hasTriggeredRef.current) return;

    if (isAgentSpeaking) {
      wasSpeakingRef.current = true;
    } else if (wasSpeakingRef.current) {
      const timer = setTimeout(() => conclude(), 1500);
      return () => clearTimeout(timer);
    }
  }, [isCompleted, isAgentSpeaking, conclude]);

  // Fallback timer
  useEffect(() => {
    if (!isCompleted || hasTriggeredRef.current) return;
    const fallbackTimer = setTimeout(() => conclude(), 25000);
    return () => clearTimeout(fallbackTimer);
  }, [isCompleted, conclude]);

  return null;
}

function BottomControls() {
  const { localParticipant, isMicrophoneEnabled } = useLocalParticipant();

  const toggleMic = useCallback(() => {
    if (localParticipant) {
      localParticipant.setMicrophoneEnabled(!isMicrophoneEnabled);
    }
  }, [localParticipant, isMicrophoneEnabled]);

  return (
    <div className="sticky bottom-4 left-0 right-0 z-20 flex justify-center items-center py-2 pointer-events-none">
      <Button
        size="icon"
        variant={isMicrophoneEnabled ? "outline" : "secondary"}
        className="pointer-events-auto size-12 rounded-full border border-border shadow-lg bg-background hover:bg-muted transition-transform hover:scale-105 active:scale-95"
        onClick={toggleMic}
        aria-label={isMicrophoneEnabled ? "Mute Microphone" : "Unmute Microphone"}
      >
        {isMicrophoneEnabled ? (
          <Mic className="size-5 text-foreground" />
        ) : (
          <MicOff className="size-5 text-destructive" />
        )}
      </Button>
    </div>
  );
}

function VoiceRoomContent({
  liveTranscript,
  renderChat,
}: {
  liveTranscript: string;
  renderChat: VoiceRoomProps["renderChat"];
}) {
  const { state: vaState, audioTrack: vaAudioTrack } = useVoiceAssistant();
  const remoteParticipants = useRemoteParticipants();
  const speakingParticipants = useSpeakingParticipants();
  const { localParticipant, isMicrophoneEnabled } = useLocalParticipant();

  // Find agent participant
  const agentParticipant =
    remoteParticipants.find((p) => p.identity.includes("agent") || p.isAgent) ||
    remoteParticipants[0];

  const isAgentSpeaking =
    speakingParticipants.some((p) => p.identity === agentParticipant?.identity) ||
    agentParticipant?.isSpeaking ||
    vaState === "speaking";

  const isUserSpeaking =
    speakingParticipants.some((p) => p.identity === localParticipant?.identity) ||
    localParticipant?.isSpeaking ||
    liveTranscript.trim().length > 0;

  // Remote audio track
  const remotePub = Array.from(agentParticipant?.audioTrackPublications.values() || [])[0];
  const remoteTrack = (vaAudioTrack || remotePub?.track) as RemoteAudioTrack | undefined;

  // Local audio track
  const localPub = Array.from(localParticipant?.audioTrackPublications.values() || [])[0];
  const localTrack = localPub?.track as LocalAudioTrack | undefined;

  const agentState: AgentState = isAgentSpeaking
    ? "speaking"
    : isUserSpeaking || isMicrophoneEnabled
    ? "listening"
    : vaState === "thinking"
    ? "thinking"
    : "listening";

  const userState: AgentState = isUserSpeaking
    ? "speaking"
    : isMicrophoneEnabled
    ? "listening"
    : "listening";

  return (
    <div className="flex-1 w-full max-w-3xl mx-auto px-4 py-2 flex flex-col min-h-0">


      {renderChat({
        liveTranscript,
        agentState,
        agentAudioTrack: remoteTrack,
        userState,
        userAudioTrack: localTrack,
      })}
      <BottomControls />
    </div>
  );
}

export function VoiceRoom({
  token,
  serverUrl,
  isCompleted,
  onDisconnected,
  onSessionConcluded,
  onRoomReady,
  onMicStateChange,
  onChatTurn,
  renderChat,
}: VoiceRoomProps) {
  const [liveTranscript, setLiveTranscript] = useState("");

  return (
    <LiveKitRoom
      token={token}
      serverUrl={serverUrl}
      audio={true}
      video={false}
      onDisconnected={onDisconnected}
      className="w-full flex-1 flex flex-col min-h-[calc(100vh-4rem)] relative"
    >
      <RoomAudioRenderer />
      <StartAudio label="Click to allow audio playback" />
      <RoomEventsHandler
        isCompleted={isCompleted}
        onSessionConcluded={onSessionConcluded}
        onLiveTranscript={setLiveTranscript}
        onChatTurn={onChatTurn}
        onRoomReady={onRoomReady}
      />
      <RoomStateBridge onMicStateChange={onMicStateChange} />

      <VoiceRoomContent
        liveTranscript={liveTranscript}
        renderChat={renderChat}
      />
    </LiveKitRoom>
  );
}

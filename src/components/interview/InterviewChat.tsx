import { type AgentState } from "@livekit/components-react";
import type { RemoteAudioTrack, LocalAudioTrack } from "livekit-client";
import { useEffect, useRef } from "react";
import type { InterviewSession, InterviewCursor } from "../../types/interview";
import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from "@/components/ui/conversation";
import { Message, MessageContent } from "@/components/ui/message";
import { AgentAudioVisualizerGrid } from "@/components/agents-ui/agent-audio-visualizer-grid";
import {
  buildVisibleChatMessages,
  normalizeTranscript,
} from "../../lib/interviewUtils";

interface InterviewChatProps {
  session: InterviewSession;
  cursor?: InterviewCursor;
  liveTranscript?: string;
  isCompleted?: boolean;
  userAvatarUrl?: string;
  userName?: string;
  agentState?: AgentState;
  agentAudioTrack?: RemoteAudioTrack | LocalAudioTrack;
  userState?: AgentState;
  userAudioTrack?: RemoteAudioTrack | LocalAudioTrack;
  extraTurns?: { id: string; from: "assistant" | "user"; text: string }[];
}

function AssistantAvatar({
  isActive,
  agentState,
}: {
  isActive: boolean;
  agentState: AgentState;
  audioTrack?: RemoteAudioTrack | LocalAudioTrack;
}) {
  return (
    <div className="shrink-0 flex items-center justify-center size-8 rounded-full border border-border/40 bg-muted/20">
      <AgentAudioVisualizerGrid
        size="sm"
        color="#C04CFA"
        rowCount={7}
        columnCount={7}
        radius={100}
        state={isActive ? agentState : "listening"}
        className="size-5 *:size-0.5 text-foreground/80"
      />
    </div>
  );
}

function CandidateAvatar({
  isActive,
  userState,
}: {
  isActive: boolean;
  userState: AgentState;
  audioTrack?: RemoteAudioTrack | LocalAudioTrack;
}) {
  return (
    <div className="shrink-0 flex items-center justify-center size-8 rounded-full border border-border/40 bg-muted/20">
      <AgentAudioVisualizerGrid
        size="sm"
        color="#C04CFA"
        rowCount={7}
        columnCount={7}
        radius={100}
        state={isActive ? userState : "listening"}
        className="size-5 *:size-0.5 text-foreground/80"
      />
    </div>
  );
}

export function InterviewChat({
  session,
  cursor = { questionIndex: 0, followUpIndex: null },
  liveTranscript = "",
  isCompleted = false,
  agentState = "listening",
  agentAudioTrack,
  userState = "listening",
  userAudioTrack,
  extraTurns = [],
}: InterviewChatProps) {
  const { messages, knownNormalized } = buildVisibleChatMessages({
    session,
    cursor,
    extraTurns,
    isCompleted,
  });

  const trimmedLiveTranscript = liveTranscript.trim();
  const normLive = normalizeTranscript(trimmedLiveTranscript);

  // Avoid showing live transcript bubble if it matches the latest recorded message
  const hasLiveTranscript =
    trimmedLiveTranscript.length > 0 &&
    !knownNormalized.some(
      (k) => k === normLive || (normLive.length > 15 && k.includes(normLive))
    );

  const isAgentCurrentlySpeaking =
    agentState === "speaking" || agentState === "thinking";
  const isUserCurrentlySpeaking = hasLiveTranscript || userState === "speaking";

  let lastAssistantIndex = -1;
  for (let i = messages.length - 1; i >= 0; i--) {
    if (messages[i].from === "assistant") {
      lastAssistantIndex = i;
      break;
    }
  }

  const scrollRef = useRef<HTMLDivElement>(null);
  const prevMessagesCountRef = useRef(messages.length);

  useEffect(() => {
    if (messages.length !== prevMessagesCountRef.current || hasLiveTranscript) {
      prevMessagesCountRef.current = messages.length;
      scrollRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [messages.length, hasLiveTranscript]);

  return (
    <Conversation className="h-[calc(100vh-10rem)] flex-1 min-h-0">
      <ConversationContent className="gap-4">
        {messages.map((message, idx) => {
          const isAssistant = message.from === "assistant";
          const isActiveAssistant =
            isAssistant &&
            idx === lastAssistantIndex &&
            !hasLiveTranscript &&
            isAgentCurrentlySpeaking;

          return (
            <Message
              key={message.id}
              from={message.from}
              className="items-start gap-3 py-2"
            >
              {isAssistant ? (
                <>
                  <AssistantAvatar
                    isActive={isActiveAssistant}
                    agentState={agentState}
                    audioTrack={agentAudioTrack}
                  />
                  <MessageContent>{message.content}</MessageContent>
                </>
              ) : (
                <>
                  <MessageContent>{message.content}</MessageContent>
                </>
              )}
            </Message>
          );
        })}

        {hasLiveTranscript && (
          <Message from="user" className="items-start gap-3 py-2">
            <MessageContent>{trimmedLiveTranscript}</MessageContent>
            <CandidateAvatar
              isActive={isUserCurrentlySpeaking}
              userState={userState}
              audioTrack={userAudioTrack}
            />
          </Message>
        )}
        <div ref={scrollRef} className="h-px" />
      </ConversationContent>
      <ConversationScrollButton />
    </Conversation>
  );
}

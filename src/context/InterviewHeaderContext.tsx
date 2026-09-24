import { createContext, useContext, useState, type ReactNode } from "react";

export interface InterviewHeaderData {
  title: string;
  attemptNumber: number;
  totalQuestions: number;
  currentQuestionIndex: number;
  isFollowUp: boolean;
  followUpIndex: number | null;
  answeredCount: number;
  skippedCount: number;
  isCompleted: boolean;
  sessionId?: string;
  onEndSession?: () => void;
  onRetry?: () => void;
  isRetrying?: boolean;
  isMicrophoneEnabled?: boolean;
  onToggleMicrophone?: () => void;
  voiceStatus?: "speaking" | "listening" | "idle";
}

interface InterviewHeaderContextType {
  headerData: InterviewHeaderData | null;
  setHeaderData: (data: InterviewHeaderData | null) => void;
}

const InterviewHeaderContext = createContext<InterviewHeaderContextType>({
  headerData: null,
  setHeaderData: () => {},
});

export function InterviewHeaderProvider({ children }: { children: ReactNode }) {
  const [headerData, setHeaderData] = useState<InterviewHeaderData | null>(null);

  return (
    <InterviewHeaderContext.Provider value={{ headerData, setHeaderData }}>
      {children}
    </InterviewHeaderContext.Provider>
  );
}

export function useInterviewHeader() {
  return useContext(InterviewHeaderContext);
}

import type { InterviewSession, InterviewCursor } from "../types/interview";

export interface ChatMessage {
  id: string;
  from: "assistant" | "user";
  content: string;
  name: string;
}

/**
 * Normalizes text for robust comparison and deduplication
 */
export function normalizeTranscript(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]/g, "");
}

/**
 * Calculates aggregate answered and skipped counts across all questions and follow-ups
 */
export function calculateSessionStats(session: InterviewSession | null): {
  answeredCount: number;
  skippedCount: number;
  totalCount: number;
} {
  if (!session) return { answeredCount: 0, skippedCount: 0, totalCount: 0 };

  let answered = 0;
  let skipped = 0;
  let total = 0;

  for (const q of session.questions || []) {
    total++;
    if (q.status === "answered") answered++;
    if (q.status === "skipped") skipped++;

    for (const f of q.followUps || []) {
      total++;
      if (f.status === "answered") answered++;
      if (f.status === "skipped") skipped++;
    }
  }

  return { answeredCount: answered, skippedCount: skipped, totalCount: total };
}

/**
 * Builds a strictly-gated, deduplicated sequence of chat messages for the interview room.
 */
export function buildVisibleChatMessages(options: {
  session: InterviewSession;
  cursor: InterviewCursor;
  extraTurns?: { id: string; from: "assistant" | "user"; text: string }[];
  isCompleted?: boolean;
}): {
  messages: ChatMessage[];
  knownNormalized: string[];
} {
  const { session, cursor, extraTurns = [], isCompleted = false } = options;
  const messages: ChatMessage[] = [];
  const knownNormalized: string[] = [];

  const maxQuestionIndex = Math.min(
    cursor ? cursor.questionIndex : session.questions.length - 1,
    session.questions.length - 1
  );

  for (let qIndex = 0; qIndex <= maxQuestionIndex; qIndex++) {
    const q = session.questions[qIndex];
    if (!q) continue;

    const isCurrentQuestion = cursor && cursor.questionIndex === qIndex;
    const isFirstQuestion = qIndex === 0;

    // Single unified opening greeting on first question
    const promptText =
      isFirstQuestion && session.opening
        ? `${session.opening}\n\n${q.prompt}`
        : q.prompt;

    messages.push({
      id: `q-${q.id}`,
      from: "assistant",
      content: promptText,
      name: "AI",
    });
    knownNormalized.push(normalizeTranscript(promptText));
    if (isFirstQuestion && session.opening) {
      knownNormalized.push(normalizeTranscript(session.opening));
      knownNormalized.push(normalizeTranscript(q.prompt));
    }

    if (q.status === "answered" && q.answer) {
      messages.push({
        id: `q-ans-${q.id}`,
        from: "user",
        content: q.answer,
        name: "Candidate",
      });
      knownNormalized.push(normalizeTranscript(q.answer));
    } else if (q.status === "skipped") {
      const skipContent = q.answer || "Skipped";
      messages.push({
        id: `q-skip-${q.id}`,
        from: "user",
        content: skipContent,
        name: "Candidate",
      });
      knownNormalized.push(normalizeTranscript(skipContent));
    }

    // Follow-ups gating
    if (q.followUps && q.followUps.length > 0) {
      if (isCurrentQuestion) {
        if (cursor.followUpIndex !== null) {
          for (let fIdx = 0; fIdx <= cursor.followUpIndex; fIdx++) {
            const f = q.followUps[fIdx];
            if (!f) continue;

            messages.push({
              id: `f-${f.id}`,
              from: "assistant",
              content: f.prompt,
              name: "AI",
            });
            knownNormalized.push(normalizeTranscript(f.prompt));

            if (f.status === "answered" && f.answer) {
              messages.push({
                id: `f-ans-${f.id}`,
                from: "user",
                content: f.answer,
                name: "Candidate",
              });
              knownNormalized.push(normalizeTranscript(f.answer));
            } else if (f.status === "skipped") {
              const fSkipContent = f.answer || "Skipped";
              messages.push({
                id: `f-skip-${f.id}`,
                from: "user",
                content: fSkipContent,
                name: "Candidate",
              });
              knownNormalized.push(normalizeTranscript(fSkipContent));
            }
          }
        }
      } else {
        for (const f of q.followUps) {
          if (f.status === null) continue;

          messages.push({
            id: `f-${f.id}`,
            from: "assistant",
            content: f.prompt,
            name: "AI",
          });
          knownNormalized.push(normalizeTranscript(f.prompt));

          if (f.status === "answered" && f.answer) {
            messages.push({
              id: `f-ans-${f.id}`,
              from: "user",
              content: f.answer,
              name: "Candidate",
            });
            knownNormalized.push(normalizeTranscript(f.answer));
          } else if (f.status === "skipped") {
            const fSkipContent = f.answer || "Skipped";
            messages.push({
              id: `f-skip-${f.id}`,
              from: "user",
              content: fSkipContent,
              name: "Candidate",
            });
            knownNormalized.push(normalizeTranscript(fSkipContent));
          }
        }
      }
    }
  }

  // Extra dialogue turns (clarifications, queries)
  for (const turn of extraTurns) {
    const norm = normalizeTranscript(turn.text);
    if (!norm) continue;

    const isDuplicate = knownNormalized.some(
      (known) =>
        known === norm ||
        (known.length > 15 && norm.includes(known)) ||
        (norm.length > 15 && known.includes(norm))
    );

    if (!isDuplicate) {
      messages.push({
        id: turn.id,
        from: turn.from,
        content: turn.text,
        name: turn.from === "assistant" ? "AI" : "Candidate",
      });
      knownNormalized.push(norm);
    }
  }

  // Closing remarks
  if (isCompleted && session.closing) {
    messages.push({
      id: "closing",
      from: "assistant",
      content: session.closing,
      name: "AI",
    });
  }

  return { messages, knownNormalized };
}

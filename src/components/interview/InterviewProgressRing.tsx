import { Badge } from "@/components/ui/badge";

interface InterviewProgressProps {
  totalQuestions: number;
  currentQuestionIndex: number;
  isFollowUp?: boolean;
  followUpIndex?: number | null;
  answeredCount: number;
  skippedCount: number;
  isCompleted?: boolean;
}

export function InterviewProgressRing({
  totalQuestions,
  currentQuestionIndex,
  isFollowUp = false,
  followUpIndex = null,
  answeredCount,
  skippedCount,
  isCompleted = false,
}: InterviewProgressProps) {
  const safeTotal = Math.max(1, totalQuestions);
  const currentNum = isCompleted
    ? safeTotal
    : Math.min(currentQuestionIndex + 1, safeTotal);

  return (
    <div className="flex items-center gap-2">
      <Badge variant="outline" className="text-xs font-semibold">
        Question {currentNum} of {safeTotal}
      </Badge>

      {isFollowUp && followUpIndex !== null && (
        <Badge variant="secondary" className="text-xs">
          Follow-up #{followUpIndex + 1}
        </Badge>
      )}

      {answeredCount > 0 && (
        <Badge variant="secondary" className="text-xs font-normal text-muted-foreground hidden sm:inline-flex">
          {answeredCount} answered
        </Badge>
      )}

      {skippedCount > 0 && (
        <Badge variant="outline" className="text-xs font-normal text-muted-foreground hidden sm:inline-flex">
          {skippedCount} skipped
        </Badge>
      )}
    </div>
  );
}

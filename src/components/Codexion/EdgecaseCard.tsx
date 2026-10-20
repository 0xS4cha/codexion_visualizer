import { useState } from "react";
import { MessageSquare } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EdgecaseComments } from "@/components/Codexion/EdgecaseComments";

type edgecaseCardProps = {
  id: string;
  title: string;
  author: string;
  tags: string[];
  description: string;
  votes: number;
  userVote?: "up" | "down";
  commentCount?: number;
  currentLogin?: string;
  hasStoredLog?: boolean;
  canCheckLog?: boolean;
  onOpen: () => void;
  onReplay?: () => void;
  onCheckLog?: () => void;
  onAuthorClick?: () => void;
  onVote: (voteType: "up" | "down") => void;
};

export function EdgecaseCard({
  id,
  title,
  author,
  tags,
  description,
  votes,
  userVote,
  commentCount = 0,
  currentLogin,
  hasStoredLog,
  canCheckLog,
  onOpen,
  onReplay,
  onCheckLog,
  onAuthorClick,
  onVote,
}: edgecaseCardProps) {
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState(commentCount);
  const [optimisticVotes, setOptimisticVotes] = useState(votes);
  const [optimisticUserVote, setOptimisticUserVote] = useState(userVote);

  const handleDownVote = () => {
    if (optimisticUserVote === "down") {
      setOptimisticVotes((v) => v + 1);
      setOptimisticUserVote(undefined);
      onVote("down");
    } else {
      const delta = optimisticUserVote === "up" ? 2 : 1;
      setOptimisticVotes((v) => v - delta);
      setOptimisticUserVote("down");
      onVote("down");
    }
  };

  const handleUpVote = () => {
    if (optimisticUserVote === "up") {
      setOptimisticVotes((v) => v - 1);
      setOptimisticUserVote(undefined);
      onVote("up");
    } else {
      const delta = optimisticUserVote === "down" ? 2 : 1;
      setOptimisticVotes((v) => v + delta);
      setOptimisticUserVote("up");
      onVote("up");
    }
  };

  return (
    <div
      className="flex gap-4 rounded-xl border border-white/10 bg-black/20 p-4"
    >
      <div className="flex flex-col items-center justify-start gap-1">
        <button
          onClick={handleUpVote}
          className={`p-1 rounded transition cursor-pointer ${optimisticUserVote === "up"
            ? "text-green-500"
            : "text-white/40 hover:text-green-400 hover:bg-white/5"
            }`}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="m18 15-6-6-6 6" />
          </svg>
        </button>
        <span
          className={`text-sm font-semibold tabular-nums ${optimisticUserVote === "up"
            ? "text-green-500"
            : optimisticUserVote === "down"
              ? "text-red-500"
              : "text-white/80"
            }`}
        >
          {optimisticVotes}
        </span>
        <button
          onClick={handleDownVote}
          className={`p-1 rounded transition cursor-pointer ${optimisticUserVote === "down"
            ? "text-red-500"
            : "text-white/40 hover:text-red-400 hover:bg-white/5"
            }`}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="m6 9 6 6 6-6" />
          </svg>
        </button>
      </div>
      <div className="flex flex-1 flex-col min-w-0">
      <div className="flex flex-1 flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2 min-w-0">
          <div className="flex flex-wrap items-center gap-3">
            <h4 className="text-base sm:text-lg font-semibold text-white/90 break-words">
              {title}
            </h4>
            <button type="button" onClick={onAuthorClick} className="text-xs text-white/40 hover:text-white hover:underline cursor-pointer">By @{author}</button>
          </div>
          <p className="text-sm text-white/45 max-w-2xl leading-relaxed">{description}</p>
          <div className="flex flex-wrap gap-2">
            {tags.map((tag) => (
              <Badge
                key={tag}
                variant="outline"
                className="border-white/10 bg-white/5 text-[10px] text-white/60 px-2.5 py-0.5"
              >
                {tag}
              </Badge>
            ))}
          </div>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2 self-start sm:self-center">
          <Button
            onClick={onOpen}
            variant="outline"
            title="Load the command and settings, then run your program"
            className="text-white/70 text-xs font-semibold px-4.5 py-1.5 rounded-full border border-white/10 hover:bg-white/10 hover:text-white transition cursor-pointer h-9"
          >
            Open
          </Button>
          {hasStoredLog && onReplay && (
            <Button
              onClick={onReplay}
              variant="outline"
              title="Load the log the author published"
              className="text-white/70 text-xs font-semibold px-4 py-1.5 rounded-full border border-white/10 hover:bg-white/10 hover:text-white transition cursor-pointer h-9"
            >
              Replay
            </Button>
          )}
          {canCheckLog && onCheckLog && (
            <Button
              onClick={onCheckLog}
              title="Validate your current log against this edge case's command"
              className="text-black bg-white text-xs font-semibold px-4 py-1.5 rounded-full hover:bg-white/90 transition cursor-pointer h-9"
            >
              Check my log
            </Button>
          )}
        </div>
      </div>
      <button
        type="button"
        onClick={() => setShowComments((v) => !v)}
        className="mt-3 flex items-center gap-1.5 self-start text-xs text-white/40 hover:text-white/80 cursor-pointer"
      >
        <MessageSquare className="h-3.5 w-3.5" />
        {comments} comment{comments === 1 ? "" : "s"}
      </button>
      {showComments && (
        <EdgecaseComments edgecaseId={id} currentLogin={currentLogin} onCountChange={(d) => setComments((c) => Math.max(0, c + d))} />
      )}
      </div>
    </div>
  );
}

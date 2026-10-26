import { useState } from "react";
import { ChevronDown, ChevronUp, MessageSquare } from "lucide-react";
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
      className="flex gap-4 rounded-2xl border border-white/10 bg-[#121215]/80 backdrop-blur-md shadow-xl p-5 hover:border-white/20 transition-colors duration-500"
    >
      <div className="flex flex-col items-center justify-start gap-0.5 rounded-xl border border-white/5 bg-white/5 px-1 py-1.5 self-start">
        <button
          onClick={handleUpVote}
          aria-label="Upvote"
          aria-pressed={optimisticUserVote === "up"}
          className={`p-1 rounded-lg transition cursor-pointer ${optimisticUserVote === "up"
            ? "text-emerald-400 bg-emerald-400/10"
            : "text-white/40 hover:text-emerald-300 hover:bg-white/10"
            }`}
        >
          <ChevronUp className="w-4 h-4" />
        </button>
        <span
          className={`text-sm font-bold tabular-nums ${optimisticUserVote === "up"
            ? "text-emerald-400"
            : optimisticUserVote === "down"
              ? "text-red-400"
              : "text-white"
            }`}
        >
          {optimisticVotes}
        </span>
        <button
          onClick={handleDownVote}
          aria-label="Downvote"
          aria-pressed={optimisticUserVote === "down"}
          className={`p-1 rounded-lg transition cursor-pointer ${optimisticUserVote === "down"
            ? "text-red-400 bg-red-400/10"
            : "text-white/40 hover:text-red-300 hover:bg-white/10"
            }`}
        >
          <ChevronDown className="w-4 h-4" />
        </button>
      </div>
      <div className="flex flex-1 flex-col min-w-0">
      <div className="flex flex-1 flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2 min-w-0">
          <div className="flex flex-wrap items-center gap-3">
            <h4 className="text-base font-semibold text-white/90 tracking-tight break-words">
              {title}
            </h4>
            <button type="button" onClick={onAuthorClick} className="text-[11px] text-white/40 hover:text-white hover:underline cursor-pointer">by @{author}</button>
          </div>
          <p className="text-sm text-white/45 max-w-2xl leading-relaxed">{description}</p>
          <div className="flex flex-wrap gap-2">
            {tags.map((tag) => (
              <Badge
                key={tag}
                variant="outline"
                className="border-white/5 bg-white/5 text-[10px] text-white/50 px-2.5 py-0.5"
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
            className="h-9 px-4 rounded-xl border border-white/10 bg-white/5 text-xs font-medium text-white/80 hover:bg-white/10 hover:text-white transition active:scale-95 cursor-pointer"
          >
            Open
          </Button>
          {hasStoredLog && onReplay && (
            <Button
              onClick={onReplay}
              variant="outline"
              title="Load the log the author published"
              className="h-9 px-4 rounded-xl border border-white/10 bg-white/5 text-xs font-medium text-white/80 hover:bg-white/10 hover:text-white transition active:scale-95 cursor-pointer"
            >
              Replay
            </Button>
          )}
          {canCheckLog && onCheckLog && (
            <Button
              onClick={onCheckLog}
              title="Validate your current log against this edge case's command"
              className="h-9 px-4 rounded-xl bg-white text-black text-xs font-semibold tracking-wide hover:bg-white/90 transition active:scale-95 cursor-pointer"
            >
              Check my log
            </Button>
          )}
        </div>
      </div>
      <button
        type="button"
        onClick={() => setShowComments((v) => !v)}
        className="mt-4 flex items-center gap-1.5 self-start text-[11px] font-medium text-white/40 hover:text-white transition-colors cursor-pointer"
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

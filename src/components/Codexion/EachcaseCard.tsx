import { useState } from "react";

type EachcaseCardProps = {
  id: string;
  title: string;
  author: string;
  tags: string[];
  description: string;
  votes: number;
  userVote?: "up" | "down";
  onOpen: () => void;
  onVote: (voteType: "up" | "down") => void;
};

export function EachcaseCard({
  title,
  author,
  tags,
  description,
  votes,
  userVote,
  onOpen,
  onVote,
}: EachcaseCardProps) {
  const [optimisticVotes, setOptimisticVotes] = useState(votes);
  const [optimisticUserVote, setOptimisticUserVote] = useState(userVote);
  const handleDownVote = () => {
    if (optimisticUserVote === "down") return;
    const delta = optimisticUserVote === "up" ? 2 : 1;
    setOptimisticVotes((v) => v - delta);
    setOptimisticUserVote("down");

    onVote("down");
  };

  const handleUpVote = () => {
    if (optimisticUserVote === "up") return;
    const delta = optimisticUserVote === "down" ? 2 : 1;
    setOptimisticVotes((v) => v + delta);
    setOptimisticUserVote("up");

    onVote("up");
  };
  return (
    <div className="flex gap-4 rounded-xl border border-white/10 bg-black/20 p-4">
      <div className="flex flex-col items-center justify-start gap-1">
        <button
          onClick={handleUpVote}
          className={`p-1 rounded transition ${userVote === "up" ? "text-green-500" : "text-white/40 hover:text-green-400 hover:bg-white/5"}`}
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
          className={`text-sm font-medium ${userVote === "up" ? "text-green-500" : userVote === "down" ? "text-red-500" : "text-white/80"}`}
        >
          {optimisticVotes}
        </span>
        <button
          onClick={handleDownVote}
          className={`p-1 rounded transition ${userVote === "down" ? "text-red-500" : "text-white/40 hover:text-red-400 hover:bg-white/5"}`}
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
      <div className="flex flex-1 flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-3">
            <h4 className="text-base sm:text-lg font-semibold text-white/90">
              {title}
            </h4>
            <span className="text-xs text-white/40">By @{author}</span>
          </div>
          <p className="text-sm text-white/45 max-w-2xl">{description}</p>
          <div className="flex flex-wrap gap-2">
            {tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] text-white/60"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
        <button
          onClick={onOpen}
          className="self-start sm:self-center text-white/60 text-xs font-medium px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 border border-white/10 transition"
        >
          Open
        </button>
      </div>
    </div>
  );
}

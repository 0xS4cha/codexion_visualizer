import { motion } from "motion/react";
import { useNavigate } from "react-router-dom";
import { useMemo } from "react";
import { formatDistanceToNowStrict } from "date-fns";
import { Github, Star, GitPullRequest, MessageSquare, Heart, Users as UsersIcon, Eye, Earth, GitCommitHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback, AvatarGroupCount, AvatarGroup } from "@/components/ui/avatar";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import { Progress } from "@/components/ui/progress";

import Users from "@/assets/users.json";
import { UserReadme } from "@/types/user";
import { usePulse } from "@/hooks/usePulse";
import { countryFlag } from "@/lib/worldStats";

const MAX_AVATARS_PREVIEW = 5;
const MAX_FLAGS_PREVIEW = 5;
const STAR_GOALS = [10, 25, 50, 100, 150, 250, 500, 1000, 2500, 5000];

function nextStarGoal(stars: number): number {
  return STAR_GOALS.find((g) => g > stars) ?? Math.ceil((stars + 1) / 5000) * 5000;
}

export default function GitHubCTA() {
  const navigate = useNavigate();
  const userList = Users as UserReadme[];
  const previewUsers = userList.slice(0, MAX_AVATARS_PREVIEW);
  const remainingCount = Math.max(userList.length - MAX_AVATARS_PREVIEW, 0);
  const pulse = usePulse();
  const repo = pulse?.repo ?? null;
  const starGoal = repo ? nextStarGoal(repo.stars) : 0;

  const countries = useMemo(
    () => Object.entries(pulse?.visitorsByCountry ?? {}).sort((a, b) => b[1] - a[1]).map(([code]) => code),
    [pulse]
  );
  const regionNames = useMemo(() => new Intl.DisplayNames(["en"], { type: "region" }), []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="relative overflow-hidden rounded-2xl border border-white/10 bg-[#121215]/80 backdrop-blur-md p-6 sm:p-8"
    >
      <div className="absolute inset-0 -z-10 bg-[#0a0a0d] sm:hidden" />

      <div className="absolute -right-16 -top-16 -z-10 h-44 w-44 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />
      <div className="absolute -left-16 -bottom-16 -z-10 h-44 w-44 rounded-full bg-pink-500/10 blur-3xl pointer-events-none" />

      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="outline" className="border-white/15 bg-white/5 text-white/60">
              <span className="flex h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse" />
              Open Source
            </Badge>

            <Badge variant="outline" className="border-white/15 bg-white/5 text-white/60">
              42 Common Core
            </Badge>

            {repo?.pushedAt && (
              <Badge variant="outline" className="border-white/15 bg-white/5 text-white/60 flex items-center gap-1" title={new Date(repo.pushedAt).toLocaleString()}>
                <GitCommitHorizontal className="w-3 h-3" />
                Updated {formatDistanceToNowStrict(new Date(repo.pushedAt), { addSuffix: true })}
              </Badge>
            )}

            {pulse && pulse.liveVisitors > 0 && (
              <Badge variant="outline" className="border-emerald-400/20 bg-emerald-400/5 text-emerald-300/80 flex items-center gap-1.5">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 animate-ping" />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
                </span>
                {pulse.liveVisitors} online now
              </Badge>
            )}

            {userList.length > 0 && (
              <Badge variant="outline" className="border-white/15 bg-white/5 text-white/60 flex items-center gap-1">
                <UsersIcon className="w-3 h-3" />
                {userList.length} student{userList.length > 1 ? "s" : ""} mention us in their project READMEs.
              </Badge>
            )}
          </div>

          <h3 className="text-xl font-bold tracking-tight text-white/90 flex items-center gap-2">
            <Github className="w-5 h-5 text-white/80" />
            Support Codexion Visualizer
          </h3>
          <p className="text-sm text-white/45 max-w-xl leading-relaxed">
            This visualizer is <strong>100% free and open-source</strong>. It was built to help 42 students debug and optimize their scheduler algorithms. If this helper saved you time, please support us with a star or contribute an issue!
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {previewUsers.length > 0 && (
              <button
                type="button"
                onClick={() => navigate("/community")}
                className="group flex items-center gap-2 w-fit rounded-full pr-3 py-1 pl-1 border border-white/10 bg-white/5 hover:bg-white/10 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
                aria-label="See all the developers who have added this link to their codexion README"
              >
                <AvatarGroup>
                  {previewUsers.map((u) => (
                    <Avatar key={u.username} className="h-6 w-6 border-2 border-[#121215]">
                      <AvatarImage src={u.avatar_url} alt={u.username} />
                      <AvatarFallback className="text-[10px]">
                        {u.username?.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  ))}
                  {remainingCount > 0 && (
                    <AvatarGroupCount className="h-6 w-6 border-2 border-[#121215] bg-[#121215]">
                      +{remainingCount}
                    </AvatarGroupCount>
                  )}
                </AvatarGroup>

                <Eye
                  aria-hidden="true"
                  className="h-3.5 w-3.5 text-white/40 transition-all duration-200 group-hover:text-white/80 group-hover:translate-x-0.5"
                />
              </button>
          )}
          <button
            type="button"
            onClick={() => navigate("/world")}
            className="group flex items-center gap-2 w-fit rounded-full px-3 py-1 border border-white/10 bg-white/5 hover:bg-white/10 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
            aria-label="View Global Simulation Reach"
          >
            {countries.length > 0 ? (
              <>
                <span className="flex -space-x-1 text-sm leading-none" aria-hidden="true">
                  {countries.slice(0, MAX_FLAGS_PREVIEW).map((code) => (
                    <span key={code} title={regionNames.of(code)}>{countryFlag(code)}</span>
                  ))}
                </span>
                <span className="text-xs text-white/60">
                  Used in {countries.length} countr{countries.length > 1 ? "ies" : "y"}
                </span>
              </>
            ) : (
              <Earth className="w-4 h-4 text-white/70" />
            )}
            <Eye
              aria-hidden="true"
              className="h-3.5 w-3.5 text-white/40 transition-all duration-200 group-hover:text-white/80 group-hover:translate-x-0.5"
            />
          </button>
        </div>
        <div className="flex flex-wrap gap-3">
          <TooltipProvider delayDuration={200}>
            <Tooltip>
              <TooltipTrigger asChild>
                <a
                  href="https://github.com/0xS4cha/codexion_visualizer"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Add a star on github"
                  className="rounded-full bg-white text-black hover:bg-white/90 px-5 py-2 text-xs font-semibold cursor-pointer inline-flex items-center gap-2 focus-visible:ring-2 focus-visible:ring-white/50"
                >
                  <Star className="w-3.5 h-3.5 fill-current" />
                  Star on GitHub
                  {repo && (
                    <span className="ml-1 border-l border-black/15 pl-2 tabular-nums">{repo.stars.toLocaleString()}</span>
                  )}
                </a>
              </TooltipTrigger>
              <TooltipContent  side={"bottom"}>It takes 2 seconds and helps a lot 🙏</TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <Button
            asChild
            variant="outline"
            className="rounded-full border border-white/10 bg-white/5 px-5 py-2 text-xs font-medium text-white/70 hover:bg-white/10 hover:text-white cursor-pointer flex items-center gap-2 focus-visible:ring-2 focus-visible:ring-white/40"
          >
            <a
              href="https://github.com/0xS4cha/codexion_visualizer/issues"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Open an issue on github"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              Open an Issue
            </a>
          </Button>

          <Button
            asChild
            variant="outline"
            className="rounded-full border border-white/10 bg-white/5 px-5 py-2 text-xs font-medium text-white/70 hover:bg-white/10 hover:text-white cursor-pointer flex items-center gap-2 focus-visible:ring-2 focus-visible:ring-white/40"
          >
            <a
              href="https://github.com/0xS4cha/codexion_visualizer/pulls"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Contribute with a pull request"
            >
              <GitPullRequest className="w-3.5 h-3.5" />
              Contribute
            </a>
          </Button>
        </div>

        {repo && (
          <div className="flex flex-col gap-1.5 max-w-sm">
            <div className="flex justify-between text-[11px] text-white/40">
              <span>Next goal: {starGoal.toLocaleString()} stars</span>
              <span className="tabular-nums">{repo.stars} / {starGoal}</span>
            </div>
            <Progress
              value={(repo.stars / starGoal) * 100}
              className="h-1.5 bg-white/10 [&>[data-slot=progress-indicator]]:bg-gradient-to-r [&>[data-slot=progress-indicator]]:from-amber-300 [&>[data-slot=progress-indicator]]:to-yellow-500"
              aria-label="Progress towards the next star goal"
            />
          </div>
        )}

        <div className="flex items-center gap-4 border-t border-white/5 pt-4 text-xs text-white/30">
          <div className="flex items-center gap-1">
            <Heart className="w-3.5 h-3.5 text-red-500 fill-current" />
            <span>Built by 42 students for 42 students</span>
          </div>
          <span>•</span>
          <span>MIT License</span>
        </div>
      </div>
    </motion.div>
  );
}
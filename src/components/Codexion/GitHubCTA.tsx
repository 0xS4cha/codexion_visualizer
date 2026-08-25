import { motion } from "motion/react";
import { useNavigate } from "react-router-dom";
import { Github, Star, GitPullRequest, MessageSquare, Heart, Users as UsersIcon, Eye, Earth } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback, AvatarGroupCount, AvatarGroup } from "@/components/ui/avatar";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import Users from "@/assets/users.json";
import { UserReadme } from "@/types/user";

const MAX_AVATARS_PREVIEW = 5;

export default function GitHubCTA() {
  const navigate = useNavigate();
  const userList = Users as UserReadme[];
  const previewUsers = userList.slice(0, MAX_AVATARS_PREVIEW);
  const remainingCount = Math.max(userList.length - MAX_AVATARS_PREVIEW, 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
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
            <HoverCard openDelay={100}>
              <HoverCardTrigger asChild>
              <button
                type="button"
                className="group flex items-center gap-2 w-fit rounded-full pr-3 py-1 pl-1 border border-white/10 bg-white/5 hover:bg-white/10 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
                aria-label="See the developers who have added this link to their codexion README."
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
              </HoverCardTrigger>
              <HoverCardContent className="w-72 border-white/10 bg-[#121215] text-white/80">
                <p className="text-xs text-white/50 mb-2">
                  These students mentioned Codexion Visualizer in their project's README:<br/> (update all 24h)
                </p>
                <ul className="flex flex-col gap-1 max-h-40 overflow-y-auto pr-1">
                  {userList.map((u) => (
                    <li key={u.username}>
                      <a
                        href={`https://github.com/${u.username}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-white/70 hover:text-white hover:underline focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white/40 rounded"
                      >
                        @{u.username}
                      </a>
                    </li>
                  ))}
                </ul>
              </HoverCardContent>
            </HoverCard>
          )}
          <Button
            asChild
            variant="outline"
            onClick={() => navigate("/world")}
            className="rounded-full border border-white/10 bg-white/5 w-[34px] h-[34px] p-0 text-xs font-medium text-white/70 hover:bg-white/10 hover:text-white cursor-pointer flex items-center justify-center focus-visible:ring-2 focus-visible:ring-white/40"
          >
            <button aria-label="View Global Simulation Reach">
              <Earth className="w-4 h-4" />
            </button>
          </Button>
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
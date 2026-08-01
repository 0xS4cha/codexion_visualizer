import { motion } from "motion/react";
import { Github, Star, GitPullRequest, MessageSquare, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function GitHubCTA() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="relative overflow-hidden rounded-2xl border border-white/10 bg-[#121215]/80 backdrop-blur-md p-6 sm:p-8"
    >

      <div className="absolute -right-16 -top-16 -z-10 h-44 w-44 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />
      <div className="absolute -left-16 -bottom-16 -z-10 h-44 w-44 rounded-full bg-pink-500/10 blur-3xl pointer-events-none" />

      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="border-white/15 bg-white/5 text-white/60">
              <span className="flex h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse" />
              Open Source
            </Badge>
            <Badge variant="outline" className="border-white/15 bg-white/5 text-white/60">
              42 Common Core
            </Badge>
          </div>
          <h3 className="text-xl font-bold tracking-tight text-white/90 flex items-center gap-2">
            <Github className="w-5 h-5 text-white/80" />
            Support Codexion Visualizer
          </h3>
          <p className="text-sm text-white/45 max-w-xl leading-relaxed">
            This visualizer is <strong>100% free and open-source</strong>. It was built to help 42 students debug and optimize their scheduler algorithms. If this helper saved you time, please support us with a star or contribute an issue!
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Button
            asChild
            variant="default"
            className="rounded-full bg-white text-black hover:bg-white/90 px-5 py-2 text-xs font-semibold cursor-pointer flex items-center gap-2"
          >
            <a
              href="https://github.com/0xS4cha/codexion_visualizer"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Star className="w-3.5 h-3.5 fill-current" />
              Star on GitHub
            </a>
          </Button>

          <Button
            asChild
            variant="outline"
            className="rounded-full border border-white/10 bg-white/5 px-5 py-2 text-xs font-medium text-white/70 hover:bg-white/10 hover:text-white cursor-pointer flex items-center gap-2"
          >
            <a
              href="https://github.com/0xS4cha/codexion_visualizer/issues"
              target="_blank"
              rel="noopener noreferrer"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              Open an Issue
            </a>
          </Button>

          <Button
            asChild
            variant="outline"
            className="rounded-full border border-white/10 bg-white/5 px-5 py-2 text-xs font-medium text-white/70 hover:bg-white/10 hover:text-white cursor-pointer flex items-center gap-2"
          >
            <a
              href="https://github.com/0xS4cha/codexion_visualizer/pulls"
              target="_blank"
              rel="noopener noreferrer"
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

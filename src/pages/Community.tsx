import { motion, Variants } from "motion/react";
import { Github, Users as UsersIcon, Heart, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { BackButton } from "@/components/Codexion/BackButton";
import Users from "@/assets/users.json";
import { UserReadme } from "@/types/user";
import Header from "@/components/Codexion/Header";
import Footer from "@/components/Codexion/Footer";

export default function Community() {
  const navigate = useNavigate();
  const userList = Users as UserReadme[];

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } },
  };

  return (
    <div className="min-h-screen bg-[#0a0a0d] text-white/90 selection:bg-white/20 selection:text-white">
      <Header />
      <div className="relative max-w-6xl mx-auto px-6 py-12 pt-24">
        <header className="mb-16 flex flex-col md:flex-row md:items-end justify-between gap-8">
          <div className="flex flex-col gap-6">
            <div className="-ml-4">
              <BackButton />
            </div>

            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <div className="flex items-center gap-3 mb-4 flex-wrap">
                <Badge variant="outline" className="border-white/10 bg-white/5 text-white/70">
                  <Heart className="w-3 h-3 text-white/70 fill-current" />
                </Badge>
                <Badge variant="outline" className="border-white/10 bg-white/5 text-white/70">
                  <UsersIcon className="w-3 h-3 mr-1.5" />
                  {userList.length} Supporters
                </Badge>
              </div>
              <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-white mb-4">
                Community
              </h1>
              <p className="text-lg text-white/50 max-w-2xl leading-relaxed">
                A massive thank you to all the amazing 42 students who have added Codexion to their project's README. Your support keeps this project alive and growing.
              </p>
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="w-full max-w-md"
          >
            <Card className="w-full bg-black/40 backdrop-blur-md border-white/10 text-white/90">
              <CardHeader className="pb-6">
                <CardTitle className="text-base flex items-center gap-2">
                  <Github className="w-5 h-5 text-white/70" />
                  Want to be on this wall?
                </CardTitle>
                <CardDescription className="text-sm text-white/50 leading-relaxed mt-2">
                  Add a link to the Codexion Visualizer in your project's README, and you'll automatically be added here (updates every 24h).
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  asChild
                  className="w-full bg-white text-black hover:bg-white/90 hover:text-black font-semibold text-sm h-11 transition-colors focus-visible:ring-2 focus-visible:ring-white/50"
                >
                  <a
                    href="https://github.com/0xS4cha/codexion_visualizer"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center"
                  >
                    <Github className="w-4 h-4 mr-2" />
                    View Repository
                  </a>
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        </header>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"
        >
          {userList.map((user) => (
            <motion.a
              key={user.username}
              href={user.url || `https://github.com/${user.username}`}
              target="_blank"
              rel="noopener noreferrer"
              variants={itemVariants}
              className="group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40 block rounded-xl outline-none"
            >
              <Card className="h-full relative overflow-hidden border-white/5 bg-zinc-950/60 hover:bg-zinc-900/80 transition-all duration-300 hover:border-white/20">
                <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                <CardContent className="p-5 flex items-center gap-4">
                  <div className="relative">
                    <Avatar className="h-12 w-12 border border-white/10 group-hover:border-white/30 transition-colors">
                      <AvatarImage src={user.avatar_url} alt={user.username} />
                      <AvatarFallback className="bg-zinc-900 text-white/50">
                        {user.username?.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="absolute -bottom-1 -right-1 bg-zinc-950 rounded-full p-0.5 border border-white/10">
                      <Github className="w-3.5 h-3.5 text-white/50" />
                    </div>
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white/90 truncate group-hover:text-white transition-colors">
                      @{user.username}
                    </p>
                    <p className="text-xs text-white/40 truncate mt-0.5">
                      42 Student
                    </p>
                  </div>

                  <ExternalLink className="w-4 h-4 text-white/20 group-hover:text-white/60 transition-colors opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transform duration-300" />
                </CardContent>
              </Card>
            </motion.a>
          ))}
        </motion.div>

        {userList.length === 0 && (
          <div className="py-20 text-center flex flex-col items-center justify-center border border-dashed border-white/10 rounded-2xl bg-[#121215]/30 backdrop-blur-sm">
            <UsersIcon className="w-12 h-12 text-white/20 mb-4" />
            <p className="text-white/50 font-medium">No supporters found yet.</p>
            <p className="text-white/30 text-sm mt-1">Be the first to add Codexion to your README!</p>
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}

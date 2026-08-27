import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import ShapeGrid from "@/components/ui/Backgrounds/ShapeGrid/ShapeGrid";
import Header from "@/components/Codexion/Header";
import { HomeIcon } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col overflow-hidden">
      <div className="fixed inset-0 -z-10 bg-[#0a0a0d]">
        <ShapeGrid
          speed={0.5}
          squareSize={40}
          direction="diagonal"
          borderColor="#2F293A"
          hoverFillColor="#222"
          shape="square"
          hoverTrailAmount={0}
        />
      </div>
      <Header />

      <main className="flex flex-1 items-center justify-center px-4 pt-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="flex max-w-md flex-col items-center justify-center rounded-2xl border border-white/10 bg-white/5 p-10 text-center backdrop-blur-md"
        >
          <motion.div
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{
              type: "spring",
              stiffness: 260,
              damping: 20,
              delay: 0.1,
            }}
            className="mb-6 flex h-24 w-24 items-center justify-center"
          >
            <span className="text-4xl font-bold text-white/80">404</span>
          </motion.div>

          <h1 className="mb-3 text-2xl font-bold tracking-tight text-white/90">
            Page Not Found
          </h1>
          <p className="mb-8 text-sm leading-relaxed text-white/50">
            The page you are looking for doesn't exist or has been moved.
          </p>

          <Link
            to="/"
            className="flex items-center gap-2 rounded-full bg-white px-6 py-2.5 text-sm font-semibold text-black transition-transform hover:scale-105 active:scale-95"
          >
            <HomeIcon className="h-4 w-4" />
            Back to Home
          </Link>
        </motion.div>
      </main>
    </div>
  );
}
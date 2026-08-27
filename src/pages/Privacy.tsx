import { motion } from "motion/react";
import { BackButton } from "@/components/Codexion/BackButton";
import { privacies } from "@/config/privacy"
import Footer from "@/components/Codexion/Footer";
import Header from "@/components/Codexion/Header";
export default function Privacy() {
  return (
    <div className="min-h-screen bg-[#0a0a0d] text-white/90 selection:bg-white/20 selection:text-white">
      <Header />
      <div className="relative max-w-4xl mx-auto px-6 py-12 pt-24">
        <header className="mb-12 flex flex-col gap-6">
          <div className="-ml-4">
            <BackButton />
          </div>

          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-white mb-4">
              Privacy Policy
            </h1>
            <p className="text-lg text-white/50 max-w-2xl leading-relaxed">
              How we handle your data, logs, and telemetry while using the Codexion Visualizer.
            </p>
          </motion.div>
        </header>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="space-y-12 pb-24 text-white/80"
        >
          {privacies.map((u) => (
            <section>
              <div className="flex items-center gap-3 mb-4">
                <h2 className="text-2xl font-semibold text-white">{u.id}. {u.title}</h2>
              </div>
              <p className="text-lg leading-relaxed text-white/60">
                {u.content}
              </p>
            </section>
          ))}
        </motion.div>
      </div>
      <Footer />
    </div>
  );
}

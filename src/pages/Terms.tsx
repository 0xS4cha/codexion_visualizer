import { motion } from "motion/react";
import { BackButton } from "@/components/Codexion/BackButton";

export default function Terms() {
  return (
    <div className="min-h-screen bg-[#0a0a0d] text-white/90 font-sans selection:bg-white/20 selection:text-white">
      <div className="relative max-w-4xl mx-auto px-6 py-12">
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
              Terms of Service
            </h1>
            <p className="text-lg text-white/50 max-w-2xl leading-relaxed">
              Guidelines and rules for using the Codexion Visualizer platform, a 42 school student project.
            </p>
          </motion.div>
        </header>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="space-y-12 pb-24 text-white/80"
        >
          <section>
            <div className="flex items-center gap-3 mb-4">
              <h2 className="text-2xl font-semibold text-white">1. Nature of the Project</h2>
            </div>
            <p className="text-lg leading-relaxed text-white/60">
              Codexion Visualizer is an educational project created by students (@0xS4cha and @69Nesta) as part of the 42 curriculum. It is designed to help visualize and debug datasets and program logs. By using this tool, you acknowledge that it is provided "as is" without any guarantees of continuous operation or support.
            </p>
          </section>

          <section>
            <div className="flex items-center gap-3 mb-4">
              <h2 className="text-2xl font-semibold text-white">2. Acceptable Use</h2>
            </div>
            <p className="text-lg leading-relaxed text-white/60">
              You agree to use Codexion strictly for educational, debugging, and visualization purposes. You may input raw JSON, text logs, and other data structures. Do not use this platform to process sensitive, confidential, or personally identifiable information, as we do not guarantee the absolute security of inputted data.
            </p>
          </section>

          <section>
            <div className="flex items-center gap-3 mb-4">
              <h2 className="text-2xl font-semibold text-white">3. Limitation of Liability</h2>
            </div>
            <p className="text-lg leading-relaxed text-white/60">
              The authors and 42 school shall not be held liable for any damages, data loss, or misinterpretations resulting from the use of the visualization tools. The visualizations (timeline, circle table, metrics) are interpretations of your data and may contain inaccuracies.
            </p>
          </section>

          <section>
            <div className="flex items-center gap-3 mb-4">
              <h2 className="text-2xl font-semibold text-white">4. Intellectual Property</h2>
            </div>
            <p className="text-lg leading-relaxed text-white/60">
              The visualizer interface, code structure, and design belong to their respective authors. You may fork or use the repository under the terms of its included LICENSE. Your data remains your property, and we do not claim any ownership over the logs or datasets you process through the tool.
            </p>
          </section>
        </motion.div>
      </div>
    </div>
  );
}

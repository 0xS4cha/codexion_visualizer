import { motion } from "motion/react";
import { BackButton } from "@/components/Codexion/BackButton";

export default function Privacy() {
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
          <section>
            <div className="flex items-center gap-3 mb-4">
              <h2 className="text-2xl font-semibold text-white">1. Data Processing</h2>
            </div>
            <p className="text-lg leading-relaxed text-white/60">
              When you use Codexion Visualizer, the data you input (JSON, logs, or other structures) is primarily processed client-side in your browser to generate the visualizations (timeline, tables, analysis). We do not store your debug logs or datasets on our servers.
            </p>
          </section>

          <section>
            <div className="flex items-center gap-3 mb-4">
              <h2 className="text-2xl font-semibold text-white">2. Telemetry and Analytics</h2>
            </div>
            <p className="text-lg leading-relaxed text-white/60">
              To understand how the platform is used and to populate the Global Simulation Reach map, we collect basic, anonymized telemetry data. This includes page visits (e.g., hitting our <code>/api/visit</code> endpoint) and aggregated statistics like visitor count by country, referrers, and browser types. This data does not personally identify you.
            </p>
          </section>

          <section>
            <div className="flex items-center gap-3 mb-4">
              <h2 className="text-2xl font-semibold text-white">3. Third-Party Services</h2>
            </div>
            <p className="text-lg leading-relaxed text-white/60">
              We use services like MapLibre for rendering the global statistics map and may use standard web infrastructure (like Vercel) for hosting. These providers may collect standard network logs (such as IP addresses) as part of their operational requirements.
            </p>
          </section>

          <section>
            <div className="flex items-center gap-3 mb-4">
              <h2 className="text-2xl font-semibold text-white">4. Security</h2>
            </div>
            <p className="text-lg leading-relaxed text-white/60">
              While we strive to protect the integrity of the tool, remember this is an educational project. Please refrain from pasting highly sensitive production logs, API keys, or personal information into the visualizer, as browser extensions or network intermediaries could potentially intercept local data.
            </p>
          </section>
        </motion.div>
      </div>
    </div>
  );
}

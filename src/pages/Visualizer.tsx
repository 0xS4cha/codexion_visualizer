import { useEffect } from "react";
import ShapeGrid from "@/components/ui/Backgrounds/ShapeGrid/ShapeGrid";
import CodexionTimeline from "@/components/Codexion/CodexionTimeline";
import CodexionTable from "@/components/Codexion/CodexionTable";
import CodexionStats from "@/components/Codexion/CodexionStats";
import CodexionOptions from "@/components/Codexion/CodexionOptions";
import CodexionOutput from "@/components/Codexion/CodexionOutput";
import CodexionCommand from "@/components/Codexion/CodexionCommand";
import CodexionAnalysis from "@/components/Codexion/CodexionAnalysis";
import CodexionCompare from "@/components/Codexion/CodexionCompare";
import Header from "@/components/Codexion/Header";
import Footer from "@/components/Codexion/Footer";
import GitHubCTA from "@/components/Codexion/GitHubCTA";
import { CodexionSimulationProvider, useCodexionSimulationContext } from "@/context/CodexionSimulationContext";
import { useAppSelector, useAppDispatch } from "@/store/hooks";
import { setCommand, setOutput } from "@/store/features/inputSlice";
import { setInstantAction, setDongleCooldown } from "@/store/features/settingsSlice";
import { setActiveTab } from "@/store/features/viewSlice";
import type { VisualizerTab } from "@/store/features/viewSlice";
import { usePlayback } from "@/hooks/usePlayback";
import { decodeShare } from "@/lib/share";
import { toast } from "sonner";
import { motion, AnimatePresence } from "motion/react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";


function EmptyState() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="flex flex-col items-center justify-center border border-white/10 bg-white/5 backdrop-blur-md rounded-2xl p-12 text-center h-[340px]"
    >
      <motion.div
        animate={{
          scale: [1, 1.05, 1],
          opacity: [0.5, 0.8, 0.5]
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        className="w-14 h-14 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mb-5 text-white/40"
      >
        <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      </motion.div>
      <h3 className="text-lg font-semibold text-white/90 mb-2">No Simulation Data</h3>
      <p className="text-sm text-white/45 max-w-md mb-6 leading-relaxed">
        Run a local simulation by clicking the button on the left, or paste your program logs in the text area.
      </p>
      <div className="flex flex-wrap justify-center gap-3">
        <Badge variant="outline" className="flex items-center gap-1.5 px-3 py-1 bg-white/5 border-white/5 text-white/40 text-[10px]">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
          compilation
        </Badge>
        <Badge variant="outline" className="flex items-center gap-1.5 px-3 py-1 bg-white/5 border-white/5 text-white/40 text-[10px]">
          <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
          debugging
        </Badge>
        <Badge variant="outline" className="flex items-center gap-1.5 px-3 py-1 bg-white/5 border-white/5 text-white/40 text-[10px]">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
          refactoring
        </Badge>
      </div>
    </motion.div>
  );
}

const TABS: VisualizerTab[] = ['timeline', 'table', 'analysis', 'compare'];

function PlaybackDriver() {
  const { data } = useCodexionSimulationContext();
  usePlayback(data ? data.visualToReal(data.maxTime) : null, data ? data.visualToReal(data.minTime) : 0);
  return null;
}

function AnalysisStatus() {
  const { data, isLoading, error } = useCodexionSimulationContext();
  if (error) return <span className="text-[11px] text-red-300">Analysis failed: {error.message}</span>;
  if (isLoading) return <span className="text-[11px] text-white/40 animate-pulse">Analyzing…</span>;
  if (!data) return null;
  const errors = data.issues.filter((i) => i.type === 'error').length;
  return (
    <span className={`text-[11px] ${errors ? 'text-red-300' : 'text-emerald-300/80'}`}>
      {errors ? `${errors} error${errors > 1 ? 's' : ''} found` : 'No errors found'}
    </span>
  );
}

export default function Visualizer() {
  useEffect(() => {
    fetch("/api/visit", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ path: window.location.pathname }),
    }).catch(() => undefined);
  }, []);

  const dispatch = useAppDispatch();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tabParam = params.get("tab");
    if (tabParam && (TABS as string[]).includes(tabParam)) {
      dispatch(setActiveTab(tabParam as VisualizerTab));
    }
    const shareParam = params.get("share");
    if (shareParam) {
      decodeShare(shareParam).then((run) => {
        if (!run) {
          toast.error("This share link is invalid or corrupted.");
          return;
        }
        dispatch(setCommand(run.command));
        dispatch(setOutput(run.output));
        if (run.instantActionPadding !== undefined) dispatch(setInstantAction(run.instantActionPadding));
        if (run.dongleCooldown !== undefined) dispatch(setDongleCooldown(run.dongleCooldown));
      });
    }
    if (tabParam || shareParam) {
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [dispatch]);

  const activeTab = useAppSelector((state) => state.view.activeTab);
  const hasOutput = useAppSelector((state) => state.user_input.output.some(line => line.trim() !== ''));

  return (
    <CodexionSimulationProvider>
      <PlaybackDriver />
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
      <div className="fixed inset-0 -z-10 bg-radial-[circle_at_center,transparent_0%,#0a0a0d_95%] pointer-events-none" />

      <Header />

      <main className="min-h-screen pt-24 pb-24 px-4 sm:px-6 max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-6 items-start"
        >
          <motion.div
            initial={{ opacity: 0, x: -15 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="space-y-6"
          >
            <CodexionCommand />
            <CodexionOutput />
            <CodexionOptions />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 15 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="space-y-6"
          >
            <AnimatePresence mode="wait">
              {hasOutput ? (
                <motion.div
                  key="dashboard-content"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="space-y-6"
                >
                  <Tabs value={activeTab} onValueChange={(val) => dispatch(setActiveTab(val as VisualizerTab))} className="w-full">
                    <TabsList className="w-full flex bg-[#121215]/80 border border-white/10 p-1 rounded-xl backdrop-blur-md">
                      <TabsTrigger value="timeline" className="flex-1 py-2 text-xs font-semibold rounded-lg transition duration-200 cursor-pointer">
                        Timeline & Stats
                      </TabsTrigger>
                      <TabsTrigger value="table" className="flex-1 py-2 text-xs font-semibold rounded-lg transition duration-200 cursor-pointer">
                        Circle Table
                      </TabsTrigger>
                      <TabsTrigger value="analysis" className="flex-1 py-2 text-xs font-semibold rounded-lg transition duration-200 cursor-pointer">
                        Analysis & Metrics
                      </TabsTrigger>
                      <TabsTrigger value="compare" className="flex-1 py-2 text-xs font-semibold rounded-lg transition duration-200 cursor-pointer">
                        Compare
                      </TabsTrigger>
                    </TabsList>
                  </Tabs>
                  <div className="-mt-3 flex justify-end px-1">
                    <AnalysisStatus />
                  </div>

                  <AnimatePresence mode="wait">
                    <motion.div
                      key={activeTab}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.15 }}
                      className="space-y-6"
                    >
                      {activeTab === "timeline" && (
                        <>
                          <CodexionTimeline />
                          <CodexionStats />
                        </>
                      )}
                      {activeTab === "table" && <CodexionTable />}
                      {activeTab === "analysis" && <CodexionAnalysis />}
                      {activeTab === "compare" && <CodexionCompare />}
                    </motion.div>
                  </AnimatePresence>
                </motion.div>
              ) : (
                <div className="space-y-6">
                  <EmptyState key="empty-state" />
                  <GitHubCTA />
                </div>
              )}
            </AnimatePresence>
          </motion.div>
        </motion.div>
      </main>

      <Footer />
    </CodexionSimulationProvider>
  );
}

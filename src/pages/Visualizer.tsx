import { useState } from "react";
import GlassSurface from "@/components/ui/Components/GlassSurface/GlassSurface";
import ShinyText from "@/components/ui/TextAnimations/ShinyText/ShinyText";
import ShapeGrid from "@/components/ui/Backgrounds/ShapeGrid/ShapeGrid";
import CodexionTimeline from "@/components/Codexion/CodexionTimeline";
import CodexionTable from "@/components/Codexion/CodexionTable";
import CodexionStats from "@/components/Codexion/CodexionStats";
import CodexionOptions from "@/components/Codexion/CodexionOptions";
import CodexionOutput from "@/components/Codexion/CodexionOutput"
import CodexionCommand from "@/components/Codexion/CodexionCommand"
import CodexionAnalysis from "@/components/Codexion/CodexionAnalysis"
import { CodexionSimulationProvider } from "@/context/CodexionSimulationContext";
import { useAppSelector } from "@/store/hooks";
import { motion, AnimatePresence } from "motion/react";

function EmptyState() {
	return (
		<motion.div
			initial={{ opacity: 0, y: 15 }}
			animate={{ opacity: 1, y: 0 }}
			exit={{ opacity: 0, y: -15 }}
			transition={{ duration: 0.4, ease: "easeOut" }}
			className="flex flex-col items-center justify-center border border-white/10 bg-white/5 backdrop-blur-md rounded-2xl p-12 text-center h-[520px]"
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
				className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mb-6 text-white/40"
			>
				<svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
					<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
				</svg>
			</motion.div>
			<h3 className="text-lg font-semibold text-white/90 mb-2">No Simulation Data</h3>
			<p className="text-sm text-white/45 max-w-md mb-8 leading-relaxed">
				Run a local simulation by clicking the button on the left, or paste your program logs in the text area.
			</p>
			<div className="flex flex-wrap justify-center gap-3">
				<div className="flex items-center gap-1.5 text-xs text-white/30 bg-white/5 border border-white/5 px-3 py-1.5 rounded-full">
					<span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
					compilation
				</div>
				<div className="flex items-center gap-1.5 text-xs text-white/30 bg-white/5 border border-white/5 px-3 py-1.5 rounded-full">
					<span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
					debugging
				</div>
				<div className="flex items-center gap-1.5 text-xs text-white/30 bg-white/5 border border-white/5 px-3 py-1.5 rounded-full">
					<span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
					refactoring
				</div>
			</div>
		</motion.div>
	);
}

export default function Visualizer() {
	const [activeTab, setActiveTab] = useState<'timeline' | 'table' | 'analysis'>('timeline');
	const hasOutput = useAppSelector((state) => state.user_input.output.trim().length > 0);

	return (
		<CodexionSimulationProvider>
			<div className="fixed inset-0 -z-10 bg-[#0a0a0d]">
				<ShapeGrid
					speed={0.5}
					squareSize={40}
					direction='diagonal'
					borderColor="#2F293A"
					hoverFillColor='#222'
					shape='square'
					hoverTrailAmount={0}
				/>
			</div>
			<div className="fixed inset-0 -z-10 bg-radial-[circle_at_center,transparent_0%,#0a0a0d_95%] pointer-events-none" />

			<header className="fixed top-0 left-0 right-0 z-50 px-4 py-3 sm:px-6">
				<GlassSurface
					width="100%"
					height={64}
					borderRadius={16}
					className="mx-auto max-w-7xl flex items-center justify-between px-6 border border-white/5 bg-[#121215]/80 backdrop-blur-md"
				>
					<div className="flex items-center gap-3">
						<span className="text-2xl font-bold tabular-nums text-white/90">42</span>
						<span className="text-white/40">|</span>
						<ShinyText
							text="Codexion Visualizer"
							className="text-xl font-bold tracking-tight"
							color="#a0a0a0"
							shineColor="#e8e8e8"
							speed={3}
							spread={90}
						/>
					</div>
				</GlassSurface>
			</header>

			<main className="min-h-screen pt-24 pb-20 px-4 sm:px-6 max-w-7xl mx-auto">
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
									<div className="flex gap-1 p-1 bg-white/5 rounded-xl border border-white/10 backdrop-blur-md">
										<button
											onClick={() => setActiveTab('timeline')}
											className={`flex-1 py-2 text-xs font-semibold rounded-lg transition duration-200 cursor-pointer ${activeTab === 'timeline'
												? 'bg-white/10 text-white border border-white/10'
												: 'text-white/50 hover:text-white/80 hover:bg-white/5'
												}`}
										>
											Timeline & Stats
										</button>
										<button
											onClick={() => setActiveTab('table')}
											className={`flex-1 py-2 text-xs font-semibold rounded-lg transition duration-200 cursor-pointer ${activeTab === 'table'
												? 'bg-white/10 text-white border border-white/10'
												: 'text-white/50 hover:text-white/80 hover:bg-white/5'
												}`}
										>
											Circle Table
										</button>
										<button
											onClick={() => setActiveTab('analysis')}
											className={`flex-1 py-2 text-xs font-semibold rounded-lg transition duration-200 cursor-pointer ${activeTab === 'analysis'
												? 'bg-white/10 text-white border border-white/10'
												: 'text-white/50 hover:text-white/80 hover:bg-white/5'
												}`}
										>
											Analysis & Metrics
										</button>
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
											{activeTab === 'timeline' && (
												<>
													<CodexionTimeline />
													<CodexionStats />
												</>
											)}
											{activeTab === 'table' && (
												<CodexionTable />
											)}
											{activeTab === 'analysis' && (
												<CodexionAnalysis />
											)}
										</motion.div>
									</AnimatePresence>
								</motion.div>
							) : (
								<EmptyState key="empty-state" />
							)}
						</AnimatePresence>
					</motion.div>

				</motion.div>
			</main>

			<footer className="fixed bottom-0 left-0 right-0 z-50 px-4 py-3 sm:px-6">
				<GlassSurface
					width="100%"
					height={56}
					borderRadius={16}
					className="mx-auto max-w-7xl flex items-center justify-center px-6 border border-white/5 bg-[#121215]/80 backdrop-blur-md"
				>
					<div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-sm">
						<ShinyText
							text="Codexion"
							className="font-semibold"
							color="#888"
							shineColor="#fff"
							speed={5}
							spread={90}
						/>
						<span className="text-white/30">—</span>
						<ShinyText
							text="42 · Common core"
							className="font-medium"
							color="#666"
							shineColor="#a0a0a0"
							speed={4}
							spread={100}
						/>
						<span className="text-white/30">—</span>
						<a href="https://sacha-dev.me/" className="text-white/50">© 2026 Sacha S. (sservant)</a>
						<span className="text-white/30">—</span>
						<a href="https://github.com/0xS4cha/codexion_visualizer" className="text-white/50">Github (Star or review)</a>
					</div>
				</GlassSurface>
			</footer>
		</CodexionSimulationProvider>
	);
}

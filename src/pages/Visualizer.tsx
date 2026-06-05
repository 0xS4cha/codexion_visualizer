import Silk from "@/components/ui/Backgrounds/Silk/Silk";
import GlassSurface from "@/components/ui/Components/GlassSurface/GlassSurface";
import ShinyText from "@/components/ui/TextAnimations/ShinyText/ShinyText";
import CodexionTimeline from "@/components/Codexion/CodexionTimeline";
import CodexionTable from "@/components/Codexion/CodexionTable";
import CodexionStats from "@/components/Codexion/CodexionStats";
import CodexionOptions from "@/components/Codexion/CodexionOptions";
import CodexionOutput from "@/components/Codexion/CodexionOutput"
import CodexionCommand from "@/components/Codexion/CodexionCommand"
import CodexionAnalysis from "@/components/Codexion/CodexionAnalysis"
import BorderGlow from "@/components/ui/Components/BorderGlow/BorderGlow"
import { useNavigate } from "react-router-dom";
import { CodexionSimulationProvider } from "@/context/CodexionSimulationContext";

export default function Visualizer() {
	const navigate = useNavigate();
	const handleHub = () => {
		navigate("/hub");
	}
	return (
		<CodexionSimulationProvider>
			<div className="fixed inset-0 -z-10 pointer-events-none">
				<Silk
					speed={5}
					scale={1}
					color="#2d2d2d"
					noiseIntensity={1.5}
					rotation={0}
				/>
			</div>

			<header className="fixed top-0 left-0 right-0 z-50 px-4 py-3 sm:px-6">
				<GlassSurface
					width="100%"
					height={64}
					borderRadius={16}
					className="mx-auto max-w-6xl flex items-center justify-between px-6"
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

			<main className="min-h-screen pt-24 pb-32 px-4 sm:px-6">
				<div className="mx-auto max-w-6xl space-y-6">
					<BorderGlow
						edgeSensitivity={30}
						glowColor="40 0 80"
						backgroundColor="bg-black/20"
						borderRadius={28}
						glowRadius={40}
						glowIntensity={1}
						coneSpread={25}
						animated={true}
						colors={['#c084fc', '#f472b6', '#38bdf8']}
						className="w-full rounded-xl border border-white/10 bg-black/20"
					>
						<div className="flex w-full items-center justify-between gap-4 p-4 px-6 text-white">
							<div className="flex items-center gap-4">
								<span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/10 text-xl">
									i
								</span>
								<div className="text-left">
									<h3 className="font-semibold text-white/90">New feature !</h3>
									<p className="text-sm text-white/60">Discover the Community Hub to share and explore edge cases.</p>
								</div>
							</div>
							<button
								type="button"
								onClick={handleHub}
								className="shrink-0 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-medium tracking-wide text-white/70 transition hover:bg-white/10 hover:text-white"
							>
								Discover the Hub
							</button>
						</div>
					</BorderGlow>
					<CodexionCommand />
					<CodexionOutput />
					<CodexionOptions />
					<CodexionAnalysis />
					<CodexionTimeline />
					<CodexionTable />
					<CodexionStats />
				</div>
			</main>

			<footer className="fixed bottom-0 left-0 right-0 z-50 px-4 py-3 sm:px-6">
				<GlassSurface
					width="100%"
					height={56}
					borderRadius={16}
					className="mx-auto max-w-6xl flex items-center justify-center px-6"
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

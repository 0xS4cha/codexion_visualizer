import { useState } from "react";
import Silk from "@/components/utils/Backgrounds/Silk/Silk";
import GlassSurface from "@/components/utils/Components/GlassSurface/GlassSurface";
import ShinyText from "@/components/utils/TextAnimations/ShinyText/ShinyText";
import CodexionTimeline from "@/components/CodexionTimeline";

export default function Visualizer() {
	const [rawLog, setRawLog] = useState("");

	return (
		<>
			<div className="fixed inset-0 -z-10 pointer-events-none">
				<Silk
					speed={5}
					scale={1}
					color="#2d2d2dff"
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
							text="Codexion"
							className="text-xl font-bold tracking-tight"
							color="#a0a0a0"
							shineColor="#e8e8e8"
							speed={3}
							spread={90}
						/>
					</div>
					<div className="flex items-center gap-4 text-sm">
						<ShinyText
							text="Visualizer"
							className="font-medium"
							color="#888"
							shineColor="#fff"
							speed={4}
							spread={100}
						/>
					</div>
				</GlassSurface>
			</header>

			<main className="min-h-screen pt-24 pb-32 px-4 sm:px-6">
				<div className="mx-auto max-w-6xl space-y-6">
					<GlassSurface
						width="100%"
						height={200}
						borderRadius={16}
						className="overflow-hidden !items-stretch !justify-stretch"
					>
						<div className="flex w-full flex-1 flex-col gap-2 self-stretch p-4">
							<label className="mb-2 flex items-center gap-2 text-sm font-medium text-white/80">
								<ShinyText
									text="Logs Codexion"
									className="text-sm"
									color="#888"
									shineColor="#fff"
									speed={4}
									spread={90}
								/>
								<span className="text-white/40">—</span>
								<span className="text-white/50">
									Past the output (TIMESTAMP CODER_ID ACTION)
								</span>
							</label>
							<textarea
								value={rawLog}
								onChange={(e) => setRawLog(e.target.value)}
								placeholder={`
0 2 has taken a dongle
0 2 is compiling
4 2 is debugging
5 2 is refactoring
...`}
								className="flex-1 resize-none rounded-lg border border-white/10 bg-black/30 px-4 py-3 font-mono text-sm text-white/90 placeholder:text-white/30 focus:border-white/30 focus:outline-none focus:ring-1 focus:ring-white/20"
								spellCheck={false}
							/>
						</div>
					</GlassSurface>

					<CodexionTimeline rawLog={rawLog} />
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
		</>
	);
}

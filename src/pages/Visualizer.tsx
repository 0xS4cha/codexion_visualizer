import { useMemo, useRef, useCallback } from "react";
import { SiReact, SiNextdotjs, SiTypescript, SiTailwindcss, SiC, SiLua, SiGit } from 'react-icons/si';
import { useNavigate } from "react-router-dom";
import { motion, useScroll, useSpring, useTransform } from "framer-motion";
import Silk from "@/components/utils/Backgrounds/Silk/Silk"
import GlassSurface from "@/components/utils/Components/GlassSurface/GlassSurface"
import ShinyText from "@/components/utils/TextAnimations/ShinyText/ShinyText";

export default function Home() {
	const navigate = useNavigate();


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
			<div>
				<footer className="border-t border-white/10 px-4 py-10 sm:px-8">
					<div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 text-sm text-white/60 sm:flex-row">
						<span>© 2026 Sacha S. — All rights reserved.</span>
					</div>
				</footer>
			</div>
		</>
	);
}

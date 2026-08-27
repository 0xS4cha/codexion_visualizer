import { useNavigate } from "react-router-dom";


export default function Footer() {
    const navigate = useNavigate();
    return (
        <footer className=" bottom-0 left-0 right-0 z-40 bg-zinc-950/90 border-t border-zinc-800 backdrop-blur-sm">
            <div className="mx-auto max-w-7xl flex items-center justify-between px-6 h-12">
                <div className="flex items-center gap-4 text-xs font-mono text-zinc-500">
                    <span className="font-semibold text-zinc-300">CODEXION</span>
                    <span className="text-zinc-700">|</span>
                    <span>42 COMMON CORE</span>
                </div>
                <span className="text-white/20 px-4">—</span>
                <div className="flex items-center gap-4 text-xs">
                    <a
                        onClick={() => navigate("/privacy")}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="cursor-pointer flex items-center gap-1.5 text-white/50 hover:text-white transition font-medium"
                    >
                        <span>PRIVACY</span>
                    </a>
                    <span className="text-white/20">—</span>
                    <a
                        onClick={() => navigate("/terms")}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="cursor-pointer flex items-center gap-1.5 text-white/50 hover:text-white transition font-medium"
                    >
                        <span>TERMS</span>
                    </a>
                    <span className="text-white/20">—</span>
                    <a
                        href="https://github.com/0xS4cha/codexion_visualizer"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 text-white/50 hover:text-white transition font-medium"
                    >
                        <span>GITHUB</span>
                    </a>
                </div>
            </div>
        </footer>
    )
}
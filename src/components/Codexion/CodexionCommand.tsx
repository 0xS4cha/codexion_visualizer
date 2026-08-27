import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { setCommand, setOutput } from "@/store/features/inputSlice";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Share, Activity } from "lucide-react";
import { useLiveConnection } from "@/hooks/useLiveConnection";
import ShinyText from "@/components/ui/TextAnimations/ShinyText/ShinyText"; // Utilisé pour le titre
import { runCodexionSimulation } from "@/core/codexionLocalSimulation";

export default function CodexionCommand() {
    const command = useAppSelector((state) => state.user_input.command);
    const output = useAppSelector((state) => state.user_input.output);
    const dispatch = useAppDispatch();
    const navigate = useNavigate();
    const hasCommand = command.trim().length > 0;
    const hasOutput = output.trim().length > 0;

    const { isConnected, isActive, startConnection, stopConnection } = useLiveConnection();

    const handleAction = () => {
        navigate("/hub");
    };

    const handleSimulate = () => {
        const cmdToRun = command.trim() || "./codexion 4 1000 200 100 150 5 50 edf";
        if (!command.trim()) {
            dispatch(setCommand(cmdToRun));
        }
        const generatedLog = runCodexionSimulation(cmdToRun);
        dispatch(setOutput(generatedLog));
    };

    const handleShare = () => {
        if (!hasOutput) return;
        try {
            const data = btoa(unescape(encodeURIComponent(JSON.stringify({ command, output }))));
            const url = `${window.location.origin}${window.location.pathname}?share=${data}`;
            navigator.clipboard.writeText(url);
            toast.success("Shareable link copied to clipboard!");
        } catch (error) {
            toast.error("Failed to generate share link (log might be too large).");
            console.error("Share error:", error);
        }
    };

    return (
        <div className="flex flex-col rounded-xl border border-white/10 bg-white/5 backdrop-blur-md  p-4">
            <div className="flex w-full flex-1 flex-col gap-2 self-stretch p-4">
                <label className="mb-2 flex justify-between items-center text-sm font-medium text-white/80">
                    <ShinyText
                        text="Params Codexion"
                        className="text-sm"
                        color="#888"
                        shineColor="#fff"
                        speed={4}
                        spread={90}
                    />
                    <span className="text-white/50 text-right text-xs">
                        Paste the command (recommanded)
                    </span>
                </label>
                <textarea
                    value={command}
                    onChange={(e) => dispatch(setCommand(e.target.value))}
                    placeholder={`./codexion <coders> <time_to_burnout> <time_to_compile> <time_to_debug> <time_to_refactor> <nb_compiles_required> <dongle_cooldown> <scheduler>`}
                    className="flex-1 min-h-[80px] resize-none rounded-lg border border-white/10 bg-black/30 px-4 py-3 font-mono text-sm text-white/90 placeholder:text-white/30 focus:border-white/30 focus:outline-none focus:ring-1 focus:ring-white/20"
                    spellCheck={false}
                />
                <div className="grid grid-cols-2 gap-3 pt-3">
                    <button
                        type="button"
                        onClick={handleSimulate}
                        className="flex justify-center items-center rounded-xl bg-white text-black hover:bg-white/90 px-4 py-2.5 text-xs font-semibold tracking-wide transition active:scale-95 cursor-pointer"
                    >
                        Run Local Simulation
                    </button>
                    <button
                        type="button"
                        onClick={isActive ? stopConnection : startConnection}
                        className={`flex justify-center items-center gap-1.5 rounded-xl border px-4 py-2.5 text-xs font-semibold tracking-wide transition active:scale-95 cursor-pointer ${isActive ? 'border-white/20 bg-white/10 text-white hover:bg-white/15' : 'border-white/10 bg-white/5 text-white/70 hover:bg-white/10 hover:text-white'}`}
                    >
                        <Activity className="h-3.5 w-3.5" />
                        {isActive ? "Stop Live" : "Live Connect"}
                        {isConnected && <span className="relative flex h-2 w-2 ml-1"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-60"></span><span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span></span>}
                    </button>
                    {hasOutput && !isActive && (
                        <button
                            type="button"
                            onClick={handleShare}
                            className="flex justify-center items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 px-4 py-2 text-xs font-medium text-white/80 transition active:scale-95 cursor-pointer"
                        >
                            <Share className="h-3.5 w-3.5" />
                            Share Snapshot
                        </button>
                    )}
                    <button
                        type="button"
                        onClick={handleAction}
                        className={`flex justify-center items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 px-4 py-2 text-xs font-medium text-white/80 transition active:scale-95 cursor-pointer ${!(hasOutput && !isActive) ? 'col-span-2' : ''}`}
                    >
                        {hasCommand ? "Share an edge case" : "Test an edge case"}
                    </button>
                </div>
            </div>
        </div>
    )
}

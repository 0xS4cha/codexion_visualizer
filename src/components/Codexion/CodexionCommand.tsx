import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { setCommand, setOutput } from "@/store/features/inputSlice";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Share, Activity, Info, Terminal } from "lucide-react";
import { useLiveConnection } from "@/hooks/useLiveConnection";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
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
                    <div className="relative flex">
                        <button
                            type="button"
                            onClick={isActive ? stopConnection : startConnection}
                            className={`w-full flex justify-center items-center gap-1.5 rounded-xl border py-2.5 text-xs font-semibold tracking-wide transition active:scale-95 cursor-pointer ${isActive ? 'px-4 border-white/20 bg-white/10 text-white hover:bg-white/15' : 'pl-4 pr-10 border-white/10 bg-white/5 text-white/70 hover:bg-white/10 hover:text-white'}`}
                        >
                            {isActive ? "Stop Live" : "Live Connect"}
                            {isConnected && <span className="relative flex h-2 w-2 ml-1"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-60"></span><span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span></span>}
                        </button>

                        {!isActive && (
                            <Popover>
                                <PopoverTrigger asChild>
                                    <button className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-md hover:bg-white/10 text-white/50 hover:text-white transition-colors">
                                        <Info className="w-3.5 h-3.5" />
                                    </button>
                                </PopoverTrigger>
                                <PopoverContent className="w-[22rem] border border-white/10 bg-black/60 backdrop-blur-xl text-white/80 p-5 shadow-2xl rounded-2xl" align="end" sideOffset={10}>
                                    <h4 className="font-semibold text-white flex items-center gap-2 mb-2">
                                        <span className="flex h-2 w-2 relative">
                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white-400 opacity-75"></span>
                                            <span className="relative inline-flex rounded-full h-2 w-2 bg-white-500"></span>
                                        </span>
                                        New: Live Mode!
                                    </h4>
                                    <p className="text-xs text-white/60 mb-5 leading-relaxed">
                                        Visualize your codexion in real-time. Stop waiting for the simulation to finish to spot deadlocks.
                                    </p>
                                    <ol className="text-xs space-y-4 list-none">
                                        <li className="flex gap-3">
                                            <span className="flex items-center justify-center bg-white/10 rounded-full w-5 h-5 font-bold text-[10px] text-white shrink-0">1</span>
                                            <div>
                                                <span className="text-white/90 block mb-1 font-medium">Download the local bridge</span>
                                                <div className="flex flex-col gap-1 mt-1">
                                                    <a
                                                        href="https://github.com/0xS4cha/codexion_live/releases/download/v1.0/codexion_live"
                                                        download
                                                        className="inline-flex items-center gap-1 text-white hover:text-white-300 hover:underline"
                                                    >
                                                        Download codexion_live (v1.0)
                                                    </a>
                                                    <a
                                                        href="https://github.com/0xS4cha/codexion_live/"
                                                        target="_blank" rel="noreferrer"
                                                        className="inline-flex items-center gap-1 text-white/50 hover:text-white/80 hover:underline"
                                                    >
                                                        View Source Code
                                                    </a>
                                                </div>
                                            </div>
                                        </li>
                                        <li className="flex gap-3">
                                            <span className="flex items-center justify-center bg-white/10 rounded-full w-5 h-5 font-bold text-[10px] text-white shrink-0">2</span>
                                            <div className="w-full">
                                                <span className="text-white/90 block mb-1 font-medium">Pipe your program</span>
                                                <code className="flex items-center gap-2 mt-1 bg-black/50 p-2 rounded-md border border-white/5 font-mono text-[10px] text-white/70 overflow-x-auto whitespace-nowrap">
                                                    <Terminal className="w-3 h-3 text-white/30 shrink-0" />
                                                    ./codexion ... | ./codexion_live
                                                </code>
                                            </div>
                                        </li>
                                        <li className="flex gap-3">
                                            <span className="flex items-center justify-center bg-white/10 rounded-full w-5 h-5 font-bold text-[10px] text-white shrink-0">3</span>
                                            <div className="flex items-center h-5">
                                                <span className="text-white/90 font-medium">Click on "Live Connect"</span>
                                            </div>
                                        </li>
                                    </ol>
                                </PopoverContent>
                            </Popover>
                        )}
                    </div>
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

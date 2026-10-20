import { useMemo, useState } from "react";
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { setCommand, setOutput } from "@/store/features/inputSlice";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Share, Dices, RefreshCw, ChevronDown, AlertCircle } from "lucide-react";
import { useLiveConnection } from "@/hooks/useLiveConnection";
import ShinyText from "@/components/ui/TextAnimations/ShinyText/ShinyText";
import LiveHelpPopover from "@/components/Codexion/LiveHelpPopover";
import { runCodexionSimulationWithParams } from "@/core/codexionLocalSimulation";
import {
    DEFAULT_BINARY,
    PARAM_FIELDS,
    PRESETS,
    formatCommand,
    randomParams,
    resolveParams,
    splitCommand,
    validateCommand,
} from "@/core/commandParams";
import type { CodexionParams } from "@/core/commandParams";
import { buildShareUrl, MAX_URL_LENGTH } from "@/lib/share";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type Mode = "form" | "raw";

export default function CodexionCommand() {
    const command = useAppSelector((state) => state.user_input.command);
    const output = useAppSelector((state) => state.user_input.output);
    const settings = useAppSelector((state) => state.settings);
    const liveUrl = settings.liveUrl;
    const dispatch = useAppDispatch();
    const navigate = useNavigate();
    const [mode, setMode] = useState<Mode>("raw");
    const [isSharing, setIsSharing] = useState(false);
    const hasCommand = command.trim().length > 0;
    const hasOutput = output.some(line => line.trim() !== '');

    const { isConnected, isActive, bridge, startConnection, stopConnection, rerun } = useLiveConnection(liveUrl);

    const errors = useMemo(() => validateCommand(command), [command]);
    const formParams = useMemo(() => resolveParams(command), [command]);
    const binary = splitCommand(command).binary ?? DEFAULT_BINARY;

    const applyParams = (params: CodexionParams) => {
        dispatch(setCommand(formatCommand(params, binary)));
    };

    const updateField = (key: keyof CodexionParams, value: string) => {
        if (key === "scheduler") {
            applyParams({ ...formParams, scheduler: value === "fifo" ? "fifo" : "edf" });
            return;
        }
        const n = parseInt(value, 10);
        applyParams({ ...formParams, [key]: Number.isNaN(n) ? 0 : n });
    };

    const handleSimulate = () => {
        let cmdToRun = command.trim();
        if (!cmdToRun) {
            cmdToRun = formatCommand(PRESETS[0].params);
            dispatch(setCommand(cmdToRun));
        }
        if (errors.some((e) => e.field !== "command")) {
            toast.error("Fix the command errors before running the simulation.");
            return;
        }
        const generatedLog = runCodexionSimulationWithParams(resolveParams(cmdToRun));
        dispatch(setOutput(generatedLog.split('\n')));
    };

    const handleShare = async () => {
        if (!hasOutput) return;
        setIsSharing(true);
        try {
            const url = await buildShareUrl({
                command,
                output,
                instantActionPadding: settings.instantActionPadding,
                dongleCooldown: settings.dongleCooldown,
            });
            await navigator.clipboard.writeText(url);
            if (url.length > MAX_URL_LENGTH) {
                toast.warning("Link copied, but it is very long and some apps may truncate it.");
            } else {
                toast.success("Shareable link copied to clipboard!");
            }
        } catch {
            toast.error("Failed to generate the share link.");
        } finally {
            setIsSharing(false);
        }
    };

    const fieldError = (key: keyof CodexionParams) => errors.find((e) => e.field === key)?.message;

    return (
        <div className="flex flex-col rounded-xl border border-white/10 bg-white/5 backdrop-blur-md  p-4">
            <div className="flex w-full flex-1 flex-col gap-2 self-stretch p-4">
                <div className="mb-2 flex justify-between items-center gap-2 text-sm font-medium text-white/80">
                    <ShinyText
                        text="Params Codexion"
                        className="text-sm"
                        color="#888"
                        shineColor="#fff"
                        speed={4}
                        spread={90}
                    />
                    <div className="flex items-center gap-1 rounded-lg bg-black/30 p-0.5 text-[11px]">
                        {(["raw", "form"] as Mode[]).map((m) => (
                            <button
                                key={m}
                                type="button"
                                onClick={() => setMode(m)}
                                className={`rounded-md px-2 py-1 cursor-pointer ${mode === m ? "bg-white/15 text-white" : "text-white/50 hover:text-white/80"}`}
                            >
                                {m === "raw" ? "Command" : "Form"}
                            </button>
                        ))}
                    </div>
                </div>

                {mode === "raw" ? (
                    <textarea
                        value={command}
                        onChange={(e) => dispatch(setCommand(e.target.value))}
                        placeholder={`./codexion <coders> <time_to_burnout> <time_to_compile> <time_to_debug> <time_to_refactor> <nb_compiles_required> <dongle_cooldown> <scheduler>`}
                        className="flex-1 min-h-[80px] resize-none rounded-lg border border-white/10 bg-black/30 px-4 py-3 font-mono text-sm text-white/90 placeholder:text-white/30 focus:border-white/30 focus:outline-none focus:ring-1 focus:ring-white/20"
                        spellCheck={false}
                        aria-label="Codexion command"
                    />
                ) : (
                    <div className="grid grid-cols-2 gap-2">
                        {PARAM_FIELDS.map((f) => (
                            <label key={f.key} className="flex flex-col gap-1">
                                <span className="text-[10px] uppercase tracking-wider text-white/40">{f.label}</span>
                                <input
                                    type="number"
                                    min={f.min}
                                    max={f.max}
                                    value={formParams[f.key] as number}
                                    onChange={(e) => updateField(f.key, e.target.value)}
                                    className={`h-9 rounded-lg border bg-black/30 px-2.5 font-mono text-sm text-white/90 focus:outline-none focus:ring-1 focus:ring-white/20 ${fieldError(f.key) ? "border-red-500/50" : "border-white/10"}`}
                                />
                            </label>
                        ))}
                        <label className="flex flex-col gap-1">
                            <span className="text-[10px] uppercase tracking-wider text-white/40">Scheduler</span>
                            <select
                                value={formParams.scheduler}
                                onChange={(e) => updateField("scheduler", e.target.value)}
                                className="h-9 rounded-lg border border-white/10 bg-black/30 px-2 text-sm text-white/90 focus:outline-none cursor-pointer"
                            >
                                <option value="fifo" className="bg-[#121215]">fifo</option>
                                <option value="edf" className="bg-[#121215]">edf</option>
                            </select>
                        </label>
                    </div>
                )}

                {errors.length > 0 && (
                    <ul className="space-y-1 rounded-lg border border-red-500/15 bg-red-500/5 p-2 text-[11px] text-red-200/80">
                        {errors.map((e, i) => (
                            <li key={i} className="flex gap-1.5">
                                <AlertCircle className="mt-0.5 h-3 w-3 shrink-0" />
                                {e.message}
                            </li>
                        ))}
                    </ul>
                )}

                <div className="flex gap-2">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <button type="button" className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-[11px] text-white/70 hover:bg-white/10 cursor-pointer">
                                Presets
                                <ChevronDown className="h-3 w-3" />
                            </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="w-72 border-white/10 bg-[#121215] text-white/80">
                            {PRESETS.map((p) => (
                                <DropdownMenuItem key={p.name} onClick={() => applyParams(p.params)} className="flex flex-col items-start gap-0.5">
                                    <span className="text-xs font-medium">{p.name}</span>
                                    <span className="text-[10px] text-white/40">{p.description}</span>
                                </DropdownMenuItem>
                            ))}
                        </DropdownMenuContent>
                    </DropdownMenu>
                    <button
                        type="button"
                        onClick={() => applyParams(randomParams())}
                        className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-[11px] text-white/70 hover:bg-white/10 cursor-pointer"
                        title="Generate random edge-case parameters"
                    >
                        <Dices className="h-3.5 w-3.5" />
                        Randomize
                    </button>
                </div>

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
                            {isActive ? (isConnected ? "Stop Live" : "Connecting…") : "Live Connect"}
                            {isConnected && <span className="relative flex h-2 w-2 ml-1"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-60"></span><span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span></span>}
                        </button>

                        {!isActive && <LiveHelpPopover />}
                    </div>
                    {isConnected && bridge?.exec && (
                        <button
                            type="button"
                            onClick={rerun}
                            className="col-span-2 flex justify-center items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 px-4 py-2 text-xs font-medium text-white/80 transition active:scale-95 cursor-pointer"
                        >
                            <RefreshCw className="h-3.5 w-3.5" />
                            Rerun program{bridge.exited ? "" : " (restart)"}
                        </button>
                    )}
                    {isConnected && bridge && (
                        <p className="col-span-2 text-center text-[10px] text-white/40">
                            Bridge v{bridge.version ?? "?"} · {bridge.exec ? "running your program" : "reading stdin"}
                            {bridge.exited ? ` · exited${bridge.exitCode !== undefined && bridge.exitCode !== null ? ` (code ${bridge.exitCode})` : ""}` : ""}
                        </p>
                    )}
                    {hasOutput && !isActive && (
                        <button
                            type="button"
                            onClick={handleShare}
                            disabled={isSharing}
                            className="flex justify-center items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 px-4 py-2 text-xs font-medium text-white/80 transition active:scale-95 cursor-pointer disabled:opacity-50"
                        >
                            <Share className="h-3.5 w-3.5" />
                            {isSharing ? "Sharing…" : "Share Snapshot"}
                        </button>
                    )}
                    <button
                        type="button"
                        onClick={() => navigate("/hub")}
                        className={`flex justify-center items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 px-4 py-2 text-xs font-medium text-white/80 transition active:scale-95 cursor-pointer ${!(hasOutput && !isActive) ? 'col-span-2' : ''}`}
                    >
                        {hasCommand ? "Share an edge case" : "Test an edge case"}
                    </button>
                </div>
            </div>
        </div>
    )
}

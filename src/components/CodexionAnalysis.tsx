import { useMemo } from "react";
import { useAppSelector } from '@/redux/hook/index';
import { prepareCodexionSimulation } from "@/lib/codexionSimulation";
import ShinyText from "@/components/utils/TextAnimations/ShinyText/ShinyText";
import { AlertTriangle, AlertCircle, CheckCircle2, Activity, CircleAlert } from "lucide-react";

export default function CodexionAnalysis() {
    const padding = useAppSelector((state) => state.settings.instantActionPadding);
    const rawLog = useAppSelector((state) => state.user_input.output);
    const command = useAppSelector((state) => state.user_input.command);
    const dongleCooldown = useAppSelector((state) => state.settings.dongleCooldown);

    const { issues, coderStats, coderIds } = useMemo(() => {
        const parts = command.split(' ').filter(p => p.length > 0);
        const timeToBurnout = parts.length > 2 ? parseInt(parts[2], 10) : 0;
        const timeToRefactor = parts.length > 5 ? parseInt(parts[5], 10) : undefined;
        const cmdDongleCooldown = parts.length > 7 ? parseInt(parts[7], 10) : undefined;

        return prepareCodexionSimulation(
            rawLog,
            padding,
            timeToRefactor,
            cmdDongleCooldown !== undefined ? cmdDongleCooldown : dongleCooldown,
            timeToBurnout
        );
    }, [rawLog, padding, command, dongleCooldown]);

    if (coderIds.length === 0) return null;

    const errors = issues.filter(i => i.type === 'error');
    const warnings = issues.filter(i => i.type === 'warning');

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="flex flex-col rounded-xl border border-white/10 bg-black/20 p-6">
                <div className="mb-6 flex items-center justify-between">
                    <h2 className="text-sm font-semibold uppercase tracking-widest text-white/80">
                        <ShinyText text="Simulation Analysis (Doubtful)" disabled={false} speed={3} className="" />
                    </h2>
                    <div className="flex gap-3">
                        <div className="flex items-center gap-1.5 text-[10px] text-red-400">
                            <AlertCircle className="w-3 h-3" />
                            {errors.length} Errors
                        </div>
                        <div className="flex items-center gap-1.5 text-[10px] text-amber-400">
                            <AlertTriangle className="w-3 h-3" />
                            {warnings.length} Warnings
                        </div>
                    </div>
                </div>

                <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                    {issues.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-10 text-white/30 italic">
                            <CircleAlert className="w-8 h-8 mb-2 text-emerald-500/50" />
                            
                            <p className="text-sm">No issues detected in the simulation run. Currently being reworked</p>
                        </div>
                    ) : (
                        issues.map((issue, idx) => (
                            <div
                                key={idx}
                                className={`flex gap-3 p-3 rounded-lg border ${issue.type === 'error' ? 'bg-red-500/5 border-red-500/10' : 'bg-amber-500/5 border-amber-500/10'
                                    }`}
                            >
                                <div className="mt-0.5">
                                    {issue.type === 'error' ? (
                                        <AlertCircle className="w-4 h-4 text-red-500" />
                                    ) : (
                                        <AlertTriangle className="w-4 h-4 text-amber-500" />
                                    )}
                                </div>
                                <div className="flex-1">
                                    <p className={`text-xs font-medium ${issue.type === 'error' ? 'text-red-200/80' : 'text-amber-200/80'}`}>
                                        {issue.message}
                                    </p>
                                    <div className="mt-1 flex items-center gap-2 text-[10px] text-white/30">
                                        <span>at {issue.timestamp}ms</span>
                                        {issue.coderId && <span>• Coder {issue.coderId}</span>}
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            <div className="flex flex-col rounded-xl border border-white/10 bg-black/20 p-6">
                <div className="mb-6 flex items-center justify-between">
                    <h2 className="text-sm font-semibold uppercase tracking-widest text-white/80">
                        <ShinyText text="Performance Metrics" disabled={false} speed={3} className="" />
                    </h2>
                    <Activity className="w-4 h-4 text-white/30" />
                </div>

                <div className="flex-1 space-y-6">
                    <div className="space-y-4">
                        {coderIds.slice(0, 5).map(id => {
                            const stats = coderStats[id] || {};
                            const total = Object.values(stats).reduce((a: any, b: any) => a + b, 0) as number;
                            const compilePct = ((stats["is compiling"] || 0) / total) * 100;
                            const debugPct = ((stats["is debugging"] || 0) / total) * 100;
                            const refactorPct = ((stats["is refactoring"] || 0) / total) * 100;

                            return (
                                <div key={id} className="space-y-1.5">
                                    <div className="flex justify-between text-[10px]">
                                        <span className="text-white/50 font-mono">Coder {id} Activity</span>
                                        <span className="text-white/30">{total} actions</span>
                                    </div>
                                    <div className="h-2 w-full bg-white/5 rounded-full flex overflow-hidden">
                                        <div
                                            className="h-full bg-blue-400"
                                            style={{ width: `${compilePct}%` }}
                                            title={`Compiling: ${Math.round(compilePct)}%`}
                                        />
                                        <div
                                            className="h-full bg-purple-400"
                                            style={{ width: `${debugPct}%` }}
                                            title={`Debugging: ${Math.round(debugPct)}%`}
                                        />
                                        <div
                                            className="h-full bg-emerald-400"
                                            style={{ width: `${refactorPct}%` }}
                                            title={`Refactoring: ${Math.round(refactorPct)}%`}
                                        />
                                    </div>
                                </div>
                            )
                        })}
                        {coderIds.length > 5 && (
                            <p className="text-[10px] text-center text-white/20 italic">Showing top 5 coders</p>
                        )}
                    </div>

                    <div className="grid grid-cols-3 gap-2 pt-4 border-t border-white/5">
                        <div className="flex flex-col items-center">
                            <span className="text-[10px] text-white/40 uppercase mb-1">Compiling</span>
                            <div className="h-1 w-8 bg-blue-400 rounded-full" />
                        </div>
                        <div className="flex flex-col items-center">
                            <span className="text-[10px] text-white/40 uppercase mb-1">Debugging</span>
                            <div className="h-1 w-8 bg-purple-400 rounded-full" />
                        </div>
                        <div className="flex flex-col items-center">
                            <span className="text-[10px] text-white/40 uppercase mb-1">Refactoring</span>
                            <div className="h-1 w-8 bg-emerald-400 rounded-full" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

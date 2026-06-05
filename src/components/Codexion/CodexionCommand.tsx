import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { setCommand, setOutput } from "@/store/features/inputSlice";
import { useNavigate } from "react-router-dom";
import ShinyText from "@/components/ui/TextAnimations/ShinyText/ShinyText"; // Utilisé pour le titre
import { runCodexionSimulation } from "@/core/codexionLocalSimulation";

export default function CodexionCommand() {
    const command = useAppSelector((state) => state.user_input.command);
    const dispatch = useAppDispatch();
    const navigate = useNavigate();
    const hasCommand = command.trim().length > 0;

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
                <div className="flex gap-3 pt-2">
                    <button
                        type="button"
                        onClick={handleSimulate}
                        className="rounded-full bg-white text-black hover:bg-white/90 px-5 py-2 text-xs font-semibold tracking-wide transition active:scale-95 cursor-pointer"
                    >
                        Run Local Simulation
                    </button>
                    <button
                        type="button"
                        onClick={handleAction}
                        className="rounded-full border border-white/10 bg-white/5 px-5 py-2 text-xs font-medium tracking-wide text-white/70 transition hover:bg-white/10 hover:text-white active:scale-95 cursor-pointer"
                    >
                        {hasCommand ? "Share an edge case" : "Test an edge case"}
                    </button>
                </div>
            </div>
        </div>
    )
}

import { useAppSelector, useAppDispatch } from '@/redux/hook/index';
import { setCommand, setOutput } from "@/redux/slice/inputSlice";
import ShinyText from "@/components/utils/TextAnimations/ShinyText/ShinyText"; // Utilisé pour le titre

export default function CodexionOptions() {
  const command = useAppSelector((state) => state.user_input.command);
  const dispatch = useAppDispatch();
  return (
    <div className="flex flex-col rounded-xl border border-white/10 bg-black/20 p-4">
        <div className="flex w-full flex-1 flex-col gap-2 self-stretch p-4">
            <label className="mb-2 flex items-center gap-2 text-sm font-medium text-white/80">
                <ShinyText
                    text="Params Codexion"
                    className="text-sm"
                    color="#888"
                    shineColor="#fff"
                    speed={4}
                    spread={90}
                />
                <span className="text-white/40">—</span>
                <span className="text-white/50">
                    Paste the command (Optionnal but recommanded)
                </span>
            </label>
            <textarea
                value={command}
                onChange={(e) => dispatch(setCommand(e.target.value))}
                placeholder={`./codexion <coders> <time_to_burnout> <time_to_compile> <time_to_debug> <time_to_refactor> <nb_compiles_required> <dongle_cooldown> <scheduler>`}
                className="flex-1 resize-none rounded-lg border border-white/10 bg-black/30 px-4 py-3 font-mono text-sm text-white/90 placeholder:text-white/30 focus:border-white/30 focus:outline-none focus:ring-1 focus:ring-white/20"
                spellCheck={false}
            />
        </div>
    </div>
  )
}
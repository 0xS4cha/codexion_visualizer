import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAppDispatch } from "@/store/hooks";
import { setCommand, setOutput } from "@/store/features/inputSlice";
import { setInstantAction, setDongleCooldown } from "@/store/features/settingsSlice";
import { setActiveTab } from "@/store/features/viewSlice";
import { fetchSharedRun } from "@/lib/share";

export default function SharedRun() {
  const { id } = useParams<{ id: string }>();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!id) return;
    let alive = true;
    fetchSharedRun(id)
      .then((run) => {
        if (!alive) return;
        if (!run) {
          setFailed(true);
          return;
        }
        dispatch(setCommand(run.command));
        dispatch(setOutput(run.output));
        if (run.instantActionPadding !== undefined) dispatch(setInstantAction(run.instantActionPadding));
        if (run.dongleCooldown !== undefined) dispatch(setDongleCooldown(run.dongleCooldown));
        dispatch(setActiveTab("timeline"));
        navigate("/", { replace: true });
      })
      .catch(() => alive && setFailed(true));
    return () => {
      alive = false;
    };
  }, [id, dispatch, navigate]);

  return (
    <div className="min-h-screen bg-[#0a0a0d] flex flex-col items-center justify-center gap-4 text-white/60 text-sm">
      {failed ? (
        <>
          <p>This shared run does not exist or has expired.</p>
          <button type="button" onClick={() => navigate("/")} className="rounded-full bg-white px-4 py-2 text-xs font-semibold text-black cursor-pointer">
            Go to Visualizer
          </button>
        </>
      ) : (
        <p className="animate-pulse">Loading shared run…</p>
      )}
    </div>
  );
}

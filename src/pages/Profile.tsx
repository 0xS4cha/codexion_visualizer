import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ThumbsUp, MessageSquare, FileText } from "lucide-react";
import Header from "@/components/Codexion/Header";
import Footer from "@/components/Codexion/Footer";
import { BackButton } from "@/components/Codexion/BackButton";
import { Badge } from "@/components/ui/badge";
import { getedgecases, edgecaseCreatedAt, edgecaseOutputLines } from "@/config/firebase";
import type { edgecaseData } from "@/config/firebase";
import { useAppDispatch } from "@/store/hooks";
import { setCommand, setOutput } from "@/store/features/inputSlice";
import { setInstantAction, setDongleCooldown } from "@/store/features/settingsSlice";

type Edgecase = edgecaseData & { id: string };

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 p-4">
      <div className="text-white/40">{icon}</div>
      <div>
        <div className="text-xl font-semibold text-white/90 tabular-nums">{value}</div>
        <div className="text-[10px] uppercase tracking-wider text-white/40">{label}</div>
      </div>
    </div>
  );
}

export default function Profile() {
  const { login = "" } = useParams<{ login: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const [cases, setCases] = useState<Edgecase[] | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let alive = true;
    getedgecases()
      .then((all) => alive && setCases(all))
      .catch(() => alive && setFailed(true));
    return () => {
      alive = false;
    };
  }, []);

  const mine = useMemo(
    () => (cases ?? []).filter((c) => c.author?.toLowerCase() === login.toLowerCase()).sort((a, b) => edgecaseCreatedAt(b) - edgecaseCreatedAt(a)),
    [cases, login]
  );
  const totalVotes = mine.reduce((acc, c) => acc + (c.votes ?? 0), 0);
  const totalComments = mine.reduce((acc, c) => acc + (c.commentCount ?? 0), 0);
  const tagCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const c of mine) for (const t of c.tags ?? []) counts.set(t, (counts.get(t) ?? 0) + 1);
    return Array.from(counts.entries()).sort((a, b) => b[1] - a[1]);
  }, [mine]);

  const open = (ec: Edgecase, withLog: boolean) => {
    dispatch(setCommand(ec.command));
    dispatch(setInstantAction(ec.instantActionPadding));
    dispatch(setDongleCooldown(ec.dongleCooldown));
    if (withLog) dispatch(setOutput(edgecaseOutputLines(ec)));
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-[#0a0a0d] text-white/90">
      <Header />
      <main className="mx-auto max-w-5xl px-6 pb-20 pt-24">
        <div className="-ml-4 mb-6">
          <BackButton />
        </div>
        <h1 className="text-3xl font-bold tracking-tight">@{login}</h1>
        <p className="mt-2 text-sm text-white/50">Edge cases shared with the community.</p>

        <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <StatCard icon={<FileText className="h-5 w-5" />} label="Edge cases" value={mine.length} />
          <StatCard icon={<ThumbsUp className="h-5 w-5" />} label="Votes received" value={totalVotes} />
          <StatCard icon={<MessageSquare className="h-5 w-5" />} label="Comments received" value={totalComments} />
        </div>

        {tagCounts.length > 0 && (
          <div className="mt-6 flex flex-wrap gap-2">
            {tagCounts.map(([tag, count]) => (
              <Badge key={tag} variant="outline" className="border-white/10 bg-white/5 text-white/60">
                {tag} · {count}
              </Badge>
            ))}
          </div>
        )}

        <section className="mt-8 space-y-3">
          {failed ? (
            <p className="text-sm text-red-300">Failed to load edge cases.</p>
          ) : cases === null ? (
            <p className="text-sm text-white/40">Loading…</p>
          ) : mine.length === 0 ? (
            <p className="text-sm text-white/40">@{login} has not published any edge case yet.</p>
          ) : (
            mine.map((ec) => (
              <div key={ec.id} className="flex flex-col gap-3 rounded-xl border border-white/10 bg-black/20 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0 space-y-1">
                  <h3 className="font-semibold text-white/90 break-words">{ec.title}</h3>
                  <p className="text-sm text-white/45 break-words">{ec.description}</p>
                  <p className="font-mono text-[11px] text-white/35 break-all">{ec.command}</p>
                  <div className="flex gap-3 text-[11px] text-white/40">
                    <span>{ec.votes ?? 0} votes</span>
                    <span>{ec.commentCount ?? 0} comments</span>
                  </div>
                </div>
                <div className="flex shrink-0 gap-2">
                  <button type="button" onClick={() => open(ec, false)} className="rounded-full border border-white/10 px-4 py-1.5 text-xs font-semibold text-white/70 hover:bg-white/10 cursor-pointer">
                    Open
                  </button>
                  {edgecaseOutputLines(ec).some((l) => l.trim() !== "") && (
                    <button type="button" onClick={() => open(ec, true)} className="rounded-full border border-white/10 px-4 py-1.5 text-xs font-semibold text-white/70 hover:bg-white/10 cursor-pointer">
                      Replay
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </section>
      </main>
      <Footer />
    </div>
  );
}

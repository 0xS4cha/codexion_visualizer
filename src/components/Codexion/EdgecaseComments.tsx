import { useEffect, useState } from "react";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { getComments } from "@/config/firebase";
import type { EdgecaseComment } from "@/config/firebase";
import { useSecureApi } from "@/hooks/useSecureApi";

const MAX_COMMENT = 1000;

interface EdgecaseCommentsProps {
  edgecaseId: string;
  currentLogin?: string;
  onCountChange?: (delta: number) => void;
}

function formatDate(ms: number | null): string {
  if (!ms) return "";
  return new Date(ms).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
}

export function EdgecaseComments({ edgecaseId, currentLogin, onCountChange }: EdgecaseCommentsProps) {
  const [comments, setComments] = useState<EdgecaseComment[] | null>(null);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const { fetchSecure } = useSecureApi();

  useEffect(() => {
    let alive = true;
    getComments(edgecaseId)
      .then((c) => alive && setComments(c))
      .catch(() => alive && setComments([]));
    return () => {
      alive = false;
    };
  }, [edgecaseId]);

  const submit = async () => {
    const value = text.trim();
    if (!value) return;
    setSending(true);
    try {
      const { comment } = await fetchSecure("/api/cases/comments", {
        method: "POST",
        body: JSON.stringify({ id: edgecaseId, text: value }),
      });
      setComments((prev) => [...(prev ?? []), comment]);
      setText("");
      onCountChange?.(1);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to post comment.");
    } finally {
      setSending(false);
    }
  };

  const remove = async (commentId: string) => {
    try {
      await fetchSecure("/api/cases/comments", {
        method: "DELETE",
        body: JSON.stringify({ id: edgecaseId, commentId }),
      });
      setComments((prev) => (prev ?? []).filter((c) => c.id !== commentId));
      onCountChange?.(-1);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to delete comment.");
    }
  };

  return (
    <div className="mt-3 space-y-3 border-t border-white/5 pt-3">
      {comments === null ? (
        <p className="text-xs text-white/40">Loading comments…</p>
      ) : comments.length === 0 ? (
        <p className="text-xs text-white/40">No comments yet. Be the first to share a hint!</p>
      ) : (
        <ul className="space-y-2">
          {comments.map((c) => (
            <li key={c.id} className="rounded-lg bg-white/5 px-3 py-2">
              <div className="flex items-center justify-between gap-2 text-[10px] text-white/40">
                <span>
                  @{c.author} · {formatDate(c.createdAt)}
                </span>
                {currentLogin === c.author && (
                  <button type="button" onClick={() => remove(c.id)} className="text-white/40 hover:text-red-300 cursor-pointer" aria-label="Delete comment">
                    <Trash2 className="h-3 w-3" />
                  </button>
                )}
              </div>
              <p className="mt-1 whitespace-pre-wrap break-words text-xs text-white/75">{c.text}</p>
            </li>
          ))}
        </ul>
      )}
      {currentLogin && (
        <div className="flex flex-col gap-2">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value.slice(0, MAX_COMMENT))}
            placeholder="Add a comment, a hint or a fix…"
            rows={2}
            className="w-full resize-y rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-xs text-white/90 placeholder:text-white/30 focus:outline-none focus:ring-1 focus:ring-white/20"
          />
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-white/30">{text.length}/{MAX_COMMENT}</span>
            <button
              type="button"
              onClick={submit}
              disabled={sending || !text.trim()}
              className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-black hover:bg-white/90 disabled:opacity-50 cursor-pointer"
            >
              {sending ? "Posting…" : "Comment"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

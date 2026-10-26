import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { ChevronLeft, ChevronRight, FlaskConical, LayoutDashboard, MessageSquare, Plus, Search, ThumbsUp, UserRound, UsersRound, X } from "lucide-react";
import { DashboardUser } from "@/types/user";
import ShapeGrid from "@/components/ui/Backgrounds/ShapeGrid/ShapeGrid";
import Header from "@/components/Codexion/Header";
import { signInWithCustomToken } from "firebase/auth";
import { useAppSelector, useAppDispatch } from "@/store/hooks";
import { auth, getedgecases, edgecaseData, edgecaseOutputLines, edgecaseCreatedAt } from "@/config/firebase";
import { setCommand, setOutput } from "@/store/features/inputSlice";
import { setActiveTab } from "@/store/features/viewSlice";
import { AVAILABLE_TAGS, MAX_TAGS } from "@/config/tags";
import { toast } from "sonner";
import { setInstantAction, setDongleCooldown } from "@/store/features/settingsSlice";
import { useSecureApi } from "@/hooks/useSecureApi";
import { EdgecaseCard } from "@/components/Codexion/EdgecaseCard";
import { BackButton } from "@/components/Codexion/BackButton";
import { StatTile } from "@/components/Codexion/WorldStatsCards";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import Footer from "@/components/Codexion/Footer";

type SortMode = "newest" | "top" | "discussed" | "oldest";

const SORT_LABELS: Record<SortMode, string> = {
  newest: "Newest",
  top: "Top",
  discussed: "Discussed",
  oldest: "Oldest",
};

const cardClass =
  "gap-2 bg-[#121215]/80 backdrop-blur-md border-white/10 shadow-xl rounded-2xl hover:border-white/20 transition-colors duration-500";
const sectionLabelClass = "text-[10px] tracking-wider uppercase font-medium text-white/40";
const fieldClass =
  "h-10 rounded-lg bg-black/30 border-white/10 text-sm text-white/90 placeholder:text-white/30 focus-visible:border-white/30 focus-visible:ring-1 focus-visible:ring-white/20";
const secondaryButtonClass =
  "rounded-xl border border-white/10 bg-white/5 text-xs font-medium text-white/80 hover:bg-white/10 hover:text-white transition active:scale-95 cursor-pointer";
const primaryButtonClass =
  "rounded-xl bg-white text-black hover:bg-white/90 text-xs font-semibold tracking-wide transition active:scale-95 cursor-pointer";

export default function Edgecase() {
  const [user, setUser] = useState<DashboardUser | null>(null);
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { fetchSecure } = useSecureApi();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [edgecases, setedgecases] = useState<(edgecaseData & { id: string })[]>([]);
  const [isLoadingList, setIsLoadingList] = useState(true);

  const [searchQuery, setSearchQuery] = useState("");
  const [activeTags, setActiveTags] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortMode, setSortMode] = useState<SortMode>("newest");
  const itemsPerPage = 4;

  const { command: reduxCommand, output } = useAppSelector((state) => state.user_input);
  const { instantActionPadding: reduxPadding, dongleCooldown: reduxCooldown } = useAppSelector((state) => state.settings);

  const [localCommand, setLocalCommand] = useState(reduxCommand);
  const [localPadding, setLocalPadding] = useState(reduxPadding);
  const [localCooldown, setLocalCooldown] = useState(reduxCooldown);

  useEffect(() => {
    const fetchCases = async () => {
      try {
        const data = await getedgecases();
        setedgecases(data);
      } catch {
        toast.error("Failed to load edge cases.");
      } finally {
        setIsLoadingList(false);
      }
    };
    fetchCases();
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const encoded = params.get("user");
    const token = params.get("token");

    if (encoded) {
      try {
        const decoded = JSON.parse(atob(encoded));
        setUser(decoded);
        sessionStorage.setItem("42_user", JSON.stringify(decoded));

        if (token) {
          signInWithCustomToken(auth, token)
            .then(() => {
              window.history.replaceState({}, "", "/hub");
              window.dispatchEvent(new Event("storage"));
            })
            .catch(() => {
              toast.error("Could not open your session, please log in again.");
            });
        } else {
          window.history.replaceState({}, "", "/hub");
          window.dispatchEvent(new Event("storage"));
        }
      } catch {
        navigate("/?error=invalid_data");
      }
    } else {
      const stored = sessionStorage.getItem("42_user");
      if (stored) {
        setUser(JSON.parse(stored));
      } else {
        navigate("/login");
      }
    }
  }, [navigate]);

  const totals = useMemo(
    () => ({
      votes: edgecases.reduce((acc, ec) => acc + (ec.votes ?? 0), 0),
      comments: edgecases.reduce((acc, ec) => acc + (ec.commentCount ?? 0), 0),
      authors: new Set(edgecases.map((ec) => ec.author).filter(Boolean)).size,
    }),
    [edgecases]
  );

  const handlePublish = async () => {
    if (!title.trim() || !description.trim()) return;
    setIsSubmitting(true);
    try {
      await fetchSecure("/api/cases/save", {
        method: "POST",
        body: JSON.stringify({
          title,
          description,
          tags: selectedTags,
          command: localCommand,
          instantActionPadding: localPadding,
          dongleCooldown: localCooldown,
          output
        })
      });
      setIsModalOpen(false);
      setTitle("");
      setDescription("");
      setSelectedTags([]);

      setIsLoadingList(true);
      const data = await getedgecases();
      setedgecases(data);
      setIsLoadingList(false);
      toast.success("Edge case published!");
    } catch (e) {
      toast.error(e instanceof Error ? `Failed to publish: ${e.message}` : "Failed to publish edgecase.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVote = async (id: string, voteType: "up" | "down") => {
    if (!user) return;
    try {
      const { newVotes, newVotedBy } = await fetchSecure("/api/cases/vote", {
        method: "POST",
        body: JSON.stringify({ id, voteType })
      });
      setedgecases((prev) =>
        prev.map((ec) => {
          if (ec.id === id) {
            return { ...ec, votes: newVotes, votedBy: newVotedBy };
          }
          return ec;
        })
      );
    } catch {
      toast.error("Failed to register your vote.");
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1);
  };

  const handleTagToggle = (tag: string) => {
    setActiveTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setSearchQuery("");
    setActiveTags([]);
    setCurrentPage(1);
  };

  const openShareModal = () => {
    setLocalCommand(reduxCommand);
    setLocalPadding(reduxPadding);
    setLocalCooldown(reduxCooldown);
    setIsModalOpen(true);
  };

  const filterededgecases = edgecases.filter((ec) => {
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch =
      !searchQuery ||
      (ec.title && ec.title.toLowerCase().includes(searchLower)) ||
      (ec.description && ec.description.toLowerCase().includes(searchLower)) ||
      (ec.author && ec.author.toLowerCase().includes(searchLower)) ||
      (ec.tags && ec.tags.some((t) => t.toLowerCase().includes(searchLower)));

    const matchesTags =
      activeTags.length === 0 ||
      activeTags.every((tag) => ec.tags && ec.tags.includes(tag));

    return matchesSearch && matchesTags;
  });

  const sortededgecases = [...filterededgecases].sort((a, b) => {
    switch (sortMode) {
      case "top":
        return (b.votes ?? 0) - (a.votes ?? 0) || edgecaseCreatedAt(b) - edgecaseCreatedAt(a);
      case "discussed":
        return (b.commentCount ?? 0) - (a.commentCount ?? 0) || edgecaseCreatedAt(b) - edgecaseCreatedAt(a);
      case "oldest":
        return edgecaseCreatedAt(a) - edgecaseCreatedAt(b);
      default:
        return edgecaseCreatedAt(b) - edgecaseCreatedAt(a);
    }
  });

  const hasLocalOutput = output.some((l) => l.trim() !== "");
  const hasFilters = searchQuery !== "" || activeTags.length > 0;
  const totalPages = Math.ceil(sortededgecases.length / itemsPerPage);
  const paginatededgecases = sortededgecases.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  if (!user) {
    return (
      <div className="min-h-screen bg-[#0a0a0d] flex items-center justify-center">
        <div className="text-white/40 text-sm tracking-wide animate-pulse">Loading…</div>
      </div>
    );
  }

  const iconClass = "w-3.5 h-3.5";

  return (
    <>
      <div className="fixed inset-0 -z-10 bg-[#0a0a0d]">
        <ShapeGrid
          speed={0.5}
          squareSize={40}
          direction="diagonal"
          borderColor="#2F293A"
          hoverFillColor="#222"
          shape="square"
          hoverTrailAmount={0}
        />
      </div>
      <div className="fixed inset-0 -z-10 bg-radial-[circle_at_center,transparent_0%,#0a0a0d_95%] pointer-events-none" />

      <Header />

      <main className="min-h-screen pt-20 pb-24 px-4 sm:px-6 max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="space-y-6"
        >
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <BackButton />
              <h1 className="mt-2 px-4 text-xl sm:text-2xl font-bold text-white tracking-tight">Edge Case Hub</h1>
              <p className="px-4 text-xs text-white/40">Tricky Codexion scenarios shared by the community</p>
            </div>
            <Button onClick={openShareModal} className={`${primaryButtonClass} h-10 px-4`}>
              <Plus className="w-4 h-4" />
              Share an edge case
            </Button>
          </div>

          {isLoadingList && edgecases.length === 0 ? (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {Array.from({ length: 4 }, (_, i) => (
                <Skeleton key={i} className="h-[86px] rounded-2xl bg-white/5" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatTile delay={0.1} icon={<FlaskConical className={iconClass} />} label="Edge cases" value={edgecases.length.toLocaleString()} hint="shared so far" />
              <StatTile delay={0.15} icon={<ThumbsUp className={iconClass} />} label="Votes" value={totals.votes.toLocaleString()} hint="net score across all cases" />
              <StatTile delay={0.2} icon={<MessageSquare className={iconClass} />} label="Comments" value={totals.comments.toLocaleString()} hint="community discussions" />
              <StatTile delay={0.25} icon={<UsersRound className={iconClass} />} label="Contributors" value={totals.authors.toLocaleString()} hint="unique authors" />
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-6 items-start">
            <motion.aside
              initial={{ opacity: 0, x: -15 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
              className="space-y-6 lg:sticky lg:top-24"
            >
              <Card className={cardClass}>
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center justify-between text-sm font-semibold text-white/90">
                    Filters
                    {hasFilters && (
                      <button
                        type="button"
                        onClick={clearFilters}
                        className="flex items-center gap-1 text-[11px] font-medium text-white/50 hover:text-white transition-colors cursor-pointer"
                      >
                        <X className="w-3 h-3" />
                        Clear
                      </button>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-5">
                  <div className="space-y-2">
                    <p className={sectionLabelClass}>Search</p>
                    <div className="relative">
                      <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30" />
                      <Input
                        value={searchQuery}
                        onChange={handleSearchChange}
                        placeholder="Title, tag or author…"
                        aria-label="Search edge cases"
                        className={`${fieldClass} pl-9`}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <p className={sectionLabelClass}>Sort by</p>
                    <ToggleGroup
                      type="single"
                      value={sortMode}
                      onValueChange={(value) => {
                        if (!value) return;
                        setSortMode(value as SortMode);
                        setCurrentPage(1);
                      }}
                      aria-label="Sort edge cases"
                      spacing={0}
                      className="w-full border border-white/10 bg-black/30"
                    >
                      {(Object.keys(SORT_LABELS) as SortMode[]).map((m) => (
                        <ToggleGroupItem key={m} value={m} className="flex-1 text-xs cursor-pointer">
                          {SORT_LABELS[m]}
                        </ToggleGroupItem>
                      ))}
                    </ToggleGroup>
                  </div>

                  <div className="space-y-2">
                    <p className={sectionLabelClass}>
                      Tags{activeTags.length > 0 && <span className="text-white/60"> · {activeTags.length} selected</span>}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {AVAILABLE_TAGS.map((tag) => (
                        <FilterChip
                          key={tag}
                          label={tag}
                          active={activeTags.includes(tag)}
                          onClick={() => handleTagToggle(tag)}
                        />
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className={cardClass}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold text-white/90">Shortcuts</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {[
                    { icon: LayoutDashboard, label: "Go to Visualizer", to: "/" },
                    { icon: UserRound, label: "My edge cases", to: `/u/${user.login}` },
                  ].map(({ icon: Icon, label, to }, i) => (
                    <motion.div key={label} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1, duration: 0.4 }}>
                      <Link
                        to={to}
                        className="flex items-center justify-between rounded-lg px-3 py-2.5 text-xs bg-white/5 border border-white/5 hover:bg-white/10 hover:border-white/15 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
                      >
                        <span className="flex items-center gap-2 text-white/80 font-medium">
                          <Icon className="w-3.5 h-3.5 text-white/50" />
                          {label}
                        </span>
                        <ChevronRight className="w-3.5 h-3.5 text-white/40" />
                      </Link>
                    </motion.div>
                  ))}
                </CardContent>
              </Card>
            </motion.aside>

            <motion.section
              initial={{ opacity: 0, x: 15 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: 0.2 }}
              className="space-y-4"
            >
              <div className="flex items-center justify-between px-1">
                <p className={sectionLabelClass}>
                  {isLoadingList ? "Loading edge cases…" : `${filterededgecases.length} edge case${filterededgecases.length === 1 ? "" : "s"}`}
                </p>
                {totalPages > 1 && (
                  <p className="text-[11px] text-white/40 tabular-nums">
                    Page {currentPage} of {totalPages}
                  </p>
                )}
              </div>

              {isLoadingList ? (
                <div className="grid gap-4" aria-busy="true">
                  {Array.from({ length: itemsPerPage }, (_, i) => (
                    <Skeleton key={i} className="h-[150px] rounded-2xl bg-white/5" />
                  ))}
                </div>
              ) : filterededgecases.length === 0 ? (
                <EmptyState hasFilters={hasFilters} onClear={clearFilters} onShare={openShareModal} />
              ) : (
                <>
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={`${currentPage}-${sortMode}`}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.15 }}
                      className="grid gap-4"
                    >
                      {paginatededgecases.map((ec, i) => (
                        <motion.div
                          key={ec.id}
                          initial={{ opacity: 0, y: 12 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.05, duration: 0.4 }}
                        >
                          <EdgecaseCard
                            id={ec.id}
                            title={ec.title}
                            author={ec.author}
                            tags={ec.tags || []}
                            description={ec.description}
                            votes={ec.votes || 0}
                            userVote={user ? ec.votedBy?.[user.login] : undefined}
                            commentCount={ec.commentCount ?? 0}
                            currentLogin={user.login}
                            hasStoredLog={edgecaseOutputLines(ec).some((l) => l.trim() !== "")}
                            canCheckLog={hasLocalOutput && !!ec.command}
                            onAuthorClick={() => navigate(`/u/${ec.author}`)}
                            onVote={(voteType) => handleVote(ec.id, voteType)}
                            onOpen={() => {
                              dispatch(setCommand(ec.command));
                              dispatch(setInstantAction(ec.instantActionPadding));
                              dispatch(setDongleCooldown(ec.dongleCooldown));
                              navigate("/");
                            }}
                            onReplay={() => {
                              dispatch(setCommand(ec.command));
                              dispatch(setOutput(edgecaseOutputLines(ec)));
                              dispatch(setInstantAction(ec.instantActionPadding));
                              dispatch(setDongleCooldown(ec.dongleCooldown));
                              dispatch(setActiveTab("timeline"));
                              navigate("/");
                            }}
                            onCheckLog={() => {
                              dispatch(setCommand(ec.command));
                              dispatch(setInstantAction(ec.instantActionPadding));
                              dispatch(setDongleCooldown(ec.dongleCooldown));
                              dispatch(setActiveTab("analysis"));
                              navigate("/");
                            }}
                          />
                        </motion.div>
                      ))}
                    </motion.div>
                  </AnimatePresence>

                  {totalPages > 1 && (
                    <div className="flex items-center justify-center gap-3 pt-2">
                      <Button
                        onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        variant="outline"
                        aria-label="Previous page"
                        className={`${secondaryButtonClass} h-9 px-3 disabled:opacity-40`}
                      >
                        <ChevronLeft className="w-3.5 h-3.5" />
                        Previous
                      </Button>
                      <span className="text-xs text-white/50 tabular-nums min-w-[60px] text-center">
                        {currentPage} / {totalPages}
                      </span>
                      <Button
                        onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                        variant="outline"
                        aria-label="Next page"
                        className={`${secondaryButtonClass} h-9 px-3 disabled:opacity-40`}
                      >
                        Next
                        <ChevronRight className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  )}
                </>
              )}
            </motion.section>
          </div>
        </motion.div>
      </main>
      <Footer />

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-2xl rounded-2xl bg-[#121215]/95 backdrop-blur-xl border border-white/10 text-white/90 shadow-[0_8px_32px_rgba(0,0,0,0.5)]">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-white tracking-tight">Share your edge case</DialogTitle>
            <DialogDescription className="text-xs text-white/40">
              Publish an edge case scenario for others to simulate and analyze.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <label className="flex flex-col gap-1.5">
              <span className={sectionLabelClass}>Title</span>
              <Input
                value={title}
                maxLength={120}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="A descriptive title"
                className={fieldClass}
              />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className={sectionLabelClass}>Description</span>
              <textarea
                value={description}
                maxLength={2000}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What happened in this edge case?"
                className="min-h-[80px] resize-none rounded-lg border border-white/10 bg-black/30 px-3 py-2.5 text-sm text-white/90 placeholder:text-white/30 focus:border-white/30 focus:outline-none focus:ring-1 focus:ring-white/20"
              />
            </label>
            <div className="flex flex-col gap-1.5">
              <span className={sectionLabelClass}>
                Tags <span className="text-white/30">({selectedTags.length}/{MAX_TAGS})</span>
              </span>
              <div className="flex flex-wrap gap-2">
                {AVAILABLE_TAGS.map((tag) => (
                  <FilterChip
                    key={tag}
                    label={tag}
                    active={selectedTags.includes(tag)}
                    onClick={() =>
                      setSelectedTags((prev) =>
                        prev.includes(tag) ? prev.filter((t) => t !== tag) : prev.length >= MAX_TAGS ? prev : [...prev, tag]
                      )
                    }
                  />
                ))}
              </div>
            </div>
            <label className="flex flex-col gap-1.5">
              <span className={sectionLabelClass}>Command</span>
              <Input
                value={localCommand}
                onChange={(e) => setLocalCommand(e.target.value)}
                className={`${fieldClass} font-mono`}
              />
            </label>

            <div className="grid grid-cols-2 gap-4">
              <label className="flex flex-col gap-1.5">
                <span className={sectionLabelClass}>Instant Action Padding</span>
                <Input
                  type="number"
                  value={localPadding}
                  onChange={(e) => setLocalPadding(Number(e.target.value))}
                  className={`${fieldClass} font-mono`}
                />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className={sectionLabelClass}>Dongle Cooldown</span>
                <Input
                  type="number"
                  value={localCooldown}
                  onChange={(e) => setLocalCooldown(Number(e.target.value))}
                  className={`${fieldClass} font-mono`}
                />
              </label>
            </div>
          </div>

          <DialogFooter className="mt-2">
            <Button
              onClick={handlePublish}
              disabled={isSubmitting || !title.trim() || !description.trim()}
              className={`${primaryButtonClass} w-full h-10 disabled:opacity-50`}
            >
              {isSubmitting ? "Publishing…" : "Publish edge case"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

type EmptyStateProps = {
  hasFilters: boolean;
  onClear: () => void;
  onShare: () => void;
};

function EmptyState({ hasFilters, onClear, onShare }: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="flex flex-col items-center justify-center border border-white/10 bg-white/5 backdrop-blur-md rounded-2xl p-12 text-center h-[340px]"
    >
      <motion.div
        animate={{ scale: [1, 1.05, 1], opacity: [0.5, 0.8, 0.5] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        className="w-14 h-14 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mb-5 text-white/40"
      >
        <FlaskConical className="w-7 h-7" strokeWidth={1.5} />
      </motion.div>
      <h3 className="text-lg font-semibold text-white/90 mb-2">No edge cases found</h3>
      <p className="text-sm text-white/45 max-w-md mb-6 leading-relaxed">
        {hasFilters
          ? "Nothing matches your search or tags. Try loosening your filters."
          : "Nobody has shared an edge case yet. Be the first one!"}
      </p>
      <Button
        onClick={hasFilters ? onClear : onShare}
        variant="outline"
        className={`${hasFilters ? secondaryButtonClass : primaryButtonClass} h-9 px-4`}
      >
        {hasFilters ? "Clear filters" : "Share an edge case"}
      </Button>
    </motion.div>
  );
}

type FilterChipProps = {
  label: string;
  active?: boolean;
  onClick: () => void;
};

function FilterChip({ label, active, onClick }: FilterChipProps) {
  return (
    <button type="button" onClick={onClick} aria-pressed={active} className="cursor-pointer rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40">
      <Badge
        variant={active ? "default" : "outline"}
        className={`px-3 py-1 text-[11px] font-medium transition-all ${active
          ? "bg-white text-black hover:bg-white/90"
          : "border-white/10 bg-white/5 text-white/60 hover:text-white hover:bg-white/10"
          }`}
      >
        {label}
      </Badge>
    </button>
  );
}

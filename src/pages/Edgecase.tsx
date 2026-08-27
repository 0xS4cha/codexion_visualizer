import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { DashboardUser } from "@/types/user";
import ShapeGrid from "@/components/ui/Backgrounds/ShapeGrid/ShapeGrid";
import Header from "@/components/Codexion/Header";
import { signInWithCustomToken } from "firebase/auth";
import { useAppSelector, useAppDispatch } from "@/store/hooks";
import { auth, getedgecases, edgecaseData } from "@/config/firebase";
import { setCommand } from "@/store/features/inputSlice";
import { setInstantAction, setDongleCooldown } from "@/store/features/settingsSlice";
import { useSecureApi } from "@/hooks/useSecureApi";
import { EdgecaseCard } from "@/components/Codexion/EdgecaseCard";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import Footer from "@/components/Codexion/Footer";

const AVAILABLE_TAGS = [
  "Burnout",
  "Deadlock",
  "Tricky",
  "Stack",
  "Memory",
  "Infinite Loop",
  "Segfault",
  "Leaks",
  "Parsing",
  "Other"
];

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
      } catch (error) {
        console.error("Failed to fetch edgecases", error);
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
            .catch((err) => {
              console.error("Firebase Auth Error:", err);
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
    } catch (e) {
      console.error(e);
      alert("Failed to publish edgecase.");
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
    } catch (e) {
      console.error("Failed to vote", e);
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

  const totalPages = Math.ceil(filterededgecases.length / itemsPerPage);
  const paginatededgecases = filterededgecases.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  if (!user) {
    return (
      <div className="min-h-screen bg-[#0c0c0c] flex items-center justify-center">
        <div className="text-white/60 text-sm tracking-wide">Loading...</div>
      </div>
    );
  }

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

      <main className="px-4 pb-20 pt-24 max-w-7xl mx-auto">
        <div className="w-full space-y-6">
          <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
            <aside className="space-y-4">
              <Card className="border border-white/10 bg-white/5 backdrop-blur-md">
                <CardHeader className="pb-3">
                  <CardDescription className="text-xs uppercase tracking-widest text-white/40">Filters</CardDescription>
                  <CardTitle className="text-lg font-semibold text-white/85">Quick search</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <Input
                      value={searchQuery}
                      onChange={handleSearchChange}
                      placeholder="Search an edgecase, a tag, or an author..."
                      className="h-11 bg-black/30 border-white/10 text-white/90 placeholder:text-white/30 focus-visible:border-white/30 focus-visible:ring-white/20"
                    />
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

              <Card className="border border-white/10 bg-white/5 backdrop-blur-md">
                <CardHeader className="pb-3">
                  <CardDescription className="text-xs uppercase tracking-widest text-white/40">Actions</CardDescription>
                  <CardTitle className="text-lg font-semibold text-white/85">Options</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button
                    onClick={() => navigate("/")}
                    variant="outline"
                    className="w-full rounded-full border border-white/10 bg-white/5 text-sm font-semibold text-white/80 hover:bg-white/10 transition h-11 cursor-pointer"
                  >
                    Go to Visualizer
                  </Button>
                  <Button
                    onClick={() => {
                      setLocalCommand(reduxCommand);
                      setLocalPadding(reduxPadding);
                      setLocalCooldown(reduxCooldown);
                      setIsModalOpen(true);
                    }}
                    className="w-full rounded-full bg-white text-black hover:bg-white/90 text-sm font-bold transition h-11 cursor-pointer"
                  >
                    Share an Edgecase
                  </Button>
                </CardContent>
              </Card>
            </aside>

            <section className="space-y-4">
              <div className="grid gap-4">
                {isLoadingList ? (
                  <div className="text-white/50 text-center py-8">Loading edgecases...</div>
                ) : filterededgecases.length === 0 ? (
                  <div className="text-white/50 text-center py-8">No edgecases found.</div>
                ) : (
                  <>
                    {paginatededgecases.map((ec) => (
                      <EdgecaseCard
                        key={ec.id}
                        id={ec.id}
                        title={ec.title}
                        author={ec.author}
                        tags={ec.tags || []}
                        description={ec.description}
                        votes={ec.votes || 0}
                        userVote={user ? ec.votedBy?.[user.login] : undefined}
                        onVote={(voteType) => handleVote(ec.id, voteType)}
                        onOpen={() => {
                          dispatch(setCommand(ec.command));
                          dispatch(setInstantAction(ec.instantActionPadding));
                          dispatch(setDongleCooldown(ec.dongleCooldown));
                          navigate("/");
                        }}
                      />
                    ))}

                    {totalPages > 1 && (
                      <div className="flex items-center justify-center gap-4 mt-6">
                        <Button
                          onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                          disabled={currentPage === 1}
                          variant="outline"
                          className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white/70 hover:bg-white/10 disabled:opacity-50 transition cursor-pointer"
                        >
                          Previous
                        </Button>
                        <span className="text-sm text-white/50">
                          Page {currentPage} of {totalPages}
                        </span>
                        <Button
                          onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                          disabled={currentPage === totalPages}
                          variant="outline"
                          className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white/70 hover:bg-white/10 disabled:opacity-50 transition cursor-pointer"
                        >
                          Next
                        </Button>
                      </div>
                    )}
                  </>
                )}
              </div>
            </section>
          </div>
        </div>
      </main>
      <Footer />

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-2xl bg-[#121215] border border-white/10 text-white/90">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-white/90">Share your edgecase</DialogTitle>
            <DialogDescription className="text-white/40">
              Publish an edgecase scenario for others to simulate and analyze.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <label className="text-sm font-medium text-white/70">Title</label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="A descriptive title"
                className="h-11 bg-black/30 border-white/10 text-white/90 placeholder:text-white/30 focus-visible:border-white/30 focus-visible:ring-white/20"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-white/70">Description</label>
              <Input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What happened in this edgecase?"
                className="h-11 bg-black/30 border-white/10 text-white/90 placeholder:text-white/30 focus-visible:border-white/30 focus-visible:ring-white/20"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-white/70">Tags</label>
              <div className="flex flex-wrap gap-2">
                {AVAILABLE_TAGS.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() =>
                      setSelectedTags((prev) =>
                        prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
                      )
                    }
                    className="cursor-pointer font-sans"
                  >
                    <Badge
                      variant={selectedTags.includes(tag) ? "default" : "outline"}
                      className={`px-3 py-1.5 text-xs transition-all ${selectedTags.includes(tag)
                        ? "bg-white text-black hover:bg-white/90"
                        : "border-white/10 bg-white/5 text-white/60 hover:text-white hover:bg-white/10"
                        }`}
                    >
                      {tag}
                    </Badge>
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-white/70">Command</label>
              <Input
                value={localCommand}
                onChange={(e) => setLocalCommand(e.target.value)}
                className="h-11 font-mono bg-black/30 border-white/10 text-white/90 placeholder:text-white/30 focus-visible:border-white/30 focus-visible:ring-white/20"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-white/70">Instant Action Padding</label>
                <Input
                  type="number"
                  value={localPadding}
                  onChange={(e) => setLocalPadding(Number(e.target.value))}
                  className="h-11 font-mono bg-black/30 border-white/10 text-white/90 placeholder:text-white/30 focus-visible:border-white/30 focus-visible:ring-white/20"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-white/70">Dongle Cooldown</label>
                <Input
                  type="number"
                  value={localCooldown}
                  onChange={(e) => setLocalCooldown(Number(e.target.value))}
                  className="h-11 font-mono bg-black/30 border-white/10 text-white/90 placeholder:text-white/30 focus-visible:border-white/30 focus-visible:ring-white/20"
                />
              </div>
            </div>
          </div>

          <DialogFooter className="mt-4">
            <Button
              onClick={handlePublish}
              disabled={isSubmitting}
              className="w-full rounded-full bg-white text-black font-semibold hover:bg-white/90 transition disabled:opacity-50 h-11 cursor-pointer"
            >
              {isSubmitting ? "Publishing..." : "Publish edgecase"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

type FilterChipProps = {
  label: string;
  active?: boolean;
  onClick: () => void;
};

function FilterChip({ label, active, onClick }: FilterChipProps) {
  return (
    <button type="button" onClick={onClick} className="cursor-pointer">
      <Badge
        variant={active ? "default" : "outline"}
        className={`px-3 py-1.5 text-xs transition-all ${active
          ? "bg-white text-black hover:bg-white/90"
          : "border-white/15 bg-white/5 text-white/60 hover:text-white hover:bg-white/10"
          }`}
      >
        {label}
      </Badge>
    </button>
  );
}

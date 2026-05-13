import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { DashboardUser } from "@/types/user";
import Silk from "@/components/ui/Backgrounds/Silk/Silk";
import GlassSurface from "@/components/ui/Components/GlassSurface/GlassSurface";
import ShinyText from "@/components/ui/TextAnimations/ShinyText/ShinyText";
import { signInWithCustomToken } from "firebase/auth";
import { useAppSelector, useAppDispatch } from "@/store/hooks";
import { auth, getedgecases, edgecaseData } from "@/config/firebase";
import { setCommand, setOutput } from "@/store/features/inputSlice";
import { setInstantAction, setDongleCooldown } from "@/store/features/settingsSlice";
import { useSecureApi } from "@/hooks/useSecureApi";
import { EdgecaseCard } from "@/components/Codexion/EdgecaseCard"

const AVAILABLE_TAGS = [
  "Burnout",
  "Deadlock",
  "Tricky",
  "Stack",
  "Memory",
  "Infinite Loop",
  "Segfault",
  "Leaks"
];

export default function edgecase() {
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
            })
            .catch((err) => {
              console.error("Firebase Auth Error:", err);
            });
        } else {
          window.history.replaceState({}, "", "/hub");
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

  const handleLogout = () => {
    sessionStorage.removeItem("42_user");
    auth.signOut().then(() => {
      navigate("/");
    });
  };

  const handlePublish = async () => {
    if (!title.trim() || !description.trim()) return;
    setIsSubmitting(true);
    try {
      await fetchSecure('/api/cases/save', {
        method: 'POST',
        body: JSON.stringify({
          title,
          description,
          tags: selectedTags,
          command: localCommand,
          instantActionPadding: localPadding,
          dongleCooldown: localCooldown,
          output,
          author: user!.login,
          authorDisplayName: user!.displayName,
        })
      });
      setIsModalOpen(false);
      setTitle("");
      setDescription("");
      setSelectedTags([]);
      
      setIsLoadingList(true);
      const data = await getedgecases();
      console.log("data", data)
      setedgecases(data);
      setIsLoadingList(false);
    } catch (e) {
      console.error(e);
      alert("Failed to publish edgecase.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVote = async (id: string, voteType: 'up' | 'down') => {
    if (!user) return;
    try {
      const { newVotes, newVotedBy } = await fetchSecure('/api/cases/vote', {
        method: 'POST',
        body: JSON.stringify({ id, voteType, userLogin: user.login })
      });
      setedgecases(prev => prev.map(ec => {
        if (ec.id === id) {
          return { ...ec, votes: newVotes, votedBy: newVotedBy };
        }
        return ec;
      }));
    } catch (e) {
      console.error("Failed to vote", e);
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1);
  };

  const handleTagToggle = (tag: string) => {
    setActiveTags(prev => 
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
    setCurrentPage(1);
  };

  const filterededgecases = edgecases.filter(ec => {
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch = !searchQuery || 
      (ec.title && ec.title.toLowerCase().includes(searchLower)) ||
      (ec.description && ec.description.toLowerCase().includes(searchLower)) ||
      (ec.author && ec.author.toLowerCase().includes(searchLower)) ||
      (ec.tags && ec.tags.some(t => t.toLowerCase().includes(searchLower)));
      
    const matchesTags = activeTags.length === 0 || 
      activeTags.every(tag => ec.tags && ec.tags.includes(tag));
      
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
      <div className="fixed inset-0 -z-10 pointer-events-none">
        <Silk speed={5} scale={1} color="#2d2d2d" noiseIntensity={1.5} rotation={0} />
      </div>

      <header className="sticky top-0 z-40 px-4 py-4 sm:px-6">
        <GlassSurface
          width="100%"
          height={72}
          borderRadius={18}
          className="mx-auto w-full flex items-center justify-between px-6"
        >
          <div className="flex items-center gap-3">
            <span className="text-2xl font-bold tabular-nums text-white/90">42</span>
            <span className="text-white/40">|</span>
            <ShinyText
              text="Edgecase Hub"
              className="text-xl font-bold tracking-tight"
              color="#a0a0a0"
              shineColor="#e8e8e8"
              speed={3}
              spread={90}
            />
          </div>
        </GlassSurface>
      </header>

      <main className="px-4 pb-20 pt-6 sm:px-6">
        <div className="w-full space-y-6">
          <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
            <aside className="space-y-4">
              <GlassSurface
                width="100%"
                height="auto"
                borderRadius={20}
                className="p-5 sm:p-6"
              >
                <div className="space-y-5">
                  <div>
                    <div className="text-xs uppercase tracking-widest text-white/40">Filters</div>
                    <h3 className="mt-2 text-lg font-semibold text-white/85">Quick search</h3>
                  </div>
                  <div className="space-y-3">
                    <input
                      value={searchQuery}
                      onChange={handleSearchChange}
                      placeholder="Search an edgecase, a tag, or an author..."
                      className="w-full rounded-lg border border-white/10 bg-black/30 px-4 py-3 text-sm text-white/90 placeholder:text-white/30 focus:border-white/30 focus:outline-none focus:ring-1 focus:ring-white/20"
                    />
                    <div className="flex flex-wrap gap-2">
                      {AVAILABLE_TAGS.map(tag => (
                        <FilterChip 
                          key={tag} 
                          label={tag} 
                          active={activeTags.includes(tag)} 
                          onClick={() => handleTagToggle(tag)} 
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </GlassSurface>

              <GlassSurface
                width="100%"
                height="auto"
                borderRadius={20}
                className="p-5 sm:p-6"
              >
                <div className="space-y-4">
                <div className="space-y-2 text-sm text-white/50">
                    <p>Signed in as</p>
                    <div className="flex items-center gap-3">
                      
                      {user.image ? (
                        <img
                          src={user.image}
                          alt={user.login}
                          className="h-10 w-10 rounded-full object-cover bg-white/5 border border-white/10"
                        />
                      ) : (
                        <div className="h-10 w-10 rounded-full bg-white/5 border border-white/10" />
                      )}
                      <div>
                        <div className="text-white/80 font-medium">{user.displayName}</div>
                        <div className="text-xs text-white/40">@{user.login}</div>
                      </div>
                    </div>
                  </div>
                  <div>
                    <div className="text-xs uppercase tracking-widest text-white/40">Share</div>
                    <h3 className="mt-2 text-lg font-semibold text-white/85">Share an edgecase</h3>
                  </div>
                  <button 
                    onClick={() => {
                      navigate("/");
                    }}
                    className="w-full rounded-full border border-white/10 bg-white/10 px-4 py-3 text-sm font-medium text-white/80 hover:bg-white/20 transition">
                    Visualizer
                  </button>
                  <button 
                    onClick={() => {
                      setLocalCommand(reduxCommand);
                      setLocalPadding(reduxPadding);
                      setLocalCooldown(reduxCooldown);
                      setIsModalOpen(true);
                    }}
                    className="w-full rounded-full border border-white/10 bg-white/10 px-4 py-3 text-sm font-medium text-white/80 hover:bg-white/20 transition">
                    Create a post
                  </button>
                  <button 
                    onClick={handleLogout}
                    className="w-full rounded-full border border-white/10 bg-white/10 px-4 py-3 text-sm font-medium text-white/80 hover:bg-white/20 transition">
                    Log out
                  </button>
                </div>
              </GlassSurface>
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
                        <button
                          onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                          disabled={currentPage === 1}
                          className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white/70 hover:bg-white/10 disabled:opacity-50 transition"
                        >
                          Previous
                        </button>
                        <span className="text-sm text-white/50">
                          Page {currentPage} of {totalPages}
                        </span>
                        <button
                          onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                          disabled={currentPage === totalPages}
                          className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white/70 hover:bg-white/10 disabled:opacity-50 transition"
                        >
                          Next
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
            </section>
          </div>
        </div>
      </main>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-2xl">
          <div className="flex flex-col rounded-xl border border-white/10 bg-black/20 p-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-white/90">Share your edgecase</h2>
                <button onClick={() => setIsModalOpen(false)} className="text-white/50 hover:text-white transition">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                </button>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-white/70">Title</label>
                  <input value={title} onChange={e => setTitle(e.target.value)} placeholder="A descriptive title" className="w-full rounded-lg border border-white/10 bg-black/30 px-4 py-3 text-sm text-white/90 focus:outline-none" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-white/70">Description</label>
                  <input value={description} onChange={e => setDescription(e.target.value)} placeholder="What happened in this edgecase?" className="w-full rounded-lg border border-white/10 bg-black/30 px-4 py-3 text-sm text-white/90 focus:outline-none" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-white/70">Tags</label>
                  <div className="flex flex-wrap gap-2">
                    {AVAILABLE_TAGS.map(tag => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => setSelectedTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag])}
                        className={`rounded-full border px-3 py-2 text-xs transition ${
                          selectedTags.includes(tag)
                            ? "border-white/30 bg-white/15 text-white"
                            : "border-white/10 bg-white/5 text-white/60 hover:text-white"
                        }`}
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-white/70">Command</label>
                  <input value={localCommand} onChange={e => setLocalCommand(e.target.value)} className="w-full rounded-lg border border-white/10 bg-black/30 px-4 py-3 font-mono text-sm text-white/90 focus:outline-none focus:border-white/30" />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-white/70">Instant Action Padding</label>
                    <input type="number" value={localPadding} onChange={e => setLocalPadding(Number(e.target.value))} className="w-full rounded-lg border border-white/10 bg-black/30 px-4 py-3 font-mono text-sm text-white/90 focus:outline-none focus:border-white/30" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-white/70">Dongle Cooldown</label>
                    <input type="number" value={localCooldown} onChange={e => setLocalCooldown(Number(e.target.value))} className="w-full rounded-lg border border-white/10 bg-black/30 px-4 py-3 font-mono text-sm text-white/90 focus:outline-none focus:border-white/30" />
                  </div>
                </div>

                <button onClick={handlePublish} disabled={isSubmitting} className="w-full rounded-full bg-white text-black px-4 py-3 font-semibold hover:bg-white/90 transition disabled:opacity-50">
                  {isSubmitting ? "Publishing..." : "Publish edgecase"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
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
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-3 py-2 text-xs transition ${
        active
          ? "border-white/30 bg-white/15 text-white"
          : "border-white/10 bg-white/5 text-white/60 hover:text-white"
      }`}
    >
      {label}
    </button>
  );
}

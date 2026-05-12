import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { DashboardUser } from "@/types/user";
import Silk from "@/components/utils/Backgrounds/Silk/Silk";
import GlassSurface from "@/components/utils/Components/GlassSurface/GlassSurface";
import ShinyText from "@/components/utils/TextAnimations/ShinyText/ShinyText";

export default function Eachcase() {
  const [user, setUser] = useState<DashboardUser | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const encoded = params.get("user");

    if (encoded) {
      try {
        const decoded = JSON.parse(atob(encoded));
        setUser(decoded);
        window.history.replaceState({}, "", "/eachcase");
        sessionStorage.setItem("42_user", JSON.stringify(decoded));
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
    navigate("/");
  };

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
              text="Eachcase Hub"
              className="text-xl font-bold tracking-tight"
              color="#a0a0a0"
              shineColor="#e8e8e8"
              speed={3}
              spread={90}
            />
          </div>
          <button
            className="text-xs sm:text-sm tracking-wide text-white/70 hover:text-white transition-colors px-4 py-2 rounded-full border border-white/10 bg-white/5"
            onClick={handleLogout}
          >
            Log out
          </button>
        </GlassSurface>
      </header>

      <main className="px-4 pb-20 pt-6 sm:px-6">
        <div className="w-full space-y-6">
          <GlassSurface
            width="100%"
            height="auto"
            borderRadius={22}
            className="p-6 sm:p-8"
          >
            <div className="space-y-2">
              <h1 className="text-2xl sm:text-3xl font-semibold text-white/90">
                Community Eachcase Hub
              </h1>
              <p className="text-sm sm:text-base text-white/45 max-w-4xl">
                Discover, explore, and share eachcase reports from the community. Tags, rankings, and discussions in one place.
              </p>
            </div>
          </GlassSurface>

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
                      placeholder="Search an eachcase, a tag, or an author..."
                      className="w-full rounded-lg border border-white/10 bg-black/30 px-4 py-3 text-sm text-white/90 placeholder:text-white/30 focus:border-white/30 focus:outline-none focus:ring-1 focus:ring-white/20"
                    />
                    <div className="grid gap-2 sm:grid-cols-2">
                      <FilterChip label="Burnout" active />
                      <FilterChip label="Deadlock" />
                      <FilterChip label="Tricky" />

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
                      <div className="h-10 w-10 rounded-full bg-white/5 border border-white/10" />
                      <div>
                        <div className="text-white/80 font-medium">{user.displayName}</div>
                        <div className="text-xs text-white/40">@{user.login}</div>
                      </div>
                    </div>
                  </div>
                  <div>
                    <div className="text-xs uppercase tracking-widest text-white/40">Share</div>
                    <h3 className="mt-2 text-lg font-semibold text-white/85">Share an eachcase</h3>
                  </div>
                  <button className="w-full rounded-full border border-white/10 bg-white/10 px-4 py-3 text-sm font-medium text-white/80 hover:bg-white/20 transition">
                    Create a post
                  </button>
                  <button className="w-full rounded-full border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium text-white/70 hover:bg-white/10 transition">
                    Share a link
                  </button>
                </div>
              </GlassSurface>
            </aside>

            <section className="space-y-4">
              <GlassSurface
                width="100%"
                height="auto"
                borderRadius={20}
                className="p-5 sm:p-6"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-white/85">Latest shared eachcases</h3>
                    <p className="text-sm text-white/45">Community picks, updated live.</p>
                  </div>
                  <button className="text-xs font-medium px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 border border-white/10 transition">
                    View all
                  </button>
                </div>
              </GlassSurface>

              <div className="grid gap-4">
                <EachcaseCard
                  title="test"
                  author="test"
                  tags={["C", "Memory", "Stack"]}
                  description="Intermittent crash caused by a missing free() at the edge of the array."
                />
                <EachcaseCard
                  title="test"
                  author="test"
                  tags={["C", "Memory", "Stack"]}
                  description="Intermittent crash caused by a missing free() at the edge of the array."
                />
                <EachcaseCard
                  title="test"
                  author="test"
                  tags={["C", "Memory", "Stack"]}
                  description="Intermittent crash caused by a missing free() at the edge of the array."
                />
              </div>
            </section>
          </div>
        </div>
      </main>
    </>
  );
}

type FilterChipProps = {
  label: string;
  active?: boolean;
};

function FilterChip({ label, active }: FilterChipProps) {
  return (
    <button
      type="button"
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

type EachcaseCardProps = {
  title: string;
  author: string;
  tags: string[];
  description: string;
};

function EachcaseCard({ title, author, tags, description }: EachcaseCardProps) {
  return (
    <GlassSurface
      width="100%"
      height="auto"
      borderRadius={18}
      className="p-6 sm:p-7 min-h-[96px]"
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-3">
            <h4 className="text-base sm:text-lg font-semibold text-white/90">{title}</h4>
            <span className="text-xs text-white/40">By @{author}</span>
          </div>
          <p className="text-sm text-white/45 max-w-2xl">{description}</p>
          <div className="flex flex-wrap gap-2">
            {tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] text-white/60"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
        <button className="self-start sm:self-center text-xs font-medium px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 border border-white/10 transition">
          Open
        </button>
      </div>
    </GlassSurface>
  );
}

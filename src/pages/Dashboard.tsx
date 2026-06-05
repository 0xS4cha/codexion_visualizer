import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { DashboardUser, ActionChipProps}  from "@/types/user"
import Silk from "@/components/ui/Backgrounds/Silk/Silk";
import GlassSurface from "@/components/ui/Components/GlassSurface/GlassSurface";
import ShinyText from "@/components/ui/TextAnimations/ShinyText/ShinyText";


export default function Dashboard() {
  const [user, setUser] = useState<DashboardUser | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const encoded = params.get("user");

    if (encoded) {
      try {
        const decoded = JSON.parse(atob(encoded));
        setUser(decoded);
        window.history.replaceState({}, "", "/dashboard");
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
    <div className="min-h-screen bg-[#0c0c0c] text-white">
      <div className="fixed inset-0 -z-10 pointer-events-none">
        <Silk speed={4.5} scale={1} color="#242424" noiseIntensity={1.4} rotation={0} />
      </div>

      <header className="sticky top-0 z-40 px-4 py-4 sm:px-6">
        <GlassSurface
          width="100%"
          height={72}
          borderRadius={18}
          className="mx-auto max-w-6xl flex items-center justify-between px-6"
        >
          <div className="flex items-center gap-3">
            <span className="text-2xl font-bold text-white/90">42</span>
            <span className="text-white/30">·</span>
            <ShinyText
              text="Portal Dashboard"
              className="text-lg sm:text-xl font-semibold"
              color="#9b9b9b"
              shineColor="#f5f5f5"
              speed={4}
              spread={95}
            />
          </div>
          <button
            className="text-xs sm:text-sm tracking-wide text-white/70 hover:text-white transition-colors px-4 py-2 rounded-full border border-white/10 bg-white/5"
            onClick={handleLogout}
          >
            Disconnect
          </button>
        </GlassSurface>
      </header>

      <main className="px-4 pb-16 pt-6 sm:px-6">
        <div className="mx-auto max-w-6xl space-y-6">
          <GlassSurface
            width="100%"
            height="auto"
            borderRadius={20}
            className="p-6 sm:p-8"
          >
            <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-5">
                <div className="relative">
                  {user.image ? (
                    <img
                      src={user.image}
                      alt={user.login}
                      className="h-20 w-20 rounded-2xl object-cover ring-1 ring-white/10"
                    />
                  ) : (
                    <div className="h-20 w-20 rounded-2xl bg-white/5 ring-1 ring-white/10" />
                  )}
                </div>
                <div className="space-y-1">
                  <h2 className="text-2xl font-semibold text-white/90">
                    {user.displayName}
                  </h2>
                  <p className="text-sm text-white/50">@{user.login}</p>
                  <p className="text-sm text-white/40">{user.email}</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-3">
                <ActionChip label={`${user.level?.toFixed(2) ?? "–"} levels`} />
                <ActionChip label={`${user.wallet ?? 0} ₳`} />
              </div>
            </div>
          </GlassSurface>



        </div>
      </main>
    </div>
  );
}



function ActionChip({ label }: ActionChipProps) {
  return (
    <div className="px-3 py-1 rounded-full border border-white/10 bg-white/5 text-xs text-white/60">
      {label}
    </div>
  );
}

const activePools = [
  {
    title: "Travelers Championship Pool",
    detail: "Locks Thu 7:00 AM",
    entries: "43 entries",
    status: "Open",
    accent: "bg-emerald-500",
    icon: "⛳",
  },
  {
    title: "NFL Survivor 2027",
    detail: "Opens Aug 15",
    entries: "0 entries",
    status: "Soon",
    accent: "bg-blue-500",
    icon: "🏈",
  },
  {
    title: "March Madness 2026",
    detail: "Bracket pool",
    entries: "32 entries",
    status: "Open",
    accent: "bg-orange-500",
    icon: "🏀",
  },
];

const liveStandings = [
  ["1", "Reid's Crushers", "-29"],
  ["2", "Mulligan Mafia", "-34"],
  ["3", "Fore Right", "-36"],
];

const recentChampions = [
  ["2026 Masters Pool", "Reid Smith"],
  ["2025 NFL Survivor", "Jason Smith"],
  ["2025 March Madness", "Tyler Jones"],
];

export default function Home() {
  return (
    <main className="min-h-screen bg-[#0d0f12] text-zinc-50">
      <div className="mx-auto min-h-screen w-full max-w-md px-5 pb-24 pt-5">
        <header className="mb-8 overflow-hidden rounded-[2rem] border border-zinc-700/70 bg-black shadow-2xl shadow-black/40">
          <img
            src="/pool-house-logo.png"
            alt="The Pool House"
            className="w-full"
          />
        </header>

        <section className="mb-7">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-sm font-black uppercase tracking-wide">
              <span className="h-3 w-3 rounded-full bg-emerald-400" />
              Live Now
            </h2>
          </div>

          <article className="rounded-[2rem] border border-zinc-700/70 bg-gradient-to-b from-[#202226] to-[#15161a] p-5 shadow-xl shadow-black/30">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <h3 className="text-xl font-black">
                  Travelers Championship Pool
                </h3>
                <p className="mt-1 text-sm text-zinc-400">
                  $430 prize pool · 43 entries
                </p>
                <p className="mt-1 text-xs text-zinc-500">Thru Round 3</p>
              </div>
              <span className="rounded-full bg-emerald-400 px-4 py-1.5 text-[11px] font-black uppercase text-zinc-950">
                Live
              </span>
            </div>

            <div className="divide-y divide-zinc-700/80">
              {liveStandings.map(([rank, name, score], index) => (
                <div
                  key={name}
                  className="grid grid-cols-[32px_1fr_auto] items-center gap-3 py-3.5"
                >
                  <span className="text-sm text-zinc-400">{rank}</span>
                  <span className="text-lg font-black">
                    {index === 0 ? "👑 " : ""}
                    {name}
                  </span>
                  <span className="text-lg font-black text-emerald-300">
                    {score}
                  </span>
                </div>
              ))}
            </div>

            <button className="mt-5 w-full rounded-2xl bg-zinc-100 px-4 py-4 text-sm font-black uppercase tracking-wide text-zinc-950">
              View leaderboard
            </button>
          </article>
        </section>

        <section className="mb-7">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-black uppercase tracking-wide">
              Active Pools
            </h2>
            <button className="text-xs font-black uppercase text-amber-300">
              View all
            </button>
          </div>

          <div className="space-y-3">
            {activePools.map((pool) => (
              <article
                key={pool.title}
                className="relative overflow-hidden rounded-3xl border border-zinc-700/70 bg-gradient-to-b from-[#202226] to-[#15161a] p-4"
              >
                <div
                  className={`absolute bottom-0 left-0 top-0 w-1.5 ${pool.accent}`}
                />
                <div className="flex gap-4 pl-2">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-black/30 text-2xl">
                    {pool.icon}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-lg font-black leading-snug">
                      {pool.title}
                    </h3>
                    <p className="mt-1 text-sm text-zinc-400">
                      {pool.detail} · {pool.entries}
                    </p>
                    <span className="mt-3 inline-flex rounded-full bg-black/25 px-3 py-1.5 text-xs font-black uppercase text-emerald-300">
                      {pool.status}
                    </span>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-black uppercase tracking-wide">
              Recent Champions
            </h2>
          </div>

          <div className="space-y-3">
            {recentChampions.map(([pool, winner]) => (
              <article
                key={pool}
                className="flex items-center gap-4 rounded-3xl border border-zinc-700/70 bg-gradient-to-b from-[#202226] to-[#15161a] p-4"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-black/30 text-2xl">
                  🏆
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-lg font-black">{pool}</p>
                  <p className="mt-1 text-sm font-bold text-amber-300">
                    {winner}
                  </p>
                </div>
                <span className="text-2xl text-zinc-500">›</span>
              </article>
            ))}
          </div>
        </section>

        <nav className="fixed bottom-0 left-0 right-0 border-t border-zinc-800 bg-[#0d0f12]/95 px-4 py-3 backdrop-blur">
          <div className="mx-auto grid max-w-md grid-cols-4 text-center text-[11px] font-semibold text-zinc-500">
            <span className="text-amber-300">Home</span>
            <span>Pools</span>
            <span>Live</span>
            <span>History</span>
          </div>
        </nav>
      </div>
    </main>
  );
}
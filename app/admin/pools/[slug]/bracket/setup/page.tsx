import Link from "next/link";
import { asc, eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import {
  resolveTeamForBracketSlot,
  type ResolvedGame,
  type ResolvedTeam,
} from "@/lib/brackets/resolve";

import { db } from "@/db";
import {
  bracketGames,
  bracketScoringRules,
  bracketTeams,
  pools,
} from "@/db/schema";
import { getIsAdmin } from "@/lib/auth-helpers";

type PageProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{
  added?: string;
  generated?: string;
  cleared?: string;
  winnersUpdated?: string;
  scoringUpdated?: string;
  scoreUpdated?: string;
  teamsImported?: string;
  importFailed?: string;
}>;
};

export default async function BracketSetupPage({
  params,
  searchParams,
}: PageProps) {
  const isAdmin = await getIsAdmin();
  if (!isAdmin) redirect("/");

  const { slug } = await params;
  const {
  added,
  generated,
  cleared,
  winnersUpdated,
  scoringUpdated,
  scoreUpdated,
  teamsImported,
  importFailed,
} = await searchParams;

  const poolRows = await db
    .select()
    .from(pools)
    .where(eq(pools.slug, slug))
    .limit(1);

  const pool = poolRows[0];
  if (!pool) redirect("/admin");

  const teams = await db
    .select()
    .from(bracketTeams)
    .where(eq(bracketTeams.poolId, pool.id))
    .orderBy(asc(bracketTeams.seed), asc(bracketTeams.name));

  const games = await db
    .select()
    .from(bracketGames)
    .where(eq(bracketGames.poolId, pool.id))
    .orderBy(asc(bracketGames.roundOrder), asc(bracketGames.gameNumber));

  const scoringRules = await db
    .select()
    .from(bracketScoringRules)
    .where(eq(bracketScoringRules.poolId, pool.id))
    .orderBy(asc(bracketScoringRules.roundOrder));

  const bracketTeamById = new Map(teams.map((team) => [team.id, team]));

const winnerTeamByGameId = new Map(
  games
    .filter((game) => game.winnerTeamId)
    .map((game) => [game.id, game.winnerTeamId as string])
);

  return (
    <main className="min-h-screen bg-[#0d0f12] px-5 py-8 text-zinc-50">
      <div className="mx-auto max-w-md">
        <p className="text-xs font-black uppercase text-amber-300">
          Admin · Bracket Setup
        </p>
        <h1 className="mt-3 text-3xl font-black">Bracket Setup</h1>
        <p className="mt-2 text-sm text-zinc-400">{pool.title}</p>

{(added === "1" ||
  generated === "1" ||
  cleared === "1" ||
  winnersUpdated === "1" ||
  scoringUpdated === "1" ||
  scoreUpdated === "1" ||
  teamsImported === "1") && (
  <div className="mt-5 rounded-3xl border border-emerald-500/40 bg-emerald-500/10 p-4 text-sm font-bold text-emerald-200">
    {added === "1" && "Team added."}
    {generated === "1" && "Bracket generated."}
    {cleared === "1" && "Bracket data cleared."}
    {winnersUpdated === "1" && "Winners updated."}
    {scoringUpdated === "1" && "Scoring updated."}
    {scoreUpdated === "1" && "Bracket scores computed."}
    {teamsImported === "1" && "Teams imported."}
  </div>
)}

{importFailed === "1" && (
  <div className="mt-5 rounded-3xl border border-red-500/40 bg-red-500/10 p-4 text-sm font-bold text-red-200">
    Team import failed. Make sure your CSV has columns named seed and team.
  </div>
)}
<form
  action={`/api/admin/pools/${pool.slug}/bracket/teams/import`}
  method="post"
  encType="multipart/form-data"
  className="mt-6 rounded-3xl border border-zinc-700/70 bg-gradient-to-b from-[#202226] to-[#15161a] p-5"
>
  <h2 className="text-lg font-black">Import Teams CSV</h2>
  <p className="mt-2 text-sm text-zinc-400">
    Upload a CSV with columns: seed, team. For NFL pools, include region as AFC or NFC.
  </p>

  <input
    name="file"
    type="file"
    accept=".csv,text/csv"
    required
    className="mt-4 w-full rounded-2xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-sm text-zinc-50"
  />

  <label className="mt-4 flex items-center gap-3 rounded-2xl border border-zinc-700 bg-zinc-900 p-4 text-sm font-bold">
    <input type="checkbox" name="clearExisting" />
    Clear existing teams before import
  </label>

  <button className="mt-5 w-full rounded-2xl bg-amber-300 px-4 py-4 text-sm font-black uppercase tracking-wide text-zinc-950">
    Import Teams
  </button>
</form>
        <form
          action={`/api/admin/pools/${pool.slug}/bracket/teams/create`}
          method="post"
          className="mt-6 rounded-3xl border border-zinc-700/70 bg-gradient-to-b from-[#202226] to-[#15161a] p-5"
        >
          <h2 className="text-lg font-black">Add Team</h2>

          <label className="mt-4 block">
            <span className="text-sm font-bold">Team Name</span>
            <input
              name="name"
              required
              placeholder="Dodgers"
              className="mt-2 w-full rounded-2xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-zinc-50 outline-none"
            />
          </label>

          <label className="mt-4 block">
            <span className="text-sm font-bold">Seed</span>
            <input
              name="seed"
              type="number"
              min="1"
              required
              placeholder="1"
              className="mt-2 w-full rounded-2xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-zinc-50 outline-none"
            />
          </label>

          <button className="mt-5 w-full rounded-2xl bg-amber-300 px-4 py-4 text-sm font-black uppercase tracking-wide text-zinc-950">
            Add Team
          </button>
        </form>

        <div className="mt-6 rounded-3xl border border-zinc-700/70 bg-gradient-to-b from-[#202226] to-[#15161a] p-5">
          <h2 className="text-lg font-black">Teams</h2>

          {teams.length === 0 ? (
            <p className="mt-3 text-sm text-zinc-400">No teams added yet.</p>
          ) : (
            <div className="mt-4 space-y-2">
              {teams.map((team) => (
                <div
                  key={team.id}
                  className="flex justify-between rounded-2xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-sm"
                >
                  <span className="font-bold">{team.name}</span>
                  <span className="text-zinc-400">
  Seed {team.seed ?? "—"}
  {team.region ? ` · ${team.region}` : ""}
</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <form
  action={`/api/admin/pools/${pool.slug}/bracket/generate`}
  method="post"
  className="mt-6 rounded-3xl border border-zinc-700/70 bg-gradient-to-b from-[#202226] to-[#15161a] p-5"
>
  <h2 className="text-lg font-black">Generate Bracket</h2>
  <p className="mt-2 text-sm text-zinc-400">
    Choose a bracket format. Standard supports 4, 8, or 16 teams. CFB Playoff
requires exactly 12 teams seeded 1 through 12. NFL Playoffs requires 14 teams:
7 AFC and 7 NFC, each seeded 1 through 7.
  </p>

  <label className="mt-4 block">
    <span className="text-sm font-bold">Bracket Format</span>
    <select
      name="bracketTemplate"
      defaultValue="standard"
      className="mt-2 w-full rounded-2xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-zinc-50 outline-none"
    >
      <option value="standard">Standard Bracket</option>
      <option value="cfb_12_team">College Football Playoff — 12 Teams</option>
      <option value="nfl_14_team">NFL Playoffs — 14 Teams</option>
    </select>
  </label>

  <button className="mt-5 w-full rounded-2xl bg-zinc-100 px-4 py-4 text-sm font-black uppercase tracking-wide text-zinc-950">
    Generate Bracket
  </button>
</form>

        <form
          action={`/api/admin/pools/${pool.slug}/bracket/winners/update`}
          method="post"
          className="mt-6"
        >
          <h2 className="mb-3 text-lg font-black">Games & Winners</h2>

          {games.length === 0 ? (
            <div className="rounded-3xl border border-zinc-700/70 bg-gradient-to-b from-[#202226] to-[#15161a] p-5">
              <p className="font-black">No bracket generated yet.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {games.map((game) => {
                const teamA = resolveTeamForBracketSlot({
  game: game as ResolvedGame,
  slot: "A",
  games: games as ResolvedGame[],
  teamById: bracketTeamById as Map<string, ResolvedTeam>,
  pickedTeamByGameId: winnerTeamByGameId,
});

const teamB = resolveTeamForBracketSlot({
  game: game as ResolvedGame,
  slot: "B",
  games: games as ResolvedGame[],
  teamById: bracketTeamById as Map<string, ResolvedTeam>,
  pickedTeamByGameId: winnerTeamByGameId,
});

const winner = game.winnerTeamId
  ? bracketTeamById.get(game.winnerTeamId)
  : null;

                return (
                  <div
                    key={game.id}
                    className="rounded-3xl border border-zinc-700/70 bg-gradient-to-b from-[#202226] to-[#15161a] p-5"
                  >
                    <p className="text-xs font-black uppercase text-amber-300">
                      {game.roundName} · Game {game.gameNumber}
                    </p>

                    <p className="mt-3 text-lg font-black">
                      {teamA?.name ?? "Winner TBD"} vs{" "}
                      {teamB?.name ?? "Winner TBD"}
                    </p>

                    {winner && (
                      <p className="mt-2 text-sm font-bold text-emerald-300">
                        Winner: {winner.name}
                      </p>
                    )}

                    <label className="mt-4 block">
                      <span className="text-xs font-black uppercase text-zinc-500">
                        Set Winner
                      </span>
                      <select
                        name={`winner-${game.id}`}
                        defaultValue={game.winnerTeamId ?? ""}
                        className="mt-2 w-full rounded-2xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-zinc-50 outline-none"
                      >
                        <option value="">No winner yet</option>

                        {teamA && (
                          <option value={teamA.id}>
                            {teamA.seed ?? "—"} {teamA.name}
                          </option>
                        )}

                        {teamB && (
                          <option value={teamB.id}>
                            {teamB.seed ?? "—"} {teamB.name}
                          </option>
                        )}
                      </select>
                    </label>
                  </div>
                );
              })}

              <button className="w-full rounded-2xl bg-amber-300 px-4 py-4 text-sm font-black uppercase tracking-wide text-zinc-950">
                Save Winners
              </button>
            </div>
          )}
        </form>

{scoringRules.length > 0 && (
  <form
    action={`/api/admin/pools/${pool.slug}/bracket/scoring/update`}
    method="post"
    className="mt-6 rounded-3xl border border-zinc-700/70 bg-gradient-to-b from-[#202226] to-[#15161a] p-5"
  >
    <h2 className="text-lg font-black">Scoring</h2>

    <div className="mt-4 space-y-3">
      {scoringRules.map((rule) => (
        <label
          key={rule.id}
          className="block rounded-2xl border border-zinc-700 bg-zinc-900 p-4"
        >
          <span className="text-sm font-bold">{rule.roundName}</span>
          <input
            name={`points-${rule.id}`}
            type="number"
            min="0"
            defaultValue={rule.points}
            className="mt-2 w-full rounded-xl border border-zinc-700 bg-black/30 px-3 py-2 text-zinc-50 outline-none"
          />
        </label>
      ))}
    </div>

    <button className="mt-5 w-full rounded-2xl bg-amber-300 px-4 py-4 text-sm font-black uppercase tracking-wide text-zinc-950">
      Save Scoring
    </button>
  </form>
)}
<form
  action={`/api/admin/pools/${pool.slug}/bracket/score`}
  method="post"
  className="mt-6"
>
  <button className="w-full rounded-2xl bg-emerald-300 px-4 py-4 text-sm font-black uppercase tracking-wide text-zinc-950">
    Compute Bracket Scores
  </button>
</form>
        <form
          action={`/api/admin/pools/${pool.slug}/bracket/clear`}
          method="post"
          className="mt-6"
        >
          <button className="w-full rounded-2xl border border-red-500/40 bg-red-500/10 px-4 py-4 text-sm font-black uppercase tracking-wide text-red-200">
            Clear Bracket Data
          </button>
        </form>

        <Link
          href={`/admin/pools/${pool.slug}`}
          className="mt-5 block rounded-2xl bg-zinc-100 px-4 py-4 text-center text-sm font-black uppercase tracking-wide text-zinc-950"
        >
          Back to Pool Admin
        </Link>
      </div>
    </main>
  );
}
import { asc, eq } from "drizzle-orm";
import Link from "next/link";
import { notFound } from "next/navigation";
import BracketPicker from "@/components/BracketPicker";
import {
  calculateGolfEntryScore,
  getGolfBonus,
  type GolfScoringSettings,
} from "@/lib/scoring/golf";

import { db } from "@/db";
import {
  bracketGames,
  bracketPicks,
  bracketTeams,
  entries,
  entryPicks,
  leaderboardResults,
  pickGroups,
  pickOptions,
  pools,
} from "@/db/schema";
import { getIsAdmin } from "@/lib/auth-helpers";

type PageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ saved?: string; locked?: string }>;
};

export default async function EntryPage({ params, searchParams }: PageProps) {
  const { id } = await params;
  const { saved, locked } = await searchParams;
  const isAdmin = await getIsAdmin();

  const entryRows = await db
    .select({ entry: entries, pool: pools })
    .from(entries)
    .innerJoin(pools, eq(entries.poolId, pools.id))
    .where(eq(entries.id, id))
    .limit(1);

  const row = entryRows[0];

  if (!row) notFound();

  const isGolfPool = row.pool.poolType === "golf";
  const isBracketPool = row.pool.poolType === "bracket";

  const golfScoringSettings =
    row.pool.scoringSettings && typeof row.pool.scoringSettings === "object"
      ? (row.pool.scoringSettings as GolfScoringSettings)
      : {};

  const deadlinePassed =
    row.pool.entryDeadlineAt &&
    new Date(row.pool.entryDeadlineAt).getTime() <= Date.now();

  const picksAreLocked = Boolean(deadlinePassed && !isAdmin);

  const groups = await db
    .select()
    .from(pickGroups)
    .where(eq(pickGroups.poolId, row.pool.id))
    .orderBy(asc(pickGroups.sortOrder));

  const options = await db
    .select()
    .from(pickOptions)
    .where(eq(pickOptions.poolId, row.pool.id));

  const savedPicks = await db
    .select()
    .from(entryPicks)
    .where(eq(entryPicks.entryId, row.entry.id));

  const results = isGolfPool
    ? await db
        .select()
        .from(leaderboardResults)
        .where(eq(leaderboardResults.poolId, row.pool.id))
    : [];

  const bracketTeamRows = isBracketPool
    ? await db
        .select()
        .from(bracketTeams)
        .where(eq(bracketTeams.poolId, row.pool.id))
        .orderBy(asc(bracketTeams.seed))
    : [];

  const bracketGameRows = isBracketPool
    ? await db
        .select()
        .from(bracketGames)
        .where(eq(bracketGames.poolId, row.pool.id))
        .orderBy(asc(bracketGames.roundOrder), asc(bracketGames.gameNumber))
    : [];

  const savedBracketPicks = isBracketPool
    ? await db
        .select()
        .from(bracketPicks)
        .where(eq(bracketPicks.entryId, row.entry.id))
    : [];

  const bracketTeamById = new Map(
    bracketTeamRows.map((team) => [team.id, team])
  );

  const bracketPickByGameId = new Map(
    savedBracketPicks.map((pick) => [pick.bracketGameId, pick])
  );

  const bracketGamesByRound = new Map<string, typeof bracketGameRows>();

  for (const game of bracketGameRows) {
    const existing = bracketGamesByRound.get(game.roundName) ?? [];
    existing.push(game);
    bracketGamesByRound.set(game.roundName, existing);
  }
  const bracketDisplayRounds = Array.from(bracketGamesByRound.entries()).map(
  ([roundName, games]) => ({
    roundName,
    games: games
      .sort((a, b) => a.gameNumber - b.gameNumber)
      .map((game) => {
        const sourcePickA = game.sourceGameAId
          ? bracketPickByGameId.get(game.sourceGameAId)
          : null;

        const sourcePickB = game.sourceGameBId
          ? bracketPickByGameId.get(game.sourceGameBId)
          : null;

        const teamA = game.teamAId
          ? bracketTeamById.get(game.teamAId)
          : sourcePickA?.pickedTeamId
            ? bracketTeamById.get(sourcePickA.pickedTeamId)
            : null;

        const teamB = game.teamBId
          ? bracketTeamById.get(game.teamBId)
          : sourcePickB?.pickedTeamId
            ? bracketTeamById.get(sourcePickB.pickedTeamId)
            : null;

        const savedPick = bracketPickByGameId.get(game.id);
        const pickedTeam = savedPick?.pickedTeamId
          ? bracketTeamById.get(savedPick.pickedTeamId)
          : null;

        const winner = game.winnerTeamId
          ? bracketTeamById.get(game.winnerTeamId)
          : null;

        return {
          game,
          teamA,
          teamB,
          pickedTeam,
          winner,
        };
      }),
  })
);

  const savedPicksByOptionId = new Map(
    savedPicks.map((pick) => [pick.pickOptionId, pick])
  );

  const savedPickIds = new Set(savedPicks.map((pick) => pick.pickOptionId));
  const selectedOptions = options.filter((option) =>
    savedPickIds.has(option.id)
  );

  const resultByPickOptionId = new Map(
    results.map((result) => [result.pickOptionId, result])
  );

  const selectedPickDetails = groups.flatMap((group) => {
    const selectedForGroup = selectedOptions.filter(
      (option) => option.groupId === group.id
    );

    return selectedForGroup.map((selected) => {
      const result = isGolfPool ? resultByPickOptionId.get(selected.id) : null;

      const position = result?.position ?? null;
      const bonus =
        isGolfPool && typeof position === "number"
          ? getGolfBonus(position, golfScoringSettings)
          : 0;

      const savedPick = savedPicksByOptionId.get(selected.id);

      return {
        group,
        selected,
        result,
        position,
        bonus,
        pickValue: savedPick?.pickValue ?? null,
      };
    });
  });

  const savedBracketPickDetails = savedBracketPicks.map((pick) => {
    const game = bracketGameRows.find((gameRow) => gameRow.id === pick.bracketGameId);
    const team = pick.pickedTeamId
      ? bracketTeamById.get(pick.pickedTeamId)
      : null;

    return {
      pick,
      game,
      team,
    };
  });

  const golfScore = isGolfPool
    ? calculateGolfEntryScore(
        selectedPickDetails.map((item) => ({
          position: item.position,
          bonus: item.bonus,
          score:
            typeof item.position === "number"
              ? item.position - item.bonus
              : null,
        })),
        golfScoringSettings
      )
    : null;

  const basePositionScore = golfScore?.baseScore ?? null;
  const totalBonus = golfScore?.totalBonus ?? 0;
  const finalGolfScore = golfScore?.totalScore ?? null;

  const scoreLabel = isGolfPool ? "Final Score" : "Score";

  return (
    <main className="min-h-screen bg-[#0d0f12] px-5 py-8 text-zinc-50">
      <div className="mx-auto max-w-md">
        <div className="mb-6 overflow-hidden rounded-[2rem] border border-zinc-700/70 bg-black">
          <img
            src="/pool-house-logo.png"
            alt="The Pool House"
            className="w-full"
          />
        </div>

        {saved === "1" && (
          <div className="mb-5 rounded-3xl border border-emerald-500/40 bg-emerald-500/10 p-4 text-sm font-bold text-emerald-200">
            Picks saved.
          </div>
        )}

        {locked === "1" && (
          <div className="mb-5 rounded-3xl border border-amber-500/40 bg-amber-500/10 p-4 text-sm font-bold text-amber-200">
            Picks are locked for this pool.
          </div>
        )}

        <div className="rounded-3xl border border-zinc-700/70 bg-gradient-to-b from-[#202226] to-[#15161a] p-5">
          <p className="text-xs font-black uppercase text-amber-300">Entry</p>

          <h1 className="mt-3 text-3xl font-black">{row.entry.entryName}</h1>

          <Link
            href={`/entries/${row.entry.id}/edit`}
            className="mt-3 inline-block text-sm font-black uppercase text-amber-300"
          >
            Edit Entry
          </Link>

          <p className="mt-2 text-zinc-400">{row.pool.title}</p>

          <div className="mt-5 space-y-3 border-t border-zinc-700 pt-5">
            <div className="flex justify-between">
              <span className="text-zinc-400">Participant</span>
              <span>{row.entry.participantName}</span>
            </div>

            <div className="flex justify-between">
              <span className="text-zinc-400">Paid</span>
              <span>{row.entry.isPaid ? "Yes" : "No"}</span>
            </div>

            <div className="flex justify-between">
              <span className="text-zinc-400">{scoreLabel}</span>
              <span>
                {isGolfPool
                  ? finalGolfScore ?? row.entry.currentScore ?? "—"
                  : row.entry.currentScore ?? "—"}
              </span>
            </div>

            {isGolfPool && (
              <>
                <div className="flex justify-between">
                  <span className="text-zinc-400">Base Position Score</span>
                  <span>{basePositionScore ?? "—"}</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-zinc-400">Bonuses</span>
                  <span>{totalBonus > 0 ? `-${totalBonus}` : "0"}</span>
                </div>
              </>
            )}

            <div className="flex justify-between gap-4">
              <span className="text-zinc-400">Pick Deadline</span>
              <span className="text-right">
                {row.pool.entryDeadlineAt
                  ? new Date(row.pool.entryDeadlineAt).toLocaleString()
                  : "No deadline set"}
              </span>
            </div>

            <div className="flex justify-between">
              <span className="text-zinc-400">Picks</span>
              <span>{picksAreLocked ? "Locked" : "Open"}</span>
            </div>

            {deadlinePassed && isAdmin && (
              <div className="rounded-2xl border border-amber-500/40 bg-amber-500/10 p-3 text-sm font-bold text-amber-200">
                Deadline has passed. Admin override is active.
              </div>
            )}
          </div>
        </div>

        {!isBracketPool && selectedPickDetails.length > 0 && (
          <div className="mt-5 rounded-3xl border border-zinc-700/70 bg-gradient-to-b from-[#202226] to-[#15161a] p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-black">Your Picks</h2>
                <p className="mt-1 text-xs text-zinc-400">
                  {isGolfPool
                    ? "Lowest final score wins. Winner and top-five bonuses do not stack."
                    : "Your saved selections for this pool."}
                </p>
              </div>

              {isGolfPool && (
                <div className="rounded-2xl border border-amber-300/40 bg-amber-300/10 px-4 py-3 text-right">
                  <p className="text-[10px] font-black uppercase text-amber-300">
                    Final
                  </p>
                  <p className="text-2xl font-black">
                    {finalGolfScore ?? "—"}
                  </p>
                </div>
              )}
            </div>

            <div className="mt-4 space-y-3">
              {selectedPickDetails.map(
                ({ group, selected, result, bonus, pickValue }) => (
                  <div
                    key={`${group.id}-${selected.id}`}
                    className="rounded-2xl border border-zinc-700 bg-zinc-900 p-4"
                  >
                    <div className="flex justify-between gap-4">
                      <span className="text-xs font-black uppercase text-zinc-500">
                        {group.name}
                      </span>

                      {isGolfPool && (
                        <span className="text-xs font-black uppercase text-amber-300">
                          Place:{" "}
                          {result?.displayPosition ??
                            result?.position ??
                            "Not imported"}
                          {bonus > 0 ? ` / -${bonus}` : ""}
                        </span>
                      )}
                    </div>

                    <p className="mt-2 text-lg font-black">
                      {pickValue || selected.displayName || selected.name}
                    </p>
                  </div>
                )
              )}
            </div>
          </div>
        )}

        {isBracketPool ? (
          <form
            action={`/api/entries/${row.entry.id}/bracket-picks`}
            method="post"
            className="mt-5 space-y-5"
          >
{bracketGameRows.length === 0 ? (
  <div className="rounded-3xl border border-zinc-700/70 bg-gradient-to-b from-[#202226] to-[#15161a] p-5">
    <h2 className="text-lg font-black">No Bracket Yet</h2>
    <p className="mt-2 text-sm text-zinc-400">
      This pool does not have a generated bracket yet.
    </p>
  </div>
) : (
  <BracketPicker
    games={bracketGameRows}
    teams={bracketTeamRows}
    savedPicks={savedBracketPicks}
    picksAreLocked={picksAreLocked}
  />
)}

            {picksAreLocked ? (
              <div className="rounded-3xl border border-zinc-700/70 bg-gradient-to-b from-[#202226] to-[#15161a] p-5">
                <h2 className="text-lg font-black">Picks Locked</h2>
                <p className="mt-2 text-sm text-zinc-400">
                  The entry deadline has passed. Picks can no longer be changed.
                </p>
              </div>
            ) : (
              bracketGameRows.length > 0 && (
                <button className="w-full rounded-2xl bg-amber-300 px-4 py-4 text-sm font-black uppercase tracking-wide text-zinc-950">
                  Save Bracket Picks
                </button>
              )
            )}
          </form>
        ) : picksAreLocked ? (
          <div className="mt-5 rounded-3xl border border-zinc-700/70 bg-gradient-to-b from-[#202226] to-[#15161a] p-5">
            <h2 className="text-lg font-black">Picks Locked</h2>
            <p className="mt-2 text-sm text-zinc-400">
              The entry deadline has passed. Picks can no longer be changed.
            </p>
          </div>
        ) : (
          <form
            action={`/api/entries/${row.entry.id}/picks`}
            method="post"
            className="mt-5 space-y-5"
          >
            {groups.length === 0 ? (
              <div className="rounded-3xl border border-zinc-700/70 bg-gradient-to-b from-[#202226] to-[#15161a] p-5">
                <h2 className="text-lg font-black">No Pick Groups Yet</h2>
                <p className="mt-2 text-sm text-zinc-400">
                  This pool does not have pick groups imported yet.
                </p>
              </div>
            ) : (
              groups.map((group) => {
                const groupOptions = options.filter(
                  (option) => option.groupId === group.id
                );

                return (
                  <section
                    key={group.id}
                    className="rounded-3xl border border-zinc-700/70 bg-gradient-to-b from-[#202226] to-[#15161a] p-5"
                  >
                    <h2 className="text-lg font-black">{group.name}</h2>
                    <p className="mt-1 text-xs text-zinc-400">
                      Pick {group.maxPicks}
                    </p>

                    <div className="mt-4 space-y-3">
                      {groupOptions.map((option) => (
                        <label
                          key={option.id}
                          className="flex items-center gap-3 rounded-2xl border border-zinc-700 bg-zinc-900 p-4"
                        >
                          <input
                            type={group.maxPicks > 1 ? "checkbox" : "radio"}
                            name={`group-${group.id}`}
                            value={option.id}
                            defaultChecked={savedPickIds.has(option.id)}
                          />
                          <span className="font-bold">
                            {option.displayName ?? option.name}
                          </span>
                        </label>
                      ))}
                    </div>
                  </section>
                );
              })
            )}

            {groups.length > 0 && (
              <button className="w-full rounded-2xl bg-amber-300 px-4 py-4 text-sm font-black uppercase tracking-wide text-zinc-950">
                Save Picks
              </button>
            )}
          </form>
        )}
      </div>
    </main>
  );
}
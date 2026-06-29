"use client";

import { useMemo, useRef } from "react";
import {
  resolveTeamForBracketSlot,
  type ResolvedGame,
  type ResolvedTeam,
} from "@/lib/brackets/resolve";

type Team = ResolvedTeam;

type Game = ResolvedGame & {
  winnerTeamId?: string | null;
};

type BracketPick = {
  gameId: string;
  pickedTeam: Team | null | undefined;
  winnerTeam: Team | null | undefined;
  displayPosition: string | null;
};

export default function BracketView({
  games,
  teams,
  picks,
}: {
  games: Game[];
  teams: Team[];
  picks: BracketPick[];
}) {
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const roundRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const teamById = useMemo(
    () => new Map(teams.map((team) => [team.id, team])),
    [teams]
  );

  const pickedTeamByGameId = useMemo(() => {
    return new Map(
      picks
        .filter((pick) => pick.pickedTeam?.id)
        .map((pick) => [pick.gameId, pick.pickedTeam?.id as string])
    );
  }, [picks]);

  const pickByGameId = useMemo(() => {
    return new Map(picks.map((pick) => [pick.gameId, pick]));
  }, [picks]);

  const rounds = useMemo(() => {
    const map = new Map<string, Game[]>();

    for (const game of games) {
      const existing = map.get(game.roundName) ?? [];
      existing.push(game);
      map.set(game.roundName, existing);
    }

    return Array.from(map.entries());
  }, [games]);

  function scrollToRound(roundName: string) {
    const container = scrollRef.current;
    const round = roundRefs.current[roundName];

    if (!container || !round) return;

    container.scrollTo({
      left: round.offsetLeft - container.offsetLeft,
      behavior: "smooth",
    });
  }

  function getTeamForSlot(game: Game, slot: "A" | "B") {
    return resolveTeamForBracketSlot({
      game,
      slot,
      games,
      teamById,
      pickedTeamByGameId,
    });
  }

  return (
    <div>
      <div className="mb-3 flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {rounds.map(([roundName]) => (
          <button
            key={roundName}
            type="button"
            onClick={() => scrollToRound(roundName)}
            className="shrink-0 rounded-full bg-black/30 px-3 py-2 text-[10px] font-black uppercase text-amber-300"
          >
            {roundName}
          </button>
        ))}
      </div>

      <p className="mb-2 text-[10px] font-black uppercase tracking-wide text-zinc-500">
        Swipe to view rounds →
      </p>

      <div
        ref={scrollRef}
        className="overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        <div className="flex min-w-max gap-3">
          {rounds.map(([roundName, roundGames]) => (
            <div
              key={roundName}
              ref={(node) => {
                roundRefs.current[roundName] = node;
              }}
              className="w-56 shrink-0"
            >
              <button
                type="button"
                onClick={() => scrollToRound(roundName)}
                className="mb-2 w-full rounded-2xl bg-black/30 px-4 py-2 text-left"
              >
                <p className="text-xs font-black uppercase text-amber-300">
                  {roundName}
                </p>
              </button>

              <div className="space-y-2">
                {roundGames
                  .sort((a, b) => a.gameNumber - b.gameNumber)
                  .map((game) => {
                    const teamA = getTeamForSlot(game, "A");
                    const teamB = getTeamForSlot(game, "B");
                    const pick = pickByGameId.get(game.id);
                    const pickedTeam = pick?.pickedTeam ?? null;
                    const winnerTeam = game.winnerTeamId
                      ? teamById.get(game.winnerTeamId) ?? null
                      : pick?.winnerTeam ?? null;

                    return (
                      <div
                        key={game.id}
                        className="rounded-2xl border border-zinc-700 bg-zinc-900 p-3"
                      >
                        <p className="mb-2 text-[10px] font-black uppercase text-zinc-500">
                          Game {game.gameNumber}
                        </p>

                        <div className="space-y-1.5">
                          {[teamA, teamB].map((team, index) => {
                            const isPicked = pickedTeam?.id === team?.id;
                            const isWinner = winnerTeam?.id === team?.id;

                            return (
                              <div
                                key={team?.id ?? `${game.id}-${index}`}
                                className={
                                  isPicked
                                    ? "rounded-xl border border-amber-300/50 bg-amber-300/10 px-3 py-2"
                                    : "rounded-xl border border-zinc-700 bg-black/20 px-3 py-2"
                                }
                              >
                                <div className="flex items-center justify-between gap-2">
                                  <span className="truncate text-sm font-bold">
                                    {team
                                      ? `${team.seed ?? "—"} ${team.name}`
                                      : "Winner TBD"}
                                  </span>

                                  {isWinner && (
                                    <span className="text-[10px] font-black uppercase text-emerald-300">
                                      Won
                                    </span>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        <div className="mt-2 flex items-center justify-between gap-3">
                          <p className="truncate text-[10px] font-black uppercase text-amber-300">
                            Pick: {pickedTeam?.name ?? "No pick"}
                          </p>

                          <p className="shrink-0 text-[10px] font-black uppercase text-emerald-300">
                            {pick?.displayPosition ?? "Pending"}
                          </p>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
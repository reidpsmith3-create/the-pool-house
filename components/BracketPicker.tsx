"use client";

import { useMemo, useRef, useState } from "react";
import {
  resolveTeamForBracketSlot,
  type ResolvedGame,
  type ResolvedTeam,
} from "@/lib/brackets/resolve";

type Team = {
  id: string;
  name: string;
  seed: number | null;
  region: string | null;
};

type Game = {
  id: string;
  roundKey: string;
  roundName: string;
  roundOrder: number;
  gameNumber: number;
  teamAId: string | null;
  teamBId: string | null;
  sourceGameAId: string | null;
  sourceGameBId: string | null;
  slotARule: string | null;
  slotBRule: string | null;
};

type SavedPick = {
  bracketGameId: string;
  pickedTeamId: string | null;
};

export default function BracketPicker({
  games,
  teams,
  savedPicks,
  picksAreLocked,
}: {
  games: Game[];
  teams: Team[];
  savedPicks: SavedPick[];
  picksAreLocked: boolean;
}) {
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const roundRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const [pickedTeamByGameId, setPickedTeamByGameId] = useState(() => {
    return new Map(
      savedPicks
        .filter((pick) => pick.pickedTeamId)
        .map((pick) => [pick.bracketGameId, pick.pickedTeamId as string])
    );
  });

  const teamById = useMemo(
    () => new Map(teams.map((team) => [team.id, team])),
    [teams]
  );

  const gameById = useMemo(
    () => new Map(games.map((game) => [game.id, game])),
    [games]
  );

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

  function getPickedTeamForGame(gameId: string) {
    const pickedTeamId = pickedTeamByGameId.get(gameId);
    return pickedTeamId ? teamById.get(pickedTeamId) ?? null : null;
  }

function getTeamForSlot(game: Game, slot: "A" | "B") {
  return resolveTeamForBracketSlot({
    game: game as ResolvedGame,
    slot,
    games: games as ResolvedGame[],
    teamById: teamById as Map<string, ResolvedTeam>,
    pickedTeamByGameId,
  });
}

  function gameDependsOnGame(game: Game, changedGameId: string) {
    if (game.sourceGameAId === changedGameId || game.sourceGameBId === changedGameId) {
      return true;
    }

    if (!game.slotARule && !game.slotBRule) return false;

    const changedGame = gameById.get(changedGameId);
    if (!changedGame) return false;

    const rules = [game.slotARule, game.slotBRule].filter(Boolean);

    return rules.some((rule) => {
      const [, , sourceRoundKey] = String(rule).split(":");
      return changedGame.roundKey === sourceRoundKey;
    });
  }

  function handlePick(gameId: string, teamId: string) {
    setPickedTeamByGameId((current) => {
      const next = new Map(current);
      next.set(gameId, teamId);

      const gameIdsToClear = new Set<string>();

      for (const game of games) {
        if (gameDependsOnGame(game, gameId)) {
          gameIdsToClear.add(game.id);
        }
      }

      let changed = true;
      while (changed) {
        changed = false;

        for (const game of games) {
          for (const clearGameId of Array.from(gameIdsToClear)) {
            if (
              gameDependsOnGame(game, clearGameId) &&
              !gameIdsToClear.has(game.id)
            ) {
              gameIdsToClear.add(game.id);
              changed = true;
            }
          }
        }
      }

      for (const clearGameId of gameIdsToClear) {
        next.delete(clearGameId);
      }

      return next;
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
        Tap a team to advance them →
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
                    const pickedTeamId = pickedTeamByGameId.get(game.id);

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
                            const isPicked = pickedTeamId === team?.id;

                            return (
                              <label
                                key={team?.id ?? `${game.id}-${index}`}
                                className={
                                  isPicked
                                    ? "block cursor-pointer rounded-xl border border-amber-300/50 bg-amber-300/10 px-3 py-2"
                                    : "block cursor-pointer rounded-xl border border-zinc-700 bg-black/20 px-3 py-2"
                                }
                              >
                                <input
                                  type="radio"
                                  name={`game-${game.id}`}
                                  value={team?.id ?? ""}
                                  disabled={!team || picksAreLocked}
                                  checked={isPicked}
                                  onChange={() => {
                                    if (team) handlePick(game.id, team.id);
                                  }}
                                  className="sr-only"
                                />

                                <span className="block truncate text-sm font-bold">
                                  {team
                                    ? `${team.seed ?? "—"} ${team.name}`
                                    : "Winner TBD"}
                                </span>
                              </label>
                            );
                          })}
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
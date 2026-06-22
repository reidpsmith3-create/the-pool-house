export type BracketGameForScoring = {
  id: string;
  roundKey: string;
  winnerTeamId: string | null;
};

export type BracketPickForScoring = {
  entryId: string;
  bracketGameId: string;
  pickedTeamId: string | null;
};

export type BracketRuleForScoring = {
  roundKey: string;
  points: number;
};

export function calculateBracketEntryScore({
  entryId,
  picks,
  games,
  rules,
}: {
  entryId: string;
  picks: BracketPickForScoring[];
  games: BracketGameForScoring[];
  rules: BracketRuleForScoring[];
}) {
  const gameById = new Map(games.map((game) => [game.id, game]));
  const pointsByRound = new Map(
    rules.map((rule) => [rule.roundKey, Number(rule.points)])
  );

  const entryPicks = picks.filter((pick) => pick.entryId === entryId);

  let totalPoints = 0;
  let correctPicks = 0;
  let scoredGames = 0;

  for (const pick of entryPicks) {
    const game = gameById.get(pick.bracketGameId);
    if (!game?.winnerTeamId) continue;

    scoredGames += 1;

    if (pick.pickedTeamId === game.winnerTeamId) {
      const points = pointsByRound.get(game.roundKey) ?? 0;
      totalPoints += points;
      correctPicks += 1;
    }
  }

  return {
    totalPoints,
    correctPicks,
    scoredGames,
  };
}
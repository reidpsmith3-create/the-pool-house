export type ResolvedTeam = {
  id: string;
  name: string;
  seed: number | null;
  region: string | null;
};

export type ResolvedGame = {
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

export function normalizeBracketRegion(value: string | null | undefined) {
  return String(value ?? "").trim().toUpperCase();
}

export function resolveBracketRule({
  rule,
  games,
  teamById,
  pickedTeamByGameId,
}: {
  rule: string | null;
  games: ResolvedGame[];
  teamById: Map<string, ResolvedTeam>;
  pickedTeamByGameId: Map<string, string>;
}) {
  if (!rule) return null;

  const [type, regionValue, sourceRoundKey] = rule.split(":");
  const region = normalizeBracketRegion(regionValue);

  const sourceWinners = games
    .filter((game) => game.roundKey === sourceRoundKey)
    .map((game) => {
      const pickedTeamId = pickedTeamByGameId.get(game.id);
      return pickedTeamId ? teamById.get(pickedTeamId) ?? null : null;
    })
.filter((team): team is ResolvedTeam => {
  if (!team) return false;
  return normalizeBracketRegion(team.region) === region;
})
    .sort((a, b) => Number(a.seed ?? 999) - Number(b.seed ?? 999));

  if (sourceWinners.length === 0) return null;

  if (type === "highest_remaining") return sourceWinners[0] ?? null;
  if (type === "middle_remaining") return sourceWinners[1] ?? null;
  if (type === "lowest_remaining") {
    return sourceWinners[sourceWinners.length - 1] ?? null;
  }

  return null;
}

export function resolveTeamForBracketSlot({
  game,
  slot,
  games,
  teamById,
  pickedTeamByGameId,
}: {
  game: ResolvedGame;
  slot: "A" | "B";
  games: ResolvedGame[];
  teamById: Map<string, ResolvedTeam>;
  pickedTeamByGameId: Map<string, string>;
}) {
  const directTeamId = slot === "A" ? game.teamAId : game.teamBId;
  if (directTeamId) return teamById.get(directTeamId) ?? null;

  const slotRule = slot === "A" ? game.slotARule : game.slotBRule;
  const ruleTeam = resolveBracketRule({
    rule: slotRule,
    games,
    teamById,
    pickedTeamByGameId,
  });

  if (ruleTeam) return ruleTeam;

  const sourceGameId = slot === "A" ? game.sourceGameAId : game.sourceGameBId;
  if (!sourceGameId) return null;

  const pickedTeamId = pickedTeamByGameId.get(sourceGameId);
  return pickedTeamId ? teamById.get(pickedTeamId) ?? null : null;
}
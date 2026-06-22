import { asc, eq } from "drizzle-orm";
import { redirect } from "next/navigation";

import { db } from "@/db";
import {
  bracketGames,
  bracketScoringRules,
  bracketTeams,
  pools,
} from "@/db/schema";
import { getIsAdmin } from "@/lib/auth-helpers";

type RouteContext = {
  params: Promise<{ slug: string }>;
};

function getRoundNames(teamCount: number) {
  if (teamCount === 4) {
    return [
      { roundKey: "semifinals", roundName: "Semifinals", points: 1 },
      { roundKey: "championship", roundName: "Championship", points: 2 },
    ];
  }

  if (teamCount === 8) {
    return [
      { roundKey: "quarterfinals", roundName: "Quarterfinals", points: 1 },
      { roundKey: "semifinals", roundName: "Semifinals", points: 2 },
      { roundKey: "championship", roundName: "Championship", points: 4 },
    ];
  }

  return [
    { roundKey: "round_of_16", roundName: "Round of 16", points: 1 },
    { roundKey: "quarterfinals", roundName: "Quarterfinals", points: 2 },
    { roundKey: "semifinals", roundName: "Semifinals", points: 4 },
    { roundKey: "championship", roundName: "Championship", points: 8 },
  ];
}

function getSeedPairs(teamCount: number) {
  if (teamCount === 4) {
    return [
      [1, 4],
      [2, 3],
    ];
  }

  if (teamCount === 8) {
    return [
      [1, 8],
      [4, 5],
      [3, 6],
      [2, 7],
    ];
  }

  return [
    [1, 16],
    [8, 9],
    [5, 12],
    [4, 13],
    [3, 14],
    [6, 11],
    [7, 10],
    [2, 15],
  ];
}

export async function POST(_request: Request, context: RouteContext) {
  const isAdmin = await getIsAdmin();
  if (!isAdmin) redirect("/");

  const { slug } = await context.params;

  const poolRows = await db
    .select()
    .from(pools)
    .where(eq(pools.slug, slug))
    .limit(1);

  const pool = poolRows[0];
  if (!pool) redirect("/admin");

  if (pool.poolType !== "bracket") {
    redirect(`/admin/pools/${pool.slug}`);
  }

  const teams = await db
    .select()
    .from(bracketTeams)
    .where(eq(bracketTeams.poolId, pool.id))
    .orderBy(asc(bracketTeams.seed));

  const teamCount = teams.length;

  if (![4, 8, 16].includes(teamCount)) {
    redirect(`/admin/pools/${pool.slug}/bracket/setup`);
  }

  await db.delete(bracketGames).where(eq(bracketGames.poolId, pool.id));
  await db
    .delete(bracketScoringRules)
    .where(eq(bracketScoringRules.poolId, pool.id));

  const teamBySeed = new Map(teams.map((team) => [team.seed, team]));
  const rounds = getRoundNames(teamCount);
  const seedPairs = getSeedPairs(teamCount);

  await db.insert(bracketScoringRules).values(
    rounds.map((round, index) => ({
      poolId: pool.id,
      roundKey: round.roundKey,
      roundName: round.roundName,
      roundOrder: index + 1,
      points: round.points,
    }))
  );

  const firstRound = rounds[0];

  const createdFirstRoundGames = await db
    .insert(bracketGames)
    .values(
      seedPairs.map(([seedA, seedB], index) => ({
        poolId: pool.id,
        roundKey: firstRound.roundKey,
        roundName: firstRound.roundName,
        roundOrder: 1,
        gameNumber: index + 1,
        teamAId: teamBySeed.get(seedA)?.id ?? null,
        teamBId: teamBySeed.get(seedB)?.id ?? null,
      }))
    )
    .returning();

  let previousRoundGames = createdFirstRoundGames;

  for (let roundIndex = 1; roundIndex < rounds.length; roundIndex++) {
    const round = rounds[roundIndex];
    const gamesToCreate = [];

    for (let i = 0; i < previousRoundGames.length; i += 2) {
      gamesToCreate.push({
        poolId: pool.id,
        roundKey: round.roundKey,
        roundName: round.roundName,
        roundOrder: roundIndex + 1,
        gameNumber: gamesToCreate.length + 1,
        sourceGameAId: previousRoundGames[i]?.id ?? null,
        sourceGameBId: previousRoundGames[i + 1]?.id ?? null,
      });
    }

    previousRoundGames = await db
      .insert(bracketGames)
      .values(gamesToCreate)
      .returning();
  }

  redirect(`/admin/pools/${pool.slug}/bracket/setup?generated=1`);
}
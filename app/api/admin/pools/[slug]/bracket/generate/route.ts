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

function getStandardRoundNames(teamCount: number) {
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

function getStandardSeedPairs(teamCount: number) {
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

const cfbRounds = [
  { roundKey: "first_round", roundName: "First Round", points: 1 },
  { roundKey: "quarterfinals", roundName: "Quarterfinals", points: 2 },
  { roundKey: "semifinals", roundName: "Semifinals", points: 4 },
  { roundKey: "championship", roundName: "Championship", points: 8 },
];

const nflRounds = [
  { roundKey: "wild_card", roundName: "Wild Card", points: 1 },
  { roundKey: "divisional", roundName: "Divisional", points: 2 },
  {
    roundKey: "conference_championship",
    roundName: "Conference Championship",
    points: 4,
  },
  { roundKey: "super_bowl", roundName: "Super Bowl", points: 8 },
];

function normalizeRegion(value: string | null) {
  return String(value ?? "").trim().toUpperCase();
}

export async function POST(request: Request, context: RouteContext) {
  const isAdmin = await getIsAdmin();
  if (!isAdmin) redirect("/");

  const { slug } = await context.params;
  const formData = await request.formData();
  const bracketTemplate = String(formData.get("bracketTemplate") ?? "standard");

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

  await db.delete(bracketGames).where(eq(bracketGames.poolId, pool.id));
  await db
    .delete(bracketScoringRules)
    .where(eq(bracketScoringRules.poolId, pool.id));

  const teamBySeed = new Map(teams.map((team) => [team.seed, team]));

  if (bracketTemplate === "nfl_14_team") {
    const afcTeams = teams.filter((team) => normalizeRegion(team.region) === "AFC");
    const nfcTeams = teams.filter((team) => normalizeRegion(team.region) === "NFC");

    if (afcTeams.length !== 7 || nfcTeams.length !== 7) {
      redirect(`/admin/pools/${pool.slug}/bracket/setup`);
    }

    const afcTeamBySeed = new Map(afcTeams.map((team) => [team.seed, team]));
    const nfcTeamBySeed = new Map(nfcTeams.map((team) => [team.seed, team]));

    await db.insert(bracketScoringRules).values(
      nflRounds.map((round, index) => ({
        poolId: pool.id,
        roundKey: round.roundKey,
        roundName: round.roundName,
        roundOrder: index + 1,
        points: round.points,
      }))
    );

    const afcWildCardGames = await db
      .insert(bracketGames)
      .values([
        {
          poolId: pool.id,
          roundKey: "wild_card",
          roundName: "AFC Wild Card",
          roundOrder: 1,
          gameNumber: 1,
          teamAId: afcTeamBySeed.get(2)?.id ?? null,
          teamBId: afcTeamBySeed.get(7)?.id ?? null,
        },
        {
          poolId: pool.id,
          roundKey: "wild_card",
          roundName: "AFC Wild Card",
          roundOrder: 1,
          gameNumber: 2,
          teamAId: afcTeamBySeed.get(3)?.id ?? null,
          teamBId: afcTeamBySeed.get(6)?.id ?? null,
        },
        {
          poolId: pool.id,
          roundKey: "wild_card",
          roundName: "AFC Wild Card",
          roundOrder: 1,
          gameNumber: 3,
          teamAId: afcTeamBySeed.get(4)?.id ?? null,
          teamBId: afcTeamBySeed.get(5)?.id ?? null,
        },
      ])
      .returning();

    const nfcWildCardGames = await db
      .insert(bracketGames)
      .values([
        {
          poolId: pool.id,
          roundKey: "wild_card",
          roundName: "NFC Wild Card",
          roundOrder: 1,
          gameNumber: 4,
          teamAId: nfcTeamBySeed.get(2)?.id ?? null,
          teamBId: nfcTeamBySeed.get(7)?.id ?? null,
        },
        {
          poolId: pool.id,
          roundKey: "wild_card",
          roundName: "NFC Wild Card",
          roundOrder: 1,
          gameNumber: 5,
          teamAId: nfcTeamBySeed.get(3)?.id ?? null,
          teamBId: nfcTeamBySeed.get(6)?.id ?? null,
        },
        {
          poolId: pool.id,
          roundKey: "wild_card",
          roundName: "NFC Wild Card",
          roundOrder: 1,
          gameNumber: 6,
          teamAId: nfcTeamBySeed.get(4)?.id ?? null,
          teamBId: nfcTeamBySeed.get(5)?.id ?? null,
        },
      ])
      .returning();

    const afcDivisionalGames = await db
      .insert(bracketGames)
      .values([
        {
          poolId: pool.id,
          roundKey: "divisional",
          roundName: "AFC Divisional",
          roundOrder: 2,
          gameNumber: 1,
          teamAId: afcTeamBySeed.get(1)?.id ?? null,
          slotBRule: "lowest_remaining:AFC:wild_card",
        },
        {
          poolId: pool.id,
          roundKey: "divisional",
          roundName: "AFC Divisional",
          roundOrder: 2,
          gameNumber: 2,
          slotARule: "highest_remaining:AFC:wild_card",
          slotBRule: "middle_remaining:AFC:wild_card",
        },
      ])
      .returning();

    const nfcDivisionalGames = await db
      .insert(bracketGames)
      .values([
        {
          poolId: pool.id,
          roundKey: "divisional",
          roundName: "NFC Divisional",
          roundOrder: 2,
          gameNumber: 3,
          teamAId: nfcTeamBySeed.get(1)?.id ?? null,
          slotBRule: "lowest_remaining:NFC:wild_card",
        },
        {
          poolId: pool.id,
          roundKey: "divisional",
          roundName: "NFC Divisional",
          roundOrder: 2,
          gameNumber: 4,
          slotARule: "highest_remaining:NFC:wild_card",
          slotBRule: "middle_remaining:NFC:wild_card",
        },
      ])
      .returning();

    const conferenceChampionshipGames = await db
      .insert(bracketGames)
      .values([
        {
          poolId: pool.id,
          roundKey: "conference_championship",
          roundName: "AFC Championship",
          roundOrder: 3,
          gameNumber: 1,
          sourceGameAId: afcDivisionalGames[0]?.id ?? null,
          sourceGameBId: afcDivisionalGames[1]?.id ?? null,
        },
        {
          poolId: pool.id,
          roundKey: "conference_championship",
          roundName: "NFC Championship",
          roundOrder: 3,
          gameNumber: 2,
          sourceGameAId: nfcDivisionalGames[0]?.id ?? null,
          sourceGameBId: nfcDivisionalGames[1]?.id ?? null,
        },
      ])
      .returning();

    await db.insert(bracketGames).values({
      poolId: pool.id,
      roundKey: "super_bowl",
      roundName: "Super Bowl",
      roundOrder: 4,
      gameNumber: 1,
      sourceGameAId: conferenceChampionshipGames[0]?.id ?? null,
      sourceGameBId: conferenceChampionshipGames[1]?.id ?? null,
    });

    redirect(`/admin/pools/${pool.slug}/bracket/setup?generated=1`);
  }

  if (bracketTemplate === "cfb_12_team") {
    if (teamCount !== 12) {
      redirect(`/admin/pools/${pool.slug}/bracket/setup`);
    }

    await db.insert(bracketScoringRules).values(
      cfbRounds.map((round, index) => ({
        poolId: pool.id,
        roundKey: round.roundKey,
        roundName: round.roundName,
        roundOrder: index + 1,
        points: round.points,
      }))
    );

    const firstRoundGames = await db
      .insert(bracketGames)
      .values([
        {
          poolId: pool.id,
          roundKey: "first_round",
          roundName: "First Round",
          roundOrder: 1,
          gameNumber: 1,
          teamAId: teamBySeed.get(12)?.id ?? null,
          teamBId: teamBySeed.get(5)?.id ?? null,
        },
        {
          poolId: pool.id,
          roundKey: "first_round",
          roundName: "First Round",
          roundOrder: 1,
          gameNumber: 2,
          teamAId: teamBySeed.get(9)?.id ?? null,
          teamBId: teamBySeed.get(8)?.id ?? null,
        },
        {
          poolId: pool.id,
          roundKey: "first_round",
          roundName: "First Round",
          roundOrder: 1,
          gameNumber: 3,
          teamAId: teamBySeed.get(11)?.id ?? null,
          teamBId: teamBySeed.get(6)?.id ?? null,
        },
        {
          poolId: pool.id,
          roundKey: "first_round",
          roundName: "First Round",
          roundOrder: 1,
          gameNumber: 4,
          teamAId: teamBySeed.get(10)?.id ?? null,
          teamBId: teamBySeed.get(7)?.id ?? null,
        },
      ])
      .returning();

    const quarterfinalGames = await db
      .insert(bracketGames)
      .values([
        {
          poolId: pool.id,
          roundKey: "quarterfinals",
          roundName: "Quarterfinals",
          roundOrder: 2,
          gameNumber: 1,
          teamAId: teamBySeed.get(4)?.id ?? null,
          sourceGameBId: firstRoundGames[0]?.id ?? null,
        },
        {
          poolId: pool.id,
          roundKey: "quarterfinals",
          roundName: "Quarterfinals",
          roundOrder: 2,
          gameNumber: 2,
          teamAId: teamBySeed.get(1)?.id ?? null,
          sourceGameBId: firstRoundGames[1]?.id ?? null,
        },
        {
          poolId: pool.id,
          roundKey: "quarterfinals",
          roundName: "Quarterfinals",
          roundOrder: 2,
          gameNumber: 3,
          teamAId: teamBySeed.get(3)?.id ?? null,
          sourceGameBId: firstRoundGames[2]?.id ?? null,
        },
        {
          poolId: pool.id,
          roundKey: "quarterfinals",
          roundName: "Quarterfinals",
          roundOrder: 2,
          gameNumber: 4,
          teamAId: teamBySeed.get(2)?.id ?? null,
          sourceGameBId: firstRoundGames[3]?.id ?? null,
        },
      ])
      .returning();

    const semifinalGames = await db
      .insert(bracketGames)
      .values([
        {
          poolId: pool.id,
          roundKey: "semifinals",
          roundName: "Semifinals",
          roundOrder: 3,
          gameNumber: 1,
          sourceGameAId: quarterfinalGames[0]?.id ?? null,
          sourceGameBId: quarterfinalGames[1]?.id ?? null,
        },
        {
          poolId: pool.id,
          roundKey: "semifinals",
          roundName: "Semifinals",
          roundOrder: 3,
          gameNumber: 2,
          sourceGameAId: quarterfinalGames[2]?.id ?? null,
          sourceGameBId: quarterfinalGames[3]?.id ?? null,
        },
      ])
      .returning();

    await db.insert(bracketGames).values({
      poolId: pool.id,
      roundKey: "championship",
      roundName: "Championship",
      roundOrder: 4,
      gameNumber: 1,
      sourceGameAId: semifinalGames[0]?.id ?? null,
      sourceGameBId: semifinalGames[1]?.id ?? null,
    });

    redirect(`/admin/pools/${pool.slug}/bracket/setup?generated=1`);
  }

  if (![4, 8, 16].includes(teamCount)) {
    redirect(`/admin/pools/${pool.slug}/bracket/setup`);
  }

  const rounds = getStandardRoundNames(teamCount);
  const seedPairs = getStandardSeedPairs(teamCount);

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
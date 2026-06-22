import { eq } from "drizzle-orm";

import { db } from "@/db";
import {
  leaderboardResults,
  leaderboardSources,
  pickOptionAliases,
  pickOptions,
  pools,
} from "@/db/schema";
import {
  normalizeGolfName,
  parseRapidGolfLeaderboardRows,
} from "@/lib/golf/parse-leaderboard";

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");

  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!process.env.RAPIDAPI_KEY) {
    return Response.json({ error: "Missing RAPIDAPI_KEY" }, { status: 500 });
  }

  const sources = await db
    .select()
    .from(leaderboardSources)
    .where(eq(leaderboardSources.autoSyncEnabled, true));

  const syncedPools: string[] = [];
  const failedPools: string[] = [];

  for (const source of sources) {
    const poolRows = await db
      .select()
      .from(pools)
      .where(eq(pools.id, source.poolId))
      .limit(1);

    const pool = poolRows[0];

    if (!pool || pool.poolType !== "golf") continue;

    try {
      const scoringSettings =
        pool.scoringSettings && typeof pool.scoringSettings === "object"
          ? (pool.scoringSettings as { missedCutScore?: number | null })
          : {};

      const missedCutScore =
        scoringSettings.missedCutScore !== undefined &&
        scoringSettings.missedCutScore !== null &&
        Number.isFinite(Number(scoringSettings.missedCutScore))
          ? Math.floor(Number(scoringSettings.missedCutScore))
          : null;

      const response = await fetch(source.sourceUrl, {
        method: "GET",
        headers: {
          "x-rapidapi-host": "live-golf-data.p.rapidapi.com",
          "x-rapidapi-key": process.env.RAPIDAPI_KEY,
        },
        cache: "no-store",
      });

      if (!response.ok) {
        failedPools.push(pool.slug);
        continue;
      }

      const rawData = await response.json();
      const sourceRows = parseRapidGolfLeaderboardRows(rawData);

      if (sourceRows.length === 0) {
        failedPools.push(pool.slug);
        continue;
      }

      const golfers = await db
        .select()
        .from(pickOptions)
        .where(eq(pickOptions.poolId, pool.id));

      const aliases = await db
        .select()
        .from(pickOptionAliases)
        .where(eq(pickOptionAliases.poolId, pool.id));

      const golferByName = new Map(
        golfers.map((golfer) => [
          normalizeGolfName(golfer.displayName ?? golfer.name),
          golfer,
        ])
      );

      const golferBySourceId = new Map(
        golfers
          .filter((golfer) => golfer.sourceId)
          .map((golfer) => [golfer.sourceId, golfer])
      );

      const golferById = new Map(golfers.map((golfer) => [golfer.id, golfer]));

      const aliasByNormalizedName = new Map(
        aliases.map((alias) => [alias.normalizedSourceName, alias])
      );

      const values: (typeof leaderboardResults.$inferInsert)[] = [];

      for (const row of sourceRows) {
        const name = row.name.trim();
        if (!name) continue;

        const normalizedName = normalizeGolfName(name);

        const alias = aliasByNormalizedName.get(normalizedName);
        const aliasMatchedGolfer = alias
          ? golferById.get(alias.pickOptionId)
          : null;

        const sourceIdMatchedGolfer = row.sourceId
          ? golferBySourceId.get(row.sourceId)
          : null;

        const matchedGolfer =
          sourceIdMatchedGolfer ??
          aliasMatchedGolfer ??
          golferByName.get(normalizedName) ??
          null;

        if (!matchedGolfer) continue;

        const normalizedStatus = String(row.status ?? "").toLowerCase();
        const normalizedDisplayPosition = String(
          row.displayPosition ?? ""
        ).toLowerCase();

        const isMissedCut =
          normalizedStatus === "cut" ||
          normalizedStatus === "mc" ||
          normalizedDisplayPosition === "cut" ||
          normalizedDisplayPosition === "mc";

        const effectivePosition =
          isMissedCut && missedCutScore !== null
            ? missedCutScore
            : row.position;

        const effectiveDisplayPosition =
          isMissedCut && missedCutScore !== null
            ? `MC (${missedCutScore})`
            : row.displayPosition;

        values.push({
          poolId: pool.id,
          pickOptionId: matchedGolfer.id,
          sourceId: row.sourceId ?? matchedGolfer.sourceId,
          name: matchedGolfer.displayName ?? matchedGolfer.name,
          position: effectivePosition,
          displayPosition: effectiveDisplayPosition || null,
          status: row.status || "active",
          scoreValue:
            row.scoreValue === "E"
              ? "0"
              : row.scoreValue !== undefined &&
                  row.scoreValue !== null &&
                  Number.isFinite(Number(String(row.scoreValue).replace("+", "")))
                ? String(Number(String(row.scoreValue).replace("+", "")))
                : effectivePosition !== null
                  ? String(effectivePosition)
                  : null,
          metadata: {
  source: "rapidapi_golf_cron",
  sourceName: name,
  normalizedSourceName: normalizedName,
  currentRoundScore: row.currentRoundScore,
  holesPlayed: row.holesPlayed,
  totalStrokes: row.totalStrokes,
},
          updatedAt: new Date(),
        });
      }

      if (values.length === 0) {
        failedPools.push(pool.slug);
        continue;
      }

      await db
        .delete(leaderboardResults)
        .where(eq(leaderboardResults.poolId, pool.id));

      await db.insert(leaderboardResults).values(values);

      await db
        .update(leaderboardSources)
        .set({ lastSyncedAt: new Date() })
        .where(eq(leaderboardSources.id, source.id));

      syncedPools.push(pool.slug);
    } catch {
      failedPools.push(pool.slug);
    }
  }

  return Response.json({
    success: true,
    syncedPools,
    failedPools,
  });
}
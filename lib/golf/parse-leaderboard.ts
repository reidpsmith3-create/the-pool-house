export type ParsedGolfResult = {
  name: string;
  displayPosition: string;
  position: number | null;
  status: string;
  scoreValue?: string | null;
};

export function parseDisplayPosition(value: string) {
  const cleaned = value.trim().toUpperCase();

  if (!cleaned || cleaned === "-" || cleaned === "—") return null;
  if (cleaned === "CUT" || cleaned === "MC" || cleaned === "WD" || cleaned === "DQ") {
    return null;
  }

  const numeric = cleaned.replace(/^T/, "");
  const position = Number(numeric);

  return Number.isFinite(position) && position > 0 ? position : null;
}

export function normalizeGolfName(value: string) {
  return value
    .toLowerCase()
    .replace(/\./g, "")
    .replace(/[^a-z0-9 ]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}
export type RapidGolfLeaderboardRow = {
  firstName?: string;
  lastName?: string;
  playerId?: string;
  position?: string;
  total?: string;
  status?: string;
};

export function parseRapidGolfLeaderboardRows(rawData: unknown) {
  const data = rawData as {
    leaderboardRows?: RapidGolfLeaderboardRow[];
  };

  const rows = Array.isArray(data.leaderboardRows)
    ? data.leaderboardRows
    : [];

  return rows
    .map((row) => {
      const firstName = String(row.firstName ?? "").trim();
      const lastName = String(row.lastName ?? "").trim();
      const name = `${firstName} ${lastName}`.trim();
      const displayPosition = String(row.position ?? "").trim();

      if (!name || !displayPosition) return null;

      return {
        name,
        sourceId: row.playerId ? String(row.playerId) : null,
        displayPosition,
        position: parseDisplayPosition(displayPosition),
        status: row.status ?? "active",
        scoreValue: row.total ?? null,
      };
    })
    .filter(
      (
        row
      ): row is {
        name: string;
        sourceId: string | null;
        displayPosition: string;
        position: number | null;
        status: string;
        scoreValue: string | null;
      } => Boolean(row)
    );
}
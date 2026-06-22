export type ParsedGolfResult = {
  name: string;
  sourceId: string | null;
  displayPosition: string;
  position: number | null;
  status: string;
  scoreValue: string | null;
  currentRoundScore: string | null;
  holesPlayed: string | null;
  totalStrokes: string | null;
};

export function parseDisplayPosition(value: string) {
  const cleaned = value.trim().toUpperCase();

  if (!cleaned || cleaned === "-" || cleaned === "—") return null;
  if (
    cleaned === "CUT" ||
    cleaned === "MC" ||
    cleaned === "WD" ||
    cleaned === "DQ"
  ) {
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
  currentRoundScore?: string;
  roundScore?: string;
  today?: string;
  thru?: string;
  holesPlayed?: string;
  totalStrokes?: string;
};

function firstAvailableValue(...values: unknown[]): string | null {
  for (const value of values) {
    if (value !== undefined && value !== null && String(value).trim() !== "") {
      return String(value).trim();
    }
  }

  return null;
}

export function parseRapidGolfLeaderboardRows(
  rawData: unknown
): ParsedGolfResult[] {
  const data = rawData as {
    leaderboardRows?: RapidGolfLeaderboardRow[];
  };

  const rows = Array.isArray(data.leaderboardRows)
    ? data.leaderboardRows
    : [];

  const parsedRows: ParsedGolfResult[] = [];

  for (const row of rows) {
    const firstName = String(row.firstName ?? "").trim();
    const lastName = String(row.lastName ?? "").trim();
    const name = `${firstName} ${lastName}`.trim();
    const displayPosition = String(row.position ?? "").trim();

    if (!name || !displayPosition) continue;

    parsedRows.push({
      name,
      sourceId: row.playerId ? String(row.playerId) : null,
      displayPosition,
      position: parseDisplayPosition(displayPosition),
      status: row.status ?? "active",
      scoreValue: row.total ?? null,
      currentRoundScore: firstAvailableValue(
        row.currentRoundScore,
        row.roundScore,
        row.today
      ),
      holesPlayed: firstAvailableValue(row.thru, row.holesPlayed),
      totalStrokes: firstAvailableValue(row.totalStrokes),
    });
  }

  return parsedRows;
}
export type GolfScoringSettings = {
  winnerBonus?: number;
  topFiveBonus?: number;
  scoresToCount?: number;
  missedCutScore?: number;
};

export type GolfPickScore = {
  position: number | null;
  bonus: number;
  score: number | null;
};

export function getGolfBonus(
  position: number,
  settings: GolfScoringSettings
) {
  const winnerBonus = Number(settings.winnerBonus ?? 0);
  const topFiveBonus = Number(settings.topFiveBonus ?? 0);

  if (position === 1) return winnerBonus;
  if (position <= 5) return topFiveBonus;

  return 0;
}

export function getGolfScoresToCount(settings: GolfScoringSettings) {
  const scoresToCount = Number(settings.scoresToCount ?? 4);

  if (!Number.isFinite(scoresToCount) || scoresToCount < 1) {
    return 4;
  }

  return Math.floor(scoresToCount);
}

export function calculateGolfEntryScore(
  picks: GolfPickScore[],
  settings: GolfScoringSettings
) {
  const scoresToCount = getGolfScoresToCount(settings);

  const availableScores = picks
    .filter((pick): pick is GolfPickScore & { score: number } => {
      return typeof pick.score === "number";
    })
    .sort((a, b) => a.score - b.score);

  const countedScores = availableScores.slice(0, scoresToCount);

  const baseScore = countedScores.reduce((sum, pick) => {
    return sum + Number(pick.position ?? 0);
  }, 0);

  const totalBonus = countedScores.reduce((sum, pick) => {
    return sum + pick.bonus;
  }, 0);

  const totalScore = countedScores.reduce((sum, pick) => {
    return sum + pick.score;
  }, 0);

  return {
    hasCompleteScore: countedScores.length >= scoresToCount,
    scoresToCount,
    countedScores,
    baseScore: countedScores.length > 0 ? baseScore : null,
    totalBonus,
    totalScore: countedScores.length > 0 ? totalScore : null,
  };
}
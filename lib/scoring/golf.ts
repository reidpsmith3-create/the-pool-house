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

  const completedScores = picks
    .filter((pick): pick is GolfPickScore & { score: number } => {
      return typeof pick.score === "number";
    })
    .sort((a, b) => a.score - b.score);

  const countedScores = completedScores.slice(0, scoresToCount);

  if (countedScores.length < scoresToCount) {
    return {
      hasCompleteScore: false,
      scoresToCount,
      countedScores,
      baseScore: null,
      totalBonus: 0,
      totalScore: null,
    };
  }

  return {
    hasCompleteScore: true,
    scoresToCount,
    countedScores,
    baseScore: countedScores.reduce((sum, pick) => {
      return sum + Number(pick.position ?? 0);
    }, 0),
    totalBonus: countedScores.reduce((sum, pick) => {
      return sum + pick.bonus;
    }, 0),
    totalScore: countedScores.reduce((sum, pick) => {
      return sum + pick.score;
    }, 0),
  };
}
/**
 * EXポイント計算ユーティリティ
 * タイピング難易度・速度評価・精度評価からEXポイントを算出する。
 */
export type SpeedRating = 'Fast' | 'Normal' | 'Slow' | 'Miss';
export type AccuracyRating = 'Perfect' | 'Good' | 'Poor';

/**
 * EXポイントを計算する。
 * @param typingDifficulty タイピング難易度（1-5想定）
 * @param speedRating 速度評価（Fast/Normal/Slow/Miss）
 * @param accuracyRating 精度評価（Perfect/Good/Poor）
 * @returns 算出されたEXポイント（小数点以下は切り捨て）
 */
export function calculateExPointGain(
  typingDifficulty: number,
  speedRating: SpeedRating,
  accuracyRating: AccuracyRating
): number {
  const speedMultiplier: Record<SpeedRating, number> = {
    Fast: 2.0,
    Normal: 1.5,
    Slow: 1.0,
    Miss: 0.0,
  };

  const accuracyMultiplier: Record<AccuracyRating, number> = {
    Perfect: 2.0,
    Good: 1.0,
    Poor: 0.5,
  };

  const basePoints = typingDifficulty;
  const total = basePoints * speedMultiplier[speedRating] * accuracyMultiplier[accuracyRating];
  return Math.floor(total);
}

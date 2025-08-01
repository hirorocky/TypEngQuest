/**
 * タイピング評価の速度レーティング
 */
export type SpeedRating = 'S' | 'A' | 'B' | 'C' | 'F';

/**
 * タイピング評価の精度レーティング
 */
export type AccuracyRating = 'Perfect' | 'Great' | 'Good' | 'Poor';

/**
 * タイピング結果
 */
export interface TypingResult {
  /** 速度評価 */
  speedRating: SpeedRating;
  /** 精度評価 */
  accuracyRating: AccuracyRating;
  /** 総合評価（効果倍率: 0, 80, 100, 120, 150） */
  totalRating: number;
  /** かかった時間（ミリ秒） */
  timeTaken: number;
  /** 精度（パーセント） */
  accuracy: number;
  /** 成功かどうか */
  isSuccess: boolean;
}

/**
 * タイピング進捗情報
 */
export interface TypingProgress {
  /** 問題文 */
  text: string;
  /** 現在の入力 */
  input: string;
  /** エラーのある文字のインデックス */
  errors: number[];
}

/**
 * タイピング難易度
 */
export type TypingDifficulty = 1 | 2 | 3 | 4 | 5;

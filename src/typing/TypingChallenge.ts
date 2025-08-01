import { TypingDifficulty, TypingProgress, TypingResult } from './types';

/**
 * タイピングチャレンジクラス - タイピングチャレンジの実行とデータ管理
 */
export class TypingChallenge {
  private text: string;
  private difficulty: TypingDifficulty;
  private input: string = '';
  private startTime: number | null = null;
  private endTime: number | null = null;
  private errors: Set<number> = new Set();

  /**
   * コンストラクタ
   * @param text - 問題文
   * @param difficulty - 難易度
   */
  constructor(text: string, difficulty: TypingDifficulty) {
    this.text = text;
    this.difficulty = difficulty;
  }

  /**
   * チャレンジを開始
   */
  start(): void {
    this.startTime = Date.now();
    this.input = '';
    this.errors.clear();
  }

  /**
   * 入力を処理
   * @param char - 入力された文字
   */
  handleInput(_char: string): void {
    // 実装はPhase 2で行う
  }

  /**
   * チャレンジが完了しているか
   * @returns 完了している場合true
   */
  isComplete(): boolean {
    return false; // 実装はPhase 2で行う
  }

  /**
   * 結果を取得
   * @returns タイピング結果
   */
  getResult(): TypingResult {
    // 実装はPhase 2で行う
    return {
      speedRating: 'C',
      accuracyRating: 'Good',
      totalRating: 100,
      timeTaken: 0,
      accuracy: 0,
      isSuccess: true,
    };
  }

  /**
   * 進捗を取得
   * @returns 進捗情報
   */
  getProgress(): TypingProgress {
    return {
      text: this.text,
      input: this.input,
      errors: Array.from(this.errors),
    };
  }

  /**
   * 残り時間を取得
   * @returns 残り時間（秒）
   */
  getRemainingTime(): number {
    // 実装はPhase 2で行う
    return 10.0;
  }

  /**
   * 問題文を取得
   * @returns 問題文
   */
  getText(): string {
    return this.text;
  }
}

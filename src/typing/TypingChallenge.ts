import {
  TypingDifficulty,
  TypingProgress,
  TypingResult,
  SpeedRating,
  AccuracyRating,
} from './types';

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
  private totalKeystrokes: number = 0;
  private incorrectKeystrokes: number = 0;

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
    this.endTime = null;
    this.input = '';
    this.errors.clear();
    this.totalKeystrokes = 0;
    this.incorrectKeystrokes = 0;
  }

  /**
   * 入力を処理
   * @param char - 入力された文字
   */
  handleInput(char: string): void {
    // 既に完了している場合は何もしない
    if (this.isComplete()) {
      return;
    }

    // バックスペース処理
    if (char === '\x7f') {
      if (this.input.length > 0) {
        const deleteIndex = this.input.length - 1;
        const wasError = this.errors.has(deleteIndex);
        this.errors.delete(deleteIndex);

        this.input = this.input.slice(0, -1);

        // バックスペースによる削除はtotalKeystrokesとincorrectKeystrokesを調整
        this.totalKeystrokes--;
        if (wasError) {
          this.incorrectKeystrokes--;
        }
      }
      return;
    }

    // 通常の文字入力
    const currentIndex = this.input.length;
    const expectedChar = this.text[currentIndex];

    this.totalKeystrokes++;

    if (char !== expectedChar) {
      this.errors.add(currentIndex);
      this.incorrectKeystrokes++;
    }

    this.input += char;

    // 全文字入力完了したら終了時刻を記録
    if (this.input.length === this.text.length && !this.endTime) {
      this.endTime = Date.now();
    }
  }

  /**
   * チャレンジが完了しているか
   * @returns 完了している場合true
   */
  isComplete(): boolean {
    // 全文字入力したか、時間切れ
    return (
      this.input.length === this.text.length ||
      (this.startTime !== null && this.getRemainingTime() <= 0)
    );
  }

  /**
   * 結果を取得
   * @returns タイピング結果
   */
  getResult(): TypingResult {
    const timeTaken = this.getTimeTaken();
    const accuracy = this.calculateAccuracy();
    const speedRating = this.calculateSpeedRating(timeTaken);
    const accuracyRating = this.calculateAccuracyRating(accuracy);
    const totalRating = this.calculateTotalRating(speedRating, accuracyRating);

    return {
      speedRating,
      accuracyRating,
      totalRating,
      timeTaken,
      accuracy,
      isSuccess: totalRating > 0,
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
    if (!this.startTime) {
      return this.getTimeLimit();
    }

    const elapsed = (Date.now() - this.startTime) / 1000;
    const remaining = this.getTimeLimit() - elapsed;
    return Math.max(0, remaining);
  }

  /**
   * 問題文を取得
   * @returns 問題文
   */
  getText(): string {
    return this.text;
  }

  /**
   * 制限時間を取得
   * @returns 制限時間（秒）
   */
  getTimeLimit(): number {
    return 10 + this.difficulty * 5;
  }

  /**
   * かかった時間を取得
   * @returns 時間（ミリ秒）
   */
  private getTimeTaken(): number {
    if (!this.startTime) {
      return 0;
    }

    const endTime = this.endTime || Date.now();
    return endTime - this.startTime;
  }

  /**
   * 精度を計算
   * @returns 精度（パーセント）
   */
  private calculateAccuracy(): number {
    if (this.totalKeystrokes === 0) {
      return 100;
    }

    const correctKeystrokes = this.totalKeystrokes - this.incorrectKeystrokes;
    return (correctKeystrokes / this.totalKeystrokes) * 100;
  }

  /**
   * 速度評価を計算
   * @param timeTaken - かかった時間（ミリ秒）
   * @returns 速度評価
   */
  private calculateSpeedRating(timeTaken: number): SpeedRating {
    const timeLimit = this.getTimeLimit() * 1000; // ミリ秒に変換
    const percentage = (timeTaken / timeLimit) * 100;

    if (percentage > 100) return 'Miss'; // 時間切れ
    if (percentage <= 70) return 'Fast'; // 70%以下
    if (percentage <= 85) return 'Normal'; // 85%以下
    return 'Slow'; // 100%以下
  }

  /**
   * 精度評価を計算
   * @param accuracy - 精度（パーセント）
   * @returns 精度評価
   */
  private calculateAccuracyRating(accuracy: number): AccuracyRating {
    if (accuracy === 100) return 'Perfect';
    if (accuracy >= 95) return 'Good';
    return 'Poor';
  }

  /**
   * 総合評価を計算
   * @param speedRating - 速度評価
   * @param accuracyRating - 精度評価
   * @returns 効果倍率
   */
  private calculateTotalRating(speedRating: SpeedRating, accuracyRating: AccuracyRating): number {
    // Miss or Poorの場合は失敗
    if (speedRating === 'Miss' || accuracyRating === 'Poor') {
      return 0;
    }

    // Fast + Perfect
    if (speedRating === 'Fast' && accuracyRating === 'Perfect') {
      return 150;
    }

    // Fast + Good
    if (speedRating === 'Fast' && accuracyRating === 'Good') {
      return 120;
    }

    // Normal + Perfect/Good
    if (speedRating === 'Normal') {
      return 100;
    }

    // Slow + Perfect/Good
    if (speedRating === 'Slow') {
      return 80;
    }

    return 0;
  }
}

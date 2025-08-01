import { CommandResult, PhaseTypes } from '../core/types';
import { Player } from '../player/Player';
import { Display } from '../ui/Display';
import { TypingChallenge } from '../typing/TypingChallenge';
import { TypingDifficulty, TypingProgress, TypingResult } from '../typing/types';
import { green, red, gray } from '../ui/colors';

/**
 * タイピングチャレンジフェーズ - リアルタイムタイピングチャレンジを管理
 */
export class TypingPhase {
  private challenge: TypingChallenge;

  /**
   * TypingPhaseのコンストラクタ
   * @param text - タイピングする問題文
   * @param difficulty - 難易度（1-5）
   */
  constructor(text: string, difficulty: TypingDifficulty) {
    this.challenge = new TypingChallenge(text, difficulty);
  }

  /**
   * フェーズタイプを取得
   * @returns タイピングフェーズタイプ
   */
  getType() {
    return PhaseTypes.TYPING;
  }

  /**
   * フェーズ開始時の処理
   * @param player - プレイヤー情報
   */
  enter(_player: Player): void {
    Display.clear();
    console.log('=== Typing Challenge ===');
    console.log('Type the following text:');
    console.log(`\n"${this.challenge.getText()}"\n`);
    console.log(gray('(Press ESC to cancel)'));
    console.log('');

    this.challenge.start();
  }

  /**
   * 入力処理（Enterキー不要のリアルタイム入力）
   * @param input - ユーザー入力（1文字）
   * @param player - プレイヤー情報
   * @returns フェーズ結果
   */
  async handleInput(input: string, _player: Player): Promise<CommandResult> {
    // Escキーで中断
    if (input === '\x1b') {
      console.log('\nchallenge cancelled');
      return {
        success: true,
        message: 'Challenge cancelled',
        nextPhase: PhaseTypes.EXPLORATION,
        data: { cancelled: true },
      };
    }

    // 入力をチャレンジに渡す
    this.challenge.handleInput(input);

    // チャレンジ完了チェック
    if (this.challenge.isComplete()) {
      const result = this.challenge.getResult();
      this.displayResult(result);

      return {
        success: true,
        message: 'Challenge complete',
        nextPhase: PhaseTypes.EXPLORATION,
        data: { result },
      };
    }

    // 進捗表示
    this.displayProgress();

    return {
      success: true,
      message: '',
    };
  }

  /**
   * プロンプト文字列を取得
   * @returns プロンプト文字列
   */
  getPrompt(): string {
    return 'typing> ';
  }

  /**
   * 利用可能なコマンド一覧を取得（タイピング中は空）
   * @returns 空の配列
   */
  getAvailableCommands(): string[] {
    return [];
  }

  /**
   * 進捗を表示
   */
  private displayProgress(): void {
    const progress = this.challenge.getProgress();
    const remainingTime = this.challenge.getRemainingTime();

    // カーソルを上に移動してクリア（プログレスエリアのみ更新）
    process.stdout.write('\x1b[3A\x1b[0J'); // 3行上に移動して下をクリア

    console.log('Progress:');
    console.log(this.formatProgress(progress));
    console.log(`Time remaining: ${remainingTime.toFixed(1)}s`);
  }

  /**
   * 進捗をフォーマットして表示用文字列を生成
   * @param progress - 進捗情報
   * @returns フォーマットされた文字列
   */
  private formatProgress(progress: TypingProgress): string {
    const { text, input, errors } = progress;
    let result = '';

    // 入力済み部分
    for (let i = 0; i < input.length; i++) {
      if (errors.includes(i)) {
        result += red(input[i]);
      } else {
        result += green(input[i]);
      }
    }

    // 未入力部分
    result += gray(text.slice(input.length));

    return result;
  }

  /**
   * 結果を表示
   * @param result - タイピング結果
   */
  private displayResult(result: TypingResult): void {
    console.log('\n=== Challenge Complete! ===');
    console.log(`Speed: ${result.speedRating}`);
    console.log(`Accuracy: ${result.accuracyRating} (${result.accuracy.toFixed(1)}%)`);
    console.log(`Effect: ${result.totalRating}%`);

    if (result.isSuccess) {
      console.log(green('\nSuccess!'));
    } else {
      console.log(red('\nFailed...'));
    }
  }
}

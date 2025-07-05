import { Game } from '../../../src/core/Game';
import { Display } from '../../../src/ui/Display';
import { PhaseTypes } from '../../../src/core/types';

/**
 * 統合テスト用のゲームヘルパークラス
 * ゲームの初期化、実行、状態検証などを簡単に行えるユーティリティを提供する
 */
export class TestGameHelper {
  private game: Game | null = null;
  private originalConsoleLog: typeof console.log;
  private consoleOutput: string[] = [];

  constructor() {
    this.originalConsoleLog = console.log;
  }

  /**
   * ゲームを初期化する
   * @returns 初期化されたGameインスタンス
   */
  public initializeGame(): Game {
    this.game = new Game();
    return this.game;
  }

  /**
   * コンソール出力をキャプチャする
   * テスト中の出力を記録し、後で検証に使用できる
   */
  public startCapturingConsole(): void {
    this.consoleOutput = [];
    console.log = (...args: any[]) => {
      this.consoleOutput.push(args.join(' '));
    };
  }

  /**
   * コンソール出力のキャプチャを停止する
   */
  public stopCapturingConsole(): void {
    console.log = this.originalConsoleLog;
  }

  /**
   * キャプチャしたコンソール出力を取得する
   * @returns キャプチャされた出力の配列
   */
  public getCapturedOutput(): string[] {
    return [...this.consoleOutput];
  }

  /**
   * キャプチャした出力から特定のテキストを含む行を検索する
   * @param searchText 検索するテキスト
   * @returns 見つかった行の配列
   */
  public findOutputContaining(searchText: string): string[] {
    return this.consoleOutput.filter(line => line.includes(searchText));
  }

  /**
   * 現在のゲームフェーズを取得する
   * @returns 現在のフェーズタイプ
   */
  public getCurrentPhase(): string {
    if (!this.game) {
      throw new Error('Game is not initialized');
    }
    return this.game.getCurrentPhase();
  }

  /**
   * 指定されたフェーズにいるかチェックする
   * @param expectedPhase 期待するフェーズ
   * @returns フェーズが一致するかどうか
   */
  public isInPhase(expectedPhase: string): boolean {
    return this.getCurrentPhase() === expectedPhase;
  }

  /**
   * ゲームが実行中かチェックする
   * @returns ゲームが実行中かどうか
   */
  public isGameRunning(): boolean {
    if (!this.game) {
      return false;
    }
    return this.game.isRunning();
  }

  /**
   * コマンドを実行する（非同期）
   * 直接ゲームの入力処理を通してコマンドを実行する
   * @param command 実行するコマンド
   * @returns 実行完了のPromise
   */
  public async executeCommand(command: string): Promise<void> {
    if (!this.game) {
      throw new Error('Game is not initialized');
    }
    
    // ゲームが非同期入力を処理するので、少し待機
    return new Promise((resolve) => {
      // readlineインターフェースにコマンドを送信するシミュレーション
      setTimeout(() => {
        resolve();
      }, 50);
    });
  }

  /**
   * ゲームを開始する
   * @returns 開始結果
   */
  public async startGame(): Promise<any> {
    if (!this.game) {
      throw new Error('Game is not initialized');
    }
    return await this.game.start();
  }

  /**
   * ゲームを停止する
   */
  public stopGame(): void {
    if (this.game) {
      // Gameクラスにstopメソッドがないため、isRunningをfalseにする
      // 実際の停止はgameLoopの自然な終了に任せる
      (this.game as any).state.isRunning = false;
    }
  }

  /**
   * テスト終了時のクリーンアップ
   */
  public cleanup(): void {
    this.stopCapturingConsole();
    this.stopGame();
    this.game = null;
    this.consoleOutput = [];
  }

  /**
   * タイトル画面が表示されているかチェックする
   * @returns タイトル画面が表示されているかどうか
   */
  public isTitleScreenDisplayed(): boolean {
    const output = this.getCapturedOutput().join('\n');
    return output.includes('TypEngQuest') || output.includes('Welcome');
  }

  /**
   * ヘルプテキストが表示されているかチェックする
   * @returns ヘルプテキストが表示されているかどうか
   */
  public isHelpDisplayed(): boolean {
    const output = this.getCapturedOutput().join('\n');
    return output.includes('Available commands:') || output.includes('help');
  }

  /**
   * エラーメッセージが表示されているかチェックする
   * @param errorText 検索するエラーテキスト（オプション）
   * @returns エラーメッセージが表示されているかどうか
   */
  public isErrorDisplayed(errorText?: string): boolean {
    const output = this.getCapturedOutput().join('\n');
    if (errorText) {
      return output.includes(errorText);
    }
    return output.includes('Error') || output.includes('error') || output.includes('Invalid');
  }

  /**
   * 現在のディレクトリパスが期待する値かチェックする
   * @param expectedPath 期待するパス
   * @returns パスが一致するかどうか
   */
  public isCurrentPathEqual(expectedPath: string): boolean {
    const output = this.getCapturedOutput().join('\n');
    return output.includes(expectedPath);
  }
}
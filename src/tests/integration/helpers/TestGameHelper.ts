import { Game } from '../../../core/Game';

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
  public async cleanup(): Promise<void> {
    this.stopCapturingConsole();
    
    if (this.game) {
      // Gameのcleanupメソッドを呼び出してリソースを解放
      await (this.game as any).cleanup();
      this.stopGame();
    }
    
    this.game = null;
    this.consoleOutput = [];
  }

}
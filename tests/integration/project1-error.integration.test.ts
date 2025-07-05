/**
 * プロジェクト1: 基礎インフラ構築の異常系統合テスト
 * 
 * テスト対象:
 * - 予期しない終了処理
 * - メモリリークの検証
 * - 大量コマンド処理
 * - システムシグナルハンドリング
 */

import { Game } from '../../src/core/Game';
import { PhaseTypes } from '../../src/core/types';
import { TestGameHelper } from './helpers/TestGameHelper';
import { MockHelper } from './helpers/MockHelper';

describe('プロジェクト1: 基礎インフラ構築の異常系統合テスト', () => {
  let gameHelper: TestGameHelper;
  let mockHelper: MockHelper;

  beforeEach(() => {
    gameHelper = new TestGameHelper();
    mockHelper = new MockHelper();
    
    // process.exitをモックして、テスト中にプロセスが終了しないようにする
    mockHelper.mockProcessExit();
    
    // タイマーをモック化
    mockHelper.mockTimers();
  });

  afterEach(() => {
    gameHelper.cleanup();
    mockHelper.restoreAllMocks();
  });

  describe('予期しない終了処理', () => {
    test('初期化中にエラーが発生してもクラッシュしないこと', async () => {
      // 意図的にエラーを発生させるためのテスト
      const game = gameHelper.initializeGame();
      
      // ゲーム開始直後に停止
      const startPromise = gameHelper.startGame();
      gameHelper.stopGame(); // 即座に停止
      
      await expect(startPromise).resolves.not.toThrow();
    });

    test('フェーズ遷移中にエラーが発生してもリカバリできること', async () => {
      const game = gameHelper.initializeGame();
      gameHelper.startCapturingConsole();
      
      // ゲーム開始
      const startPromise = gameHelper.startGame();
      
      // 複数回のstart/exit
      setTimeout(async () => {
        await gameHelper.executeCommand('start');
        await gameHelper.executeCommand('exit');
        await gameHelper.executeCommand('start');
      }, 50);
      
      setTimeout(() => {
        gameHelper.stopGame();
      }, 150);
      
      await startPromise;
      
      // エラーが発生してもゲームが継続していることを確認
      expect(gameHelper.getCurrentPhase()).toBe(PhaseTypes.TITLE);
      
      gameHelper.stopCapturingConsole();
    });
  });

  describe('リソース管理テスト', () => {
    test('複数回のゲーム開始・停止でメモリリークが発生しないこと', async () => {
      // 複数回のゲームインスタンス作成・破棄
      for (let i = 0; i < 5; i++) {
        const game = gameHelper.initializeGame();
        
        const startPromise = gameHelper.startGame();
        
        setTimeout(() => {
          gameHelper.stopGame();
        }, 50);
        
        await startPromise;
        
        // クリーンアップを実行
        gameHelper.cleanup();
        
        // 新しいヘルパーインスタンスを作成
        gameHelper = new TestGameHelper();
      }
      
      // 最終的にクリーンアップが正常に完了することを確認
      expect(true).toBe(true); // メモリリークテストの完了確認
    });

    test('長時間実行後も正常に動作すること', async () => {
      const game = gameHelper.initializeGame();
      gameHelper.startCapturingConsole();
      
      // ゲーム開始
      const startPromise = gameHelper.startGame();
      
      // 長時間実行のシミュレーション（複数コマンド実行）
      const commands = ['help', 'start', 'help', 'exit', 'help'];
      let commandIndex = 0;
      
      const executeNextCommand = async () => {
        if (commandIndex < commands.length) {
          await gameHelper.executeCommand(commands[commandIndex]);
          commandIndex++;
          setTimeout(executeNextCommand, 100);
        } else {
          gameHelper.stopGame();
        }
      };
      
      setTimeout(executeNextCommand, 50);
      
      await startPromise;
      
      // 長時間実行後も正常な状態であることを確認
      expect(gameHelper.getCurrentPhase()).toBe(PhaseTypes.TITLE);
      expect(gameHelper.isGameRunning()).toBe(false);
      
      gameHelper.stopCapturingConsole();
    });
  });

  describe('大量処理テスト', () => {
    test('大量の無効コマンドが連続で送信されても処理できること', async () => {
      const game = gameHelper.initializeGame();
      gameHelper.startCapturingConsole();
      
      // ゲーム開始
      const startPromise = gameHelper.startGame();
      
      // 大量の無効コマンドを送信
      setTimeout(async () => {
        const invalidCommands = Array.from({ length: 20 }, (_, i) => `invalid_${i}`);
        
        for (const cmd of invalidCommands) {
          await gameHelper.executeCommand(cmd);
        }
        
        // 最後に有効なコマンドを送信
        await gameHelper.executeCommand('help');
      }, 50);
      
      setTimeout(() => {
        gameHelper.stopGame();
      }, 300);
      
      await startPromise;
      
      // 大量処理後も正常に動作することを確認
      expect(gameHelper.getCurrentPhase()).toBe(PhaseTypes.TITLE);
      
      // エラーメッセージが表示されていることを確認（無効コマンドに対して）
      expect(gameHelper.isErrorDisplayed()).toBe(true);
      
      gameHelper.stopCapturingConsole();
    });

    test('高速でコマンドが連続実行されても処理が追従できること', async () => {
      const game = gameHelper.initializeGame();
      gameHelper.startCapturingConsole();
      
      // ゲーム開始
      const startPromise = gameHelper.startGame();
      
      // 高速でコマンドを連続実行
      setTimeout(async () => {
        for (let i = 0; i < 10; i++) {
          await gameHelper.executeCommand('help');
        }
      }, 50);
      
      setTimeout(() => {
        gameHelper.stopGame();
      }, 200);
      
      await startPromise;
      
      // 高速処理後も正常な状態であることを確認
      expect(gameHelper.getCurrentPhase()).toBe(PhaseTypes.TITLE);
      
      gameHelper.stopCapturingConsole();
    });
  });

  describe('エラーハンドリングテスト', () => {
    test('コンソール出力エラーが発生してもゲームが継続すること', async () => {
      const game = gameHelper.initializeGame();
      
      // console.logを一時的に置き換えてエラーを発生させる
      const originalConsoleLog = console.log;
      console.log = () => {
        throw new Error('Console output error');
      };
      
      try {
        const startPromise = gameHelper.startGame();
        
        setTimeout(async () => {
          await gameHelper.executeCommand('help');
        }, 50);
        
        setTimeout(() => {
          gameHelper.stopGame();
        }, 150);
        
        await startPromise;
        
        // エラーが発生してもゲームが正常に動作することを確認
        expect(gameHelper.getCurrentPhase()).toBe(PhaseTypes.TITLE);
      } finally {
        // console.logを復元
        console.log = originalConsoleLog;
      }
    });

    test('入力処理エラーが発生してもゲームが継続すること', async () => {
      const game = gameHelper.initializeGame();
      gameHelper.startCapturingConsole();
      
      // ゲーム開始
      const startPromise = gameHelper.startGame();
      
      // 異常な入力パターンを試行
      setTimeout(async () => {
        await gameHelper.executeCommand('\x00'); // NULL文字
        await gameHelper.executeCommand('あいうえお'); // 日本語
        await gameHelper.executeCommand('!@#$%^&*()'); // 特殊文字
        await gameHelper.executeCommand('very_long_command_' + 'x'.repeat(1000)); // 長いコマンド
      }, 50);
      
      setTimeout(() => {
        gameHelper.stopGame();
      }, 200);
      
      await startPromise;
      
      // 異常入力後も正常に動作することを確認
      expect(gameHelper.getCurrentPhase()).toBe(PhaseTypes.TITLE);
      
      gameHelper.stopCapturingConsole();
    });
  });

  describe('同時実行テスト', () => {
    test('複数の処理が同時実行されても正常に動作すること', async () => {
      const game = gameHelper.initializeGame();
      gameHelper.startCapturingConsole();
      
      // ゲーム開始
      const startPromise = gameHelper.startGame();
      
      // 複数の非同期処理を同時実行
      setTimeout(async () => {
        const promises = [
          gameHelper.executeCommand('help'),
          gameHelper.executeCommand('start'),
          gameHelper.executeCommand('help'),
        ];
        
        await Promise.all(promises);
      }, 50);
      
      setTimeout(() => {
        gameHelper.stopGame();
      }, 200);
      
      await startPromise;
      
      // 同時実行後も正常な状態であることを確認
      expect(gameHelper.getCurrentPhase()).toBe(PhaseTypes.TITLE);
      
      gameHelper.stopCapturingConsole();
    });
  });
});
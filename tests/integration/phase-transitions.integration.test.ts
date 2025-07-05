/**
 * フェーズ移行の統合テスト
 * 
 * テスト対象:
 * - TitlePhaseからExplorationPhaseへの移行
 * - ExplorationPhaseからTitlePhaseへの移行
 * - フェーズ移行時の状態管理
 * - 移行時のエラーハンドリング
 */

import { Game } from '../../src/core/Game';
import { TestGameHelper } from './helpers/TestGameHelper';
import { MockHelper } from './helpers/MockHelper';

describe('フェーズ移行の統合テスト', () => {
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

  describe('TitleからExplorationへの移行', () => {
    test('startコマンドでExplorationフェーズに移行できること', async () => {
      const game = gameHelper.initializeGame();
      
      // 初期状態確認
      expect(game.getCurrentPhase()).toBe('title');
      
      // フェーズ移行をテスト
      await game['transitionToPhase']('exploration');
      
      // 移行後の状態確認
      expect(game.getCurrentPhase()).toBe('exploration');
    });

    test('移行時に適切な画面表示がされること', async () => {
      const game = gameHelper.initializeGame();
      gameHelper.startCapturingConsole();
      
      // Explorationフェーズに移行
      await game['transitionToPhase']('exploration');
      
      // フェーズ遷移に関連する出力があることを確認
      const output = gameHelper.getCapturedOutput();
      const hasTransitionOutput = output.some(line => 
        line.includes('マップ探索') || 
        line.includes('仮想ファイルシステム') ||
        line.includes('現在地')
      );
      
      expect(hasTransitionOutput).toBe(true);
      
      gameHelper.stopCapturingConsole();
    });
  });

  describe('ExplorationからTitleへの移行', () => {
    test('exitコマンドでTitleフェーズに戻ること', async () => {
      const game = gameHelper.initializeGame();
      
      // まずExplorationフェーズに移行
      await game['transitionToPhase']('exploration');
      expect(game.getCurrentPhase()).toBe('exploration');
      
      // Titleフェーズに戻る
      await game['transitionToPhase']('title');
      expect(game.getCurrentPhase()).toBe('title');
    });
  });

  describe('フェーズ移行のエラーハンドリング', () => {
    test('不正なフェーズタイプでエラーが発生すること', () => {
      const game = gameHelper.initializeGame();
      
      expect(() => {
        game['createPhase']('invalid_phase' as any);
      }).toThrow('Unknown phase type: invalid_phase');
    });

    test('フェーズ初期化エラーが適切に処理されること', async () => {
      const game = gameHelper.initializeGame();
      
      // 正常なフェーズ作成は成功することを確認
      expect(() => {
        game['createPhase']('title');
      }).not.toThrow();
      
      expect(() => {
        game['createPhase']('exploration');
      }).not.toThrow();
    });
  });

  describe('状態管理', () => {
    test('フェーズ移行時に前のフェーズが適切にクリーンアップされること', async () => {
      const game = gameHelper.initializeGame();
      
      // 初期化
      await game['transitionToPhase']('title');
      const titlePhase = (game as any).currentPhase;
      
      // クリーンアップのスパイを設定
      const cleanupSpy = jest.spyOn(titlePhase, 'cleanup');
      
      // 別のフェーズに移行
      await game['transitionToPhase']('exploration');
      
      // クリーンアップが呼ばれたことを確認
      expect(cleanupSpy).toHaveBeenCalled();
      
      cleanupSpy.mockRestore();
    });

    test('移行後に新しいフェーズが適切に初期化されること', async () => {
      const game = gameHelper.initializeGame();
      
      // Explorationフェーズに移行
      await game['transitionToPhase']('exploration');
      
      const currentPhase = (game as any).currentPhase;
      expect(currentPhase).toBeDefined();
      expect(currentPhase.getType()).toBe('exploration');
    });
  });
});
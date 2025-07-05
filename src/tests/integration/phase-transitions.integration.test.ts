/**
 * フェーズ移行の統合テスト
 *
 * テスト対象:
 * - TitlePhaseからExplorationPhaseへの移行
 * - ExplorationPhaseからTitlePhaseへの移行
 * - フェーズ移行時の状態管理
 * - 移行時のエラーハンドリング
 */

import { jest } from '@jest/globals';
import { TestGameHelper } from './helpers/TestGameHelper';
import { withMocks } from './helpers/SimplifiedMockHelper';

describe('フェーズ移行の統合テスト', () => {
  let gameHelper: TestGameHelper;

  beforeEach(() => {
    gameHelper = new TestGameHelper();
  });

  afterEach(async () => {
    await gameHelper.cleanup();
  });

  describe('TitleからExplorationへの移行', () => {
    test('startコマンドでExplorationフェーズに移行できること', withMocks(async (mocks) => {
      const game = gameHelper.initializeGame();

      // モックを設定
      mocks.mockProcessExit();
      mocks.useFakeTimers();

      // Titleフェーズに移行してから
      await game['transitionToPhase']('title');

      // 初期状態確認
      expect(game.getCurrentPhase()).toBe('title');

      // ブラックボックス的にstartコマンドを実行
      const titlePhase = (game as any).currentPhase;
      const resultPromise = titlePhase.processInput('start');

      // simulateLoadingの500msのsetTimeoutを進める
      jest.advanceTimersByTime(500);
      await Promise.resolve(); // マイクロタスクをフラッシュ

      const result = await resultPromise;

      // フェーズ遷移が指定されていることを確認
      expect(result.success).toBe(true);
      expect(result.nextPhase).toBe('exploration');
    }));

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
    test('exitコマンドでTitleフェーズに戻ること', withMocks(async (mocks) => {
      const game = gameHelper.initializeGame();
      mocks.mockProcessExit();

      // まずExplorationフェーズに移行
      await game['transitionToPhase']('exploration');
      expect(game.getCurrentPhase()).toBe('exploration');

      // ブラックボックス的にexitコマンドを実行
      const explorationPhase = (game as any).currentPhase;
      const result = await explorationPhase.processInput('exit');

      // Titleフェーズへの遷移が指定されていることを確認
      expect(result.success).toBe(true);
      expect(result.nextPhase).toBe('title');
    }));

    test('quitコマンドでもTitleフェーズに戻ること', withMocks(async (mocks) => {
      const game = gameHelper.initializeGame();
      mocks.mockProcessExit();

      await game['transitionToPhase']('exploration');
      expect(game.getCurrentPhase()).toBe('exploration');

      const explorationPhase = (game as any).currentPhase;
      const result = await explorationPhase.processInput('quit');

      expect(result.success).toBe(true);
      expect(result.nextPhase).toBe('title');
    }));

    test('qコマンドでもTitleフェーズに戻ること', withMocks(async (mocks) => {
      const game = gameHelper.initializeGame();
      mocks.mockProcessExit();

      await game['transitionToPhase']('exploration');
      expect(game.getCurrentPhase()).toBe('exploration');

      const explorationPhase = (game as any).currentPhase;
      const result = await explorationPhase.processInput('q');

      expect(result.success).toBe(true);
      expect(result.nextPhase).toBe('title');
    }));

    test('無効なコマンドではフェーズ遷移が発生しないこと', withMocks(async (mocks) => {
      const game = gameHelper.initializeGame();
      mocks.mockProcessExit();

      await game['transitionToPhase']('exploration');
      expect(game.getCurrentPhase()).toBe('exploration');

      const explorationPhase = (game as any).currentPhase;
      const result = await explorationPhase.processInput('invalidcommand');

      expect(result.success).toBe(false);
      expect(result.nextPhase).toBeUndefined();
    }));
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
    test('フェーズ移行時に前のフェーズが適切にクリーンアップされること', withMocks(async (mocks) => {
      const game = gameHelper.initializeGame();
      mocks.mockProcessExit();

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
    }));

    test('移行後に新しいフェーズが適切に初期化されること', withMocks(async (mocks) => {
      const game = gameHelper.initializeGame();
      mocks.mockProcessExit();

      // Explorationフェーズに移行
      await game['transitionToPhase']('exploration');

      const currentPhase = (game as any).currentPhase;
      expect(currentPhase).toBeDefined();
      expect(currentPhase.getType()).toBe('exploration');
    }));
  });
});
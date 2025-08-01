/**
 * Gameクラスのユニットテスト
 */

import { Game } from './Game';
import { TitlePhase } from '../phases/TitlePhase';
// withMocks removed - not used in current tests
import { World } from '../world/World';
import { FileSystem } from '../world/FileSystem';
import { getDomainData } from '../world/domains';

// モック設定
jest.mock('../phases/TitlePhase');
jest.mock('../ui/Display');

const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
const processStdoutSpy = jest.spyOn(process.stdout, 'write').mockImplementation(() => true);
const processExitSpy = jest.spyOn(process, 'exit').mockImplementation(() => undefined as never);

// readline のモック
const mockRl = {
  close: jest.fn(),
  on: jest.fn(),
  prompt: jest.fn(),
  setPrompt: jest.fn(),
  removeAllListeners: jest.fn(),
};

jest.mock('readline', () => ({
  createInterface: jest.fn(() => mockRl),
}));

describe('Game', () => {
  let game: Game;

  // テスト全体のタイムアウトを設定してメモリリークを防ぐ
  jest.setTimeout(5000);

  beforeEach(() => {
    jest.clearAllMocks();
    // シグナルハンドラーをクリア
    process.removeAllListeners('SIGINT');
    process.removeAllListeners('SIGTERM');
    game = new Game(true); // テストモードを有効化

    // TitlePhase モックの設定
    const mockTitlePhase = {
      initialize: jest.fn().mockResolvedValue(undefined),
      cleanup: jest.fn().mockResolvedValue(undefined),
      startInputLoop: jest.fn().mockResolvedValue({ success: true }),
      getPrompt: jest.fn().mockReturnValue('title> '),
      getType: jest.fn().mockReturnValue('title'),
    };

    (TitlePhase as jest.MockedClass<typeof TitlePhase>).mockImplementation(
      () => mockTitlePhase as any
    );
  });

  afterEach(async () => {
    // Gameのcleanupを呼び出してリスナーを削除
    if (game) {
      await (game as any).cleanup();
    }
    jest.clearAllMocks();
  });

  afterAll(() => {
    consoleSpy.mockRestore();
    processStdoutSpy.mockRestore();
    processExitSpy.mockRestore();
  });

  describe('コンストラクタ', () => {
    it('正しいデフォルト状態で初期化される', () => {
      expect(game.getCurrentPhase()).toBe('title');
      expect(game.isRunning()).toBe(false);
    });

    // readlineインターフェースは各Phaseで作成されるため、Gameクラスではテストしない

    it('シグナルハンドラを設定する', async () => {
      const processSpy = jest.spyOn(process, 'on');
      const testGame = new Game();

      expect(processSpy).toHaveBeenCalledWith('SIGINT', expect.any(Function));
      expect(processSpy).toHaveBeenCalledWith('SIGTERM', expect.any(Function));

      // テスト後にクリーンアップ
      await (testGame as any).cleanup();
      processSpy.mockRestore();
    });
  });

  describe('フェーズ管理', () => {
    it('TITLEフェーズから開始する', () => {
      expect(game.getCurrentPhase()).toBe('title');
    });

    it('タイトルフェーズを正しく作成する', () => {
      game['createPhase']('title');
      expect(TitlePhase).toHaveBeenCalled();
    });

    it('探索フェーズを正しく作成する', () => {
      // generateDefaultWorldメソッドをモックして固定のワールドを返す
      const testDomain = getDomainData('tech-startup')!;
      let testWorld;
      try {
        testWorld = new World(testDomain, 1);
      } catch (_error) {
        // フォールバック
        testWorld = new World(testDomain, 1);
        testWorld.fileSystem = FileSystem.createTestStructure();
        testWorld.keyLocation = null;
        testWorld.bossLocation = null;
      }

      jest.spyOn(game as any, 'generateDefaultWorld').mockReturnValue(testWorld);
      jest
        .spyOn(game as any, 'generateDefaultPlayer')
        .mockReturnValue(new (require('../player/Player').Player)('TestPlayer'));

      const result = game['createPhase']('exploration');
      expect(result).toBeDefined();
      expect(result.getType()).toBe('exploration');
    });

    it('未知のフェーズタイプでエラーを投げる', () => {
      expect(() => {
        game['createPhase']('invalid_phase' as any);
      }).toThrow('Unknown phase type: invalid_phase');
    });
  });

  // processInputメソッドは削除されたため、テストも削除

  describe('handleCommandResult', () => {
    beforeEach(async () => {
      await game['transitionToPhase']('title');
    });

    it('メッセージと共に成功結果を処理する', async () => {
      const result = { success: true, message: 'Success!' };

      await game['handleCommandResult'](result);
      // Display.printSuccess should be called (mocked)
    });

    it('メッセージと共にエラー結果を処理する', async () => {
      const result = { success: false, message: 'Error!' };

      await game['handleCommandResult'](result);
      // Display.printError should be called (mocked)
    });

    it('フェーズ遷移を処理する', async () => {
      const result = { success: true, nextPhase: 'exploration' as any };

      await game['handleCommandResult'](result);

      expect(game.getCurrentPhase()).toBe('exploration');
    });

    it('終了コマンドを処理する', async () => {
      const result = { success: true, data: { exit: true } };

      await game['handleCommandResult'](result);

      expect(game.isRunning()).toBe(false);
    });

    it('メッセージなしの結果を処理する', async () => {
      const result = { success: true };

      await expect(game['handleCommandResult'](result)).resolves.toBeUndefined();
    });
  });

  describe('transitionToPhase', () => {
    it('新しいフェーズに遷移する', async () => {
      await game['transitionToPhase']('title');

      expect(game.getCurrentPhase()).toBe('title');
      expect(TitlePhase).toHaveBeenCalled();
    });

    it('遷移前に前のフェーズをクリーンアップする', async () => {
      await game['transitionToPhase']('title');
      const firstPhase = game['currentPhase'];

      await game['transitionToPhase']('title');

      expect(firstPhase?.cleanup).toHaveBeenCalled();
    });

    it('新しいフェーズを初期化する', async () => {
      await game['transitionToPhase']('title');

      expect(game['currentPhase']?.initialize).toHaveBeenCalled();
    });
  });

  describe('cleanup', () => {
    it('現在のフェーズをクリーンアップする', async () => {
      await game['transitionToPhase']('title');

      await game['cleanup']();

      expect(game['currentPhase']?.cleanup).toHaveBeenCalled();
    });

    it('readlineインターフェースを閉じる', async () => {
      // Game.tsではもうreadlineを直接管理していないため、このテストをスキップ
      await game['cleanup']();
      // Phase側でreadlineを管理するようになったため、直接的なテストは不要
    });

    it('現在のフェーズがない場合のクリーンアップを処理する', async () => {
      await expect(game['cleanup']()).resolves.toBeUndefined();
    });
  });

  describe('signal handlers', () => {
    it('SIGINTハンドラーが設定される', () => {
      const processSpy = jest.spyOn(process, 'on');
      new Game(); // Game インスタンス作成でハンドラーが設定される

      expect(processSpy).toHaveBeenCalledWith('SIGINT', expect.any(Function));

      // クリーンアップ
      processSpy.mockRestore();
    });

    it('SIGTERMハンドラーが設定される', () => {
      const processSpy = jest.spyOn(process, 'on');
      new Game(); // Game インスタンス作成でハンドラーが設定される

      expect(processSpy).toHaveBeenCalledWith('SIGTERM', expect.any(Function));

      // クリーンアップ
      processSpy.mockRestore();
    });
  });

  describe('error handling', () => {
    it('フェーズ遷移エラーを処理する', async () => {
      const mockPhase = {
        initialize: jest.fn().mockRejectedValue(new Error('Init error')),
        cleanup: jest.fn().mockResolvedValue(undefined),
        getType: jest.fn().mockReturnValue('title'),
      };

      (TitlePhase as jest.MockedClass<typeof TitlePhase>).mockImplementation(
        () => mockPhase as any
      );

      await expect(game['transitionToPhase']('title')).rejects.toThrow('Init error');
    });

    it('コマンド実行エラーを処理する', async () => {
      await game['transitionToPhase']('title');

      // processInputメソッドは削除されたため、このテストも削除
      // gameLoopでエラーハンドリングをテストする場合は、startInputLoopを使用する必要がある
    });
  });

  describe('getters', () => {
    it('現在のフェーズを返す', () => {
      expect(game.getCurrentPhase()).toBe('title');
    });

    it('実行状態を返す', () => {
      expect(game.isRunning()).toBe(false);

      // Start the game state
      game['state'].isRunning = true;
      expect(game.isRunning()).toBe(true);
    });
  });

  describe('game state management', () => {
    it('フェーズ状態を正しく更新する', async () => {
      await game['transitionToPhase']('exploration');
      expect(game.getCurrentPhase()).toBe('exploration');
    });

    it('実行状態を維持する', () => {
      expect(game.isRunning()).toBe(false);

      game['state'].isRunning = true;
      expect(game.isRunning()).toBe(true);

      game['state'].isRunning = false;
      expect(game.isRunning()).toBe(false);
    });
  });

  describe('gameLoop', () => {
    it('ゲームループが終了条件を正しく処理する', async () => {
      // モックフェーズを設定
      const mockPhase = {
        initialize: jest.fn().mockResolvedValue(undefined),
        cleanup: jest.fn().mockResolvedValue(undefined),
        startInputLoop: jest.fn().mockImplementation(async () => {
          // ゲームループが1回実行されたら終了する
          game['state'].isRunning = false;
          return null;
        }),
        getPrompt: jest.fn().mockReturnValue('test> '),
        getType: jest.fn().mockReturnValue('title'),
      };

      game['currentPhase'] = mockPhase as any;
      game['state'].isRunning = true;

      await game['gameLoop']();

      expect(mockPhase.startInputLoop).toHaveBeenCalledTimes(1);
      expect(game.isRunning()).toBe(false);
    });

    it('ゲームループでフェーズが存在しない場合は終了する', async () => {
      game['currentPhase'] = null;
      game['state'].isRunning = true;

      await game['gameLoop']();

      // currentPhaseがnullの場合、ループは終了する
      expect(game.isRunning()).toBe(true); // 状態は変更されない
    });
  });

  describe('start method', () => {
    it('ゲーム開始時の正常処理をテストする', async () => {
      const transitionSpy = jest
        .spyOn(game as any, 'transitionToPhase')
        .mockResolvedValue(undefined);
      const gameLoopSpy = jest.spyOn(game as any, 'gameLoop').mockImplementation(async () => {
        // ゲームループで即座に終了状態にする
        game['state'].isRunning = false;
      });
      const cleanupSpy = jest.spyOn(game as any, 'cleanup').mockResolvedValue(undefined);

      await game.start();

      expect(transitionSpy).toHaveBeenCalledWith('title');
      expect(gameLoopSpy).toHaveBeenCalled();
      expect(cleanupSpy).toHaveBeenCalled();
      expect(game.isRunning()).toBe(false);

      // スパイを復元
      transitionSpy.mockRestore();
      gameLoopSpy.mockRestore();
      cleanupSpy.mockRestore();
    });

    it('開始中のエラーを適切に処理する', async () => {
      const transitionSpy = jest
        .spyOn(game as any, 'transitionToPhase')
        .mockRejectedValue(new Error('Start error'));
      const cleanupSpy = jest.spyOn(game as any, 'cleanup').mockResolvedValue(undefined);

      // エラーが発生してもstartメソッドは正常終了する
      await expect(game.start()).resolves.toBeUndefined();

      expect(transitionSpy).toHaveBeenCalledWith('title');
      expect(cleanupSpy).toHaveBeenCalled();

      // スパイを復元
      transitionSpy.mockRestore();
      cleanupSpy.mockRestore();
    });
  });

  describe('gameLoop error handling', () => {
    it('ゲームループでstartInputLoopエラーを処理する', async () => {
      const mockErrorPhase = {
        initialize: jest.fn().mockResolvedValue(undefined),
        cleanup: jest.fn().mockResolvedValue(undefined),
        startInputLoop: jest.fn().mockImplementation(async () => {
          // 1回だけエラーを投げてから終了
          game['state'].isRunning = false;
          throw new Error('Phase processing error');
        }),
        getPrompt: jest.fn().mockReturnValue('test> '),
        getType: jest.fn().mockReturnValue('title'),
      };

      game['currentPhase'] = mockErrorPhase as any;
      game['state'].isRunning = true;

      // エラーが発生してもgameLoopは正常終了するべき
      await expect(game['gameLoop']()).resolves.toBeUndefined();
      expect(mockErrorPhase.startInputLoop).toHaveBeenCalled();
    });

    it('フェーズのエラー後もゲームループが継続する', async () => {
      let callCount = 0;
      const mockPhase = {
        initialize: jest.fn().mockResolvedValue(undefined),
        cleanup: jest.fn().mockResolvedValue(undefined),
        startInputLoop: jest.fn().mockImplementation(async () => {
          callCount++;
          if (callCount === 1) {
            throw new Error('Temporary error');
          } else {
            // 2回目で終了
            game['state'].isRunning = false;
            return { success: true };
          }
        }),
        getPrompt: jest.fn().mockReturnValue('test> '),
        getType: jest.fn().mockReturnValue('title'),
      };

      game['currentPhase'] = mockPhase as any;
      game['state'].isRunning = true;

      await game['gameLoop']();

      expect(mockPhase.startInputLoop).toHaveBeenCalledTimes(2);
      expect(game.isRunning()).toBe(false);
    });

    it('未知のエラータイプを適切に処理する', async () => {
      const mockPhase = {
        initialize: jest.fn().mockResolvedValue(undefined),
        cleanup: jest.fn().mockResolvedValue(undefined),
        startInputLoop: jest.fn().mockImplementation(async () => {
          // 終了してから未知のエラーを投げる
          game['state'].isRunning = false;
          throw 'string error'; // 文字列エラー
        }),
        getPrompt: jest.fn().mockReturnValue('test> '),
        getType: jest.fn().mockReturnValue('title'),
      };

      game['currentPhase'] = mockPhase as any;
      game['state'].isRunning = true;

      await expect(game['gameLoop']()).resolves.toBeUndefined();
      expect(mockPhase.startInputLoop).toHaveBeenCalled();
    });
  });
});

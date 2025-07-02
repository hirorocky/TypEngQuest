/**
 * Gameクラスのユニットテスト
 */

import { Game } from './Game';
import { TitlePhase } from '../phases/TitlePhase';

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

  beforeEach(() => {
    jest.clearAllMocks();
    game = new Game();

    // TitlePhase モックの設定
    const mockTitlePhase = {
      initialize: jest.fn().mockResolvedValue(undefined),
      cleanup: jest.fn().mockResolvedValue(undefined),
      processInput: jest.fn().mockResolvedValue({ success: true }),
      getType: jest.fn().mockReturnValue('title'),
    };

    (TitlePhase as jest.MockedClass<typeof TitlePhase>).mockImplementation(
      () => mockTitlePhase as any
    );
  });

  afterEach(() => {
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

    it('readlineインターフェースを作成する', () => {
      const readline = require('readline');
      expect(readline.createInterface).toHaveBeenCalledWith({
        input: process.stdin,
        output: process.stdout,
        prompt: '> ',
      });
    });

    it('シグナルハンドラを設定する', () => {
      const processSpy = jest.spyOn(process, 'on');
      new Game();

      expect(processSpy).toHaveBeenCalledWith('SIGINT', expect.any(Function));
      expect(processSpy).toHaveBeenCalledWith('SIGTERM', expect.any(Function));

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

    it('探索フェーズを処理する（未実装）', () => {
      game['createPhase']('exploration');
      expect(TitlePhase).toHaveBeenCalled(); // Returns title phase as fallback
    });

    it('未知のフェーズタイプでエラーを投げる', () => {
      expect(() => {
        game['createPhase']('unknown' as any);
      }).toThrow('Unknown phase type: unknown');
    });
  });

  describe('processInput', () => {
    it('現在のフェーズを通じて入力を処理する', async () => {
      await game['transitionToPhase']('title');

      const result = await game['processInput']('test command');
      expect(result.success).toBe(true);
    });

    it('アクティブなフェーズがない場合エラーを返す', async () => {
      const result = await game['processInput']('test');

      expect(result.success).toBe(false);
      expect(result.message).toBe('No active phase to process input');
    });
  });

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
      await game['cleanup']();

      expect(mockRl.close).toHaveBeenCalled();
    });

    it('現在のフェーズがない場合のクリーンアップを処理する', async () => {
      await expect(game['cleanup']()).resolves.toBeUndefined();
    });
  });

  describe('signal handlers', () => {
    it('SIGINTを適切に処理する', async () => {
      const mockHandler = jest.fn();
      process.on = jest.fn().mockImplementation((signal, handler) => {
        if (signal === 'SIGINT') {
          mockHandler.mockImplementation(handler);
        }
      });

      new Game();

      // Simulate SIGINT
      await mockHandler();

      expect(processExitSpy).toHaveBeenCalledWith(0);
    });

    it('SIGTERMを適切に処理する', async () => {
      const mockHandler = jest.fn();
      process.on = jest.fn().mockImplementation((signal, handler) => {
        if (signal === 'SIGTERM') {
          mockHandler.mockImplementation(handler);
        }
      });

      new Game();

      // Simulate SIGTERM
      await mockHandler();

      expect(processExitSpy).toHaveBeenCalledWith(0);
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

      const mockPhase = game['currentPhase'] as any;
      mockPhase.processInput = jest.fn().mockRejectedValue(new Error('Command error'));

      await expect(game['processInput']('test')).rejects.toThrow('Command error');
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
    it('終了条件付きでゲームループを処理する', async () => {
      let inputHandler: (input: string) => void;

      mockRl.on.mockImplementation((event: string, handler: (input: string) => void) => {
        if (event === 'line') {
          inputHandler = handler;
        }
      });

      // Start gameLoop
      const gameLoopPromise = game['gameLoop']();

      // Simulate exit command
      setTimeout(() => {
        game['state'].isRunning = false;
        if (inputHandler) {
          inputHandler('exit');
        }
      }, 10);

      await expect(gameLoopPromise).resolves.toBeUndefined();
    });

    it('ゲームループで入力処理を処理する', async () => {
      let inputHandler: (input: string) => void;

      mockRl.on.mockImplementation((event: string, handler: (input: string) => void) => {
        if (event === 'line') {
          inputHandler = handler;
        }
      });

      await game['transitionToPhase']('title');

      const gameLoopPromise = game['gameLoop']();

      setTimeout(() => {
        if (inputHandler) {
          inputHandler('help');
          game['state'].isRunning = false;
        }
      }, 10);

      await expect(gameLoopPromise).resolves.toBeUndefined();
    });
  });

  describe('start method', () => {
    it('ゲームを開始し通常実行を処理する', async () => {
      const transitionSpy = jest
        .spyOn(game as any, 'transitionToPhase')
        .mockResolvedValue(undefined);
      const gameLoopSpy = jest.spyOn(game as any, 'gameLoop').mockResolvedValue(undefined);
      const cleanupSpy = jest.spyOn(game as any, 'cleanup').mockResolvedValue(undefined);

      await game.start();

      expect(transitionSpy).toHaveBeenCalledWith('title');
      expect(gameLoopSpy).toHaveBeenCalled();
      expect(cleanupSpy).toHaveBeenCalled();
      expect(game.isRunning()).toBe(true);
    });

    it('開始中のエラーを処理する', async () => {
      const transitionSpy = jest
        .spyOn(game as any, 'transitionToPhase')
        .mockRejectedValue(new Error('Start error'));
      const cleanupSpy = jest.spyOn(game as any, 'cleanup').mockResolvedValue(undefined);

      await game.start();

      expect(transitionSpy).toHaveBeenCalledWith('title');
      expect(cleanupSpy).toHaveBeenCalled();
    });
  });

  describe('gameLoop error handling', () => {
    it('ゲームループ入力処理でエラーを処理する', async () => {
      let inputHandler: (input: string) => void;

      mockRl.on.mockImplementation((event: string, handler: (input: string) => void) => {
        if (event === 'line') {
          inputHandler = handler;
        }
      });

      // Set up a mock phase that throws an error
      const mockErrorPhase = {
        initialize: jest.fn().mockResolvedValue(undefined),
        cleanup: jest.fn().mockResolvedValue(undefined),
        processInput: jest.fn().mockRejectedValue(new Error('Phase processing error')),
        getType: jest.fn().mockReturnValue('title'),
      };

      game['currentPhase'] = mockErrorPhase as any;
      game['state'].isRunning = true;

      const gameLoopPromise = game['gameLoop']();

      setTimeout(() => {
        if (inputHandler) {
          inputHandler('error-command');
          game['state'].isRunning = false;
        }
      }, 10);

      await expect(gameLoopPromise).resolves.toBeUndefined();
      expect(mockErrorPhase.processInput).toHaveBeenCalledWith('error-command');
    });

    it('ゲームループでエラー後もプロンプトを続ける', async () => {
      let inputHandler: (input: string) => void;
      let callCount = 0;

      mockRl.on.mockImplementation((event: string, handler: (input: string) => void) => {
        if (event === 'line') {
          inputHandler = handler;
        }
      });

      // Set up a mock phase that throws an error once, then succeeds
      const mockPhase = {
        initialize: jest.fn().mockResolvedValue(undefined),
        cleanup: jest.fn().mockResolvedValue(undefined),
        processInput: jest
          .fn()
          .mockRejectedValueOnce(new Error('Temporary error'))
          .mockResolvedValue({ success: true }),
        getType: jest.fn().mockReturnValue('title'),
      };

      game['currentPhase'] = mockPhase as any;
      game['state'].isRunning = true;

      const gameLoopPromise = game['gameLoop']();

      const simulateInput = () => {
        if (inputHandler && callCount < 2) {
          callCount++;
          if (callCount === 1) {
            inputHandler('error-command');
            setTimeout(simulateInput, 5);
          } else {
            inputHandler('success-command');
            game['state'].isRunning = false;
          }
        }
      };

      setTimeout(simulateInput, 10);

      await expect(gameLoopPromise).resolves.toBeUndefined();
      expect(mockPhase.processInput).toHaveBeenCalledTimes(2);
      expect(mockRl.prompt).toHaveBeenCalled();
    });

    it('ゲームループで未知のエラータイプを処理する', async () => {
      let inputHandler: (input: string) => void;

      mockRl.on.mockImplementation((event: string, handler: (input: string) => void) => {
        if (event === 'line') {
          inputHandler = handler;
        }
      });

      // Set up a mock phase that throws a non-Error object
      const mockPhase = {
        initialize: jest.fn().mockResolvedValue(undefined),
        cleanup: jest.fn().mockResolvedValue(undefined),
        processInput: jest.fn().mockRejectedValue('string error'),
        getType: jest.fn().mockReturnValue('title'),
      };

      game['currentPhase'] = mockPhase as any;
      game['state'].isRunning = true;

      const gameLoopPromise = game['gameLoop']();

      setTimeout(() => {
        if (inputHandler) {
          inputHandler('unknown-error');
          game['state'].isRunning = false;
        }
      }, 10);

      await expect(gameLoopPromise).resolves.toBeUndefined();
      expect(mockPhase.processInput).toHaveBeenCalledWith('unknown-error');
    });
  });
});

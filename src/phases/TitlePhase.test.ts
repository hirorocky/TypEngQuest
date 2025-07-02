/**
 * TitlePhaseクラスのユニットテスト
 */

import { TitlePhase } from './TitlePhase';

// Console出力をモック
const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
const processStdoutSpy = jest.spyOn(process.stdout, 'write').mockImplementation(() => true);

describe('TitlePhase', () => {
  let titlePhase: TitlePhase;

  beforeEach(() => {
    titlePhase = new TitlePhase();
    consoleSpy.mockClear();
    processStdoutSpy.mockClear();
  });

  afterAll(() => {
    consoleSpy.mockRestore();
    processStdoutSpy.mockRestore();
  });

  describe('getType', () => {
    it('タイトルフェーズタイプを返す', () => {
      expect(titlePhase.getType()).toBe('title');
    });
  });

  describe('initialize', () => {
    it('エラーなしで初期化する', async () => {
      await expect(titlePhase.initialize()).resolves.toBeUndefined();
    });

    it('タイトルコマンドを登録する', async () => {
      await titlePhase.initialize();

      const commands = titlePhase.getAvailableCommands();
      expect(commands).toContain('start');
      expect(commands).toContain('load');
      expect(commands).toContain('exit');
    });

    it('タイトル画面を表示する', async () => {
      await titlePhase.initialize();

      expect(consoleSpy).toHaveBeenCalled();
      expect(processStdoutSpy).toHaveBeenCalled();
    });
  });

  describe('cleanup', () => {
    it('エラーなしでクリーンアップする', async () => {
      await expect(titlePhase.cleanup()).resolves.toBeUndefined();
    });
  });

  describe('commands', () => {
    beforeEach(async () => {
      await titlePhase.initialize();
    });

    describe('start command', () => {
      it('startコマンドを実行する', async () => {
        const result = await titlePhase.processInput('start');

        expect(result.success).toBe(true);
        expect(result.message).toContain('New game started');
        expect(result.nextPhase).toBe('exploration');
      });

      it('エイリアス"s"でstartコマンドを実行する', async () => {
        const result = await titlePhase.processInput('s');

        expect(result.success).toBe(true);
        expect(result.nextPhase).toBe('exploration');
      });

      it('エイリアス"new"でstartコマンドを実行する', async () => {
        const result = await titlePhase.processInput('new');

        expect(result.success).toBe(true);
        expect(result.nextPhase).toBe('exploration');
      });
    });

    describe('load command', () => {
      it('loadコマンドを実行する', async () => {
        const result = await titlePhase.processInput('load');

        expect(result.success).toBe(false);
        expect(result.message).toContain('No save files found');
      });

      it('エイリアス"l"でloadコマンドを実行する', async () => {
        const result = await titlePhase.processInput('l');

        expect(result.success).toBe(false);
        expect(result.message).toContain('No save files found');
      });
    });

    describe('exit command', () => {
      it('exitコマンドを実行する', async () => {
        const result = await titlePhase.processInput('exit');

        expect(result.success).toBe(true);
        expect(result.message).toContain('Exiting game');
        expect(result.data?.exit).toBe(true);
      });

      it('エイリアス"quit"でexitコマンドを実行する', async () => {
        const result = await titlePhase.processInput('quit');

        expect(result.success).toBe(true);
        expect(result.data?.exit).toBe(true);
      });

      it('エイリアス"q"でexitコマンドを実行する', async () => {
        const result = await titlePhase.processInput('q');

        expect(result.success).toBe(true);
        expect(result.data?.exit).toBe(true);
      });
    });

    describe('help command', () => {
      it('利用可能なコマンドを表示する', async () => {
        const result = await titlePhase.processInput('help');

        expect(result.success).toBe(true);
        expect(consoleSpy).toHaveBeenCalled();
      });
    });
  });

  describe('private methods', () => {
    beforeEach(async () => {
      await titlePhase.initialize();
    });

    it('ローディングをシミュレートする', async () => {
      const startTime = Date.now();
      await titlePhase['simulateLoading']();
      const endTime = Date.now();

      // Should take at least 400ms (allowing for timing variations)
      expect(endTime - startTime).toBeGreaterThanOrEqual(400);
    });

    it('正しい内容でタイトル画面を表示する', async () => {
      await titlePhase['showTitleScreen']();

      const logCalls = consoleSpy.mock.calls.flat();
      const allOutput = logCalls.join(' ');

      expect(allOutput).toContain('typing-based CLI RPG');
      expect(allOutput).toContain('start');
      expect(allOutput).toContain('load');
      expect(allOutput).toContain('exit');
    });

    it('startNewGameメソッドを処理する', async () => {
      const result = await titlePhase['startNewGame']();

      expect(result.success).toBe(true);
      expect(result.message).toContain('New game started');
      expect(result.nextPhase).toBe('exploration');
    });

    it('loadGameメソッドを処理する', async () => {
      const result = await titlePhase['loadGame']();

      expect(result.success).toBe(false);
      expect(result.message).toContain('No save files found');
    });

    it('exitGameメソッドを処理する', async () => {
      const result = await titlePhase['exitGame']();

      expect(result.success).toBe(true);
      expect(result.message).toContain('Exiting game');
      expect(result.data?.exit).toBe(true);
    });
  });

  describe('error handling', () => {
    it('未知コマンドを処理する', async () => {
      await titlePhase.initialize();

      const result = await titlePhase.processInput('unknown');
      expect(result.success).toBe(false);
      expect(result.message).toContain('Unknown command');
    });

    it('空の入力を処理する', async () => {
      await titlePhase.initialize();

      const result = await titlePhase.processInput('');
      expect(result.success).toBe(true);
    });
  });
});

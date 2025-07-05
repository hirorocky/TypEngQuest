/**
 * Titleフェーズの統合テスト
 * 
 * テスト対象:
 * - Titleフェーズのコマンド処理
 * - start/load/exitコマンドの動作
 * - ヘルプ表示機能
 * - エラーハンドリング
 */

import { TitlePhase } from '../../phases/TitlePhase';
import { TestGameHelper } from './helpers/TestGameHelper';
import { withMocks } from './helpers/SimplifiedMockHelper';

describe('Titleフェーズの統合テスト', () => {
  let gameHelper: TestGameHelper;
  let titlePhase: TitlePhase;

  beforeEach(async () => {
    gameHelper = new TestGameHelper();
    
    titlePhase = new TitlePhase();
    await titlePhase.initialize();
  });

  afterEach(async () => {
    await titlePhase.cleanup();
    await gameHelper.cleanup();
  });

  describe('基本機能テスト', () => {
    test('TitlePhaseが正常に初期化されること', () => {
      expect(titlePhase).toBeInstanceOf(TitlePhase);
      expect(titlePhase.getType()).toBe('title');
    });

    test('利用可能なコマンド一覧を取得できること', () => {
      const availableCommands = titlePhase.getAvailableCommands();
      
      // 基本的なタイトルフェーズコマンドが含まれていることを確認
      const expectedCommands = ['start', 'load', 'exit', 'help', 'clear', 'history'];
      expectedCommands.forEach(cmd => {
        expect(availableCommands).toContain(cmd);
      });
    });
  });

  describe('コマンド処理テスト', () => {
    test('startコマンドでExplorationフェーズに遷移すること', withMocks(async (mocks) => {
      mocks.useFakeTimers();
      
      const resultPromise = titlePhase.processInput('start');
      
      // TitlePhaseのsimulateLoadingの500msのsetTimeoutを進める
      jest.advanceTimersByTime(500);
      await Promise.resolve();
      
      const result = await resultPromise;
      
      expect(result.success).toBe(true);
      expect(result.nextPhase).toBe('exploration');
      expect(result.message).toContain('New game started');
    }));

    test('loadコマンドが適切に処理されること', withMocks(async (mocks) => {
      mocks.useFakeTimers();
      
      const resultPromise = titlePhase.processInput('load');
      
      // TitlePhaseのsimulateLoadingの500msのsetTimeoutを進める
      jest.advanceTimersByTime(500);
      await Promise.resolve();
      
      const result = await resultPromise;
      
      expect(result.success).toBe(false);
      // ロード機能は現在未実装のため、エラーメッセージが返されることを確認
      expect(result.message).toContain('No save files found');
    }));

    test('exitコマンドでゲーム終了フラグが設定されること', async () => {
      const result = await titlePhase.processInput('exit');
      
      expect(result.success).toBe(true);
      expect(result.data?.exit).toBe(true);
    });

    test('helpコマンドでコマンド一覧が表示されること', async () => {
      gameHelper.startCapturingConsole();
      
      const result = await titlePhase.processInput('help');
      
      expect(result.success).toBe(true);
      
      // ヘルプ出力にタイトルフェーズコマンドが含まれていることを確認
      const output = gameHelper.getCapturedOutput();
      const helpOutput = output.join('\n');
      
      expect(helpOutput).toContain('start');
      expect(helpOutput).toContain('load');
      expect(helpOutput).toContain('exit');
      
      gameHelper.stopCapturingConsole();
    });

    test('clearコマンドで画面がクリアされること', async () => {
      const result = await titlePhase.processInput('clear');
      
      expect(result.success).toBe(true);
    });

    test('historyコマンドでコマンド履歴が表示されること', async () => {
      // まず何かのコマンドを実行して履歴を作る
      await titlePhase.processInput('help');
      
      gameHelper.startCapturingConsole();
      
      const result = await titlePhase.processInput('history');
      
      expect(result.success).toBe(true);
      
      gameHelper.stopCapturingConsole();
    });
  });

  describe('エラーハンドリングテスト', () => {
    test('無効なコマンドでエラーメッセージが表示されること', async () => {
      const result = await titlePhase.processInput('invalid_command');
      
      expect(result.success).toBe(false);
      expect(result.message).toContain('Unknown command');
    });

    test('空のコマンドが適切に処理されること', async () => {
      const result = await titlePhase.processInput('');
      
      // 空のコマンドはCommandParserで成功として処理される
      expect(result.success).toBe(true);
    });

    test('スペースのみのコマンドが適切に処理されること', async () => {
      const result = await titlePhase.processInput('   ');
      
      // スペースのみのコマンドもCommandParserで成功として処理される
      expect(result.success).toBe(true);
    });
  });

  describe('コマンドエイリアステスト', () => {
    test('helpコマンドのエイリアス（h, ?）が動作すること', async () => {
      const helpResult = await titlePhase.processInput('help');
      const hResult = await titlePhase.processInput('h');
      const questionResult = await titlePhase.processInput('?');
      
      expect(helpResult.success).toBe(true);
      expect(hResult.success).toBe(true);
      expect(questionResult.success).toBe(true);
    });

    test('clearコマンドのエイリアス（cls）が動作すること', async () => {
      const clearResult = await titlePhase.processInput('clear');
      const clsResult = await titlePhase.processInput('cls');
      
      expect(clearResult.success).toBe(true);
      expect(clsResult.success).toBe(true);
    });

    test('exitコマンドのエイリアス（quit, q）が動作すること', async () => {
      const exitResult = await titlePhase.processInput('exit');
      const quitResult = await titlePhase.processInput('quit');
      const qResult = await titlePhase.processInput('q');
      
      expect(exitResult.success).toBe(true);
      expect(quitResult.success).toBe(true);
      expect(qResult.success).toBe(true);
      
      // 全て終了フラグが設定されることを確認
      expect(exitResult.data?.exit).toBe(true);
      expect(quitResult.data?.exit).toBe(true);
      expect(qResult.data?.exit).toBe(true);
    });
  });

  describe('継続的処理テスト', () => {
    test('複数のコマンドを連続実行できること', async () => {
      const commands = ['help', 'clear', 'help', 'clear'];
      
      for (const cmd of commands) {
        const result = await titlePhase.processInput(cmd);
        expect(result.success).toBe(true);
      }
    });

    test('コマンド実行後にフェーズ状態が維持されること', async () => {
      await titlePhase.processInput('help');
      expect(titlePhase.getType()).toBe('title');
      
      await titlePhase.processInput('clear');
      expect(titlePhase.getType()).toBe('title');
    });
  });
});
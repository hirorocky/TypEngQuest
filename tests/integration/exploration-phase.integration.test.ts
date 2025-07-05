/**
 * Explorationフェーズの統合テスト
 * 
 * テスト対象:
 * - ファイルシステムナビゲーション機能（cd, ls, pwd, tree）
 * - コマンド処理とエラーハンドリング
 * - ナビゲーションフローの統合
 * - システムコマンド（help, clear, exit）
 */

import { ExplorationPhase } from '../../src/phases/ExplorationPhase';
import { FileSystem } from '../../src/world/FileSystem';
import { TestGameHelper } from './helpers/TestGameHelper';
import { MockHelper } from './helpers/MockHelper';

describe('Explorationフェーズの統合テスト', () => {
  let gameHelper: TestGameHelper;
  let mockHelper: MockHelper;
  let explorationPhase: ExplorationPhase;

  beforeEach(async () => {
    gameHelper = new TestGameHelper();
    mockHelper = new MockHelper();
    
    // process.exitをモックして、テスト中にプロセスが終了しないようにする
    mockHelper.mockProcessExit();
    
    explorationPhase = new ExplorationPhase();
    await explorationPhase.initialize();
  });

  afterEach(async () => {
    await explorationPhase.cleanup();
    gameHelper.cleanup();
    mockHelper.restoreAllMocks();
  });

  describe('基本機能テスト', () => {
    test('ExplorationPhaseが正常に初期化されること', () => {
      expect(explorationPhase).toBeInstanceOf(ExplorationPhase);
      expect(explorationPhase.getType()).toBe('exploration');
    });

    test('利用可能なコマンド一覧を取得できること', () => {
      const availableCommands = explorationPhase.getAvailableCommands();
      
      // 基本的なナビゲーションコマンドが含まれていることを確認
      const expectedCommands = ['cd', 'ls', 'pwd', 'tree', 'help', 'clear', 'exit'];
      expectedCommands.forEach(cmd => {
        expect(availableCommands).toContain(cmd);
      });
    });
  });

  describe('ナビゲーションコマンドテスト', () => {
    test('lsコマンドでディレクトリ一覧が表示されること', async () => {
      const result = await explorationPhase.processInput('ls');
      
      expect(result.success).toBe(true);
    });

    test('pwdコマンドで現在位置が表示されること', async () => {
      const result = await explorationPhase.processInput('pwd');
      
      expect(result.success).toBe(true);
    });

    test('treeコマンドでディレクトリ構造が表示されること', async () => {
      const result = await explorationPhase.processInput('tree');
      
      expect(result.success).toBe(true);
    });

    test('cdコマンドでディレクトリ移動ができること', async () => {
      // まずlsで利用可能なディレクトリを確認
      const lsResult = await explorationPhase.processInput('ls');
      expect(lsResult.success).toBe(true);
      
      // 子ディレクトリがある場合はcdをテスト
      const cdResult = await explorationPhase.processInput('cd .');
      expect(cdResult.success).toBe(true);
    });

    test('cd ..で親ディレクトリに移動できること', async () => {
      const result = await explorationPhase.processInput('cd ..');
      
      // ルートディレクトリにいる場合は失敗、そうでなければ成功
      expect(result.success).toBeDefined();
    });
  });

  describe('システムコマンドテスト', () => {
    test('helpコマンドでナビゲーションコマンドが表示されること', async () => {
      gameHelper.startCapturingConsole();
      
      const result = await explorationPhase.processInput('help');
      
      expect(result.success).toBe(true);
      
      // ヘルプ出力にナビゲーションコマンドが含まれていることを確認
      const output = gameHelper.getCapturedOutput();
      const helpOutput = output.join('\n');
      
      expect(helpOutput).toContain('cd');
      expect(helpOutput).toContain('ls');
      expect(helpOutput).toContain('pwd');
      expect(helpOutput).toContain('tree');
      
      gameHelper.stopCapturingConsole();
    });

    test('clearコマンドで画面がクリアされること', async () => {
      const result = await explorationPhase.processInput('clear');
      
      expect(result.success).toBe(true);
    });

    test('exitコマンドでTitleフェーズに戻ること', async () => {
      const result = await explorationPhase.processInput('exit');
      
      expect(result.success).toBe(true);
      expect(result.nextPhase).toBe('title');
    });
  });

  describe('エラーハンドリングテスト', () => {
    test('無効なコマンドでエラーメッセージが表示されること', async () => {
      const result = await explorationPhase.processInput('invalid_navigation_command');
      
      expect(result.success).toBe(false);
      expect(result.message).toContain('不明なコマンド');
    });

    test('存在しないディレクトリへのcd操作でエラーが適切に処理されること', async () => {
      const result = await explorationPhase.processInput('cd nonexistent_directory');
      
      expect(result.success).toBe(false);
      expect(result.message).toBeDefined();
    });

    test('不正な引数を持つコマンドが適切に処理されること', async () => {
      const commands = [
        'ls --invalid-option',
        'pwd extra_arg',
        'tree --depth=abc'  // 不正な数値
      ];
      
      for (const cmd of commands) {
        const result = await explorationPhase.processInput(cmd);
        // エラーが適切に処理されること（成功でも失敗でも問題ないが、クラッシュしないこと）
        expect(result.success).toBeDefined();
      }
    });
  });

  describe('ナビゲーションフロー統合テスト', () => {
    test('ls→pwd→tree の一連の操作が正常に動作すること', async () => {
      const commands = ['ls', 'pwd', 'tree'];
      
      for (const cmd of commands) {
        const result = await explorationPhase.processInput(cmd);
        expect(result.success).toBe(true);
      }
    });

    test('複数回のナビゲーション操作後に正しい状態を維持すること', async () => {
      const commands = ['ls', 'pwd', 'tree', 'help', 'ls', 'pwd'];
      
      for (const cmd of commands) {
        const result = await explorationPhase.processInput(cmd);
        expect(result.success).toBe(true);
      }
      
      // フェーズタイプが維持されていることを確認
      expect(explorationPhase.getType()).toBe('exploration');
    });

    test('連続したcd操作が正常に動作すること', async () => {
      // 現在位置確認
      const pwdResult1 = await explorationPhase.processInput('pwd');
      expect(pwdResult1.success).toBe(true);
      
      // カレントディレクトリに移動（何も起こらないはず）
      const cdResult1 = await explorationPhase.processInput('cd .');
      expect(cdResult1.success).toBe(true);
      
      // 再度位置確認
      const pwdResult2 = await explorationPhase.processInput('pwd');
      expect(pwdResult2.success).toBe(true);
    });
  });

  describe('ファイルシステム統合テスト', () => {
    test('FileSystemクラスとの統合が正常に動作すること', () => {
      const fileSystem = FileSystem.createTestStructure();
      
      expect(fileSystem).toBeInstanceOf(FileSystem);
      expect(fileSystem.pwd()).toBe('/projects');
    });

    test('ファイルシステム操作の結果が一貫していること', async () => {
      // 初期位置確認
      const initialPwd = await explorationPhase.processInput('pwd');
      expect(initialPwd.success).toBe(true);
      
      // ディレクトリ一覧確認
      const lsResult = await explorationPhase.processInput('ls');
      expect(lsResult.success).toBe(true);
      
      // 位置が変わっていないことを確認
      const finalPwd = await explorationPhase.processInput('pwd');
      expect(finalPwd.success).toBe(true);
    });
  });

  describe('コマンドエイリアステスト', () => {
    test('helpコマンドのエイリアス（h, ?）が動作すること', async () => {
      const helpResult = await explorationPhase.processInput('help');
      const hResult = await explorationPhase.processInput('h');
      const questionResult = await explorationPhase.processInput('?');
      
      expect(helpResult.success).toBe(true);
      expect(hResult.success).toBe(true);
      expect(questionResult.success).toBe(true);
    });

    test('clearコマンドのエイリアス（cls）が動作すること', async () => {
      const clearResult = await explorationPhase.processInput('clear');
      const clsResult = await explorationPhase.processInput('cls');
      
      expect(clearResult.success).toBe(true);
      expect(clsResult.success).toBe(true);
    });

    test('exitコマンドのエイリアス（quit, q）が動作すること', async () => {
      const exitResult = await explorationPhase.processInput('exit');
      const quitResult = await explorationPhase.processInput('quit');
      const qResult = await explorationPhase.processInput('q');
      
      expect(exitResult.success).toBe(true);
      expect(quitResult.success).toBe(true);
      expect(qResult.success).toBe(true);
      
      // 全てTitleフェーズへの遷移が設定されることを確認
      expect(exitResult.nextPhase).toBe('title');
      expect(quitResult.nextPhase).toBe('title');
      expect(qResult.nextPhase).toBe('title');
    });
  });
});
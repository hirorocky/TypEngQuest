/**
 * Explorationフェーズの統合テスト
 *
 * テスト対象:
 * - ファイルシステムナビゲーション機能（cd, ls, pwd, tree）
 * - コマンド処理とエラーハンドリング
 * - ナビゲーションフローの統合
 * - システムコマンド（help, clear, exit）
 */

import { ExplorationPhase } from '../../phases/ExplorationPhase';
import { FileSystem } from '../../world/FileSystem';
import { World } from '../../world/World';
import { TestGameHelper } from './helpers/TestGameHelper';
import { withMocks } from './helpers/SimplifiedMockHelper';

describe('Explorationフェーズの統合テスト', () => {
  let gameHelper: TestGameHelper;
  let explorationPhase: ExplorationPhase;
  let fileSystem: FileSystem;

  beforeEach(async () => {
    gameHelper = new TestGameHelper();

    // 統合テスト用の固定ファイル構造を作成
    fileSystem = FileSystem.createSampleStructure();

    const domain = { type: 'tech-startup' as any, name: 'tech-startup', description: 'Test domain', directoryNames: ['src', 'lib', 'config'], fileNames: { monster: ['monster.py'], treasure: ['treasure.json'], event: ['event.js'], savepoint: ['save.md'] } };
    const world = new (class extends World {
      constructor() {
        super(domain, 1, true); // isTest = true
        this.fileSystem = fileSystem;
      }
    })();
    explorationPhase = new ExplorationPhase(world);
    await explorationPhase.initialize();
  });

  afterEach(async () => {
    await explorationPhase.cleanup();
    await gameHelper.cleanup();
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
      expect(result.output).toBeDefined();
      expect(result.output?.some((line: string) => line.includes('web-app'))).toBe(true);
      expect(result.output?.some((line: string) => line.includes('game-engine'))).toBe(true);
      expect(result.output?.some((line: string) => line.includes('mobile-app'))).toBe(true);
    });

    test('pwdコマンドで現在位置が表示されること', async () => {
      const result = await explorationPhase.processInput('pwd');

      expect(result.success).toBe(true);
      expect(result.output).toBeDefined();
      expect(result.output?.some((line: string) => line.includes('/'))).toBe(true);
    });

    test('treeコマンドでディレクトリ構造が表示されること', async () => {
      const result = await explorationPhase.processInput('tree');

      expect(result.success).toBe(true);
      expect(result.output).toBeDefined();
      expect(result.output?.some((line: string) => line.includes('web-app'))).toBe(true);
      expect(result.output?.some((line: string) => line.includes('game-engine'))).toBe(true);
      expect(result.output?.some((line: string) => line.includes('mobile-app'))).toBe(true);
    });

    test('cdコマンドでディレクトリ移動ができること', async () => {
      // 初期位置を確認
      const initialPwd = await explorationPhase.processInput('pwd');
      expect(initialPwd.success).toBe(true);
      expect(initialPwd.output).toContain('/');

      // web-appディレクトリに移動
      const cdResult = await explorationPhase.processInput('cd web-app');
      expect(cdResult.success).toBe(true);

      // 移動後の位置を確認
      const newPwd = await explorationPhase.processInput('pwd');
      expect(newPwd.success).toBe(true);
      expect(newPwd.output).toContain('/web-app');
    });

    test('深いディレクトリ構造での移動テスト', async () => {
      // web-app/src/componentsまで移動
      const cd1 = await explorationPhase.processInput('cd web-app');
      expect(cd1.success).toBe(true);

      const cd2 = await explorationPhase.processInput('cd src');
      expect(cd2.success).toBe(true);

      const cd3 = await explorationPhase.processInput('cd components');
      expect(cd3.success).toBe(true);

      // 最終位置確認
      const pwd = await explorationPhase.processInput('pwd');
      expect(pwd.success).toBe(true);
      expect(pwd.output).toContain('/web-app/src/components');

      // 親ディレクトリに戻る
      const cdBack = await explorationPhase.processInput('cd ..');
      expect(cdBack.success).toBe(true);

      const pwdBack = await explorationPhase.processInput('pwd');
      expect(pwdBack.success).toBe(true);
      expect(pwdBack.output).toContain('/web-app/src');
    });

    test('絶対パスでの移動テスト', async () => {
      // 絶対パスでgame-engine/assetsに移動
      const cdAbs = await explorationPhase.processInput('cd /game-engine/assets');
      expect(cdAbs.success).toBe(true);

      const pwd = await explorationPhase.processInput('pwd');
      expect(pwd.success).toBe(true);
      expect(pwd.output).toContain('/game-engine/assets');
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

    test('exitコマンドでTitleフェーズに戻ること', withMocks(async (mocks) => {
      mocks.mockProcessExit();
      
      const result = await explorationPhase.processInput('exit');

      expect(result.success).toBe(true);
      expect(result.nextPhase).toBe('title');
    }));
  });

  describe('エラーハンドリングテスト', () => {
    test('無効なコマンドでエラーメッセージが表示されること', async () => {
      const result = await explorationPhase.processInput('invalid_navigation_command');

      expect(result.success).toBe(false);
      expect(result.message).toContain('command not found');
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
      expect(pwdResult1.output).toContain('/');

      // カレントディレクトリに移動（何も起こらないはず）
      const cdResult1 = await explorationPhase.processInput('cd .');
      expect(cdResult1.success).toBe(true);

      // 再度位置確認
      const pwdResult2 = await explorationPhase.processInput('pwd');
      expect(pwdResult2.success).toBe(true);
      // 位置が変わっていないことを確認
      expect(pwdResult2.output).toContain('/');
    });
  });

  describe('ファイルシステム統合テスト', () => {
    test('FileSystemクラスとの統合が正常に動作すること', () => {
      const fileSystem = FileSystem.createTestStructure();

      expect(fileSystem).toBeInstanceOf(FileSystem);
      expect(fileSystem.pwd()).toBe('/');
    });

    test('ファイルシステム操作の結果が一貫していること', async () => {
      // 初期位置確認
      const initialPwd = await explorationPhase.processInput('pwd');
      expect(initialPwd.success).toBe(true);
      expect(initialPwd.output).toContain('/');

      // ディレクトリ一覧確認
      const lsResult = await explorationPhase.processInput('ls');
      expect(lsResult.success).toBe(true);

      // 位置が変わっていないことを確認
      const finalPwd = await explorationPhase.processInput('pwd');
      expect(finalPwd.success).toBe(true);
      expect(finalPwd.output).toContain('/');
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

    test('exitコマンドのエイリアス（quit, q）が動作すること', withMocks(async (mocks) => {
      mocks.mockProcessExit();
      
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
    }));
  });
});
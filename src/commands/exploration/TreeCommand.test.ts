/**
 * TreeCommandクラスのテスト
 */

import { TreeCommand } from './TreeCommand';
import { FileSystem } from '../../world/FileSystem';
import { CommandContext } from '../BaseCommand';

describe('TreeCommand', () => {
  let command: TreeCommand;
  let fileSystem: FileSystem;
  let context: CommandContext;

  beforeEach(() => {
    fileSystem = FileSystem.createTestStructure();
    command = new TreeCommand();
    context = {
      currentPhase: 'exploration',
      fileSystem,
    };
  });

  describe('基本プロパティ', () => {
    test('コマンド名とディスクリプション', () => {
      expect(command.name).toBe('tree');
      expect(command.description).toBe('display directory tree structure');
    });
  });

  describe('executeInternal - コマンド実行', () => {
    test('基本的なツリー表示', () => {
      const result = command.execute([], context);

      expect(result.success).toBe(true);
      expect(result.message).toBe('directory tree:');
      expect(result.output).toBeDefined();
      expect(result.output!.length).toBeGreaterThan(0);

      // ツリー形式の文字が含まれることを確認
      const treeOutput = result.output!.join('\n');
      expect(treeOutput).toMatch(/[├└]/); // ツリー文字
      expect(treeOutput).toContain('projects/');
    });

    test('隠しファイルも含むツリー表示 (-a)', () => {
      fileSystem.cd('mobile-app');
      const result = command.execute(['-a'], context);

      expect(result.success).toBe(true);
      const treeOutput = result.output!.join('\n');
      expect(treeOutput).toContain('.hidden.json');
    });

    test('深度制限付きツリー表示 (-d)', () => {
      const result = command.execute(['-d', '1'], context);

      expect(result.success).toBe(true);
      const treeOutput = result.output!.join('\n');

      // 深度1なので、ルートの直下のディレクトリまでは表示される
      expect(treeOutput).toContain('web-app/');
      expect(treeOutput).toContain('mobile-app/');

      // 深度1なので、src/やtests/は表示されないはず
      expect(treeOutput).not.toContain('src/');
      expect(treeOutput).not.toContain('tests/');
    });

    test('深度制限付きツリー表示 (--depth)', () => {
      const result = command.execute(['--depth', '2'], context);

      expect(result.success).toBe(true);
      const treeOutput = result.output!.join('\n');

      // 深度2なので、2層目まで表示される
      expect(treeOutput).toContain('web-app/');
      expect(treeOutput).toContain('src/');
      expect(treeOutput).toContain('tests/');
    });

    test('複合オプション (-a -d)', () => {
      fileSystem.cd('mobile-app');
      const result = command.execute(['-a', '-d', '2'], context);

      expect(result.success).toBe(true);
      const treeOutput = result.output!.join('\n');
      expect(treeOutput).toContain('.hidden.json');
    });

    test('無効な深度値は無視される', () => {
      const result = command.execute(['-d', 'invalid'], context);

      expect(result.success).toBe(true);
      // 無効な深度値の場合は制限なしで表示
      const treeOutput = result.output!.join('\n');
      expect(treeOutput).toContain('web-app/');
    });

    test('負の深度値は無視される', () => {
      const result = command.execute(['-d', '-1'], context);

      expect(result.success).toBe(true);
      // 負の深度値の場合は制限なしで表示
      const treeOutput = result.output!.join('\n');
      expect(treeOutput).toContain('web-app/');
    });
  });

  describe('ツリー表示フォーマット', () => {
    test('ツリー構造文字が正しく使用される', () => {
      const result = command.execute([], context);
      const treeOutput = result.output!.join('\n');

      // ツリー構造を表す文字が含まれる
      expect(treeOutput).toMatch(/├──/);
      expect(treeOutput).toMatch(/└──/);
      expect(treeOutput).toMatch(/│/);
    });

    test('ディレクトリに/が付く', () => {
      const result = command.execute([], context);
      const treeOutput = result.output!.join('\n');

      expect(treeOutput).toContain('web-app/');
      expect(treeOutput).toContain('mobile-app/');
    });

    test('ファイルタイプアイコンが表示される', () => {
      // ルートディレクトリからtreeを実行してすべてのファイルタイプを確認
      const result = command.execute([], context);
      const treeOutput = result.output!.join('\n');

      // モンスターファイルのアイコン（.js, .ts等）
      expect(treeOutput).toContain('⚔️');
      // 宝箱ファイルのアイコン（.json, .yaml等）
      expect(treeOutput).toContain('💰');
      // セーブポイントのアイコン（.md）
      expect(treeOutput).toContain('💾');
      // イベントファイルのアイコン（.exe）
      expect(treeOutput).toContain('🎭');
    });

    test('深度制限でツリー構造が正しく表示される', () => {
      const result = command.execute(['-d', '2'], context);
      // 階層構造が正しく表示されることを確認
      const lines = result.output!;
      expect(lines[0]).toContain('projects/');
      expect(lines.some(line => line.includes('├──') || line.includes('└──'))).toBe(true);
    });
  });

  describe('サブディレクトリでのツリー表示', () => {
    test('サブディレクトリに移動後のツリー表示', () => {
      fileSystem.cd('web-app');
      const result = command.execute([], context);

      expect(result.success).toBe(true);
      const treeOutput = result.output!.join('\n');

      // web-appディレクトリの内容が表示される
      expect(treeOutput).toContain('web-app/');
      expect(treeOutput).toContain('src/');
      expect(treeOutput).toContain('tests/');
    });

    test('深いディレクトリでのツリー表示', () => {
      fileSystem.cd('web-app/src');
      const result = command.execute([], context);

      expect(result.success).toBe(true);
      const treeOutput = result.output!.join('\n');

      // srcディレクトリの内容が表示される
      expect(treeOutput).toContain('src/');
    });
  });

  describe('getHelp - ヘルプ表示', () => {
    test('適切なヘルプが返される', () => {
      const help = command.getHelp();

      expect(help).toBeInstanceOf(Array);
      expect(help.length).toBeGreaterThan(0);
      expect(help[0]).toContain('tree');
      expect(help.join('\n')).toContain('display directory tree structure');
    });

    test('オプションの説明が含まれる', () => {
      const help = command.getHelp();
      const helpText = help.join('\n');

      expect(helpText).toContain('-a');
      expect(helpText).toContain('-d');
      expect(helpText).toContain('--all');
      expect(helpText).toContain('--depth');
    });

    test('ファイルタイプアイコンの説明が含まれる', () => {
      const help = command.getHelp();
      const helpText = help.join('\n');

      expect(helpText).toContain('⚔️');
      expect(helpText).toContain('💰');
      expect(helpText).toContain('💾');
      expect(helpText).toContain('🎭');
      expect(helpText).toContain('📄');
    });

    test('使用例が含まれる', () => {
      const help = command.getHelp();
      const helpText = help.join('\n');

      expect(helpText).toContain('tree -a');
      expect(helpText).toContain('tree -d 2');
      expect(helpText).toContain('tree --depth 3');
    });
  });

  describe('引数の検証', () => {
    test('引数なしは有効', () => {
      const result = command.validateArgs([]);
      expect(result.valid).toBe(true);
    });

    test('オプション付きは有効', () => {
      const result = command.validateArgs(['-a']);
      expect(result.valid).toBe(true);
    });

    test('深度指定付きは有効', () => {
      const result = command.validateArgs(['-d', '3']);
      expect(result.valid).toBe(true);
    });

    test('複合オプションは有効', () => {
      const result = command.validateArgs(['-a', '--depth', '2']);
      expect(result.valid).toBe(true);
    });
  });

});

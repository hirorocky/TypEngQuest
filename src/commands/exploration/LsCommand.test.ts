/**
 * LsCommandクラスのテスト
 */

import { LsCommand } from './LsCommand';
import { FileSystem } from '../../world/FileSystem';
import { CommandContext } from '../BaseCommand';

describe('LsCommand', () => {
  let command: LsCommand;
  let fileSystem: FileSystem;
  let context: CommandContext;

  beforeEach(() => {
    fileSystem = FileSystem.createTestStructure();
    command = new LsCommand();
    context = {
      currentPhase: 'exploration',
      fileSystem,
    };
  });

  describe('基本プロパティ', () => {
    test('コマンド名とディスクリプション', () => {
      expect(command.name).toBe('ls');
      expect(command.description).toBe('ファイル・ディレクトリ一覧を表示します');
    });
  });

  describe('executeInternal - コマンド実行', () => {
    test('基本的なファイル一覧表示', () => {
      const result = command.execute([], context);

      expect(result.success).toBe(true);
      expect(result.message).toBe('ファイル一覧:');
      expect(result.output).toBeDefined();
      expect(result.output!.length).toBeGreaterThan(0);
    });

    test('隠しファイルも含む一覧表示 (-a)', () => {
      fileSystem.cd('game-studio/src');
      const result = command.execute(['-a'], context);

      expect(result.success).toBe(true);
      expect(result.output!.join(' ')).toContain('.hidden.py');
    });

    test('詳細表示 (-l)', () => {
      const result = command.execute(['-l'], context);

      expect(result.success).toBe(true);
      expect(result.output!.length).toBeGreaterThan(0);
      // 詳細表示には権限情報が含まれる
      expect(
        result.output!.some(line => line.includes('drwxr-xr-x') || line.includes('-rw-r--r--'))
      ).toBe(true);
    });

    test('複合オプション (-la)', () => {
      fileSystem.cd('game-studio/src');
      const result = command.execute(['-la'], context);

      expect(result.success).toBe(true);
      expect(result.output!.join(' ')).toContain('.hidden.py');
      expect(
        result.output!.some(line => line.includes('drwxr-xr-x') || line.includes('-rw-r--r--'))
      ).toBe(true);
    });

    test('ロングオプション (--all --long)', () => {
      fileSystem.cd('game-studio/src');
      const result = command.execute(['--all', '--long'], context);

      expect(result.success).toBe(true);
      expect(result.output!.join(' ')).toContain('.hidden.py');
      expect(
        result.output!.some(line => line.includes('drwxr-xr-x') || line.includes('-rw-r--r--'))
      ).toBe(true);
    });

    test('指定パスの一覧表示', () => {
      const result = command.execute(['game-studio'], context);

      expect(result.success).toBe(true);
      expect(result.output!.join(' ')).toContain('src/');
      expect(result.output!.join(' ')).toContain('config/');
    });

    test('絶対パスの一覧表示', () => {
      const result = command.execute(['/projects/game-studio'], context);

      expect(result.success).toBe(true);
      expect(result.output!.join(' ')).toContain('src/');
    });

    test('ホームパスの一覧表示', () => {
      const result = command.execute(['~/tech-startup'], context);

      expect(result.success).toBe(true);
      expect(result.output!.join(' ')).toContain('api/');
    });

    test('存在しないパスはエラー', () => {
      const result = command.execute(['nonexistent'], context);

      expect(result.success).toBe(false);
      expect(result.message).toContain('パスが見つかりません');
    });

    test('ファイルを指定した場合はエラー', () => {
      const result = command.execute(['game-studio/README.md'], context);

      expect(result.success).toBe(false);
      expect(result.message).toContain('ディレクトリではありません');
    });
  });

  describe('表示フォーマット', () => {
    test('通常表示でディレクトリに/が付く', () => {
      const result = command.execute([], context);

      expect(result.success).toBe(true);
      expect(result.output!.join(' ')).toContain('game-studio/');
      expect(result.output!.join(' ')).toContain('tech-startup/');
    });

    test('詳細表示でディレクトリの権限が正しい', () => {
      const result = command.execute(['-l'], context);

      expect(result.success).toBe(true);
      const hasDirectoryPermission = result.output!.some(line => line.startsWith('drwxr-xr-x'));
      expect(hasDirectoryPermission).toBe(true);
    });

    test('詳細表示でファイルの権限が正しい', () => {
      fileSystem.cd('game-studio');
      const result = command.execute(['-l'], context);

      expect(result.success).toBe(true);
      const hasFilePermission = result.output!.some(line => line.startsWith('-rw-r--r--'));
      expect(hasFilePermission).toBe(true);
    });

    test('詳細表示でファイルサイズが表示される', () => {
      fileSystem.cd('game-studio');
      const result = command.execute(['-l'], context);

      expect(result.success).toBe(true);
      result.output!.forEach(line => {
        expect(line).toMatch(/\d+\s+\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}/);
      });
    });
  });

  describe('getHelp - ヘルプ表示', () => {
    test('適切なヘルプが返される', () => {
      const help = command.getHelp();

      expect(help).toBeInstanceOf(Array);
      expect(help.length).toBeGreaterThan(0);
      expect(help[0]).toContain('ls');
      expect(help.join('\n')).toContain('ファイル・ディレクトリ一覧を表示します');
    });

    test('オプションの説明が含まれる', () => {
      const help = command.getHelp();
      const helpText = help.join('\n');

      expect(helpText).toContain('-a');
      expect(helpText).toContain('-l');
      expect(helpText).toContain('--all');
      expect(helpText).toContain('--long');
    });

    test('使用例が含まれる', () => {
      const help = command.getHelp();
      const helpText = help.join('\n');

      expect(helpText).toContain('ls -a');
      expect(helpText).toContain('ls -l');
      expect(helpText).toContain('ls -la');
    });
  });

  describe('引数の検証', () => {
    test('引数なしは有効', () => {
      const result = command.validateArgs([]);
      expect(result.valid).toBe(true);
    });

    test('オプション付きは有効', () => {
      const result = command.validateArgs(['-la']);
      expect(result.valid).toBe(true);
    });

    test('パス指定付きは有効', () => {
      const result = command.validateArgs(['src']);
      expect(result.valid).toBe(true);
    });

    test('複合引数は有効', () => {
      const result = command.validateArgs(['-l', 'src']);
      expect(result.valid).toBe(true);
    });
  });
});

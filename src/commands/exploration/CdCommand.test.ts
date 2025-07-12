/**
 * CdCommandクラスのテスト
 */

import { CdCommand } from './CdCommand';
import { FileSystem } from '../../world/FileSystem';
import { CommandContext } from '../BaseCommand';

describe('CdCommand', () => {
  let command: CdCommand;
  let fileSystem: FileSystem;
  let context: CommandContext;

  beforeEach(() => {
    fileSystem = FileSystem.createTestStructure();
    command = new CdCommand();
    context = {
      currentPhase: 'exploration',
      fileSystem,
    };
  });

  describe('基本プロパティ', () => {
    test('コマンド名とディスクリプション', () => {
      expect(command.name).toBe('cd');
      expect(command.description).toBe('change working directory');
    });
  });

  describe('executeInternal - コマンド実行', () => {
    test('引数なしでルートディレクトリに移動', () => {
      // サブディレクトリに移動してから
      fileSystem.cd('web-app');

      const result = command.execute([], context);

      expect(result.success).toBe(true);
      expect(result.message).toContain('changed to');
      expect(fileSystem.pwd()).toBe('/');
    });

    test('~ でルートディレクトリに移動', () => {
      fileSystem.cd('web-app');

      const result = command.execute(['~'], context);

      expect(result.success).toBe(true);
      expect(fileSystem.pwd()).toBe('/');
    });

    test('.. で親ディレクトリに移動', () => {
      fileSystem.cd('web-app');
      fileSystem.cd('src');

      const result = command.execute(['..'], context);

      expect(result.success).toBe(true);
      expect(fileSystem.pwd()).toBe('/web-app');
    });

    test('相対パスでの移動', () => {
      const result = command.execute(['web-app'], context);

      expect(result.success).toBe(true);
      expect(fileSystem.pwd()).toBe('/web-app');
    });

    test('絶対パスでの移動', () => {
      const result = command.execute(['/web-app/src'], context);

      expect(result.success).toBe(true);
      expect(fileSystem.pwd()).toBe('/web-app/src');
    });

    test('ホームパスでの移動', () => {
      const result = command.execute(['~/web-app'], context);

      expect(result.success).toBe(true);
      expect(fileSystem.pwd()).toBe('/web-app');
    });

    test('存在しないディレクトリへの移動はエラー', () => {
      const result = command.execute(['nonexistent'], context);

      expect(result.success).toBe(false);
      expect(result.message).toContain('no such directory');
    });

    test('ファイルへの移動はエラー', () => {
      const result = command.execute(['web-app/README.md'], context);

      expect(result.success).toBe(false);
      expect(result.message).toContain('not a directory');
    });

    test('ルートより上への移動はエラー', () => {
      const result = command.execute(['..'], context);

      expect(result.success).toBe(false);
      expect(result.message).toContain('cannot change directory above root');
    });
  });

  describe('getHelp - ヘルプ表示', () => {
    test('適切なヘルプが返される', () => {
      const help = command.getHelp();

      expect(help).toBeInstanceOf(Array);
      expect(help.length).toBeGreaterThan(0);
      expect(help[0]).toContain('cd');
      expect(help.join('\n')).toContain('change working directory');
    });

    test('使用例が含まれる', () => {
      const help = command.getHelp();
      const helpText = help.join('\n');

      expect(helpText).toContain('cd ..');
      expect(helpText).toContain('cd ~');
      expect(helpText).toContain('cd src');
    });
  });

  describe('引数の検証', () => {
    test('空の引数配列は有効', () => {
      const result = command.validateArgs([]);
      expect(result.valid).toBe(true);
    });

    test('引数1つは有効', () => {
      const result = command.validateArgs(['src']);
      expect(result.valid).toBe(true);
    });

    test('複数の引数は有効（最初の引数のみ使用）', () => {
      const result = command.validateArgs(['src', 'config']);
      expect(result.valid).toBe(true);
    });
  });
});

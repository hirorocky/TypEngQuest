/**
 * CdCommandクラスのテスト
 */

import { CdCommand } from './CdCommand';
import { FileSystem } from '../world/FileSystem';

describe('CdCommand', () => {
  let command: CdCommand;
  let fileSystem: FileSystem;

  beforeEach(() => {
    fileSystem = FileSystem.createTestStructure();
    command = new CdCommand();
  });

  describe('基本プロパティ', () => {
    test('コマンド名とディスクリプション', () => {
      expect(command.name).toBe('cd');
      expect(command.description).toBe('ディレクトリを移動します');
    });
  });

  describe('executeInternal - コマンド実行', () => {
    test('引数なしでルートディレクトリに移動', () => {
      // サブディレクトリに移動してから
      fileSystem.cd('game-studio');

      const result = command.execute([], fileSystem);

      expect(result.success).toBe(true);
      expect(result.message).toContain('移動しました');
      expect(fileSystem.pwd()).toBe('/projects');
    });

    test('~ でルートディレクトリに移動', () => {
      fileSystem.cd('game-studio');

      const result = command.execute(['~'], fileSystem);

      expect(result.success).toBe(true);
      expect(fileSystem.pwd()).toBe('/projects');
    });

    test('.. で親ディレクトリに移動', () => {
      fileSystem.cd('game-studio');
      fileSystem.cd('src');

      const result = command.execute(['..'], fileSystem);

      expect(result.success).toBe(true);
      expect(fileSystem.pwd()).toBe('/projects/game-studio');
    });

    test('相対パスでの移動', () => {
      const result = command.execute(['game-studio'], fileSystem);

      expect(result.success).toBe(true);
      expect(fileSystem.pwd()).toBe('/projects/game-studio');
    });

    test('絶対パスでの移動', () => {
      const result = command.execute(['/projects/game-studio/src'], fileSystem);

      expect(result.success).toBe(true);
      expect(fileSystem.pwd()).toBe('/projects/game-studio/src');
    });

    test('ホームパスでの移動', () => {
      const result = command.execute(['~/game-studio'], fileSystem);

      expect(result.success).toBe(true);
      expect(fileSystem.pwd()).toBe('/projects/game-studio');
    });

    test('存在しないディレクトリへの移動はエラー', () => {
      const result = command.execute(['nonexistent'], fileSystem);

      expect(result.success).toBe(false);
      expect(result.message).toContain('ディレクトリが見つかりません');
    });

    test('ファイルへの移動はエラー', () => {
      const result = command.execute(['game-studio/README.md'], fileSystem);

      expect(result.success).toBe(false);
      expect(result.message).toContain('ディレクトリではありません');
    });

    test('ルートより上への移動はエラー', () => {
      const result = command.execute(['..'], fileSystem);

      expect(result.success).toBe(false);
      expect(result.message).toContain('ルートディレクトリより上には移動できません');
    });
  });

  describe('getHelp - ヘルプ表示', () => {
    test('適切なヘルプが返される', () => {
      const help = command.getHelp();

      expect(help).toBeInstanceOf(Array);
      expect(help.length).toBeGreaterThan(0);
      expect(help[0]).toContain('cd');
      expect(help.join('\n')).toContain('ディレクトリを移動します');
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

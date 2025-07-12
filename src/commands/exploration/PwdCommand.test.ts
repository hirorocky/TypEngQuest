/**
 * PwdCommandクラスのテスト
 */

import { PwdCommand } from './PwdCommand';
import { FileSystem } from '../../world/FileSystem';
import { CommandContext } from '../BaseCommand';

describe('PwdCommand', () => {
  let command: PwdCommand;
  let fileSystem: FileSystem;
  let context: CommandContext;

  beforeEach(() => {
    fileSystem = FileSystem.createTestStructure();
    command = new PwdCommand();
    context = {
      currentPhase: 'exploration',
      fileSystem,
    };
  });

  describe('基本プロパティ', () => {
    test('コマンド名とディスクリプション', () => {
      expect(command.name).toBe('pwd');
      expect(command.description).toBe('print working directory');
    });
  });

  describe('executeInternal - コマンド実行', () => {
    test('ルートディレクトリでのpwd', () => {
      const result = command.execute([], context);

      expect(result.success).toBe(true);
      expect(result.output).toEqual(['/']);
    });

    test('サブディレクトリでのpwd', () => {
      fileSystem.cd('web-app');
      const result = command.execute([], context);

      expect(result.success).toBe(true);
      expect(result.output).toEqual(['/web-app']);
    });

    test('深いディレクトリでのpwd', () => {
      fileSystem.cd('web-app/src');
      const result = command.execute([], context);

      expect(result.success).toBe(true);
      expect(result.output).toEqual(['/web-app/src']);
    });

    test('絶対パスで移動後のpwd', () => {
      fileSystem.cd('/mobile-app/src');
      const result = command.execute([], context);

      expect(result.success).toBe(true);
      expect(result.output).toEqual(['/mobile-app/src']);
    });

    test('親ディレクトリに戻った後のpwd', () => {
      fileSystem.cd('web-app/src');
      fileSystem.cd('..');
      const result = command.execute([], context);

      expect(result.success).toBe(true);
      expect(result.output).toEqual(['/web-app']);
    });

    test('ホームディレクトリに戻った後のpwd', () => {
      fileSystem.cd('web-app/src');
      fileSystem.cd('~');
      const result = command.execute([], context);

      expect(result.success).toBe(true);
      expect(result.output).toEqual(['/']);
    });

    test('引数を渡してもpwdは正常動作', () => {
      fileSystem.cd('web-app');
      const result = command.execute(['ignored', 'arguments'], context);

      expect(result.success).toBe(true);
      expect(result.output).toEqual(['/web-app']);
    });
  });

  describe('getHelp - ヘルプ表示', () => {
    test('適切なヘルプが返される', () => {
      const help = command.getHelp();

      expect(help).toBeInstanceOf(Array);
      expect(help.length).toBeGreaterThan(0);
      expect(help[0]).toContain('pwd');
      expect(help.join('\n')).toContain('print working directory');
    });

    test('引数不要の説明が含まれる', () => {
      const help = command.getHelp();
      const helpText = help.join('\n');

      expect(helpText).toContain('takes no arguments');
    });

    test('使用例が含まれる', () => {
      const help = command.getHelp();
      const helpText = help.join('\n');

      expect(helpText).toContain('pwd');
      expect(helpText).toContain('/web-app/src');
    });
  });

  describe('引数の検証', () => {
    test('引数なしは有効', () => {
      const result = command.validateArgs([]);
      expect(result.valid).toBe(true);
    });

    test('引数ありでも有効（引数は無視される）', () => {
      const result = command.validateArgs(['some', 'ignored', 'args']);
      expect(result.valid).toBe(true);
    });
  });

  describe('ディレクトリ移動との連携テスト', () => {
    test('複数回の移動でpwdが正しく動作', () => {
      // 初期位置
      let result = command.execute([], context);
      expect(result.output).toEqual(['/']);

      // web-appに移動
      fileSystem.cd('web-app');
      result = command.execute([], context);
      expect(result.output).toEqual(['/web-app']);

      // srcに移動
      fileSystem.cd('src');
      result = command.execute([], context);
      expect(result.output).toEqual(['/web-app/src']);

      // 親ディレクトリに戻る
      fileSystem.cd('..');
      result = command.execute([], context);
      expect(result.output).toEqual(['/web-app']);

      // ルートに戻る
      fileSystem.cd('~');
      result = command.execute([], context);
      expect(result.output).toEqual(['/']);
    });

    test('異なるプロジェクトディレクトリでのpwd', () => {
      // mobile-appに移動
      fileSystem.cd('mobile-app');
      let result = command.execute([], context);
      expect(result.output).toEqual(['/mobile-app']);

      // srcに移動
      fileSystem.cd('src');
      result = command.execute([], context);
      expect(result.output).toEqual(['/mobile-app/src']);

      // 絶対パスでweb-appに移動
      fileSystem.cd('/web-app');
      result = command.execute([], context);
      expect(result.output).toEqual(['/web-app']);
    });
  });
});

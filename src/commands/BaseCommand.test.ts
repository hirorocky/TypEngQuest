/**
 * BaseCommandクラスのテスト
 */

import { BaseCommand, CommandResult, CommandContext } from './BaseCommand';
import { FileSystem } from '../world/FileSystem';

// テスト用の具象コマンドクラス
class TestCommand extends BaseCommand {
  public name = 'test';
  public description = 'テスト用コマンド';

  protected executeInternal(args: string[], _context: CommandContext): CommandResult {
    if (args[0] === 'error') {
      return this.error('テストエラー');
    }
    if (args[0] === 'success') {
      return this.success('テスト成功', ['出力1', '出力2']);
    }
    return this.success('デフォルト成功');
  }

  public getHelp(): string[] {
    return [
      'test [argument] - テスト用コマンド',
      '  test success - 成功を返す',
      '  test error - エラーを返す',
    ];
  }
}

describe('BaseCommand', () => {
  let command: TestCommand;
  let fileSystem: FileSystem;
  let context: CommandContext;

  beforeEach(() => {
    fileSystem = FileSystem.createTestStructure();
    command = new TestCommand();
    context = {
      currentPhase: 'exploration',
      fileSystem,
    };
  });

  describe('execute - コマンド実行', () => {
    test('正常なコマンド実行', () => {
      const result = command.execute(['success'], context);

      expect(result.success).toBe(true);
      expect(result.message).toBe('テスト成功');
      expect(result.output).toEqual(['出力1', '出力2']);
    });

    test('エラーケースの処理', () => {
      const result = command.execute(['error'], context);

      expect(result.success).toBe(false);
      expect(result.message).toBe('テストエラー');
      expect(result.output).toBeUndefined();
    });

    test('引数なしでの実行', () => {
      const result = command.execute([], context);

      expect(result.success).toBe(true);
      expect(result.message).toBe('デフォルト成功');
    });
  });

  describe('validateArgs - 引数検証', () => {
    test('有効な引数の検証', () => {
      const result = command.validateArgs(['valid', 'args']);
      expect(result.valid).toBe(true);
    });

    test('空の引数配列の検証', () => {
      const result = command.validateArgs([]);
      expect(result.valid).toBe(true);
    });

    test('nullや未定義の引数の検証', () => {
      // @ts-expect-error - テストのためにnullを渡す
      expect(() => command.validateArgs(null)).not.toThrow();
      // @ts-expect-error - テストのためにundefinedを渡す
      expect(() => command.validateArgs(undefined)).not.toThrow();
    });
  });

  describe('success - 成功結果の作成', () => {
    test('メッセージのみの成功結果', () => {
      const result = command['success']('成功メッセージ');

      expect(result.success).toBe(true);
      expect(result.message).toBe('成功メッセージ');
      expect(result.output).toBeUndefined();
    });

    test('出力付きの成功結果', () => {
      const output = ['行1', '行2', '行3'];
      const result = command['success']('成功', output);

      expect(result.success).toBe(true);
      expect(result.message).toBe('成功');
      expect(result.output).toEqual(output);
    });

    test('空の出力配列', () => {
      const result = command['success']('成功', []);

      expect(result.success).toBe(true);
      expect(result.output).toEqual([]);
    });
  });

  describe('error - エラー結果の作成', () => {
    test('エラーメッセージの作成', () => {
      const result = command['error']('エラーメッセージ');

      expect(result.success).toBe(false);
      expect(result.message).toBe('エラーメッセージ');
      expect(result.output).toBeUndefined();
    });

    test('空のエラーメッセージ', () => {
      const result = command['error']('');

      expect(result.success).toBe(false);
      expect(result.message).toBe('');
    });
  });

  describe('parseOptions - オプション解析', () => {
    test('ショートオプションの解析', () => {
      const args = ['-a', '-l', 'file.txt'];
      const options = command['parseOptions'](args);

      expect(options.flags).toContain('a');
      expect(options.flags).toContain('l');
      expect(options.remaining).toEqual(['file.txt']);
    });

    test('ロングオプションの解析', () => {
      const args = ['--verbose', '--force', 'target'];
      const options = command['parseOptions'](args);

      expect(options.flags).toContain('verbose');
      expect(options.flags).toContain('force');
      expect(options.remaining).toEqual(['target']);
    });

    test('組み合わせオプションの解析', () => {
      const args = ['-la', '--verbose', 'file.txt'];
      const options = command['parseOptions'](args);

      expect(options.flags).toContain('l');
      expect(options.flags).toContain('a');
      expect(options.flags).toContain('verbose');
      expect(options.remaining).toEqual(['file.txt']);
    });

    test('値付きオプションの解析', () => {
      const args = ['--depth', '3', '-n', '5', 'target'];
      const options = command['parseOptions'](args);

      expect(options.values).toEqual({ depth: '3', n: '5' });
      expect(options.remaining).toEqual(['target']);
    });

    test('オプションなしの場合', () => {
      const args = ['file1.txt', 'file2.txt'];
      const options = command['parseOptions'](args);

      expect(options.flags).toEqual([]);
      expect(options.values).toEqual({});
      expect(options.remaining).toEqual(['file1.txt', 'file2.txt']);
    });

    test('-- 区切り文字の処理', () => {
      const args = ['-a', '--', '--not-option', 'file.txt'];
      const options = command['parseOptions'](args);

      expect(options.flags).toContain('a');
      expect(options.remaining).toEqual(['--not-option', 'file.txt']);
    });

    test('空の引数配列', () => {
      const options = command['parseOptions']([]);

      expect(options.flags).toEqual([]);
      expect(options.values).toEqual({});
      expect(options.remaining).toEqual([]);
    });
  });

  describe('formatOutput - 出力フォーマット', () => {
    test('文字列配列のフォーマット', () => {
      const lines = ['行1', '行2', '行3'];
      const formatted = command['formatOutput'](lines);

      expect(formatted).toBe('行1\n行2\n行3');
    });

    test('空の配列のフォーマット', () => {
      const formatted = command['formatOutput']([]);

      expect(formatted).toBe('');
    });

    test('単一行のフォーマット', () => {
      const formatted = command['formatOutput'](['単一行']);

      expect(formatted).toBe('単一行');
    });

    test('空文字列を含む配列', () => {
      const lines = ['行1', '', '行3'];
      const formatted = command['formatOutput'](lines);

      expect(formatted).toBe('行1\n\n行3');
    });
  });

  describe('プロパティとメソッドの存在確認', () => {
    test('必須プロパティが存在する', () => {
      expect(command.name).toBeDefined();
      expect(command.description).toBeDefined();
      expect(typeof command.name).toBe('string');
      expect(typeof command.description).toBe('string');
    });

    test('必須メソッドが存在する', () => {
      expect(typeof command.execute).toBe('function');
      expect(typeof command.getHelp).toBe('function');
    });

    test('getHelpが適切な形式を返す', () => {
      const help = command.getHelp();

      expect(Array.isArray(help)).toBe(true);
      expect(help.length).toBeGreaterThan(0);
      help.forEach(line => {
        expect(typeof line).toBe('string');
      });
    });
  });
});

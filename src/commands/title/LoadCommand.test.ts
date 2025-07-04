/**
 * LoadCommandクラスのテスト
 */

import { LoadCommand } from './LoadCommand';
import { CommandContext } from '../BaseCommand';

describe('LoadCommand', () => {
  let command: LoadCommand;
  let context: CommandContext;

  beforeEach(() => {
    command = new LoadCommand();
    context = {
      currentPhase: 'title',
    };
  });

  describe('基本プロパティ', () => {
    test('コマンド名が正しい', () => {
      expect(command.name).toBe('load');
    });

    test('説明文が設定されている', () => {
      expect(command.description).toBe('セーブデータをロードする');
    });
  });

  describe('executeInternal', () => {
    test('引数なしでエラーメッセージを返す', () => {
      const result = command.execute([], context);

      expect(result.success).toBe(false);
      expect(result.message).toContain('セーブファイルが見つかりません');
    });

    test('スロット番号指定時にエラーメッセージを返す', () => {
      const result = command.execute(['1'], context);

      expect(result.success).toBe(false);
      expect(result.message).toContain('セーブスロット1が見つかりません');
    });

    test('複数の引数でも最初の引数をスロット番号として使用', () => {
      const result = command.execute(['2', 'extra'], context);

      expect(result.success).toBe(false);
      expect(result.message).toContain('セーブスロット2が見つかりません');
    });
  });

  describe('getHelp', () => {
    test('ヘルプテキストが返される', () => {
      const help = command.getHelp();

      expect(help).toBeInstanceOf(Array);
      expect(help.length).toBeGreaterThan(0);
      expect(help[0]).toContain('load');
    });
  });
});
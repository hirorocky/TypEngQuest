/**
 * ExitCommandクラスのテスト
 */

import { ExitCommand } from './ExitCommand';
import { CommandContext } from '../BaseCommand';

describe('ExitCommand', () => {
  let command: ExitCommand;
  let context: CommandContext;

  beforeEach(() => {
    command = new ExitCommand();
    context = {
      currentPhase: 'title',
    };
  });

  describe('基本プロパティ', () => {
    test('コマンド名が正しい', () => {
      expect(command.name).toBe('exit');
    });

    test('説明文が設定されている', () => {
      expect(command.description).toBe('exit game');
    });
  });

  describe('executeInternal', () => {
    test('ゲーム終了メッセージを返す', () => {
      const result = command.execute([], context);

      expect(result.success).toBe(true);
      expect(result.message).toContain('exiting game');
      expect(result.message).toContain('thanks for playing');
    });

    test('引数があっても正常に動作する', () => {
      const result = command.execute(['extra', 'args'], context);

      expect(result.success).toBe(true);
      expect(result.message).toContain('exiting game');
    });
  });

  describe('getHelp', () => {
    test('ヘルプテキストが返される', () => {
      const help = command.getHelp();

      expect(help).toBeInstanceOf(Array);
      expect(help.length).toBeGreaterThan(0);
      expect(help[0]).toContain('exit');
    });
  });
});
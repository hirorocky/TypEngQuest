/**
 * StartCommandクラスのテスト
 */

import { StartCommand } from './StartCommand';
import { CommandContext } from '../BaseCommand';

describe('StartCommand', () => {
  let command: StartCommand;
  let context: CommandContext;

  beforeEach(() => {
    command = new StartCommand();
    context = {
      currentPhase: 'title',
    };
  });

  describe('基本プロパティ', () => {
    test('コマンド名が正しい', () => {
      expect(command.name).toBe('start');
    });

    test('説明文が設定されている', () => {
      expect(command.description).toBe('新しいゲームを開始する');
    });
  });

  describe('executeInternal', () => {
    test('新しいゲームを開始する', () => {
      const result = command.execute([], context);

      expect(result.success).toBe(true);
      expect(result.message).toBe('新しいゲームを開始しました！');
      expect(result.nextPhase).toBe('exploration');
      expect(result.data).toEqual({ newGame: true });
    });

    test('引数があっても正常に動作する', () => {
      const result = command.execute(['extra', 'args'], context);

      expect(result.success).toBe(true);
      expect(result.nextPhase).toBe('exploration');
    });
  });

  describe('getHelp', () => {
    test('ヘルプテキストが返される', () => {
      const help = command.getHelp();

      expect(help).toBeInstanceOf(Array);
      expect(help.length).toBeGreaterThan(0);
      expect(help[0]).toContain('start');
    });
  });
});
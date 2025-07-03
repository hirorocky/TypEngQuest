/**
 * PwdCommandクラスのテスト
 */

import { PwdCommand } from './PwdCommand';
import { FileSystem } from '../world/FileSystem';

describe('PwdCommand', () => {
  let command: PwdCommand;
  let fileSystem: FileSystem;

  beforeEach(() => {
    fileSystem = FileSystem.createTestStructure();
    command = new PwdCommand();
  });

  describe('基本プロパティ', () => {
    test('コマンド名とディスクリプション', () => {
      expect(command.name).toBe('pwd');
      expect(command.description).toBe('現在の作業ディレクトリのパスを表示します');
    });
  });

  describe('executeInternal - コマンド実行', () => {
    test('ルートディレクトリでのpwd', () => {
      const result = command.execute([], fileSystem);

      expect(result.success).toBe(true);
      expect(result.message).toBe('/projects');
    });

    test('サブディレクトリでのpwd', () => {
      fileSystem.cd('game-studio');
      const result = command.execute([], fileSystem);

      expect(result.success).toBe(true);
      expect(result.message).toBe('/projects/game-studio');
    });

    test('深いディレクトリでのpwd', () => {
      fileSystem.cd('game-studio/src');
      const result = command.execute([], fileSystem);

      expect(result.success).toBe(true);
      expect(result.message).toBe('/projects/game-studio/src');
    });

    test('絶対パスで移動後のpwd', () => {
      fileSystem.cd('/projects/tech-startup/api');
      const result = command.execute([], fileSystem);

      expect(result.success).toBe(true);
      expect(result.message).toBe('/projects/tech-startup/api');
    });

    test('親ディレクトリに戻った後のpwd', () => {
      fileSystem.cd('game-studio/src');
      fileSystem.cd('..');
      const result = command.execute([], fileSystem);

      expect(result.success).toBe(true);
      expect(result.message).toBe('/projects/game-studio');
    });

    test('ホームディレクトリに戻った後のpwd', () => {
      fileSystem.cd('game-studio/src');
      fileSystem.cd('~');
      const result = command.execute([], fileSystem);

      expect(result.success).toBe(true);
      expect(result.message).toBe('/projects');
    });

    test('引数を渡してもpwdは正常動作', () => {
      fileSystem.cd('game-studio');
      const result = command.execute(['ignored', 'arguments'], fileSystem);

      expect(result.success).toBe(true);
      expect(result.message).toBe('/projects/game-studio');
    });
  });

  describe('getHelp - ヘルプ表示', () => {
    test('適切なヘルプが返される', () => {
      const help = command.getHelp();

      expect(help).toBeInstanceOf(Array);
      expect(help.length).toBeGreaterThan(0);
      expect(help[0]).toContain('pwd');
      expect(help.join('\n')).toContain('現在の作業ディレクトリのパスを表示します');
    });

    test('引数不要の説明が含まれる', () => {
      const help = command.getHelp();
      const helpText = help.join('\n');

      expect(helpText).toContain('引数を取りません');
    });

    test('使用例が含まれる', () => {
      const help = command.getHelp();
      const helpText = help.join('\n');

      expect(helpText).toContain('pwd');
      expect(helpText).toContain('/projects/game-studio/src');
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
      let result = command.execute([], fileSystem);
      expect(result.message).toBe('/projects');

      // game-studioに移動
      fileSystem.cd('game-studio');
      result = command.execute([], fileSystem);
      expect(result.message).toBe('/projects/game-studio');

      // srcに移動
      fileSystem.cd('src');
      result = command.execute([], fileSystem);
      expect(result.message).toBe('/projects/game-studio/src');

      // 親ディレクトリに戻る
      fileSystem.cd('..');
      result = command.execute([], fileSystem);
      expect(result.message).toBe('/projects/game-studio');

      // ルートに戻る
      fileSystem.cd('~');
      result = command.execute([], fileSystem);
      expect(result.message).toBe('/projects');
    });

    test('異なるプロジェクトディレクトリでのpwd', () => {
      // tech-startupに移動
      fileSystem.cd('tech-startup');
      let result = command.execute([], fileSystem);
      expect(result.message).toBe('/projects/tech-startup');

      // apiに移動
      fileSystem.cd('api');
      result = command.execute([], fileSystem);
      expect(result.message).toBe('/projects/tech-startup/api');

      // 絶対パスでgame-studioに移動
      fileSystem.cd('/projects/game-studio');
      result = command.execute([], fileSystem);
      expect(result.message).toBe('/projects/game-studio');
    });
  });
});

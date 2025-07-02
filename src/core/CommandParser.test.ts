/**
 * CommandParserクラスのユニットテスト
 */

import { CommandParser } from './CommandParser';
import { Command } from './types';

const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

describe('CommandParser', () => {
  let parser: CommandParser;

  beforeEach(() => {
    parser = new CommandParser();
    consoleSpy.mockClear();
  });

  afterAll(() => {
    consoleSpy.mockRestore();
  });

  describe('コンストラクタ', () => {
    it('グローバルコマンドで初期化される', () => {
      const commands = parser.getAvailableCommands();
      expect(commands).toContain('help');
      expect(commands).toContain('clear');
      expect(commands).toContain('history');
    });
  });

  describe('register', () => {
    it('コマンドを登録できる', () => {
      const testCommand: Command = {
        name: 'test',
        description: 'Test command',
        execute: async () => ({ success: true }),
      };

      parser.register(testCommand);
      const commands = parser.getAvailableCommands();
      expect(commands).toContain('test');
    });

    it('コマンドエイリアスを登録できる', () => {
      const testCommand: Command = {
        name: 'test',
        aliases: ['t', 'testing'],
        description: 'Test command',
        execute: async () => ({ success: true }),
      };

      parser.register(testCommand);

      // Aliases should work as commands
      expect(parser.parse('t')).resolves.toEqual({ success: true });
      expect(parser.parse('testing')).resolves.toEqual({ success: true });
    });
  });

  describe('unregister', () => {
    it('コマンドとそのエイリアスを登録解除できる', () => {
      const testCommand: Command = {
        name: 'test',
        aliases: ['t'],
        description: 'Test command',
        execute: async () => ({ success: true }),
      };

      parser.register(testCommand);
      parser.unregister('test');

      const commands = parser.getAvailableCommands();
      expect(commands).not.toContain('test');
    });
  });

  describe('parse', () => {
    it('空の入力を処理できる', async () => {
      const result = await parser.parse('');
      expect(result.success).toBe(true);
    });

    it('空白のみの入力を処理できる', async () => {
      const result = await parser.parse('   ');
      expect(result.success).toBe(true);
    });

    it('helpコマンドを実行できる', async () => {
      const result = await parser.parse('help');
      expect(result.success).toBe(true);
    });

    it('helpコマンドをエイリアスで実行できる', async () => {
      const result = await parser.parse('h');
      expect(result.success).toBe(true);
    });

    it('clearコマンドを実行できる', async () => {
      const result = await parser.parse('clear');
      expect(result.success).toBe(true);
    });

    it('historyコマンドを実行できる', async () => {
      await parser.parse('test command');
      const result = await parser.parse('history');
      expect(result.success).toBe(true);
    });

    it('未知のコマンドでエラーを返す', async () => {
      const result = await parser.parse('unknown');
      expect(result.success).toBe(false);
      expect(result.message).toContain('Unknown command');
    });

    it('引数付きコマンドを処理できる', async () => {
      const testCommand: Command = {
        name: 'echo',
        description: 'Echo command',
        execute: async args => ({
          success: true,
          message: args.join(' '),
        }),
      };

      parser.register(testCommand);
      const result = await parser.parse('echo hello world');
      expect(result.success).toBe(true);
      expect(result.message).toBe('hello world');
    });

    it('クォートされた引数を処理できる', async () => {
      const testCommand: Command = {
        name: 'echo',
        description: 'Echo command',
        execute: async args => ({
          success: true,
          message: args[0],
        }),
      };

      parser.register(testCommand);
      const result = await parser.parse('echo "hello world"');
      expect(result.success).toBe(true);
      expect(result.message).toBe('hello world');
    });

    it('シングルクォートされた引数を処理できる', async () => {
      const testCommand: Command = {
        name: 'echo',
        description: 'Echo command',
        execute: async args => ({
          success: true,
          message: args[0],
        }),
      };

      parser.register(testCommand);
      const result = await parser.parse("echo 'hello world'");
      expect(result.success).toBe(true);
      expect(result.message).toBe('hello world');
    });

    it('コマンド実行エラーを処理できる', async () => {
      const errorCommand: Command = {
        name: 'error',
        description: 'Error command',
        execute: async () => {
          throw new Error('Test error');
        },
      };

      parser.register(errorCommand);
      const result = await parser.parse('error');
      expect(result.success).toBe(false);
      expect(result.message).toContain('Error executing command');
    });

    it('大文字小文字を区別しないコマンドを処理できる', async () => {
      const result = await parser.parse('HELP');
      expect(result.success).toBe(true);
    });

    it('コマンドを履歴に追加する', async () => {
      await parser.parse('help');
      await parser.parse('clear');

      const history = parser.getHistory();
      expect(history).toContain('help');
      expect(history).toContain('clear');
    });

    it('履歴を100コマンドに制限する', async () => {
      // Add more than 100 commands
      for (let i = 0; i < 105; i++) {
        await parser.parse(`command${i}`);
      }

      const history = parser.getHistory();
      expect(history.length).toBe(100);
      expect(history[0]).toBe('command5'); // First 5 should be removed
    });
  });

  describe('parseInput', () => {
    it('複雑なクォート文字列をパースできる', async () => {
      const testCommand: Command = {
        name: 'complex',
        description: 'Complex command',
        execute: async args => ({
          success: true,
          data: { args },
        }),
      };

      parser.register(testCommand);
      const result = await parser.parse('complex "arg with spaces" simple \'another quoted\'');
      expect(result.success).toBe(true);
      expect(result.data?.args).toEqual(['arg with spaces', 'simple', 'another quoted']);
    });

    it('ネストしたクォートを正しく処理できる', async () => {
      const testCommand: Command = {
        name: 'nested',
        description: 'Nested command',
        execute: async args => ({
          success: true,
          data: { args },
        }),
      };

      parser.register(testCommand);
      const result = await parser.parse('nested "outer \\"inner\\" text"');
      expect(result.success).toBe(true);
    });
  });

  describe('getAvailableCommands', () => {
    it('ユニークなコマンド名のみを返す', () => {
      const testCommand: Command = {
        name: 'test',
        aliases: ['t', 'testing'],
        description: 'Test command',
        execute: async () => ({ success: true }),
      };

      parser.register(testCommand);
      const commands = parser.getAvailableCommands();

      // Should not include aliases in the list
      expect(commands).toContain('test');
      expect(commands.filter(cmd => cmd === 'test')).toHaveLength(1);
    });
  });

  describe('getHistory', () => {
    it('履歴のコピーを返す', () => {
      const history1 = parser.getHistory();
      const history2 = parser.getHistory();

      expect(history1).not.toBe(history2); // Different references
      expect(history1).toEqual(history2); // Same content
    });

    it('初期状態で空の配列を返す', () => {
      const history = parser.getHistory();
      expect(history).toEqual([]);
    });
  });
});

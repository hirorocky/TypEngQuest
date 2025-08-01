import { TypeCommand } from './TypeCommand';
import { CommandContext } from '../BaseCommand';
import { PhaseTypes } from '../../core/types';

describe('TypeCommand', () => {
  let typeCommand: TypeCommand;
  let mockContext: CommandContext;

  beforeEach(() => {
    typeCommand = new TypeCommand();
    mockContext = {
      currentPhase: 'title',
    };
  });

  describe('基本情報', () => {
    test('コマンド名を取得できる', () => {
      expect(typeCommand.name).toBe('type');
    });

    test('説明を取得できる', () => {
      expect(typeCommand.description).toBe('Start typing test (optional: difficulty 1-5)');
    });

    test('ヘルプテキストを取得できる', () => {
      const help = typeCommand.getHelp();
      expect(help).toContain('Usage: type [difficulty]');
      expect(help).toContain('  Start typing test mode');
    });
  });

  describe('execute', () => {
    test('引数なしで実行するとランダム難易度でタイピングフェーズに遷移', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      const result = typeCommand.execute([], mockContext);

      expect(result.success).toBe(true);
      expect(result.message).toBe('Entering typing test mode');
      expect(result.nextPhase).toBe(PhaseTypes.TYPING);
      expect(result.data).toEqual({ difficulty: undefined });

      expect(consoleSpy).toHaveBeenCalledWith('Starting typing test...');
      expect(consoleSpy).toHaveBeenCalledWith('Difficulty: Random');

      consoleSpy.mockRestore();
    });

    test('難易度1を指定して実行できる', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      const result = typeCommand.execute(['1'], mockContext);

      expect(result.success).toBe(true);
      expect(result.message).toBe('Entering typing test mode');
      expect(result.nextPhase).toBe(PhaseTypes.TYPING);
      expect(result.data).toEqual({ difficulty: 1 });

      expect(consoleSpy).toHaveBeenCalledWith('Starting typing test...');
      expect(consoleSpy).toHaveBeenCalledWith('Difficulty: 1');

      consoleSpy.mockRestore();
    });

    test('難易度5を指定して実行できる', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      const result = typeCommand.execute(['5'], mockContext);

      expect(result.success).toBe(true);
      expect(result.message).toBe('Entering typing test mode');
      expect(result.nextPhase).toBe(PhaseTypes.TYPING);
      expect(result.data).toEqual({ difficulty: 5 });

      expect(consoleSpy).toHaveBeenCalledWith('Starting typing test...');
      expect(consoleSpy).toHaveBeenCalledWith('Difficulty: 5');

      consoleSpy.mockRestore();
    });

    test('無効な難易度（0）を指定した場合はエラー', () => {
      const result = typeCommand.execute(['0'], mockContext);

      expect(result.success).toBe(false);
      expect(result.message).toBe('Invalid difficulty. Please specify a number between 1-5.');
      expect(result.nextPhase).toBeUndefined();
    });

    test('無効な難易度（6）を指定した場合はエラー', () => {
      const result = typeCommand.execute(['6'], mockContext);

      expect(result.success).toBe(false);
      expect(result.message).toBe('Invalid difficulty. Please specify a number between 1-5.');
      expect(result.nextPhase).toBeUndefined();
    });

    test('無効な引数（文字列）を指定した場合はエラー', () => {
      const result = typeCommand.execute(['abc'], mockContext);

      expect(result.success).toBe(false);
      expect(result.message).toBe('Invalid difficulty. Please specify a number between 1-5.');
      expect(result.nextPhase).toBeUndefined();
    });

    test('複数の引数がある場合は最初の引数のみを使用', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      const result = typeCommand.execute(['3', '2', '1'], mockContext);

      expect(result.success).toBe(true);
      expect(result.data).toEqual({ difficulty: 3 });

      consoleSpy.mockRestore();
    });
  });
});
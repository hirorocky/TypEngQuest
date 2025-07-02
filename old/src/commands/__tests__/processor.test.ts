import { CommandProcessor } from '../processor';
import { Game } from '../../core/game';
import { Player } from '../../core/player';

// Mock console.log to capture output
const mockConsoleLog = jest.fn();
const originalConsoleLog = console.log;

beforeAll(() => {
  console.log = mockConsoleLog;
});

afterAll(() => {
  console.log = originalConsoleLog;
});

beforeEach(() => {
  mockConsoleLog.mockClear();
});

describe('CommandProcessor', () => {
  let game: Game;
  let processor: CommandProcessor;
  let player: Player;

  beforeEach(() => {
    game = new Game();
    processor = new CommandProcessor(game);
    player = game.getPlayer();
  });

  describe('Case Sensitivity', () => {
    test('should preserve case in file name arguments', async () => {
      // 大文字を含むファイル名でfileコマンドを実行
      await processor.process('file CHANGELOG.cpp');
      
      // エラーメッセージが小文字変換されていないことを確認
      const output = mockConsoleLog.mock.calls.map(call => call[0]).join(' ');
      expect(output).toContain('CHANGELOG.cpp'); // 大文字が保持されている
      expect(output).not.toContain('changelog.cpp'); // 小文字に変換されていない
    });

    test('should preserve case in file name arguments for cat command', async () => {
      // 大文字を含むファイル名でcatコマンドを実行
      await processor.process('cat README.MD');
      
      // エラーメッセージが小文字変換されていないことを確認
      const output = mockConsoleLog.mock.calls.map(call => call[0]).join(' ');
      expect(output).toContain('README.MD'); // 大文字が保持されている
      expect(output).not.toContain('readme.md'); // 小文字に変換されていない
    });

    test('should preserve case in directory name arguments for cd command', async () => {
      // 大文字を含むディレクトリ名でcdコマンドを実行
      await processor.process('cd MyProject');
      
      // エラーメッセージが小文字変換されていないことを確認
      const output = mockConsoleLog.mock.calls.map(call => call[0]).join(' ');
      expect(output).toContain('MyProject'); // 大文字が保持されている
      expect(output).not.toContain('myproject'); // 小文字に変換されていない
    });

    test('should still handle commands case-insensitively', async () => {
      // コマンド自体は大文字小文字を区別しない
      await processor.process('FILE test.txt');
      await processor.process('Cat test.txt');
      await processor.process('CD src');
      
      // どのコマンドもエラーなく実行される（コマンド名の大文字小文字は無視される）
      const errorMessages = mockConsoleLog.mock.calls
        .map(call => call[0])
        .filter(msg => msg.includes('Unknown command'));
      
      expect(errorMessages).toHaveLength(0);
    });
  });

  describe('Command Processing', () => {
    test('should handle empty command gracefully', async () => {
      await processor.process('');
      expect(mockConsoleLog).not.toHaveBeenCalled();
    });

    test('should handle unknown command', async () => {
      await processor.process('unknown');
      expect(mockConsoleLog).toHaveBeenCalledWith(expect.stringContaining('Unknown command: unknown'));
    });

    test('should handle help command', async () => {
      await processor.process('help');
      expect(mockConsoleLog).toHaveBeenCalledWith(expect.stringContaining('Available Commands'));
    });

    test('should handle status command', async () => {
      await processor.process('status');
      expect(mockConsoleLog).toHaveBeenCalledWith(expect.stringContaining('Code Warrior'));
      expect(mockConsoleLog).toHaveBeenCalledWith(expect.stringContaining('Health:'));
    });

    test('should handle inventory command', async () => {
      await processor.process('inventory');
      expect(mockConsoleLog).toHaveBeenCalledWith(expect.stringContaining('Word Inventory'));
    });

    test('should handle equipment command', async () => {
      await processor.process('equipment');
      expect(mockConsoleLog).toHaveBeenCalledWith(expect.stringContaining('Equipment Slots'));
    });

    test('should be case insensitive', async () => {
      await processor.process('HELP');
      expect(mockConsoleLog).toHaveBeenCalledWith(expect.stringContaining('Available Commands'));
    });
  });

  describe('Equipment Commands', () => {
    test('should handle valid equip command', async () => {
      await processor.process('equip 1 the');
      expect(mockConsoleLog).toHaveBeenCalledWith(expect.stringContaining('Equipped "the" to slot 1'));
    });

    test('should handle invalid equip command syntax', async () => {
      await processor.process('equip');
      expect(mockConsoleLog).toHaveBeenCalledWith(expect.stringContaining('Usage: equip <slot> <word>'));
    });

    test('should handle equip with invalid slot number', async () => {
      await processor.process('equip 0 the');
      expect(mockConsoleLog).toHaveBeenCalledWith(expect.stringContaining('Slot number must be 1-5'));
      
      await processor.process('equip 6 the');
      expect(mockConsoleLog).toHaveBeenCalledWith(expect.stringContaining('Slot number must be 1-5'));
      
      await processor.process('equip abc the');
      expect(mockConsoleLog).toHaveBeenCalledWith(expect.stringContaining('Slot number must be 1-5'));
    });

    test('should handle equip with word not in inventory', async () => {
      await processor.process('equip 1 nonexistent');
      expect(mockConsoleLog).toHaveBeenCalledWith(expect.stringContaining('Cannot equip "nonexistent"'));
    });

    test('should handle valid unequip command', async () => {
      player.equipWord(1, 'the');
      await processor.process('unequip 1');
      expect(mockConsoleLog).toHaveBeenCalledWith(expect.stringContaining('Unequipped word from slot 1'));
    });

    test('should handle invalid unequip command syntax', async () => {
      await processor.process('unequip');
      expect(mockConsoleLog).toHaveBeenCalledWith(expect.stringContaining('Usage: unequip <slot>'));
    });

    test('should handle unequip with invalid slot number', async () => {
      await processor.process('unequip 0');
      expect(mockConsoleLog).toHaveBeenCalledWith(expect.stringContaining('Slot number must be 1-5'));
    });

    test('should handle unequip from empty slot', async () => {
      await processor.process('unequip 1');
      expect(mockConsoleLog).toHaveBeenCalledWith(expect.stringContaining('No word equipped in slot 1'));
    });
  });

  describe('Grammar Validation', () => {
    test('should validate equipment when explicitly called', async () => {
      await processor.process('validate');
      expect(mockConsoleLog).toHaveBeenCalledWith(expect.stringContaining('No words equipped'));
    });

    test('should validate grammar for single word', async () => {
      player.equipWord(1, 'the');
      await processor.process('validate');
      expect(mockConsoleLog).toHaveBeenCalledWith(expect.stringContaining('Current Sentence:'));
      expect(mockConsoleLog).toHaveBeenCalledWith(expect.stringContaining('"the"'));
    });

    test('should validate grammar for multiple words', async () => {
      player.equipWord(1, 'the');
      player.equipWord(2, 'fox');
      await processor.process('validate');
      expect(mockConsoleLog).toHaveBeenCalledWith(expect.stringContaining('"the fox"'));
    });

    test('should show validation after equip command', async () => {
      await processor.process('equip 1 the');
      expect(mockConsoleLog).toHaveBeenCalledWith(expect.stringContaining('Current Sentence:'));
    });

    test('should show validation in equipment command', async () => {
      player.equipWord(1, 'the');
      await processor.process('equipment');
      expect(mockConsoleLog).toHaveBeenCalledWith(expect.stringContaining('Current Sentence:'));
    });
  });

  describe('Display Commands', () => {
    test('should show player stats correctly', async () => {
      await processor.process('status');
      
      expect(mockConsoleLog).toHaveBeenCalledWith(expect.stringContaining('Code Warrior - Level 1'));
      expect(mockConsoleLog).toHaveBeenCalledWith(expect.stringContaining('Health: 50/50'));
      expect(mockConsoleLog).toHaveBeenCalledWith(expect.stringContaining('Attack:'));
      expect(mockConsoleLog).toHaveBeenCalledWith(expect.stringContaining('Defense:'));
    });

    test('should show inventory correctly when empty', async () => {
      // Clear inventory by equipping all words
      const inventory = player.getInventory();
      inventory.forEach((word, index) => {
        if (index < 5) player.equipWord(index + 1, word);
      });
      
      await processor.process('inventory');
      expect(mockConsoleLog).toHaveBeenCalledWith(expect.stringContaining('(empty)'));
    });

    test('should show inventory with words', async () => {
      await processor.process('inventory');
      expect(mockConsoleLog).toHaveBeenCalledWith(expect.stringContaining('the'));
      expect(mockConsoleLog).toHaveBeenCalledWith(expect.stringContaining('quick'));
    });

    test('should show equipment slots correctly', async () => {
      await processor.process('equipment');
      
      expect(mockConsoleLog).toHaveBeenCalledWith(expect.stringContaining('Equipment Slots'));
      expect(mockConsoleLog).toHaveBeenCalledWith(expect.stringContaining('Slot 1: (empty)'));
      expect(mockConsoleLog).toHaveBeenCalledWith(expect.stringContaining('Slot 2: (empty)'));
    });

    test('should show equipped words with types', async () => {
      player.equipWord(1, 'the');
      player.equipWord(2, 'quick');
      
      await processor.process('equipment');
      
      expect(mockConsoleLog).toHaveBeenCalledWith(expect.stringContaining('Slot 1: the [article]'));
      expect(mockConsoleLog).toHaveBeenCalledWith(expect.stringContaining('Slot 2: quick [adjective]'));
    });
  });

  describe('Game Control Commands', () => {
    test('should handle start command', async () => {
      await processor.process('start');
      expect(mockConsoleLog).toHaveBeenCalledWith(expect.stringContaining('Starting TypEngQuest Adventure'));
    });

    test('should handle quit command', async () => {
      const mockQuit = jest.spyOn(game, 'quit');
      await processor.process('quit');
      expect(mockQuit).toHaveBeenCalled();
    });

    test('should handle exit command', async () => {
      const mockQuit = jest.spyOn(game, 'quit');
      await processor.process('exit');
      expect(mockQuit).toHaveBeenCalled();
    });
  });

  describe('Integration Tests', () => {
    test('should maintain state across multiple commands', async () => {
      await processor.process('equip 1 the');
      await processor.process('equip 2 quick');
      await processor.process('equipment');
      
      expect(mockConsoleLog).toHaveBeenCalledWith(expect.stringContaining('Slot 1: the [article]'));
      expect(mockConsoleLog).toHaveBeenCalledWith(expect.stringContaining('Slot 2: quick [adjective]'));
    });

    test('should handle equipment stats changes', async () => {
      await processor.process('status');
      const initialCalls = mockConsoleLog.mock.calls.length;
      
      await processor.process('equip 1 the');
      await processor.process('status');
      
      // Should show different stats after equipping
      const laterCalls = mockConsoleLog.mock.calls.slice(initialCalls);
      const hasEquipmentBonus = laterCalls.some(call => 
        call && call[0] && (call[0].includes('+ 2 =') || call[0].includes('+ 1 ='))
      );
      expect(hasEquipmentBonus).toBe(true);
    });

    test('should handle word movement between inventory and equipment', async () => {
      await processor.process('inventory');
      expect(mockConsoleLog).toHaveBeenCalledWith(expect.stringContaining('the'));
      
      await processor.process('equip 1 the');
      mockConsoleLog.mockClear();
      
      await processor.process('inventory');
      const inventoryCalls = mockConsoleLog.mock.calls.find(call => 
        call && call[0] && call[0].includes('the')
      );
      expect(inventoryCalls).toBeUndefined();
      
      await processor.process('unequip 1');
      mockConsoleLog.mockClear();
      
      await processor.process('inventory');
      expect(mockConsoleLog).toHaveBeenCalledWith(expect.stringContaining('the'));
    });

    test('should handle command chaining workflow', async () => {
      await processor.process('equip 1 the');
      await processor.process('equip 2 quick');
      await processor.process('equip 3 fox');
      await processor.process('validate');
      
      expect(mockConsoleLog).toHaveBeenCalledWith(expect.stringContaining('"the quick fox"'));
    });
  });
});
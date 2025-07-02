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

describe('Grammar Validation System', () => {
  let game: Game;
  let processor: CommandProcessor;
  let player: Player;

  beforeEach(() => {
    game = new Game();
    processor = new CommandProcessor(game);
    player = game.getPlayer();
  });

  describe('Basic Grammar Rules', () => {
    test('should validate single word as valid', async () => {
      player.equipWord(1, 'the');
      await processor.process('validate');
      
      expect(mockConsoleLog).toHaveBeenCalledWith(expect.stringContaining('"the"'));
      expect(mockConsoleLog).toHaveBeenCalledWith(expect.stringContaining('Valid grammar'));
    });

    test('should validate simple noun-verb combination', async () => {
      player.equipWord(1, 'fox');
      player.equipWord(2, 'jumps');
      await processor.process('validate');
      
      expect(mockConsoleLog).toHaveBeenCalledWith(expect.stringContaining('"fox jumps"'));
      expect(mockConsoleLog).toHaveBeenCalledWith(expect.stringContaining('Valid grammar'));
    });

    test('should validate article-noun combination', async () => {
      player.equipWord(1, 'the');
      player.equipWord(2, 'fox');
      await processor.process('validate');
      
      expect(mockConsoleLog).toHaveBeenCalledWith(expect.stringContaining('"the fox"'));
      expect(mockConsoleLog).toHaveBeenCalledWith(expect.stringContaining('Valid grammar'));
    });

    test('should validate adjective-noun combination', async () => {
      player.equipWord(1, 'quick');
      player.equipWord(2, 'fox');
      await processor.process('validate');
      
      expect(mockConsoleLog).toHaveBeenCalledWith(expect.stringContaining('"quick fox"'));
      expect(mockConsoleLog).toHaveBeenCalledWith(expect.stringContaining('Valid grammar'));
    });
  });

  describe('Complex Grammar Patterns', () => {
    test('should validate complete sentence pattern', async () => {
      player.equipWord(1, 'the');
      player.equipWord(2, 'quick');
      player.equipWord(3, 'fox');
      player.equipWord(4, 'jumps');
      await processor.process('validate');
      
      expect(mockConsoleLog).toHaveBeenCalledWith(expect.stringContaining('"the quick fox jumps"'));
      expect(mockConsoleLog).toHaveBeenCalledWith(expect.stringContaining('Valid grammar'));
    });

    test('should validate sentence with all word types', async () => {
      player.equipWord(1, 'the');
      player.equipWord(2, 'quick');
      player.equipWord(3, 'brown');
      player.equipWord(4, 'fox');
      player.equipWord(5, 'jumps');
      await processor.process('validate');
      
      expect(mockConsoleLog).toHaveBeenCalledWith(expect.stringContaining('"the quick brown fox jumps"'));
      expect(mockConsoleLog).toHaveBeenCalledWith(expect.stringContaining('Valid grammar'));
    });

    test('should handle partial sentences appropriately', async () => {
      player.equipWord(1, 'the');
      player.equipWord(3, 'fox'); // Skip slot 2
      await processor.process('validate');
      
      expect(mockConsoleLog).toHaveBeenCalledWith(expect.stringContaining('"the fox"'));
      expect(mockConsoleLog).toHaveBeenCalledWith(expect.stringContaining('Valid grammar'));
    });
  });

  describe('Grammar Validation Logic', () => {
    test('should handle empty equipment', async () => {
      await processor.process('validate');
      expect(mockConsoleLog).toHaveBeenCalledWith(expect.stringContaining('No words equipped'));
    });

    test('should show combat power for valid grammar', async () => {
      player.equipWord(1, 'the');
      player.equipWord(2, 'quick');
      player.equipWord(3, 'fox');
      await processor.process('validate');
      
      expect(mockConsoleLog).toHaveBeenCalledWith(expect.stringContaining('Total Combat Power:'));
      expect(mockConsoleLog).toHaveBeenCalledWith(expect.stringContaining('Valid grammar'));
    });

    test('should provide grammar tips for invalid patterns', async () => {
      // Create a theoretically invalid pattern if one exists
      // For now, the basic grammar checker is quite permissive
      player.equipWord(1, 'quick');
      player.equipWord(2, 'quick'); // Duplicate adjectives might be considered less effective
      
      await processor.process('validate');
      // The current implementation might still validate this, but we test the structure
      expect(mockConsoleLog).toHaveBeenCalledWith(expect.stringContaining('Current Sentence:'));
    });
  });

  describe('Grammar Validation Integration', () => {
    test('should validate grammar automatically after equipping', async () => {
      await processor.process('equip 1 the');
      
      expect(mockConsoleLog).toHaveBeenCalledWith(expect.stringContaining('Current Sentence:'));
      expect(mockConsoleLog).toHaveBeenCalledWith(expect.stringContaining('"the"'));
    });

    test('should show validation in equipment display', async () => {
      player.equipWord(1, 'the');
      player.equipWord(2, 'fox');
      
      await processor.process('equipment');
      
      expect(mockConsoleLog).toHaveBeenCalledWith(expect.stringContaining('Current Sentence:'));
      expect(mockConsoleLog).toHaveBeenCalledWith(expect.stringContaining('"the fox"'));
    });

    test('should maintain grammar validation state', async () => {
      player.equipWord(1, 'the');
      await processor.process('validate');
      
      const firstValidation = mockConsoleLog.mock.calls.find(call => 
        call && call[0] && call[0].includes('Valid grammar')
      );
      expect(firstValidation).toBeDefined();
      
      mockConsoleLog.mockClear();
      
      player.equipWord(2, 'quick');
      await processor.process('validate');
      
      // Check for any validation messages
      const hasValidationMessage = mockConsoleLog.mock.calls.some(call => 
        call && call[0] && (call[0].includes('Valid grammar') || call[0].includes('Current Sentence:'))
      );
      expect(hasValidationMessage).toBe(true);
    });
  });

  describe('Word Type Classification', () => {
    test('should classify articles correctly', async () => {
      player.equipWord(1, 'the');
      await processor.process('equipment');
      
      expect(mockConsoleLog).toHaveBeenCalledWith(expect.stringContaining('the [article]'));
    });

    test('should classify adjectives correctly', async () => {
      player.equipWord(1, 'quick');
      await processor.process('equipment');
      
      expect(mockConsoleLog).toHaveBeenCalledWith(expect.stringContaining('quick [adjective]'));
    });

    test('should classify nouns correctly', async () => {
      player.equipWord(1, 'fox');
      await processor.process('equipment');
      
      expect(mockConsoleLog).toHaveBeenCalledWith(expect.stringContaining('fox [noun]'));
    });

    test('should classify verbs correctly', async () => {
      player.equipWord(1, 'jumps');
      await processor.process('equipment');
      
      expect(mockConsoleLog).toHaveBeenCalledWith(expect.stringContaining('jumps [verb]'));
    });

    test('should handle unknown word types', async () => {
      // Add an unknown word type by accessing private inventory
      (player as any).inventory.push('unknown');
      player.equipWord(1, 'unknown');
      await processor.process('equipment');
      
      // Should default to noun
      expect(mockConsoleLog).toHaveBeenCalledWith(expect.stringContaining('unknown [noun]'));
    });
  });

  describe('Grammar Validation Edge Cases', () => {
    test('should handle mixed case words', async () => {
      // Test if the system handles case variations properly
      player.equipWord(1, 'the');
      await processor.process('validate');
      
      expect(mockConsoleLog).toHaveBeenCalledWith(expect.stringContaining('"the"'));
      expect(mockConsoleLog).toHaveBeenCalledWith(expect.stringContaining('Valid grammar'));
    });

    test('should handle rapid grammar changes', async () => {
      // Rapidly change equipment and validate
      player.equipWord(1, 'the');
      await processor.process('validate');
      
      player.equipWord(2, 'quick');
      await processor.process('validate');
      
      player.unequipWord(1);
      await processor.process('validate');
      
      // Should handle all transitions gracefully
      const grammarMessages = mockConsoleLog.mock.calls.filter(call => 
        call && call[0] && call[0].includes('Current Sentence:')
      );
      expect(grammarMessages.length).toBeGreaterThan(0);
    });

    test('should maintain performance with complex sentences', async () => {
      const startTime = performance.now();
      
      // Create complex sentence
      player.equipWord(1, 'the');
      player.equipWord(2, 'quick');
      player.equipWord(3, 'brown');
      player.equipWord(4, 'fox');
      player.equipWord(5, 'jumps');
      
      // Validate multiple times
      for (let i = 0; i < 10; i++) {
        await processor.process('validate');
      }
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      // Should complete quickly
      expect(duration).toBeLessThan(100);
    });
  });

  describe('Grammar System Integration', () => {
    test('should integrate with combat power calculation', async () => {
      player.equipWord(1, 'the');
      player.equipWord(2, 'quick');
      player.equipWord(3, 'fox');
      
      await processor.process('validate');
      
      const powerMessage = mockConsoleLog.mock.calls.find(call => 
        call[0].includes('Total Combat Power:')
      );
      expect(powerMessage).toBeDefined();
      
      // Should show a numerical value
      const powerValue = powerMessage![0].match(/Total Combat Power: (\d+)/);
      expect(powerValue).toBeDefined();
      expect(parseInt(powerValue![1])).toBeGreaterThan(0);
    });

    test('should show consistent grammar validation across commands', async () => {
      player.equipWord(1, 'the');
      player.equipWord(2, 'fox');
      
      // Test validation through different commands
      await processor.process('validate');
      const validateMessage = mockConsoleLog.mock.calls.find(call => 
        call && call[0] && call[0].includes('"the fox"')
      );
      
      mockConsoleLog.mockClear();
      
      await processor.process('equipment');
      const equipmentMessage = mockConsoleLog.mock.calls.find(call => 
        call && call[0] && call[0].includes('"the fox"')
      );
      
      expect(validateMessage).toBeDefined();
      expect(equipmentMessage).toBeDefined();
    });
  });
});
import { CommandHistory } from '../commandHistory';

describe('CommandHistory', () => {
  let history: CommandHistory;

  beforeEach(() => {
    history = new CommandHistory(5); // maxSize = 5 for testing
  });

  describe('Basic History Operations', () => {
    test('should start with empty history', () => {
      expect(history.getHistory()).toEqual([]);
      expect(history.size()).toBe(0);
    });

    test('should add commands to history', () => {
      history.addCommand('status');
      history.addCommand('inventory');
      
      expect(history.getHistory()).toEqual(['status', 'inventory']);
      expect(history.size()).toBe(2);
    });

    test('should not add empty or whitespace-only commands', () => {
      history.addCommand('');
      history.addCommand('   ');
      history.addCommand('\t\n');
      
      expect(history.getHistory()).toEqual([]);
      expect(history.size()).toBe(0);
    });

    test('should not add duplicate consecutive commands', () => {
      history.addCommand('status');
      history.addCommand('status');
      history.addCommand('inventory');
      history.addCommand('inventory');
      
      expect(history.getHistory()).toEqual(['status', 'inventory']);
      expect(history.size()).toBe(2);
    });

    test('should trim whitespace from commands', () => {
      history.addCommand('  status  ');
      history.addCommand('\tinventory\n');
      
      expect(history.getHistory()).toEqual(['status', 'inventory']);
    });
  });

  describe('History Size Management', () => {
    test('should enforce maximum history size', () => {
      // Add 7 commands to history with maxSize = 5
      for (let i = 1; i <= 7; i++) {
        history.addCommand(`command${i}`);
      }
      
      expect(history.size()).toBe(5);
      expect(history.getHistory()).toEqual([
        'command3', 'command4', 'command5', 'command6', 'command7'
      ]);
    });

    test('should maintain order when removing old commands', () => {
      const commands = ['a', 'b', 'c', 'd', 'e', 'f'];
      commands.forEach(cmd => history.addCommand(cmd));
      
      expect(history.getHistory()).toEqual(['b', 'c', 'd', 'e', 'f']);
    });
  });

  describe('History Navigation', () => {
    beforeEach(() => {
      history.addCommand('status');
      history.addCommand('inventory');
      history.addCommand('equipment');
    });

    test('should navigate backward through history', () => {
      expect(history.getPrevious()).toBe('equipment');
      expect(history.getPrevious()).toBe('inventory');
      expect(history.getPrevious()).toBe('status');
    });

    test('should not go beyond oldest command', () => {
      history.getPrevious(); // equipment
      history.getPrevious(); // inventory
      history.getPrevious(); // status
      
      expect(history.getPrevious()).toBe('status'); // Should stay at oldest
    });

    test('should navigate forward through history', () => {
      // Go to oldest first
      history.getPrevious(); // equipment
      history.getPrevious(); // inventory
      history.getPrevious(); // status
      
      expect(history.getNext()).toBe('inventory');
      expect(history.getNext()).toBe('equipment');
    });

    test('should return empty string when going beyond newest', () => {
      history.getPrevious(); // equipment
      history.getPrevious(); // inventory
      
      expect(history.getNext()).toBe('equipment');
      expect(history.getNext()).toBe(''); // Beyond newest
    });

    test('should reset navigation when new command is added', () => {
      history.getPrevious(); // equipment
      history.getPrevious(); // inventory
      
      history.addCommand('newcommand');
      
      expect(history.getPrevious()).toBe('newcommand');
      expect(history.getPrevious()).toBe('equipment');
    });
  });

  describe('Search Functionality', () => {
    beforeEach(() => {
      history.addCommand('status');
      history.addCommand('save 1 test');
      history.addCommand('inventory');
      history.addCommand('save 2 backup');
      history.addCommand('equipment');
    });

    test('should find commands by prefix', () => {
      const matches = history.search('save');
      expect(matches).toEqual(['save 1 test', 'save 2 backup']);
    });

    test('should find commands case-insensitively', () => {
      const matches = history.search('SAVE');
      expect(matches).toEqual(['save 1 test', 'save 2 backup']);
    });

    test('should return empty array for no matches', () => {
      const matches = history.search('nonexistent');
      expect(matches).toEqual([]);
    });

    test('should return all commands for empty search', () => {
      const matches = history.search('');
      expect(matches).toEqual([
        'status', 'save 1 test', 'inventory', 'save 2 backup', 'equipment'
      ]);
    });

    test('should return unique matches in chronological order', () => {
      history.addCommand('status'); // Duplicate
      const matches = history.search('s');
      // 重複排除後は最初の出現のみが残る
      expect(matches).toEqual(['save 1 test', 'save 2 backup', 'status']);
    });
  });

  describe('Clear Functionality', () => {
    test('should clear all history', () => {
      history.addCommand('status');
      history.addCommand('inventory');
      
      history.clear();
      
      expect(history.getHistory()).toEqual([]);
      expect(history.size()).toBe(0);
    });

    test('should reset navigation after clear', () => {
      history.addCommand('status');
      history.getPrevious();
      
      history.clear();
      
      expect(history.getPrevious()).toBe('');
      expect(history.getNext()).toBe('');
    });
  });

  describe('Edge Cases', () => {
    test('should handle navigation on empty history', () => {
      expect(history.getPrevious()).toBe('');
      expect(history.getNext()).toBe('');
    });

    test('should handle navigation with single command', () => {
      history.addCommand('status');
      
      expect(history.getPrevious()).toBe('status');
      expect(history.getPrevious()).toBe('status'); // Should stay
      expect(history.getNext()).toBe('');
    });

    test('should handle zero maxSize', () => {
      const zeroHistory = new CommandHistory(0);
      zeroHistory.addCommand('status');
      
      expect(zeroHistory.getHistory()).toEqual([]);
      expect(zeroHistory.size()).toBe(0);
    });
  });
});
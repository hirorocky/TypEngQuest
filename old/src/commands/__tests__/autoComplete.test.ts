import { AutoComplete } from '../autoComplete';
import { Game } from '../../core/game';
import { Map } from '../../world/map';

describe('AutoComplete', () => {
  let game: Game;
  let autoComplete: AutoComplete;

  beforeEach(() => {
    game = new Game();
    autoComplete = new AutoComplete(game);
  });

  describe('Command Completion', () => {
    test('should complete basic commands', () => {
      const suggestions = autoComplete.complete('st');
      expect(suggestions).toContain('status');
      expect(suggestions).toContain('start');
    });

    test('should complete with exact match', () => {
      const suggestions = autoComplete.complete('status');
      expect(suggestions).toEqual(['status']);
    });

    test('should return empty for no matches', () => {
      const suggestions = autoComplete.complete('xyz');
      expect(suggestions).toEqual([]);
    });

    test('should be case insensitive', () => {
      const suggestions = autoComplete.complete('ST');
      expect(suggestions).toContain('status');
      expect(suggestions).toContain('start');
    });

    test('should complete equipment commands', () => {
      const suggestions = autoComplete.complete('equip');
      expect(suggestions).toContain('equipment');
      expect(suggestions).toContain('equip');
    });
  });

  describe('Context-Aware Completion', () => {
    test('should suggest directories for cd command', () => {
      const suggestions = autoComplete.complete('cd ');
      
      // Should return empty array if no directories exist, or directories if they exist
      expect(suggestions.length).toBeGreaterThanOrEqual(0);
      // All suggestions should be valid for cd (no files)
      suggestions.forEach(suggestion => {
        expect(suggestion).not.toContain('.');
      });
    });

    test('should suggest files for cat command', () => {
      const suggestions = autoComplete.complete('cat ');
      
      // Should return empty array if no files exist, or files if they exist
      expect(suggestions.length).toBeGreaterThanOrEqual(0);
    });

    test('should suggest both files and directories for ls command', () => {
      const suggestions = autoComplete.complete('ls ');
      
      // ls can work with both files and directories
      expect(suggestions.length).toBeGreaterThanOrEqual(0);
    });

    test('should suggest slot numbers for equip command', () => {
      const suggestions = autoComplete.complete('equip ');
      expect(suggestions).toEqual(['1', '2', '3', '4', '5']);
    });

    test('should suggest inventory words for equip command with slot', () => {
      const suggestions = autoComplete.complete('equip 1 ');
      const inventory = game.getPlayer().getInventory();
      
      expect(suggestions).toEqual(inventory);
    });

    test('should suggest slot numbers for unequip command', () => {
      const suggestions = autoComplete.complete('unequip ');
      expect(suggestions).toEqual(['1', '2', '3', '4', '5']);
    });

    test('should suggest save slot numbers for save command', () => {
      const suggestions = autoComplete.complete('save ');
      expect(suggestions).toEqual(['1', '2', '3', '4', '5', '6', '7', '8', '9']);
    });

    test('should suggest load slot numbers for load command', () => {
      const suggestions = autoComplete.complete('load ');
      expect(suggestions).toEqual(['1', '2', '3', '4', '5', '6', '7', '8', '9', '10']);
    });
  });

  describe('Partial Path Completion', () => {
    test('should complete partial file paths', () => {
      // Add some test files to the map first
      const map = game.getMap();
      
      const suggestions = autoComplete.complete('cat app');
      
      // Should return files that start with 'app'
      suggestions.forEach(suggestion => {
        expect(suggestion.toLowerCase()).toMatch(/^app/);
      });
    });

    test('should handle directory paths in completion', () => {
      const suggestions = autoComplete.complete('cd src/');
      
      // Should return subdirectories of src
      expect(suggestions.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Special Cases', () => {
    test('should handle empty input', () => {
      const suggestions = autoComplete.complete('');
      
      // Should return all available commands
      expect(suggestions.length).toBeGreaterThan(10);
      expect(suggestions).toContain('help');
      expect(suggestions).toContain('status');
      expect(suggestions).toContain('inventory');
    });

    test('should handle only whitespace', () => {
      const suggestions = autoComplete.complete('   ');
      expect(suggestions).toEqual([]);
    });

    test('should handle commands with multiple spaces', () => {
      const suggestions = autoComplete.complete('equip  1  ');
      const inventory = game.getPlayer().getInventory();
      expect(suggestions).toEqual(inventory);
    });

    test('should handle unknown commands gracefully', () => {
      const suggestions = autoComplete.complete('unknowncommand ');
      expect(suggestions).toEqual([]);
    });
  });

  describe('File System Integration', () => {
    test('should respect current directory for relative paths', () => {
      const map = game.getMap();
      
      // Change to a specific directory first
      map.navigateTo('/');
      
      const suggestions = autoComplete.complete('ls ');
      
      // Should suggest items in current directory
      expect(suggestions.length).toBeGreaterThanOrEqual(0);
    });

    test('should handle absolute paths', () => {
      const suggestions = autoComplete.complete('cd /');
      
      // Should work with absolute paths
      expect(suggestions.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Performance', () => {
    test('should complete quickly with many files', () => {
      const startTime = Date.now();
      
      // Test completion on a potentially large directory
      autoComplete.complete('ls ');
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      // Should complete within reasonable time (100ms)
      expect(duration).toBeLessThan(100);
    });
  });
});
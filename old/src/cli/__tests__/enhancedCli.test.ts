import { EnhancedCli } from '../enhancedCli';
import { Game } from '../../core/game';

// readlineのモック
jest.mock('readline', () => ({
  createInterface: jest.fn(() => ({
    question: jest.fn(),
    close: jest.fn(),
    on: jest.fn(),
  })),
  emitKeypressEvents: jest.fn(),
}));

// processのモック
const mockStdin = {
  isTTY: true,
  setRawMode: jest.fn(),
  on: jest.fn(),
};

Object.defineProperty(process, 'stdin', {
  value: mockStdin,
  writable: false,
});

describe('EnhancedCli', () => {
  let game: Game;
  let cli: EnhancedCli;

  beforeEach(() => {
    game = new Game();
    cli = new EnhancedCli(game);
  });

  describe('Tab Completion Behavior', () => {
    test('should return full completion when only one suggestion exists', () => {
      // getFullCompletionメソッドを直接テスト
      const result = (cli as any).getFullCompletion('stat', 'status');
      expect(result).toBe('status');
    });

    test('should handle argument completion with single suggestion', () => {
      const result = (cli as any).getFullCompletion('equip ', '1');
      expect(result).toBe('equip 1');
    });

    test('should handle partial argument completion', () => {
      const result = (cli as any).getFullCompletion('save 1', '1');
      expect(result).toBe('save 1');
    });

    test('should handle multi-word completion', () => {
      const result = (cli as any).getFullCompletion('cd sr', 'src');
      expect(result).toBe('cd src');
    });

    test('should handle empty input completion', () => {
      const result = (cli as any).getFullCompletion('', 'help');
      expect(result).toBe('help');
    });
  });

  describe('Tab Completion Integration', () => {
    test('should handle single suggestion completion', () => {
      // getCurrentLineとreplaceCurrentLineをモック
      const mockGetCurrentLine = jest.spyOn(cli as any, 'getCurrentLine');
      const mockReplaceCurrentLine = jest.spyOn(cli as any, 'replaceCurrentLine');
      
      mockGetCurrentLine.mockReturnValue('stat');
      mockReplaceCurrentLine.mockImplementation(() => {});
      
      (cli as any).handleTabCompletion();
      
      expect(mockReplaceCurrentLine).toHaveBeenCalledWith('status');
      
      mockGetCurrentLine.mockRestore();
      mockReplaceCurrentLine.mockRestore();
    });

    test('should handle multiple suggestions', () => {
      const mockGetCurrentLine = jest.spyOn(cli as any, 'getCurrentLine');
      const mockConsoleLog = jest.spyOn(console, 'log').mockImplementation();
      
      mockGetCurrentLine.mockReturnValue('s');
      
      (cli as any).handleTabCompletion();
      
      // 複数候補の表示を確認
      expect(mockConsoleLog).toHaveBeenCalledWith(expect.stringContaining('Completions:'));
      
      mockGetCurrentLine.mockRestore();
      mockConsoleLog.mockRestore();
    });

    test('should handle no matches', () => {
      const mockGetCurrentLine = jest.spyOn(cli as any, 'getCurrentLine');
      const mockConsoleLog = jest.spyOn(console, 'log').mockImplementation();
      
      mockGetCurrentLine.mockReturnValue('xyz');
      
      (cli as any).handleTabCompletion();
      
      // "No completions found"メッセージを確認
      expect(mockConsoleLog).toHaveBeenCalledWith(expect.stringContaining('No completions found'));
      
      mockGetCurrentLine.mockRestore();
      mockConsoleLog.mockRestore();
    });

    test('should handle empty input gracefully', () => {
      const mockGetCurrentLine = jest.spyOn(cli as any, 'getCurrentLine');
      const mockConsoleLog = jest.spyOn(console, 'log').mockImplementation();
      
      mockGetCurrentLine.mockReturnValue('');
      
      (cli as any).handleTabCompletion();
      
      // 空入力の場合は全コマンドを表示
      expect(mockConsoleLog).toHaveBeenCalledWith(expect.stringContaining('Completions:'));
      
      mockGetCurrentLine.mockRestore();
      mockConsoleLog.mockRestore();
    });
  });

  describe('Edge Cases', () => {
    test('should handle whitespace-only input', () => {
      const mockGetCurrentLine = jest.spyOn(cli as any, 'getCurrentLine');
      const mockConsoleLog = jest.spyOn(console, 'log').mockImplementation();
      
      mockGetCurrentLine.mockReturnValue('   ');
      
      (cli as any).handleTabCompletion();
      
      // 空白のみの場合は何も表示されない（空配列が返される）
      expect(mockConsoleLog).not.toHaveBeenCalled();
      
      mockGetCurrentLine.mockRestore();
      mockConsoleLog.mockRestore();
    });

    test('should handle trailing spaces correctly', () => {
      const result = (cli as any).getFullCompletion('equip ', '1');
      expect(result).toBe('equip 1');
    });

    test('should handle multiple spaces', () => {
      const result = (cli as any).getFullCompletion('equip  1  ', 'the');
      expect(result).toBe('equip  1 the');
    });
  });

  describe('findCommonPrefix', () => {
    test('should find common prefix correctly', () => {
      const prefix = (cli as any).findCommonPrefix(['save', 'saves', 'savedata']);
      expect(prefix).toBe('save');
    });

    test('should return full string for single suggestion', () => {
      const prefix = (cli as any).findCommonPrefix(['status']);
      expect(prefix).toBe('status');
    });

    test('should return empty string for no common prefix', () => {
      const prefix = (cli as any).findCommonPrefix(['help', 'status', 'quit']);
      expect(prefix).toBe('');
    });

    test('should handle empty array', () => {
      const prefix = (cli as any).findCommonPrefix([]);
      expect(prefix).toBe('');
    });
  });
});
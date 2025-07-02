/**
 * Phaseクラスのユニットテスト
 */

import { Phase } from './Phase';
import { PhaseType, Command } from './types';

// テスト用の具象クラス
class TestPhase extends Phase {
  getType(): PhaseType {
    return 'title';
  }

  async initialize(): Promise<void> {
    // Test implementation
  }

  async cleanup(): Promise<void> {
    // Test implementation
  }
}

describe('Phase', () => {
  let phase: TestPhase;

  beforeEach(() => {
    phase = new TestPhase();
  });

  describe('constructor', () => {
    it('コマンドパーサーで初期化される', () => {
      expect(phase.getAvailableCommands()).toContain('help');
      expect(phase.getAvailableCommands()).toContain('clear');
      expect(phase.getAvailableCommands()).toContain('history');
    });
  });

  describe('getType', () => {
    it('正しいフェーズタイプを返す', () => {
      expect(phase.getType()).toBe('title');
    });
  });

  describe('processInput', () => {
    it('パーサーを通じて入力を処理する', async () => {
      const result = await phase.processInput('help');
      expect(result.success).toBe(true);
    });

    it('空の入力を処理する', async () => {
      const result = await phase.processInput('');
      expect(result.success).toBe(true);
    });

    it('未知のコマンドを処理する', async () => {
      const result = await phase.processInput('unknown');
      expect(result.success).toBe(false);
      expect(result.message).toContain('Unknown command');
    });
  });

  describe('registerCommand', () => {
    it('新しいコマンドを登録する', async () => {
      const testCommand: Command = {
        name: 'test',
        description: 'Test command',
        execute: async () => ({ success: true, message: 'Test executed' }),
      };

      phase['registerCommand'](testCommand);

      const result = await phase.processInput('test');
      expect(result.success).toBe(true);
      expect(result.message).toBe('Test executed');
    });

    it('エイリアス付きでコマンドを登録する', async () => {
      const testCommand: Command = {
        name: 'test',
        aliases: ['t'],
        description: 'Test command',
        execute: async () => ({ success: true, message: 'Test executed' }),
      };

      phase['registerCommand'](testCommand);

      const result = await phase.processInput('t');
      expect(result.success).toBe(true);
      expect(result.message).toBe('Test executed');
    });
  });

  describe('unregisterCommand', () => {
    it('コマンドの登録を解除する', async () => {
      const testCommand: Command = {
        name: 'test',
        description: 'Test command',
        execute: async () => ({ success: true }),
      };

      phase['registerCommand'](testCommand);
      phase['unregisterCommand']('test');

      const result = await phase.processInput('test');
      expect(result.success).toBe(false);
      expect(result.message).toContain('Unknown command');
    });
  });

  describe('getAvailableCommands', () => {
    it('利用可能なコマンドのリストを返す', () => {
      const commands = phase.getAvailableCommands();
      expect(Array.isArray(commands)).toBe(true);
      expect(commands.length).toBeGreaterThan(0);
    });

    it('登録済みコマンドを含む', () => {
      const testCommand: Command = {
        name: 'test',
        description: 'Test command',
        execute: async () => ({ success: true }),
      };

      phase['registerCommand'](testCommand);

      const commands = phase.getAvailableCommands();
      expect(commands).toContain('test');
    });
  });

  describe('abstract methods', () => {
    it('抽象メソッドを実装する', async () => {
      // These methods should be implemented in concrete classes
      expect(typeof phase.initialize).toBe('function');
      expect(typeof phase.cleanup).toBe('function');
      expect(typeof phase.getType).toBe('function');

      // Should not throw when called
      await expect(phase.initialize()).resolves.toBeUndefined();
      await expect(phase.cleanup()).resolves.toBeUndefined();
    });
  });
});

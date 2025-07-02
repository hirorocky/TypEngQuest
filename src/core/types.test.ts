/**
 * types.tsのユニットテスト
 */

import { GameError } from './types';

describe('types', () => {
  describe('GameError', () => {
    it('メッセージのみでGameErrorを作成する', () => {
      const error = new GameError('Test error');

      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(GameError);
      expect(error.message).toBe('Test error');
      expect(error.name).toBe('GameError');
    });

    it('メッセージとコードでGameErrorを作成する', () => {
      const error = new GameError('Test error', 'TEST_CODE');

      expect(error.message).toBe('Test error');
      expect(error._code).toBe('TEST_CODE');
      expect(error.name).toBe('GameError');
    });

    it('コードなしでGameErrorを作成する', () => {
      const error = new GameError('Test error');

      expect(error._code).toBeUndefined();
    });

    it('スロー可能である', () => {
      expect(() => {
        throw new GameError('Test error');
      }).toThrow('Test error');
    });

    it('スタックトレースを維持する', () => {
      const error = new GameError('Test error');
      expect(error.stack).toBeDefined();
    });

    it('Errorとしてキャッチ可能である', () => {
      try {
        throw new GameError('Test error', 'CODE');
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect(error).toBeInstanceOf(GameError);
        expect((error as GameError).message).toBe('Test error');
        expect((error as GameError)._code).toBe('CODE');
      }
    });
  });
});

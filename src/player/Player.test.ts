import { Player } from './Player';

describe('Player', () => {
  describe('constructor', () => {
    test('プレイヤー名を指定して初期化できる', () => {
      const player = new Player('Hero');

      expect(player.name).toBe('Hero');
    });

    test('空文字の名前でも初期化できる', () => {
      const player = new Player('');

      expect(player.name).toBe('');
    });
  });

  describe('getLevel', () => {
    test('初期レベルは1を返す', () => {
      const player = new Player('Hero');

      expect(player.getLevel()).toBe(1);
    });
  });

  describe('toJSON', () => {
    test('プレイヤーデータをJSON形式で出力できる', () => {
      const player = new Player('Hero');
      const json = player.toJSON();

      expect(json).toEqual({
        name: 'Hero',
        level: 1,
      });
    });
  });

  describe('fromJSON', () => {
    test('JSONデータからプレイヤーを復元できる', () => {
      const jsonData = {
        name: 'SavedHero',
        level: 5,
      };

      const player = Player.fromJSON(jsonData);

      expect(player.name).toBe('SavedHero');
      expect(player.getLevel()).toBe(5);
    });

    test('不正なJSONデータでエラーを投げる', () => {
      const invalidData = {
        name: 123, // 文字列でない
        level: 'invalid', // 数値でない
      };

      expect(() => Player.fromJSON(invalidData)).toThrow('Invalid player data');
    });

    test('必須フィールドが欠けている場合エラーを投げる', () => {
      const incompleteData = {
        name: 'Hero',
        // level が欠けている
      };

      expect(() => Player.fromJSON(incompleteData)).toThrow('Invalid player data');
    });
  });

  describe('name property', () => {
    test('プレイヤー名を取得できる', () => {
      const player = new Player('TestPlayer');

      expect(player.name).toBe('TestPlayer');
    });
  });

  describe('data validation', () => {
    test('プレイヤー名に日本語が含まれていても正常に動作する', () => {
      const player = new Player('勇者');

      expect(player.name).toBe('勇者');
      expect(player.getLevel()).toBe(1);
    });

    test('プレイヤー名に特殊文字が含まれていても正常に動作する', () => {
      const player = new Player('Player@123!');

      expect(player.name).toBe('Player@123!');
      expect(player.getLevel()).toBe(1);
    });
  });
});

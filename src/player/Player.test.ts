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

  describe('getName', () => {
    test('プレイヤー名を取得できる', () => {
      const player = new Player('Hero');

      expect(player.getName()).toBe('Hero');
    });
  });

  describe('getStats', () => {
    test('プレイヤーのステータスを取得できる', () => {
      const player = new Player('Hero');
      const stats = player.getStats();

      expect(stats).toBeDefined();
      expect(stats.getMaxHP()).toBe(120); // レベル1: 100 + (1 × 20)
      expect(stats.getMaxMP()).toBe(60); // レベル1: 50 + (1 × 10)
    });
  });

  describe('toJSON', () => {
    test('プレイヤーデータをJSON形式で出力できる', () => {
      const player = new Player('Hero');
      const json = player.toJSON();

      expect(json).toEqual({
        name: 'Hero',
        level: 1,
        stats: expect.objectContaining({
          level: 1,
          currentHP: 120,
          currentMP: 60,
          baseAttack: 10,
          baseDefense: 10,
          baseSpeed: 10,
          baseAccuracy: 10,
          baseFortune: 10,
          temporaryBoosts: {
            attack: 0,
            defense: 0,
            speed: 0,
            accuracy: 0,
            fortune: 0,
          },
        }),
        inventory: expect.objectContaining({
          items: [],
        }),
      });
    });
  });

  describe('fromJSON', () => {
    test('JSONデータからプレイヤーを復元できる', () => {
      const jsonData = {
        name: 'SavedHero',
        level: 5,
        stats: {
          level: 5,
          currentHP: 180,
          currentMP: 90,
          baseAttack: 15,
          baseDefense: 12,
          baseSpeed: 10,
          baseAccuracy: 10,
          baseFortune: 10,
          temporaryBoosts: {
            attack: 0,
            defense: 0,
            speed: 0,
            accuracy: 0,
            fortune: 0,
          },
        },
        inventory: {
          items: [],
        },
      };

      const player = Player.fromJSON(jsonData);

      expect(player.name).toBe('SavedHero');
      expect(player.getLevel()).toBe(5);
      expect(player.getStats().getCurrentHP()).toBe(180);
      expect(player.getStats().getCurrentMP()).toBe(90);
    });

    test('不正なJSONデータでエラーを投げる', () => {
      const invalidData = {
        name: 123, // 文字列でない
        level: 'invalid', // 数値でない
        stats: {},
      };

      expect(() => Player.fromJSON(invalidData)).toThrow('Invalid player data');
    });

    test('必須フィールドが欠けている場合エラーを投げる', () => {
      const incompleteData = {
        name: 'Hero',
        // level, stats が欠けている
      };

      expect(() => Player.fromJSON(incompleteData)).toThrow('Invalid player data');
    });

    test('statsフィールドが欠けている場合エラーを投げる', () => {
      const dataWithoutStats = {
        name: 'Hero',
        level: 1,
        // stats が欠けている
      };

      expect(() => Player.fromJSON(dataWithoutStats)).toThrow('Invalid player data');
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

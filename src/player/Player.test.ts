import { Player } from './Player';
import { EquipmentItem, EquipmentItemData } from '../items/EquipmentItem';
import { ItemType, ItemRarity } from '../items/Item';

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

  describe('setEquippedItems', () => {
    test('装備アイテムが設定されていない場合、レベルは1を返す', () => {
      const player = new Player('Hero');

      expect(player.getLevel()).toBe(1);
    });

    test('装備アイテムが設定されている場合、グレード平均値をレベルとして返す', () => {
      const player = new Player('Hero');

      const equipment1Data: EquipmentItemData = {
        id: 'sword',
        name: 'Iron Sword',
        description: 'A basic sword',
        type: ItemType.EQUIPMENT,
        rarity: ItemRarity.COMMON,
        stats: {
          attack: 10,
          defense: 2,
          speed: 3,
          accuracy: 0,
          fortune: 0,
        },
        grade: 15, // 10+2+3+0+0=15
      };

      const equipment2Data: EquipmentItemData = {
        id: 'shield',
        name: 'Wooden Shield',
        description: 'A basic shield',
        type: ItemType.EQUIPMENT,
        rarity: ItemRarity.COMMON,
        stats: {
          attack: 0,
          defense: 8,
          speed: 1,
          accuracy: 2,
          fortune: 1,
        },
        grade: 12, // 0+8+1+2+1=12
      };

      const equipment1 = new EquipmentItem(equipment1Data);
      const equipment2 = new EquipmentItem(equipment2Data);

      player.setEquippedItems([equipment1, equipment2]);

      expect(player.getLevel()).toBe(13); // (15+12)/2 = 13.5 → 13（小数点切り捨て）
    });

    test('複数の装備アイテムの場合、正しいレベルが計算される', () => {
      const player = new Player('Hero');

      const equipmentDataList: EquipmentItemData[] = [
        {
          id: 'item1',
          name: 'Item 1',
          description: 'Item 1',
          type: ItemType.EQUIPMENT,
          rarity: ItemRarity.COMMON,
          stats: { attack: 1, defense: 0, speed: 0, accuracy: 0, fortune: 0 },
          grade: 1,
        },
        {
          id: 'item2',
          name: 'Item 2',
          description: 'Item 2',
          type: ItemType.EQUIPMENT,
          rarity: ItemRarity.COMMON,
          stats: { attack: 1, defense: 1, speed: 0, accuracy: 0, fortune: 0 },
          grade: 2,
        },
        {
          id: 'item3',
          name: 'Item 3',
          description: 'Item 3',
          type: ItemType.EQUIPMENT,
          rarity: ItemRarity.COMMON,
          stats: { attack: 1, defense: 1, speed: 1, accuracy: 0, fortune: 0 },
          grade: 3,
        },
      ];

      const equipments = equipmentDataList.map(data => new EquipmentItem(data));
      player.setEquippedItems(equipments);

      expect(player.getLevel()).toBe(2); // (1+2+3)/3 = 2.0
    });

    test('単一の装備アイテムの場合、そのグレードがレベルになる', () => {
      const player = new Player('Hero');

      const equipmentData: EquipmentItemData = {
        id: 'sword',
        name: 'Iron Sword',
        description: 'A basic sword',
        type: ItemType.EQUIPMENT,
        rarity: ItemRarity.COMMON,
        stats: {
          attack: 10,
          defense: 2,
          speed: 3,
          accuracy: 0,
          fortune: 0,
        },
        grade: 15,
      };

      const equipment = new EquipmentItem(equipmentData);
      player.setEquippedItems([equipment]);

      expect(player.getLevel()).toBe(15);
    });
  });

  describe('getEquippedItemStats', () => {
    test('装備アイテムが設定されていない場合、全てのステータスが0を返す', () => {
      const player = new Player('Hero');

      const stats = player.getEquippedItemStats();

      expect(stats.attack).toBe(0);
      expect(stats.defense).toBe(0);
      expect(stats.speed).toBe(0);
      expect(stats.accuracy).toBe(0);
      expect(stats.fortune).toBe(0);
    });

    test('装備アイテムが設定されている場合、ステータスの合計を返す', () => {
      const player = new Player('Hero');

      const equipment1Data: EquipmentItemData = {
        id: 'sword',
        name: 'Iron Sword',
        description: 'A basic sword',
        type: ItemType.EQUIPMENT,
        rarity: ItemRarity.COMMON,
        stats: {
          attack: 10,
          defense: 2,
          speed: 3,
          accuracy: 0,
          fortune: 0,
        },
        grade: 15,
      };

      const equipment2Data: EquipmentItemData = {
        id: 'shield',
        name: 'Wooden Shield',
        description: 'A basic shield',
        type: ItemType.EQUIPMENT,
        rarity: ItemRarity.COMMON,
        stats: {
          attack: 0,
          defense: 8,
          speed: 1,
          accuracy: 2,
          fortune: 1,
        },
        grade: 12,
      };

      const equipment1 = new EquipmentItem(equipment1Data);
      const equipment2 = new EquipmentItem(equipment2Data);

      player.setEquippedItems([equipment1, equipment2]);

      const stats = player.getEquippedItemStats();

      expect(stats.attack).toBe(10); // 10+0
      expect(stats.defense).toBe(10); // 2+8
      expect(stats.speed).toBe(4); // 3+1
      expect(stats.accuracy).toBe(2); // 0+2
      expect(stats.fortune).toBe(1); // 0+1
    });
  });

  describe('getEquippedItemSkills', () => {
    test('装備アイテムが設定されていない場合、空の配列を返す', () => {
      const player = new Player('Hero');

      const skills = player.getEquippedItemSkills();

      expect(skills).toEqual([]);
    });

    test('技を持つ装備アイテムが設定されている場合、その技を返す', () => {
      const player = new Player('Hero');

      const equipmentData: EquipmentItemData = {
        id: 'sword',
        name: 'Iron Sword',
        description: 'A basic sword',
        type: ItemType.EQUIPMENT,
        rarity: ItemRarity.COMMON,
        stats: {
          attack: 10,
          defense: 2,
          speed: 3,
          accuracy: 0,
          fortune: 0,
        },
        grade: 15,
        skill: {
          id: 'slash',
          name: 'Slash',
          mpCost: 5,
          successRate: 90,
          typingDifficulty: 2,
          effect: {
            type: 'damage',
            power: 50,
            target: 'enemy',
          },
        },
      };

      const equipment = new EquipmentItem(equipmentData);
      player.setEquippedItems([equipment]);

      const skills = player.getEquippedItemSkills();

      expect(skills).toHaveLength(1);
      expect(skills[0].id).toBe('slash');
      expect(skills[0].name).toBe('Slash');
    });
  });
});
